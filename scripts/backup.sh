#!/usr/bin/env bash
# Backup PostgreSQL to Cloudflare R2 via the S3-compatible API.
# Usage: backup.sh <environment>   (environment = production | staging)
#
# Prerequisites on the server:
#   1. AWS CLI installed:  apt install awscli
#   2. /etc/multivrss-backup.env containing:
#        R2_ACCOUNT_ID=your-cloudflare-account-id
#        R2_ACCESS_KEY_ID=your-r2-access-key-id
#        R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
#        R2_BUCKET=multivrss-backups
#        POSTGRES_USER=your-db-user
#      Create the R2 API token in the Cloudflare dashboard → R2 → Manage API
#      Tokens → scope it to "Object Read & Write" on this bucket only.
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

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

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

# Upload to R2
aws s3 cp "$LOCAL_DIR/$BACKUP_FILE" "s3://${R2_BUCKET}/${REMOTE_DIR}/${BACKUP_FILE}" \
  --endpoint-url "$R2_ENDPOINT"

echo "[$(date -Iseconds)] Upload complete → s3://${R2_BUCKET}/${REMOTE_DIR}/${BACKUP_FILE}"

# Remove local temp file
rm -f "$LOCAL_DIR/$BACKUP_FILE"

# Prune remote files older than RETENTION_DAYS
# Compute cutoff date as YYYYMMDD integer for comparison
CUTOFF=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d 2>/dev/null \
         || date -v-"${RETENTION_DAYS}"d +%Y%m%d)  # macOS fallback

echo "[$(date -Iseconds)] Checking for backups older than ${RETENTION_DAYS} days..."
aws s3 ls "s3://${R2_BUCKET}/${REMOTE_DIR}/" --endpoint-url "$R2_ENDPOINT" \
  | awk '{print $NF}' \
  | grep "multivrss_${ENVIRONMENT}_" \
  | while IFS= read -r remote_file; do
      # Extract YYYYMMDD from filename: multivrss_production_20250101_030000.sql.gz
      file_date=$(echo "$remote_file" | grep -oE '[0-9]{8}' | head -1)
      if [ -n "$file_date" ] && [ "$file_date" -lt "$CUTOFF" ]; then
        echo "[$(date -Iseconds)] Pruning old backup: $remote_file"
        aws s3 rm "s3://${R2_BUCKET}/${REMOTE_DIR}/${remote_file}" --endpoint-url "$R2_ENDPOINT"
      fi
    done

echo "[$(date -Iseconds)] Backup finished."
