param(
    [string]$Repo = "C:\Project\UnifiedLiveBroadcastOS",
    [string]$Branch = "main",
    [string]$CommitMessage = "Update UBOS implementation",
    [switch]$SkipValidation,
    [switch]$SkipDocker
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Stop-WithError {
    param([string]$Message)
    Write-Host "`nERROR: $Message" -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# 1. Enter repository
# ---------------------------------------------------------------------------

Write-Step "Opening UBOS repository"

if (-not (Test-Path -LiteralPath $Repo)) {
    Stop-WithError "Repository not found: $Repo"
}

Set-Location -LiteralPath $Repo

if (-not (Test-Path -LiteralPath ".git")) {
    Stop-WithError "$Repo is not a Git repository."
}

# ---------------------------------------------------------------------------
# 2. Prevent operations during unfinished Git work
# ---------------------------------------------------------------------------

Write-Step "Checking Git state"

$GitDir = git rev-parse --git-dir

if (Test-Path (Join-Path $GitDir "rebase-merge")) {
    Stop-WithError "A Git rebase is already in progress. Finish or abort it first."
}

if (Test-Path (Join-Path $GitDir "rebase-apply")) {
    Stop-WithError "A Git rebase is already in progress. Finish or abort it first."
}

if (Test-Path (Join-Path $GitDir "MERGE_HEAD")) {
    Stop-WithError "A Git merge is already in progress. Resolve it first."
}

git checkout $Branch

# ---------------------------------------------------------------------------
# 3. Commit intentional local changes
# ---------------------------------------------------------------------------

$LocalChanges = git status --porcelain

if ($LocalChanges) {
    Write-Host "`nLocal changes detected:" -ForegroundColor Yellow
    git status --short

    $Answer = Read-Host "`nStage and commit all listed changes? Type YES to continue"

    if ($Answer -ne "YES") {
        Stop-WithError "Commit cancelled. Review the files and run the script again."
    }

    git add -A

    Write-Host "`nFiles staged for commit:" -ForegroundColor Yellow
    git diff --cached --stat

    git diff --cached --check

    git commit -m $CommitMessage
}
else {
    Write-Host "No uncommitted local changes." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 4. Synchronize with GitHub
# ---------------------------------------------------------------------------

Write-Step "Fetching GitHub changes"

git fetch origin --prune --tags

Write-Step "Rebasing local work onto origin/$Branch"

git rebase "origin/$Branch"

Write-Step "Pushing UBOS to GitHub"

git push origin $Branch

Write-Step "Verifying repository synchronization"

git fetch origin

$LocalCommit = git rev-parse HEAD
$RemoteCommit = git rev-parse "origin/$Branch"

if ($LocalCommit -ne $RemoteCommit) {
    Stop-WithError "Local and remote commits do not match after push."
}

if (git status --porcelain) {
    Stop-WithError "Working tree is not clean after synchronization."
}

Write-Host "Git synchronization completed." -ForegroundColor Green
Write-Host "Commit: $LocalCommit" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 5. Verify Node.js and pnpm
# ---------------------------------------------------------------------------

Write-Step "Checking development tools"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Stop-WithError "Node.js is not installed or is not available in PATH."
}

if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
    Stop-WithError "Corepack is unavailable. Install a current Node.js release."
}

corepack enable

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    corepack prepare pnpm@latest --activate
}

node --version
pnpm --version

# ---------------------------------------------------------------------------
# 6. Install dependencies
# ---------------------------------------------------------------------------

Write-Step "Installing UBOS dependencies"

if (Test-Path -LiteralPath "pnpm-lock.yaml") {
    pnpm install --frozen-lockfile
}
else {
    pnpm install
}

# ---------------------------------------------------------------------------
# 7. Start Docker services when available
# ---------------------------------------------------------------------------

if (-not $SkipDocker) {
    $ComposeFile = $null

    if (Test-Path -LiteralPath "docker-compose.yml") {
        $ComposeFile = "docker-compose.yml"
    }
    elseif (Test-Path -LiteralPath "docker-compose.yaml") {
        $ComposeFile = "docker-compose.yaml"
    }
    elseif (Test-Path -LiteralPath "compose.yml") {
        $ComposeFile = "compose.yml"
    }
    elseif (Test-Path -LiteralPath "compose.yaml") {
        $ComposeFile = "compose.yaml"
    }

    if ($ComposeFile) {
        Write-Step "Starting Docker services"

        if (Get-Command docker -ErrorAction SilentlyContinue) {
            docker compose -f $ComposeFile up -d
            docker compose -f $ComposeFile ps
        }
        else {
            Write-Host "Docker is unavailable. Continuing without container services." `
                -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "No Docker Compose file found. Skipping Docker startup." `
            -ForegroundColor DarkYellow
    }
}

# ---------------------------------------------------------------------------
# 8. Validate repository
# ---------------------------------------------------------------------------

if (-not $SkipValidation) {
    Write-Step "Running UBOS validation"

    pnpm lint
    pnpm typecheck
    pnpm build
}
else {
    Write-Host "Validation skipped by command option." -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# 9. Detect the web package
# ---------------------------------------------------------------------------

Write-Step "Detecting UBOS web application"

$WebPackageFile = Join-Path $Repo "apps\web\package.json"

if (-not (Test-Path -LiteralPath $WebPackageFile)) {
    Stop-WithError "Web application package not found: $WebPackageFile"
}

$WebPackage = Get-Content -LiteralPath $WebPackageFile -Raw | ConvertFrom-Json
$WebPackageName = $WebPackage.name

if (-not $WebPackageName) {
    Stop-WithError "The web package does not define a package name."
}

if (-not $WebPackage.scripts.dev) {
    Stop-WithError "The web package does not define a dev script."
}

Write-Host "Web package detected: $WebPackageName" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 10. Launch UBOS locally
# ---------------------------------------------------------------------------

Write-Step "Launching UBOS locally"

Write-Host "The development server will remain active in this terminal." `
    -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop UBOS." -ForegroundColor Yellow

pnpm --filter $WebPackageName dev