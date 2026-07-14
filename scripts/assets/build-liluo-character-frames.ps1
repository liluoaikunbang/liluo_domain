param(
  [string]$TemplateRelativePath = 'src\assets\game\sprite\liluo.png',
  [string[]]$SourceRelativePaths = @(
    'src\assets\game\sprite\bondage_body_down.png',
    'src\assets\game\sprite\bondage_body_up.png',
    'src\assets\game\sprite\LiLuo_body_up.png',
    'src\assets\game\sprite\LiLuo_body_down.png',
    'src\assets\game\sprite\LiLuo_head.png'
  )
)

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$columns = 5
$rows = 4
$directions = @('down', 'left', 'right', 'up')

function Get-FrameName {
  param([int]$Row, [int]$Column)

  if ($Column -eq 0) {
    return "$($directions[$Row])_idle"
  }

  return "$($directions[$Row])_walk_$Column"
}

function Get-ExpectedFrameNames {
  $frameNames = @()

  for ($row = 0; $row -lt $rows; $row += 1) {
    for ($column = 0; $column -lt $columns; $column += 1) {
      $frameNames += "$(Get-FrameName -Row $row -Column $column).png"
    }
  }

  return $frameNames
}

function Get-SourceOutputDirectory {
  param([string]$SourcePath)

  $sourceName = [System.IO.Path]::GetFileNameWithoutExtension($SourcePath)
  return Join-Path (Split-Path -Parent $SourcePath) $sourceName
}

function Test-FixedTemplateFrameCacheFresh {
  param(
    [string]$SourceRelativePath,
    [DateTime]$TemplateLastWriteTimeUtc
  )

  $sourcePath = Join-Path $projectRoot $SourceRelativePath

  if (-not (Test-Path $sourcePath)) {
    throw "Sprite source was not found: $sourcePath"
  }

  $sourceLastWriteTimeUtc = (Get-Item -LiteralPath $sourcePath).LastWriteTimeUtc
  $newestInputWriteTimeUtc = $sourceLastWriteTimeUtc

  if ($TemplateLastWriteTimeUtc -gt $newestInputWriteTimeUtc) {
    $newestInputWriteTimeUtc = $TemplateLastWriteTimeUtc
  }

  $outputDirectory = Get-SourceOutputDirectory -SourcePath $sourcePath

  if (-not (Test-Path $outputDirectory)) {
    return $false
  }

  foreach ($frameName in Get-ExpectedFrameNames) {
    $framePath = Join-Path $outputDirectory $frameName

    if (-not (Test-Path $framePath)) {
      return $false
    }

    if ((Get-Item -LiteralPath $framePath).LastWriteTimeUtc -lt $newestInputWriteTimeUtc) {
      return $false
    }
  }

  return $true
}

function Test-VisiblePixel {
  param([System.Drawing.Color]$Pixel)

  if ($Pixel.A -le 0) {
    return $false
  }

  # Some source sheets use pure green as temporary transparent background.
  return -not ($Pixel.R -eq 0 -and $Pixel.G -eq 255 -and $Pixel.B -eq 0)
}

function Get-TemplateCropBounds {
  param([System.Drawing.Bitmap]$Template)

  if ($Template.Width % $columns -ne 0 -or $Template.Height % $rows -ne 0) {
    throw "Template size must be divisible by ${columns}x${rows}: $($Template.Width)x$($Template.Height)"
  }

  $cellWidth = [int]($Template.Width / $columns)
  $cellHeight = [int]($Template.Height / $rows)
  $left = $cellWidth
  $top = $cellHeight
  $right = -1
  $bottom = -1

  for ($row = 0; $row -lt $rows; $row += 1) {
    for ($column = 0; $column -lt $columns; $column += 1) {
      $cellLeft = $column * $cellWidth
      $cellTop = $row * $cellHeight

      for ($localY = 0; $localY -lt $cellHeight; $localY += 1) {
        for ($localX = 0; $localX -lt $cellWidth; $localX += 1) {
          $pixel = $Template.GetPixel($cellLeft + $localX, $cellTop + $localY)

          if (-not (Test-VisiblePixel -Pixel $pixel)) {
            continue
          }

          $left = [Math]::Min($left, $localX)
          $top = [Math]::Min($top, $localY)
          $right = [Math]::Max($right, $localX + 1)
          $bottom = [Math]::Max($bottom, $localY + 1)
        }
      }
    }
  }

  if ($right -lt 0 -or $bottom -lt 0) {
    throw "No visible template pixels were found in $TemplateRelativePath."
  }

  return [System.Drawing.Rectangle]::FromLTRB($left, $top, $right, $bottom)
}

function Save-FixedTemplateFrames {
  param(
    [string]$SourceRelativePath,
    [System.Drawing.Rectangle]$CropBounds,
    [int]$TemplateCellWidth,
    [int]$TemplateCellHeight
  )

  $sourcePath = Join-Path $projectRoot $SourceRelativePath

  if (-not (Test-Path $sourcePath)) {
    throw "Sprite source was not found: $sourcePath"
  }

  $source = [System.Drawing.Bitmap]::new($sourcePath)
  try {
    if ($source.Width % $columns -ne 0 -or $source.Height % $rows -ne 0) {
      throw "Sprite source size must be divisible by ${columns}x${rows}: $sourcePath ($($source.Width)x$($source.Height))"
    }

    $sourceCellWidth = [int]($source.Width / $columns)
    $sourceCellHeight = [int]($source.Height / $rows)

    if ($sourceCellWidth -ne $TemplateCellWidth -or $sourceCellHeight -ne $TemplateCellHeight) {
      throw "Sprite source cell size must match the liluo template cell size ${TemplateCellWidth}x${TemplateCellHeight}: $sourcePath has ${sourceCellWidth}x${sourceCellHeight}"
    }

    $sourceName = [System.IO.Path]::GetFileNameWithoutExtension($sourcePath)
    $outputDirectory = Join-Path (Split-Path -Parent $sourcePath) $sourceName

    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

    for ($row = 0; $row -lt $rows; $row += 1) {
      for ($column = 0; $column -lt $columns; $column += 1) {
        $frame = [System.Drawing.Bitmap]::new($CropBounds.Width, $CropBounds.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
          $cellLeft = $column * $sourceCellWidth
          $cellTop = $row * $sourceCellHeight

          for ($localY = 0; $localY -lt $CropBounds.Height; $localY += 1) {
            for ($localX = 0; $localX -lt $CropBounds.Width; $localX += 1) {
              $sourceX = $cellLeft + $CropBounds.X + $localX
              $sourceY = $cellTop + $CropBounds.Y + $localY
              $pixel = $source.GetPixel($sourceX, $sourceY)

              if (Test-VisiblePixel -Pixel $pixel) {
                $frame.SetPixel($localX, $localY, $pixel)
              }
            }
          }

          $framePath = Join-Path $outputDirectory "$(Get-FrameName -Row $row -Column $column).png"
          $frame.Save($framePath, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
          $frame.Dispose()
        }
      }
    }

    Write-Output "Generated 20 fixed-template sprite frames in $outputDirectory ($($CropBounds.Width)x$($CropBounds.Height))"
  } finally {
    $source.Dispose()
  }
}

$templatePath = Join-Path $projectRoot $TemplateRelativePath

if (-not (Test-Path $templatePath)) {
  throw "Sprite template was not found: $templatePath"
}

$templateLastWriteTimeUtc = (Get-Item -LiteralPath $templatePath).LastWriteTimeUtc
$sourceCacheStates = @{}
$staleSourceRelativePaths = @()

foreach ($sourceRelativePath in $SourceRelativePaths) {
  $isFresh = Test-FixedTemplateFrameCacheFresh `
    -SourceRelativePath $sourceRelativePath `
    -TemplateLastWriteTimeUtc $templateLastWriteTimeUtc
  $sourceCacheStates[$sourceRelativePath] = $isFresh

  if (-not $isFresh) {
    $staleSourceRelativePaths += $sourceRelativePath
  }
}

if ($staleSourceRelativePaths.Count -eq 0) {
  Write-Output 'All fixed-template sprite frame caches are up to date; skipped rebuild.'
  return
}

$template = [System.Drawing.Bitmap]::new($templatePath)
try {
  $cropBounds = Get-TemplateCropBounds -Template $template
  $templateCellWidth = [int]($template.Width / $columns)
  $templateCellHeight = [int]($template.Height / $rows)

  Write-Output "Using liluo template crop: x=$($cropBounds.X), y=$($cropBounds.Y), width=$($cropBounds.Width), height=$($cropBounds.Height)"

  foreach ($sourceRelativePath in $SourceRelativePaths) {
    if ($sourceCacheStates[$sourceRelativePath]) {
      $sourcePath = Join-Path $projectRoot $sourceRelativePath
      $outputDirectory = Get-SourceOutputDirectory -SourcePath $sourcePath
      Write-Output "Skipped fresh fixed-template sprite frames in $outputDirectory"
      continue
    }

    Save-FixedTemplateFrames `
      -SourceRelativePath $sourceRelativePath `
      -CropBounds $cropBounds `
      -TemplateCellWidth $templateCellWidth `
      -TemplateCellHeight $templateCellHeight
  }
} finally {
  $template.Dispose()
}
