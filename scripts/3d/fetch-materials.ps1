param([Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$assets = Get-Content (Join-Path $root 'public/3d/material-provenance.json') -Raw | ConvertFrom-Json
foreach ($asset in $assets) {
  $prefix = switch ($asset.asset) {
    'oak' { 'oak' }
    'beige_wall_001' { 'limestone' }
    'marble_01' { 'floor' }
    default { $null }
  }
  if (!$prefix) { continue } # The shipped HDR already lives in public/3d.
  $path = Join-Path $Destination "$prefix-$($asset.map).jpg"
  Invoke-WebRequest -Uri $asset.url -OutFile $path
  if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne $asset.sha256) {
    throw "Material checksum mismatch: $prefix-$($asset.map)"
  }
}
Write-Output 'Verified nine CC0 source maps. No downloaded architectural models.'
