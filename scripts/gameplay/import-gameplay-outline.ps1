param(
  [Parameter(Mandatory = $true)]
  [string]$InputDocx,

  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$wordNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
$presentationModeByLabel = [ordered]@{
  '主地图' = 'main-map'
  '轻扩展' = 'light-extension'
  '特殊地图' = 'special-map'
  '界面玩法' = 'interface-gameplay'
  'CG适配' = 'cg-friendly'
}
$categoryTitleOverrides = @{
  '吃鸡与生存竞赛规则' = '收缩区域与生存竞赛类'
  'PVP目标改造型PVE' = '据点控制与战术目标类'
  'MOBA与兵线战场类' = '兵线推进与据点攻防类'
  'RTS与战场指挥类' = '即时战略与战场指挥类'
  '潜行与非对称追猎类' = '潜行、追猎与协作逃生类'
  'Boss、狩猎与Raid类' = '首领战、狩猎与大型副本类'
  '传统RPG与队伍战斗类' = '角色扮演与队伍战斗类'
  '挂机、派遣与异步玩法' = '派遣与异步成长类'
  '节奏、时机与操作小游戏' = '节奏、时机与操作小游戏类'
}
$gameplayTitleOverrides = @{
  10 = '随机地牢远征'
  11 = '随机远征构筑'
  14 = '标准搜打撤'
  18 = '收缩区域生存'
  30 = '单路兵线攻防'
  31 = '多路兵线战场'
  47 = '强敌追猎逃生'
  48 = '协作目标逃生'
  54 = '团队型大型副本'
  55 = '连续首领挑战'
  62 = 'NPC群像社交推理'
  71 = '即时动作角色扮演'
  72 = '指令式回合角色扮演'
  74 = '随机远征卡牌构筑'
  77 = '自走棋编队战斗'
}
$gameplayDesignReferences = @{
  8 = @('Survivors-like')
  10 = @('Roguelike')
  11 = @('Roguelite')
  14 = @('PVE搜打撤')
  18 = @('Battle Royale（大逃杀）')
  30 = @('MOBA-lite')
  31 = @('MOBA')
  32 = @('MOBA野区玩法')
  33 = @('MOBA', '塔防')
  47 = @('非对称PVP/PVE')
  48 = @('非对称竞技修机逃脱')
  54 = @('Raid')
  55 = @('Boss Rush')
  62 = @('社交推理PVE')
  71 = @('Action RPG')
  72 = @('Turn-based RPG')
  74 = @('Roguelike卡牌构筑')
  77 = @('Auto Chess（自走棋）')
}
$variantTitleOverrides = @{
  '5|连击评分' = '连击表现评分'
  '44|装备分配' = '队伍装备分配'
  '90|装备分配' = '公会装备分配'
  '56|火焰传播' = '火焰机关'
  '74|召唤卡牌' = '战斗召唤卡牌'
  '75|召唤卡牌' = '地图召唤卡牌'
  '103|料理图鉴' = '食谱收集'
}

function Get-ParagraphInfo {
  param($Paragraph, $NamespaceManager)

  $styleNode = $Paragraph.SelectSingleNode('./w:pPr/w:pStyle', $NamespaceManager)
  $style = if ($styleNode) { $styleNode.GetAttribute('val', $script:wordNamespace) } else { 'Normal' }
  $text = (($Paragraph.SelectNodes('.//w:t', $NamespaceManager) | ForEach-Object { $_.InnerText }) -join '').Trim()
  $boldText = (($Paragraph.SelectNodes('./w:r[w:rPr/w:b or w:rPr/w:bCs]/w:t', $NamespaceManager) | ForEach-Object { $_.InnerText }) -join '').Trim()

  [pscustomobject]@{
    Style = $style
    Text = $text
    BoldText = $boldText
  }
}

function Get-NumberedHeading {
  param([string]$Text)

  if ($Text -match '^\s*(\d+)\.\s*(.+?)\s*$') {
    return [pscustomobject]@{ Number = [int]$Matches[1]; Title = $Matches[2] }
  }

  return $null
}

function Split-TitleAndModes {
  param([string]$Text)

  $modes = [System.Collections.Generic.List[string]]::new()
  foreach ($label in $script:presentationModeByLabel.Keys) {
    if ($Text -match [regex]::Escape($label)) {
      $modes.Add($script:presentationModeByLabel[$label])
    }
  }

  [pscustomobject]@{
    Title = ($Text -replace '【[^】]+】', '').Trim()
    Modes = @($modes)
  }
}

function Resolve-CategoryTitle {
  param([string]$Title)

  return $(if ($script:categoryTitleOverrides.ContainsKey($Title)) { $script:categoryTitleOverrides[$Title] } else { $Title })
}

function Resolve-GameplayTitle {
  param([int]$Number, [string]$Title)

  return $(if ($script:gameplayTitleOverrides.ContainsKey($Number)) { $script:gameplayTitleOverrides[$Number] } else { $Title })
}

function New-Variant {
  param([string]$ParentId, [int]$ParentNumber, [int]$Index, $Paragraph)

  $title = $Paragraph.BoldText
  $description = $Paragraph.Text
  if ($title -and $description.StartsWith($title)) {
    $description = $description.Substring($title.Length).Trim()
  }
  if (-not $title) {
    $title = $Paragraph.Text.TrimEnd('。', '；')
    $description = ''
  }
  $overrideKey = '{0}|{1}' -f $ParentNumber, $title
  if ($script:variantTitleOverrides.ContainsKey($overrideKey)) {
    $title = $script:variantTitleOverrides[$overrideKey]
  }

  [ordered]@{
    id = '{0}-variant-{1:D2}' -f $ParentId, $Index
    title = $title
    description = $description
  }
}

$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $InputDocx))
try {
  $documentEntry = $zip.GetEntry('word/document.xml')
  $reader = [System.IO.StreamReader]::new($documentEntry.Open(), [System.Text.Encoding]::UTF8)
  try { [xml]$documentXml = $reader.ReadToEnd() } finally { $reader.Dispose() }
} finally {
  $zip.Dispose()
}

$namespaceManager = [System.Xml.XmlNamespaceManager]::new($documentXml.NameTable)
$namespaceManager.AddNamespace('w', $wordNamespace)
$paragraphs = @(
  $documentXml.SelectNodes('//w:body/w:p', $namespaceManager) |
    ForEach-Object { Get-ParagraphInfo $_ $namespaceManager } |
    Where-Object { $_.Text }
)

$categories = [System.Collections.Generic.List[object]]::new()
$entries = [System.Collections.Generic.List[object]]::new()
$modules = [System.Collections.Generic.List[object]]::new()
$presentationPatterns = [System.Collections.Generic.List[object]]::new()
$currentSection = ''
$currentCategory = $null
$currentRecord = $null
$recordKind = ''

foreach ($paragraph in $paragraphs) {
  if ($paragraph.Style -eq 'Heading1') {
    $currentSection = $paragraph.Text
    $currentCategory = $null
    $currentRecord = $null
    $recordKind = ''

    if ($currentSection -match '^第([一二三四五六七八九十百]+)部分：(.+)$' -and
        $currentSection -notmatch '第三十[六七八]部分') {
      $categoryNumber = $categories.Count + 1
      $currentCategory = [ordered]@{
        id = 'gameplay-category-{0:D2}' -f $categoryNumber
        order = $categoryNumber
        title = Resolve-CategoryTitle $Matches[2]
      }
      $categories.Add($currentCategory)
    }
    continue
  }

  if ($paragraph.Style -eq 'Heading2') {
    $heading = Get-NumberedHeading $paragraph.Text
    if (-not $heading) {
      $currentRecord = $null
      $recordKind = ''
      continue
    }

    if ($currentSection -match '^第三十七部分') {
      $id = 'module-{0:D2}' -f $heading.Number
      $currentRecord = [ordered]@{ id = $id; order = $heading.Number; title = $heading.Title; summary = ''; capabilities = @() }
      $modules.Add($currentRecord)
      $recordKind = 'module'
      continue
    }

    if ($currentSection -match '^第三十六部分') {
      $id = 'presentation-pattern-{0:D2}' -f ($heading.Number - 117)
      $parsedHeading = Split-TitleAndModes $heading.Title
      $currentRecord = [ordered]@{
        id = $id
        order = $heading.Number - 117
        title = $parsedHeading.Title
        summary = ''
        examples = @()
      }
      $presentationPatterns.Add($currentRecord)
      $recordKind = 'presentation'
      continue
    }

    if ($currentSection -match '^第三十八部分') {
      $currentRecord = $null
      $recordKind = ''
      continue
    }

    if ($currentCategory -and $heading.Number -ge 1 -and $heading.Number -le 121) {
      $parsedHeading = Split-TitleAndModes $heading.Title
      $id = 'gameplay-{0:D3}' -f $heading.Number
      $currentRecord = [ordered]@{
        id = $id
        number = $heading.Number
        title = Resolve-GameplayTitle $heading.Number $parsedHeading.Title
        categoryId = $currentCategory.id
        summary = ''
        designReferences = @($(if ($gameplayDesignReferences.ContainsKey($heading.Number)) { $gameplayDesignReferences[$heading.Number] } else { @() }))
        presentationModes = @($parsedHeading.Modes)
        variants = @()
      }
      $entries.Add($currentRecord)
      $recordKind = 'gameplay'
    }
    continue
  }

  if (-not $currentRecord -or $paragraph.Style -eq 'Heading3') {
    continue
  }

  if ($recordKind -eq 'gameplay') {
    if ($paragraph.Style -eq 'FirstParagraph' -and -not $currentRecord.summary) {
      $currentRecord.summary = $paragraph.Text
    } elseif ($paragraph.Style -in @('Normal', 'Compact')) {
      $variantIndex = $currentRecord.variants.Count + 1
      $currentRecord.variants += New-Variant $currentRecord.id $currentRecord.number $variantIndex $paragraph
    }
    continue
  }

  if ($recordKind -eq 'module') {
    if ($paragraph.Style -eq 'FirstParagraph' -and $paragraph.Text -ne '包含：' -and -not $currentRecord.summary) {
      $currentRecord.summary = $paragraph.Text
    } elseif ($paragraph.Style -in @('Normal', 'Compact')) {
      $currentRecord.capabilities += $paragraph.Text.TrimEnd('。', '；')
    }
    continue
  }


  if ($recordKind -eq 'presentation') {
    if ($paragraph.Style -eq 'FirstParagraph' -and -not $currentRecord.summary) {
      $currentRecord.summary = $paragraph.Text
    } elseif ($paragraph.Style -in @('Normal', 'Compact')) {
      $currentRecord.examples += $paragraph.Text.TrimEnd('。', '；')
    }
    continue
  }

}

$entryNumbers = @($entries | ForEach-Object { $_.number })
if ($entries.Count -ne 117 -or (@($entryNumbers | Select-Object -Unique)).Count -ne 117) {
  throw "Expected 117 unique gameplay entries, got $($entries.Count)."
}

$catalog = [ordered]@{
  schemaVersion = 1
  title = '璃落宇宙2D像素游戏玩法总表'
  description = '面向璃落宇宙像素冒险RPG的可关联玩法目录；开发模块与CG表现模式分别存放在内部资料文件中。'
  presentationModes = [ordered]@{
    'main-map' = '主地图'
    'light-extension' = '轻扩展'
    'special-map' = '特殊地图'
    'interface-gameplay' = '界面玩法'
    'cg-friendly' = 'CG适配'
  }
  categories = @($categories)
  entries = @($entries | Sort-Object { [int]$_['number'] })
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'catalog.json'), ($catalog | ConvertTo-Json -Depth 12 -Compress), $utf8WithoutBom)
[System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'modules.json'), (@($modules) | ConvertTo-Json -Depth 8 -Compress), $utf8WithoutBom)
[System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'presentation-patterns.json'), (@($presentationPatterns) | ConvertTo-Json -Depth 8 -Compress), $utf8WithoutBom)

Write-Output "Imported $($entries.Count) gameplay entries, $($modules.Count) internal modules, and $($presentationPatterns.Count) presentation patterns."
& node (Join-Path $PSScriptRoot 'refine-gameplay-catalog.mjs') (Join-Path $OutputDirectory 'catalog.json')
if ($LASTEXITCODE -ne 0) {
  throw 'Gameplay catalog refinement failed.'
}
