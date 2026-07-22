param(
  [switch]$NoBrowser,
  [int]$Port = 0
)

$ErrorActionPreference = 'Stop'
$releaseRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$rootPrefix = $releaseRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$entryFile = Join-Path $releaseRoot 'index.html'

if (-not (Test-Path -LiteralPath $entryFile -PathType Leaf)) {
  throw "Game entry is missing: $entryFile"
}

function Get-ContentType([string]$Path) {
  switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8' }
    '.js' { 'text/javascript; charset=utf-8' }
    '.css' { 'text/css; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.png' { 'image/png' }
    '.jpg' { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.gif' { 'image/gif' }
    '.webp' { 'image/webp' }
    '.svg' { 'image/svg+xml' }
    '.mp3' { 'audio/mpeg' }
    '.ogg' { 'audio/ogg' }
    '.wav' { 'audio/wav' }
    '.ttf' { 'font/ttf' }
    '.woff' { 'font/woff' }
    '.woff2' { 'font/woff2' }
    default { 'application/octet-stream' }
  }
}

function Write-Response(
  [IO.Stream]$Stream,
  [int]$StatusCode,
  [string]$StatusText,
  [byte[]]$Body,
  [string]$ContentType,
  [bool]$IncludeBody
) {
  $headers = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($headers)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($IncludeBody -and $Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
  $Stream.Flush()
}

$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()

try {
  $actualPort = ([Net.IPEndPoint]$listener.LocalEndpoint).Port
  $gameUrl = "http://127.0.0.1:$actualPort/"
  Write-Host "LILUO_URL=$gameUrl"
  Write-Host 'Keep this window open while playing. Close it to stop the local server.'

  if (-not $NoBrowser) {
    Start-Process $gameUrl
  }

  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if (-not $requestLine) { continue }

      while (($headerLine = $reader.ReadLine()) -ne $null -and $headerLine -ne '') { }
      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2 -or ($parts[0] -ne 'GET' -and $parts[0] -ne 'HEAD')) {
        $body = [Text.Encoding]::UTF8.GetBytes('Method Not Allowed')
        Write-Response $stream 405 'Method Not Allowed' $body 'text/plain; charset=utf-8' $true
        continue
      }

      $requestPath = [Uri]::UnescapeDataString(($parts[1] -split '[?#]', 2)[0]).Replace('/', [IO.Path]::DirectorySeparatorChar)
      $relativePath = $requestPath.TrimStart([IO.Path]::DirectorySeparatorChar)
      if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'index.html' }

      $targetPath = [IO.Path]::GetFullPath((Join-Path $releaseRoot $relativePath))
      $insideRoot = $targetPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)
      if (-not $insideRoot -or -not (Test-Path -LiteralPath $targetPath -PathType Leaf)) {
        $body = [Text.Encoding]::UTF8.GetBytes('Not Found')
        Write-Response $stream 404 'Not Found' $body 'text/plain; charset=utf-8' ($parts[0] -eq 'GET')
        continue
      }

      $body = [IO.File]::ReadAllBytes($targetPath)
      Write-Response $stream 200 'OK' $body (Get-ContentType $targetPath) ($parts[0] -eq 'GET')
    }
    catch {
      try {
        $body = [Text.Encoding]::UTF8.GetBytes('Internal Server Error')
        Write-Response $stream 500 'Internal Server Error' $body 'text/plain; charset=utf-8' $true
      } catch { }
    }
    finally {
      $client.Dispose()
    }
  }
}
finally {
  $listener.Stop()
}
