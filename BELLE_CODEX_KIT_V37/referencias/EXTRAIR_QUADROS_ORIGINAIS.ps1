# Apenas se você JÁ tiver os vídeos originais e FFmpeg instalado.
# Extrai um frame a cada 0,5s para analise visual. NUNCA inclui vídeos Belle/Billie.
param([string]$Source = "$PSScriptRoot\videos_ORIGINAIS")
$ErrorActionPreference = 'Stop'
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw 'FFmpeg nao encontrado no PATH.' }
$dest = Join-Path $PSScriptRoot 'quadros_EXTRAIDOS_DOS_ORIGINAIS'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Get-ChildItem $Source -File | Where-Object {$_.Extension -in '.mp4','.mov','.webm'} | ForEach-Object {
  $name = [IO.Path]::GetFileNameWithoutExtension($_.Name) -replace '[^a-zA-Z0-9_-]','_'
  $out=Join-Path $dest $name
  New-Item -ItemType Directory -Force -Path $out | Out-Null
  & ffmpeg -hide_banner -loglevel error -i $_.FullName -vf 'fps=2,scale=960:-2' -y (Join-Path $out 'frame_%04d.jpg')
  Write-Host "Frames extraidos: $($_.Name)"
}
