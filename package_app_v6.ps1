$ErrorActionPreference = "Stop"
$projectPath = "c:\Users\s.r.silva\.gemini\antigravity\playground\amazon-sem-segredos"
$zipPath = Join-Path $projectPath "amazon-sem-segredos-source.zip"
$tempDir = Join-Path $projectPath "temp_dist_source_final_v6"

Write-Host "Cleaning up previous runs..."
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }

Write-Host "Creating temp directory..."
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Host "Copying files..."
$robocopyParams = @(
    $projectPath,
    $tempDir,
    "/E",
    "/XD", "node_modules", ".git", "dist", ".netlify", ".gemini", "temp_dist_source_final*", "pages_temp", "Pages"
)

# Robocopy returns exit codes that are not errors (0-7 are success/partial)
& robocopy @robocopyParams
if ($LASTEXITCODE -ge 8) {
    Write-Error "Robocopy failed with exit code $LASTEXITCODE"
}

Write-Host "Zipping..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath

Write-Host "Cleaning up temp directory..."
Remove-Item $tempDir -Recurse -Force

Write-Host "SUCCESS: Zip created at $zipPath"
