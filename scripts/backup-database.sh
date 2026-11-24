#!/usr/bin/env bash
# Resona — Database Backup Utility (Bash)
# Executes a logical SQL dump of the Supabase PostgreSQL database schema and data.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/../supabase/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="${BACKUP_DIR}/resona_backup_${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

echo "=========================================="
echo "  Resona Supabase Database Backup Utility"
echo "=========================================="
echo "Target: ${OUTPUT_FILE}"

if command -v supabase &> /dev/null; then
    echo "Running dump via Supabase CLI..."
    supabase db dump -f "${OUTPUT_FILE}"
elif command -v pg_dump &> /dev/null; then
    echo "Running dump via pg_dump..."
    if [ -f "${SCRIPT_DIR}/../.env" ]; then
        export $(grep -v '^#' "${SCRIPT_DIR}/../.env" | xargs)
    fi
    DB_URL="${DATABASE_URL:-postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.amjprdghovrrdbwwktgt.supabase.co:5432/postgres}"
    pg_dump "${DB_URL}" > "${OUTPUT_FILE}"
else
    echo "Error: Neither supabase CLI nor pg_dump found in PATH."
    echo "See: https://supabase.com/docs/guides/database/backup-and-restore"
    exit 1
fi

echo "Backup completed successfully!"
ls -lh "${OUTPUT_FILE}"
