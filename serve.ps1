param(
  [int]$Port = 8080,
  [string]$Root = $PSScriptRoot
)

$rootPath = [System.IO.Path]::GetFullPath($Root)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$contentTypes = @{
  '.css'  = 'text/css; charset=utf-8'
  '.html' = 'text/html; charset=utf-8'
  '.ico'  = 'image/x-icon'
  '.jpeg' = 'image/jpeg'
  '.jpg'  = 'image/jpeg'
  '.js'   = 'text/javascript; charset=utf-8'
  '.png'  = 'image/png'
  '.svg'  = 'image/svg+xml'
  '.webp' = 'image/webp'
}

$listener.Start()
Write-Host "Serving $rootPath on http://0.0.0.0:$Port/"

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()

    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
      $requestLine = $reader.ReadLine()

      while ($reader.ReadLine()) { }

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        continue
      }

      $requestTarget = ($requestLine -split ' ')[1] -split '\?' | Select-Object -First 1
      if ($requestTarget -eq '/') {
        $requestTarget = '/index.html'
      }

      $relativePath = [Uri]::UnescapeDataString($requestTarget.TrimStart('/')).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      $filePath = [System.IO.Path]::GetFullPath((Join-Path $rootPath $relativePath))
      $isInsideRoot = $filePath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)

      if (-not $isInsideRoot -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
        $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      } else {
        $body = [System.IO.File]::ReadAllBytes($filePath)
        $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
        $contentType = $contentTypes[$extension]
        if (-not $contentType) {
          $contentType = 'application/octet-stream'
        }
        $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`nCache-Control: no-store`r`n`r`n"
      }

      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}