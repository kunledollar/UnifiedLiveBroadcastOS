param(
    [Parameter(Mandatory = $true)]
    [string]$CommitMessage,

    [string]$Repository = "C:\Project\UnifiedLiveBroadcastOS",

    [string]$Remote = "origin",

    [string]$PrimaryBranch = "main",

    [switch]$MergeToMain,

    [switch]$SkipValidation
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)

    Write-Host ""
    Write-Host "==================================================" -ForegroundColor DarkGray
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor DarkGray
}

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Write-Host "git $($Arguments -join ' ')" -ForegroundColor DarkGray

    & git @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($Arguments -join ' ')"
    }
}

function Invoke-Pnpm {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Write-Host "pnpm $($Arguments -join ' ')" -ForegroundColor DarkGray

    & pnpm @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "Validation failed: pnpm $($Arguments -join ' ')"
    }
}

function Test-RemoteBranch {
    param(
        [string]$RemoteName,
        [string]$BranchName
    )

    & git show-ref --verify --quiet "refs/remotes/$RemoteName/$BranchName"

    return ($LASTEXITCODE -eq 0)
}

Set-Location $Repository

Write-Step "Verify repository"

if (-not (Test-Path ".git")) {
    throw "Not a Git repository: $Repository"
}

$currentBranch = (& git branch --show-current).Trim()

if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    throw "Detached HEAD detected. Switch to a named branch first."
}

Write-Host "Repository:     $Repository"
Write-Host "Current branch: $currentBranch"
Write-Host "Primary branch: $PrimaryBranch"
Write-Host "Remote:         $Remote"

Write-Step "Check for unfinished Git operations"

$gitDirectory = (& git rev-parse --git-dir).Trim()

$unfinishedOperations = @(
    (Join-Path $gitDirectory "MERGE_HEAD"),
    (Join-Path $gitDirectory "CHERRY_PICK_HEAD"),
    (Join-Path $gitDirectory "REVERT_HEAD"),
    (Join-Path $gitDirectory "rebase-merge"),
    (Join-Path $gitDirectory "rebase-apply")
)

foreach ($operation in $unfinishedOperations) {
    if (Test-Path $operation) {
        throw @"
An unfinished Git operation exists:

$operation

Complete or abort that operation before publishing another update.
"@
    }
}

Write-Step "Verify remote configuration"

$remoteUrl = (& git remote get-url $Remote).Trim()

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($remoteUrl)) {
    throw "Remote '$Remote' is not configured."
}

Write-Host "$Remote -> $remoteUrl"

Write-Step "Review current changes"

& git status --short

if ($LASTEXITCODE -ne 0) {
    throw "Unable to inspect repository status."
}

Write-Step "Stage the completed update"

Invoke-Git -Arguments @("add", "--all")

$stagedChanges = & git diff --cached --name-only

if ($LASTEXITCODE -ne 0) {
    throw "Unable to inspect staged changes."
}

if ($stagedChanges) {
    Write-Host "Files included in commit:" -ForegroundColor Yellow
    $stagedChanges | ForEach-Object {
        Write-Host "  $_"
    }

    Write-Step "Create focused commit"

    Invoke-Git -Arguments @(
        "commit",
        "-m",
        $CommitMessage
    )
}
else {
    Write-Host "No new changes to commit." -ForegroundColor Yellow
}

Write-Step "Fetch all remote updates"

Invoke-Git -Arguments @(
    "fetch",
    $Remote,
    "--prune",
    "--tags"
)

Write-Step "Synchronize current branch"

if (Test-RemoteBranch -RemoteName $Remote -BranchName $currentBranch) {
    try {
        Invoke-Git -Arguments @(
            "rebase",
            "$Remote/$currentBranch"
        )
    }
    catch {
        Write-Host ""
        Write-Host "The rebase stopped because manual resolution is required." -ForegroundColor Red
        Write-Host ""
        Write-Host "Inspect conflicts:" -ForegroundColor Yellow
        Write-Host "  git status"
        Write-Host ""
        Write-Host "After resolving them:" -ForegroundColor Yellow
        Write-Host "  git add <resolved-files>"
        Write-Host "  git rebase --continue"
        Write-Host ""
        Write-Host "To cancel:" -ForegroundColor Yellow
        Write-Host "  git rebase --abort"

        throw
    }

    Invoke-Git -Arguments @(
        "push",
        $Remote,
        $currentBranch
    )
}
else {
    Write-Host "Remote branch does not yet exist. Creating it." -ForegroundColor Yellow

    Invoke-Git -Arguments @(
        "push",
        "--set-upstream",
        $Remote,
        $currentBranch
    )
}

if ($MergeToMain -and $currentBranch -ne $PrimaryBranch) {
    Write-Step "Validate completed feature branch"

    if (-not $SkipValidation) {
        Invoke-Pnpm -Arguments @(
            "--filter",
            "@ubos/web",
            "test"
        )

        Invoke-Git -Arguments @(
            "diff",
            "--check"
        )
    }
    else {
        Write-Host "Validation skipped by explicit request." -ForegroundColor Yellow
    }

    Write-Step "Synchronize primary branch"

    Invoke-Git -Arguments @(
        "switch",
        $PrimaryBranch
    )

    Invoke-Git -Arguments @(
        "pull",
        "--rebase",
        $Remote,
        $PrimaryBranch
    )

    Write-Step "Merge completed branch into primary branch"

    try {
        Invoke-Git -Arguments @(
            "merge",
            "--no-ff",
            $currentBranch,
            "-m",
            "Merge completed work from $currentBranch"
        )
    }
    catch {
        Write-Host ""
        Write-Host "The merge has conflicts and was not completed." -ForegroundColor Red
        Write-Host ""
        Write-Host "Inspect conflicts:" -ForegroundColor Yellow
        Write-Host "  git status"
        Write-Host ""
        Write-Host "After resolving conflicts:" -ForegroundColor Yellow
        Write-Host "  git add <resolved-files>"
        Write-Host "  git commit"
        Write-Host ""
        Write-Host "To cancel:" -ForegroundColor Yellow
        Write-Host "  git merge --abort"

        throw
    }

    Write-Step "Validate merged primary branch"

    if (-not $SkipValidation) {
        Invoke-Pnpm -Arguments @(
            "--filter",
            "@ubos/web",
            "test"
        )

        Invoke-Git -Arguments @(
            "diff",
            "--check"
        )
    }

    Write-Step "Publish primary branch"

    Invoke-Git -Arguments @(
        "push",
        $Remote,
        $PrimaryBranch
    )
}
elseif ($currentBranch -eq $PrimaryBranch) {
    Write-Step "Current work was completed directly on primary branch"

    if (-not $SkipValidation) {
        Invoke-Pnpm -Arguments @(
            "--filter",
            "@ubos/web",
            "test"
        )

        Invoke-Git -Arguments @(
            "diff",
            "--check"
        )
    }

    Invoke-Git -Arguments @(
        "push",
        $Remote,
        $PrimaryBranch
    )
}

Write-Step "Refresh all remote references"

Invoke-Git -Arguments @(
    "fetch",
    $Remote,
    "--prune",
    "--tags"
)

Write-Step "Final synchronization report"

& git status
& git branch -vv
& git log --oneline --decorate -10

Write-Host ""
Write-Host "Remote branches not merged into ${PrimaryBranch}:" -ForegroundColor Yellow

& git branch -r --no-merged "$Remote/$PrimaryBranch" |
    Where-Object {
        $_ -notmatch "/HEAD"
    }

Write-Host ""
Write-Host "Update synchronization completed successfully." -ForegroundColor Green

if ($MergeToMain -and $currentBranch -ne $PrimaryBranch) {
    Write-Host "The completed branch was merged and pushed to $PrimaryBranch." -ForegroundColor Green
}
else {
    Write-Host "The current branch was committed, synchronized, and pushed." -ForegroundColor Green
}