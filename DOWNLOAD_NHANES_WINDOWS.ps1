$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$DataDir = Join-Path $ProjectRoot 'backend\module2_prediction\data'
New-Item -ItemType Directory -Path $DataDir -Force | Out-Null

$files = @(
  @{ Cycle='2017'; Name='DEMO_J.xpt' },
  @{ Cycle='2017'; Name='BMX_J.xpt' },
  @{ Cycle='2017'; Name='FERTIN_J.xpt' },
  @{ Cycle='2017'; Name='VID_J.xpt' },
  @{ Cycle='2017'; Name='BIOPRO_J.xpt' },
  @{ Cycle='2013'; Name='DEMO_H.xpt' },
  @{ Cycle='2013'; Name='BMX_H.xpt' },
  @{ Cycle='2013'; Name='VITB12_H.xpt' }
)

function Test-XptFile([string]$Path) {
  if (!(Test-Path $Path)) { return $false }
  $item = Get-Item $Path
  if ($item.Length -lt 1024) { return $false }
  $stream = [System.IO.File]::OpenRead($Path)
  try {
    $buffer = New-Object byte[] 256
    $read = $stream.Read($buffer, 0, $buffer.Length)
    $header = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read).ToUpperInvariant()
    return $header.Contains('HEADER RECORD') -and !$header.Contains('<HTML') -and !$header.Contains('<!DOCTYPE')
  } finally {
    $stream.Dispose()
  }
}

foreach ($f in $files) {
  $dest = Join-Path $DataDir $f.Name
  if (Test-XptFile $dest) {
    Write-Host "[NHANES] Already valid: $($f.Name)"
    continue
  }
  if (Test-Path $dest) { Remove-Item $dest -Force }
  $url = "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/$($f.Cycle)/DataFiles/$($f.Name)"
  Write-Host "[NHANES] Downloading $($f.Name) ..."
  Invoke-WebRequest -Uri $url -OutFile $dest -UserAgent 'Mozilla/5.0 (compatible; AlteraVie/2.4)' -UseBasicParsing
  if (!(Test-XptFile $dest)) {
    Remove-Item $dest -Force -ErrorAction SilentlyContinue
    throw "CDC returned an invalid/non-XPT response for $($f.Name): $url"
  }
}
Write-Host '[NHANES] All official CDC files are present and validated.'
