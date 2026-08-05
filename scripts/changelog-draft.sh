#!/usr/bin/env bash
# Draft a CHANGELOG.md-style recap of every commit since the last release tag.
# Manual replacement for the release-please automation (removed) — run this
# when you're about to cut a release, review/edit the output, then paste it
# under a new "## [X.Y.Z] - YYYY-MM-DD" heading in CHANGELOG.md.
#
# Usage: scripts/changelog-draft.sh [from-ref] [to-ref]
#   from-ref  defaults to the most recent multivrss-v* tag (falls back to any tag)
#   to-ref    defaults to HEAD
#
# Groups commits by Conventional Commits prefix: feat -> Added, fix -> Fixed,
# everything else -> Changed. Commits that don't follow the convention are
# listed as-is under Changed so nothing gets silently dropped.

set -euo pipefail

FROM_REF="${1:-$(git describe --tags --abbrev=0 --match 'multivrss-v*' 2>/dev/null || git describe --tags --abbrev=0 2>/dev/null)}"
TO_REF="${2:-HEAD}"

if [ -z "$FROM_REF" ]; then
  echo "No previous tag found — pass a from-ref explicitly, e.g. scripts/changelog-draft.sh <commit-or-tag>" >&2
  exit 1
fi

echo "# Draft changelog: ${FROM_REF}..${TO_REF}"
echo

print_group() {
  local label="$1" pattern="$2"
  local lines
  lines=$(git log "${FROM_REF}..${TO_REF}" --no-merges --pretty=format:'%s|%h' \
    | grep -iE "$pattern" \
    | sed -E 's/^[a-zA-Z]+(\([^)]*\))?!?: ?//' \
    | awk -F'|' '{ $1=toupper(substr($1,1,1)) substr($1,2); printf "- %s (%s)\n", $1, $2 }')
  if [ -n "$lines" ]; then
    echo "### ${label}"
    echo "$lines"
    echo
  fi
}

print_group "Added" '^feat(\(|:|!)'
print_group "Fixed" '^fix(\(|:|!)'

OTHER=$(git log "${FROM_REF}..${TO_REF}" --no-merges --pretty=format:'%s|%h' \
  | grep -ivE '^(feat|fix)(\(|:|!)' \
  | sed -E 's/^[a-zA-Z]+(\([^)]*\))?!?: ?//' \
  | awk -F'|' '{ $1=toupper(substr($1,1,1)) substr($1,2); printf "- %s (%s)\n", $1, $2 }')
if [ -n "$OTHER" ]; then
  echo "### Changed"
  echo "$OTHER"
fi
