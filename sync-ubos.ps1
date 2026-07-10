Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Repo = "C:\Project\UnifiedLiveBroadcastOS"
Set-Location $Repo

function Run-Step {
    param(
        [string]$Name,
        [scriptblock]$Command,
        [switch]$AllowFailure
    )

    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    & $Command
    $code = $LASTEXITCODE

    if ($code -ne 0) {
        if ($AllowFailure) {
            Write-Warning "$Name failed with exit code $code"
        } else {
            throw "$Name failed with exit code $code"
        }
    }
}

# Protect uncommitted work
$changes = git status --porcelain
if ($changes) {
    Write-Host "Uncommitted changes detected:" -ForegroundColor Yellow
    $changes
    throw "Commit or stash your changes before synchronizing."
}

Run-Step "Fetch branches, PR merges and tags" {
    git fetch --all --prune --tags
}

Run-Step "Switch to main" {
    git switch main
}

Run-Step "Pull merged remote work" {
    git pull --ff-only origin main
}

$local  = git rev-parse main
$remote = git rev-parse origin/main

Write-Host "`nLocal main : $local"
Write-Host "Remote main: $remote"

if ($local -ne $remote) {
    throw "Local main and origin/main are not synchronized."
}

Write-Host "`nRemote branches not merged into main:" -ForegroundColor Yellow
git branch -r --no-merged origin/main

Run-Step "Install dependencies" {
    pnpm install
}

Run-Step "Lint" {
    pnpm lint
}

Run-Step "Typecheck" {
    pnpm typecheck
}

Run-Step "All tests" {
    pnpm test
}

Run-Step "Shared package tests" {
    pnpm --filter "@ubos/shared" test
}

Run-Step "Media-plane tests" {
    pnpm --filter "@ubos/media-plane" test
}

Run-Step "Web production build" {
    pnpm --filter "@ubos/web" build
}

# Root build may fail if Cargo cannot reach crates.io.
Run-Step "Complete repository build" {
    pnpm build
} -AllowFailure

Write-Host "`nUBOS synchronization and validation completed." -ForegroundColor Green
Write-Host "Starting UBOS web application..." -ForegroundColor Green

pnpm --filter "@ubos/web" dev