#!/usr/bin/env bash
#
# Backup the Life RPG SQLite database with a timestamped filename. Keeps
# only the most recent 20 backups to avoid unbounded disk growth.
#
# Usage:
#   npm run db:backup
#   # or directly:
#   bash scripts/backup.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_FILE="$ROOT/prisma/dev.db"
BACKUP_DIR="$ROOT/prisma/backups"
KEEP=20

if [ ! -f "$DB_FILE" ]; then
  echo "❌ No database found at $DB_FILE"
  echo "   Run 'npm run db:migrate' first."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEST="$BACKUP_DIR/dev_$TIMESTAMP.db"

# Use sqlite3's .backup command if available (safe under concurrent writes).
# Falls back to cp, which is fine since we're a single-user app.
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_FILE" ".backup '$DEST'"
else
  cp "$DB_FILE" "$DEST"
fi

SIZE=$(du -h "$DEST" | cut -f1)
echo "✓ Backed up to $DEST ($SIZE)"

# Rotate old backups — keep the 20 most recent
COUNT=$(ls -1 "$BACKUP_DIR"/dev_*.db 2>/dev/null | wc -l | tr -d ' ')
if [ "$COUNT" -gt "$KEEP" ]; then
  REMOVED=$((COUNT - KEEP))
  # shellcheck disable=SC2012
  ls -1t "$BACKUP_DIR"/dev_*.db | tail -n +$((KEEP + 1)) | while read -r f; do
    rm "$f"
  done
  echo "  (rotated: removed $REMOVED old backup(s), kept last $KEEP)"
fi
