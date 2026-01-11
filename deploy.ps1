$ErrorActionPreference = "Stop"

# Absolute paths to tools (since PATH might not be updated in this session)
$GIT_CMD = "C:\Program Files\Git\cmd\git.exe"
$GH_CMD = "C:\Program Files\GitHub CLI\gh.exe"

# Deployment Automation Script
Write-Host "🚀 Starting Deployment to GitHub..."

# Check if authenticated
try {
    # Check status
    & $GH_CMD auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "⚠️ You are NOT logged in to GitHub."
        Write-Host "Please run: '& ""$GH_CMD"" auth login' to authenticate first."
        exit 1
    }
}
catch {
    Write-Warning "GitHub CLI (gh) not found or not working at $GH_CMD"
    exit 1
}

# Ensure .gitignore exists
if (-not (Test-Path .gitignore)) {
    Write-Host "Creating .gitignore..."
    "node_modules`ndist`n.netlify`n.env.local`n.gemini" | Out-File .gitignore -Encoding utf8
}

# Initialize Git if needed
if (-not (Test-Path .git)) {
    Write-Host "Initializing Git repository..."
    & $GIT_CMD init
    & $GIT_CMD branch -M main
    & $GIT_CMD remote add origin https://github.com/sergiorpaes/amazon-sem-segredos.git
}

# Add all files
Write-Host "Adding files..."
& $GIT_CMD add .

# Commit
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$commitMessage = "Automated deployment: $timestamp"
Write-Host "Committing: $commitMessage"
& $GIT_CMD commit -m "$commitMessage"

# Push
Write-Host "Pushing to GitHub..."
& $GIT_CMD push -u origin main

Write-Host "✅ Deployment Complete!"
