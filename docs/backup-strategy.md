# Backup Strategy

## Overview

`pg_dumpall` is streamed directly into Restic, which encrypts, deduplicates, and uploads to Cloudflare R2. One Restic repository per environment (production, staging), both under the same R2 bucket at different key prefixes.

```
docker exec db pg_dumpall  →  restic backup --stdin  →  R2 (encrypted, deduplicated)
```

## Why Restic (vs. plain pg_dump + gzip + upload)

| | Plain gzip + upload | Restic |
|---|---|---|
| Encryption at rest | None — dump sits on R2 in cleartext | AES-256, always on, no opt-out |
| Deduplication | None — full dump re-uploaded every run | Content-defined chunking, only changed blocks stored |
| Retention / pruning | Hand-rolled bash date parsing | `restic forget --keep-daily/--keep-weekly/--keep-monthly --prune` |
| Integrity check | None | `restic check` |
| Dependencies | `aws-cli` | Single static binary |

The dump contains bcrypt password hashes and user emails. Storing it unencrypted on third-party storage was the one real gap in the previous approach — Restic closes it by default.

## Cloudflare R2 setup (one-time, manual)

1. Cloudflare dashboard → R2 → create bucket `multivrss-backups`
2. R2 → Manage API Tokens → create a token scoped to **Object Read & Write** on `multivrss-backups` only
3. Note down: Account ID, Access Key ID, Secret Access Key

## Repository layout

Two independent Restic repositories in the same bucket, at different path prefixes — keeps staging and production snapshots from ever mixing:

| Environment | Restic repository |
|---|---|
| Production | `s3:https://<ACCOUNT_ID>.r2.cloudflarestorage.com/multivrss-backups/production` |
| Staging | `s3:https://<ACCOUNT_ID>.r2.cloudflarestorage.com/multivrss-backups/staging` |

## Secrets (`/etc/multivrss-backup.env`, root-only, `chmod 600`)

| Variable | Purpose |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare account ID, used to build the R2 endpoint |
| `AWS_ACCESS_KEY_ID` | R2 API token access key (Restic's S3 backend reads this standard name) |
| `AWS_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET` | `multivrss-backups` |
| `RESTIC_PASSWORD` | Repository encryption key — see below |
| `POSTGRES_USER` | DB user, passed to `pg_dumpall` |

**Critical: the Restic password.** Generate once with `openssl rand -base64 32`. This key decrypts every snapshot ever taken. Store it in **two places**: the env file above (for the automated script) and a password manager outside the VPS. If the VPS disk is lost and this password only lived there, every backup on R2 becomes permanently unreadable ciphertext — the same encryption that protects against a stolen bucket also means there is no recovery path if the key itself is lost.

## One-time initialization (per environment)

```bash
source /etc/multivrss-backup.env
export RESTIC_REPOSITORY="s3:https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/production"
restic init
```

Repeat with `/staging` for the staging repository. `restic init` must run once before the first backup — the script does not auto-create the repository.

## Daily backup logic (`scripts/backup.sh`)

```bash
docker exec "$DB_CONTAINER" pg_dumpall -U "$POSTGRES_USER" \
  | restic backup --stdin --stdin-filename "db_${ENVIRONMENT}.sql" \
      --host "multivrss-${ENVIRONMENT}" --tag automated

restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
```

Notes:

- **No `gzip` step.** Restic compresses internally (zstd) and deduplicates on raw content. Pre-compressing with gzip would make every run look 100% different to Restic's chunker — gzip's output isn't byte-stable across runs — which would destroy deduplication.
- **`--stdin`** lets Restic read the dump straight from the `docker exec | pg_dumpall` pipe — no local temp file, unlike the previous gzip + `aws s3 cp` version.
- **`forget --prune` runs after each backup**, applying retention immediately rather than letting old snapshots accumulate as unreferenced data.

## Cron (`/etc/cron.d/multivrss-backup`)

```
0 3 * * * ubuntu /home/ubuntu/multivrss/scripts/backup.sh production >> /var/log/multivrss-backup.log 2>&1
0 4 * * * ubuntu /home/ubuntu/multivrss/scripts/backup.sh staging   >> /var/log/multivrss-backup.log 2>&1
```

## Restore procedure

```bash
source /etc/multivrss-backup.env
export RESTIC_REPOSITORY="s3:https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/production"

restic snapshots                                    # list available snapshots
restic dump latest "db_production.sql" > /tmp/restore.sql
psql -U "$POSTGRES_USER" -d restore_test < /tmp/restore.sql
```

`restic dump latest <path>` streams the file straight out of the encrypted repository without a full restore-to-disk step. Always restore into a scratch database (`restore_test`) first — never directly into `production` — and diff row counts before trusting it.

## Verification cadence

| Cadence | Check |
|---|---|
| Every run | Non-zero exit from `backup.sh` surfaces in the cron log |
| Weekly | `restic check` — verifies repository index and structure |
| Monthly | Full restore drill into a scratch DB, compare row counts against production |

A backup that has never been restored is not a backup — it's an assumption.

## Cost estimate

R2 free tier: 10 GB storage, unlimited egress, 1M Class A + 10M Class B operations/month. A personal RSS reader's Postgres dump (bounded by the existing 90-day `FeedItem` retention purge) is realistically tens to low hundreds of MB; with daily/weekly/monthly retention and Restic deduplication, expected footprint stays well under the free tier.

**Expected cost: $0/month.**

## Not included yet (optional follow-up)

- **Failure alerting** — a dead-man's-switch ping (e.g. healthchecks.io free tier) so a silently failing cron job gets noticed instead of discovered at restore time. Recommended before relying on this as the sole backup path.
