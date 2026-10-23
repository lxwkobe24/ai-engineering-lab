# AI Engineering Lab: publish to a NEW public GitHub repository and configure GitHub Pages.
# Run in Windows PowerShell: powershell -ExecutionPolicy Bypass -File .\deploy-windows.ps1
# Needs Git + GitHub CLI. No access token is stored in the website.
param(
    [string]$RepoName = 'ai-engineering-lab',
    [string]$ExpectedOwner = 'lxwkobe24',
    [switch]$YesPublic
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Assert-Success([string]$Step) {
    if ($LASTEXITCODE -ne 0) { throw "$Step failed (exit code: $LASTEXITCODE)." }
}
function Test-Native([scriptblock]$Invocation) {
    # PowerShell 5.1 can treat redirected native stderr as a terminating error
    # when ErrorActionPreference = Stop. Probe commands must be nonfatal.
    $old = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & $Invocation; return ($LASTEXITCODE -eq 0) }
    finally { $ErrorActionPreference = $old }
}
function Need-Command([string]$Name, [string]$InstallHint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name not found. Install it first: $InstallHint. Reopen the terminal afterwards."
    }
}

Need-Command git 'winget install --id Git.Git -e'
Need-Command gh  'winget install --id GitHub.cli -e'

$required = @('index.html', 'styles.css', 'radar.css', 'data.js', 'app.js', 'radar.js', 'favicon.svg',
    'scripts/update_frontier.py', '.github/workflows/update-frontier.yml')
foreach ($path in $required) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing website source file: $path" }
}
if ($RepoName -notmatch '^[a-zA-Z0-9_.-]+$') { throw 'Repository name contains unsupported characters.' }

Write-Host 'Checking GitHub login...'
if (-not (Test-Native { & gh auth status 1>$null 2>$null })) {
    Write-Host 'Please sign in to GitHub using the browser window.'
    & gh auth login --web --git-protocol https
    Assert-Success 'GitHub sign-in'
}
& gh auth setup-git
Assert-Success 'Git credential setup'

$owner = (& gh api user --jq '.login').Trim()
Assert-Success 'Read GitHub profile'
if (-not $owner) { throw 'Could not determine your GitHub username.' }
if ($owner -ne $ExpectedOwner) { throw "Signed in as $owner, expected $ExpectedOwner. Please run gh auth switch." }
$full = "$owner/$RepoName"
$expectedUrl = "https://$owner.github.io/$RepoName/"

if (Test-Path -LiteralPath '.git' -PathType Container) {
    throw 'This folder already has a .git directory. For safety, deploy from a fresh extracted ZIP instead.'
}

# Do not upload into an unrelated repository, even if it appears empty.
if (Test-Native { & gh api "repos/$full" --jq '.full_name' 1>$null 2>$null }) {
    throw "The repository $full already exists. To avoid overwriting it, choose a different -RepoName."
}

Write-Host "Public repository to create: https://github.com/$full"
Write-Host "Expected website URL: $expectedUrl"
Write-Host 'Public website content includes your name, articles, project summaries, and code.'
if (-not $YesPublic) {
    $ack = Read-Host 'Type PUBLIC to approve a public repository and site'
    if ($ack -cne 'PUBLIC') { throw 'Publication cancelled. No repository was created.' }
}

& git init -b main
Assert-Success 'git init'
& git config user.name $owner
& git config user.email "${owner}@users.noreply.github.com"

# Explicit allowlist: do not accidentally publish local secrets, screenshots, tests, or .env files.
& git add -- 'index.html' 'styles.css' 'radar.css' 'data.js' 'app.js' 'radar.js' 'favicon.svg' `
    'scripts/update_frontier.py' '.github/workflows/update-frontier.yml' `
    'README.md' '.gitignore' 'deploy-windows.ps1' 'start-windows.bat'
Assert-Success 'Stage public website files'
& git commit -m 'feat: publish AI Engineering Lab website with AI frontier auto-refresh'
Assert-Success 'Initial site commit'

Write-Host 'Creating GitHub public repository and pushing code...'
& gh repo create $full --public --description 'AI Engineering Lab - personal learning website and live AI research radar' --source . --remote origin --push
Assert-Success 'Create and push repository'

Write-Host 'Configuring GitHub Pages for GitHub Actions deployment...'
$pagesConfigured = Test-Native { & gh api -X POST "repos/$full/pages" -f 'build_type=workflow' 1>$null 2>$null }
if (-not $pagesConfigured) {
    # A site might already exist. Try switching to Actions workflow mode.
    $pagesConfigured = Test-Native { & gh api -X PUT "repos/$full/pages" -f 'build_type=workflow' 1>$null 2>$null }
}
if (-not $pagesConfigured) {
    Write-Warning "Pages could not be enabled automatically. Open https://github.com/$full/settings/pages and set Source = GitHub Actions."
}

Write-Host 'Triggering the news fetch + deployment workflow...'
& gh workflow run 'update-frontier.yml' -R $full -r main
if ($LASTEXITCODE -ne 0) {
    Write-Warning 'Workflow was not triggered manually. The initial git push should still have started a run.'
}
Write-Host ''
Write-Host "REPOSITORY: https://github.com/$full"
Write-Host "WORKFLOWS:  https://github.com/$full/actions"
Write-Host "SITE (after a successful deployment): $expectedUrl"
Write-Host 'View the most recent workflow and wait until Deploy GitHub Pages succeeds.'
Write-Host "Check JSON snapshot afterwards at ${expectedUrl}frontier-feed.json"
