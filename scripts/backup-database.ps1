# Resona — Database Backup Utility (PowerShell)
# Executes a logical SQL dump of the Supabase PostgreSQL database schema and data.

param (
    [string]$OutputDir = "$PSScriptRoot\..\supabase\backups"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = Join-Path $OutputDir "resona_backup_$Timestamp.sql"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Resona Supabase Database Backup Utility" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Target output: $OutputFile"

# Check for Supabase CLI
$supabaseCli = Get-Command "supabase" -ErrorAction SilentlyContinue

if ($supabaseCli) {
    Write-Host "Running logical dump via Supabase CLI..." -ForegroundColor Yellow
    & supabase db dump -f "$OutputFile"
} else {
    Write-Host "Supabase CLI not found in PATH." -ForegroundColor Yellow
    Write-Host "Using pg_dump or environment credentials..." -ForegroundColor Yellow
    
    # Read .env if present
    $envPath = "$PSScriptRoot\..\.env"
    if (Test-Path $envPath) {
        Get-Content $envPath | Where-Object { $_ -match "^[^#].+=.+" } | ForEach-Object {
            $parts = $_ -split "=", 2
            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
        }
    }
    
    $dbUrl = $env:DATABASE_URL
    if (-not $dbUrl) {
        $dbUrl = "postgresql://postgres:$($env:SUPABASE_DB_PASSWORD)@db.amjprdghovrrdbwwktgt.supabase.co:5432/postgres"
    }

    $pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
    if ($pgDump) {
        & pg_dump "$dbUrl" -f "$OutputFile"
    } else {
        Write-Host "Please install Supabase CLI or PostgreSQL client tools (pg_dump) to execute." -ForegroundColor Red
        Write-Host "Documentation: https://supabase.com/docs/guides/database/backup-and-restore"
        exit 1
    }
}

if (Test-Path $OutputFile) {
    $size = (Get-Item $OutputFile).Length
    Write-Host "Backup completed successfully! Size: $([math]::Round($size / 1KB, 2)) KB" -ForegroundColor Green
}
