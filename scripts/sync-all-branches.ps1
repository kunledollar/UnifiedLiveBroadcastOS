param(
    [string]$Repository = "C:\Project\UnifiedLiveBroadcastOS",
    [string]$Remote = "origin",
    [string]$PrimaryBranch = "main"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "=== $Message ===" -ForegroundColor Cyan
}

Set-Location $Repository

Write-Step "Verify Git repository"

if (-not (Test-Path ".git")) {
    throw "The directory is not a Git repository: $Repository"
}

$originalBranch = git branch --show-current

if ([string]::IsNullOrWhiteSpace($originalBranch)) {
    throw "Detached HEAD detected. Check out a branch before running synchronization."
}

Write-Host "Repository: $Repository"
Write-Host "Current branch: $originalBranch"

Write-Step "Verify clean working tree"

$status = git status --porcelain

if ($status) {
    Write-Host $status
    throw @"
The working tree is not clean.

Commit or stash the changes before synchronization:

    git add .
    git commit -m "describe the change"

or:

    git stash push -u -m "temporary sync stash"
"@
}

Write-Step "Verify remote"

git remote get-url $Remote | Out-Null

if ($LASTEXITCODE -ne 0) {
    throw "Remote '$Remote' is not configured."
}

git remote -v

Write-Step "Fetch all remote updates and tags"

git fetch $Remote --prune --tags

if ($LASTEXITCODE -ne 0) {
    throw "git fetch failed."
}

Write-Step "Synchronize primary branch"

git switch $PrimaryBranch

if ($LASTEXITCODE -ne 0) {
    throw "Could not switch to '$PrimaryBranch'."
}

git pull --rebase $Remote $PrimaryBranch

if ($LASTEXITCODE -ne 0) {
    throw @"
The rebase stopped, probably because of a conflict.

Resolve conflicts, then run:

    git add <resolved-files>
    git rebase --continue

To cancel:

    git rebase --abort
"@
}

git push $Remote $PrimaryBranch

if ($LASTEXITCODE -ne 0) {
    throw "Could not push '$PrimaryBranch'."
}

Write-Step "Discover remote branches"

$remoteBranches = git for-each-ref `
    --format="%(refname:short)" `
    "refs/remotes/$Remote/" |
    Where-Object {
        $_ -ne "$Remote/HEAD" -and
        $_ -ne "$Remote/$PrimaryBranch"
    }

foreach ($remoteBranch in $remoteBranches) {
    $localBranch = $remoteBranch.Substring($Remote.Length + 1)

    Write-Host ""
    Write-Host "Processing $remoteBranch" -ForegroundColor Yellow

    $localExists = git show-ref --verify --quiet "refs/heads/$localBranch"
    $localExists = ($LASTEXITCODE -eq 0)

    if (-not $localExists) {
        git branch --track $localBranch $remoteBranch

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Created local tracking branch: $localBranch" -ForegroundColor Green
        }
        else {
            Write-Warning "Could not create local branch '$localBranch'."
        }

        continue
    }

    git switch $localBranch | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Could not switch to '$localBranch'."
        continue
    }

    $branchStatus = git status --porcelain

    if ($branchStatus) {
        Write-Warning "Skipped '$localBranch' because it contains uncommitted changes."
        continue
    }

    git merge --ff-only $remoteBranch

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Fast-forwarded: $localBranch" -ForegroundColor Green
    }
    else {
        Write-Warning @"
'$localBranch' has diverged from '$remoteBranch'.
It was not merged automatically.
Inspect it manually before rebasing or merging.
"@
        git merge --abort 2>$null
    }
}

Write-Step "Return to primary branch"

git switch $PrimaryBranch
git pull --rebase $Remote $PrimaryBranch

Write-Step "Branch synchronization report"

git branch -vv

Write-Host ""
Write-Host "Remote branches not merged into ${PrimaryBranch}:" -ForegroundColor Yellow

git branch -r --no-merged "$Remote/$PrimaryBranch" |
    Where-Object { $_ -notmatch "/HEAD" }

Write-Host ""
Write-Host "Remote branches already merged into ${PrimaryBranch}:" -ForegroundColor Green

git branch -r --merged "$Remote/$PrimaryBranch" |
    Where-Object { $_ -notmatch "/HEAD" }

Write-Step "Final repository status"

git status
git log --oneline --decorate -10

Write-Host ""
Write-Host "Synchronization completed safely." -ForegroundColor Green
Write-Host "No feature branches were automatically merged into main."
