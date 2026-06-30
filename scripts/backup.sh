#!/usr/bin/env bash
# Backup PostgreSQL to Hetzner Storage Box via SFTP.
# Usage: backup.sh <environment>   (environment = production | staging)
#
# Prerequisites on the server:
#   1. sshpass installed:  apt install sshpass
#   2. /etc/multivrss-backup.env containing:
#        STORAGE_BOX_HOST=uXXXXXX.your-storagebox.de
#        STORAGE_BOX_USER=uXXXXXX
#        SSHPASS=your-storage-box-password
#        POSTGRES_USER=your-db-user
#
# Cron (add to /etc/cron.d/multivrss-backup):
#   0 3 * * * ubuntu /home/ubuntu/multivrss/scripts/backup.sh production >> /var/log/multivrss-backup.log 2>&1
#   0 4 * * * ubuntu /home/ubuntu/multivrss/scripts/backup.sh staging   >> /var/log/multivrss-backup.log 2>&1

set -euo pipefail

ENVIRONMENT="${1:-production}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="multivrss_${ENVIRONMENT}_${TIMESTAMP}.sql.gz"
LOCAL_DIR="/tmp/multivrss-backups"
REMOTE_DIR="backups/${ENVIRONMENT}"
RETENTION_DAYS=30
COMPOSE_FILE="$HOME/multivrss/docker-compose.prod.yml"

# Load credentials
ENV_FILE="/etc/multivrss-backup.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found."
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

if [ "$ENVIRONMENT" = "production" ]; then
  COMPOSE_PROJECT="multivrss-prod"
else
  COMPOSE_PROJECT="multivrss-staging"
fi

mkdir -p "$LOCAL_DIR"

echo "[$(date -Iseconds)] Starting backup: env=$ENVIRONMENT project=$COMPOSE_PROJECT"

# Get the DB container ID for this compose project
DB_CONTAINER=$(docker compose -f "$COMPOSE_FILE" --project-name "$COMPOSE_PROJECT" ps -q db)
if [ -z "$DB_CONTAINER" ]; then
  echo "ERROR: DB container not running for project $COMPOSE_PROJECT"
  exit 1
fi

# Dump and compress
docker exec "$DB_CONTAINER" pg_dumpall -U "$POSTGRES_USER" \
  | gzip > "$LOCAL_DIR/$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$LOCAL_DIR/$BACKUP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Dump complete: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to Storage Box
sshpass -e sftp -o StrictHostKeyChecking=no \
  "${STORAGE_BOX_USER}@${STORAGE_BOX_HOST}" <<SFTP
-mkdir ${REMOTE_DIR}
put ${LOCAL_DIR}/${BACKUP_FILE} ${REMOTE_DIR}/${BACKUP_FILE}
bye
SFTP

echo "[$(date -Iseconds)] Upload complete → ${REMOTE_DIR}/${BACKUP_FILE}"

# Remove local temp file
rm -f "$LOCAL_DIR/$BACKUP_FILE"

# Prune remote files older than RETENTION_DAYS
# Compute cutoff date as YYYYMMDD integer for comparison
CUTOFF=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d 2>/dev/null \
         || date -v-"${RETENTION_DAYS}"d +%Y%m%d)  # macOS fallback

# List remote files, extract those matching our naming pattern, delete old ones
BATCH_FILE=$(mktemp)
sshpass -e sftp -o StrictHostKeyChecking=no \
  "${STORAGE_BOX_USER}@${STORAGE_BOX_HOST}" \
  -b <(echo "ls ${REMOTE_DIR}/") 2>/dev/null \
  | grep "multivrss_${ENVIRONMENT}_" \
  | awk '{print $NF}' \
  | while IFS= read -r remote_file; do
      # Extract YYYYMMDD from filename: multivrss_production_20250101_030000.sql.gz
      file_date=$(echo "$remote_file" | grep -oE '[0-9]{8}' | head -1)
      if [ -n "$file_date" ] && [ "$file_date" -lt "$CUTOFF" ]; then
        echo "rm ${REMOTE_DIR}/${remote_file}"
      fi
    done > "$BATCH_FILE"

if [ -s "$BATCH_FILE" ]; then
  echo "bye" >> "$BATCH_FILE"
  echo "[$(date -Iseconds)] Pruning old backups..."
  sshpass -e sftp -o StrictHostKeyChecking=no \
    "${STORAGE_BOX_USER}@${STORAGE_BOX_HOST}" \
    -b "$BATCH_FILE"
fi
rm -f "$BATCH_FILE"

echo "[$(date -Iseconds)] Backup finished."
