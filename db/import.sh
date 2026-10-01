#!/usr/bin/env bash
# Imports the two RETS SQL dumps into the running idx-mysql-local container.
# Usage:  ./db/import.sh /path/to/sql/folder
set -euo pipefail

CONTAINER="idx-mysql-local"
DB="rets"
DB_USER="root"
DB_PASS="retspass123"

SQL_DIR="${1:-}"
if [[ -z "$SQL_DIR" || ! -d "$SQL_DIR" ]]; then
  echo "Usage: $0 /path/to/folder/containing/rets_property.sql" >&2
  exit 1
fi

export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

for f in rets_property.sql rets_openhouse.sql; do
  src="$SQL_DIR/$f"
  if [[ ! -f "$src" ]]; then
    echo "ERROR: missing $src" >&2
    exit 1
  fi
  echo "Importing $f ..."
  docker exec -i "$CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" "$DB" < "$src"
  echo "  done."
done

echo
echo "Verifying:"
docker exec -i "$CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" "$DB" \
  -e "SELECT COUNT(*) AS rets_property    FROM rets_property;
      SELECT COUNT(*) AS rets_openhouse   FROM rets_openhouse;"
