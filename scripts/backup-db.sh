#!/bin/bash
# =============================================================================
# ASISTEN+STOCK - AUTOMATED POSTGRESQL BACKUP SCRIPT
# Standar Perlindungan Data Zero-Loss:
# - Dump database langsung dari kontainer Docker
# - Kompresi gzip (.sql.gz) hemat disk
# - Rotasi otomatis hapus backup > 7 hari
# - Dapat dijalankan harian via Linux Cron (misal jam 02:00 WIB)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="$BACKUP_DIR/backup_asisten_stock_$TIMESTAMP.sql.gz"

# Pastikan folder backup ada
mkdir -p "$BACKUP_DIR"

# Baca variabel dari .env.production jika ada
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.production" | xargs)
fi

DB_CONTAINER="${POSTGRES_CONTAINER_NAME:-asisten-postgres-prod}"
DB_USER="${POSTGRES_USER:-asisten_prod_admin}"
DB_NAME="${POSTGRES_DB:-asisten_stock_prod_db}"

echo "[$(date)] 📦 Memulai backup database $DB_NAME dari container $DB_CONTAINER..."

# Eksekusi pg_dump via Docker dan kompresi gzip
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Validasi ukuran file
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] ✅ Backup sukses tersimpan: $BACKUP_FILE ($FILE_SIZE)"

# Bersihkan backup yang lebih tua dari 7 hari
echo "[$(date)] 🧹 Membersihkan arsip backup yang berumur lebih dari 7 hari..."
find "$BACKUP_DIR" -name "backup_asisten_stock_*.sql.gz" -mtime +7 -delete
echo "[$(date)] ✨ Pembersihan selesai."
