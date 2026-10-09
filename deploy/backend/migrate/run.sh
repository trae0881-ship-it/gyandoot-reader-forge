#!/bin/sh
# Applies supabase/migrations in order. Hosted backend URLs inside cron jobs
# are rewritten to this deployment's public API URL.
set -e
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${PUBLIC_API_URL:?PUBLIC_API_URL is required (Railway gateway URL)}"
OLD_URL="https://vrzngahawxtbpwrgxtmb.supabase.co"

until psql "$DATABASE_URL" -c 'select 1' >/dev/null 2>&1; do
  echo "waiting for database..."; sleep 3
done

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /bootstrap.sql

for f in $(ls /migrations/*.sql | sort); do
  name=$(basename "$f")
  done_already=$(psql "$DATABASE_URL" -tAc "select 1 from railway_meta.applied_migrations where name='$name'")
  if [ "$done_already" = "1" ]; then continue; fi
  echo "applying $name"
  sed -e "s#${OLD_URL}#${PUBLIC_API_URL}#g" \
      -e "s#vrzngahawxtbpwrgxtmb#${PROJECT_REF:-railway}#g" "$f" > /tmp/m.sql
  if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f /tmp/m.sql; then
    psql "$DATABASE_URL" -c "insert into railway_meta.applied_migrations(name) values ('$name')"
  else
    echo "FAILED: $name"; exit 1
  fi
done
echo "all migrations applied"
