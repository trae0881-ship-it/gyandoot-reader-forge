#!/bin/sh
set -e
: "${PORT:=8000}"
export KONG_PROXY_LISTEN="0.0.0.0:${PORT}"
envsubst < /kong.yml.template > /tmp/kong.yml
exec /docker-entrypoint.sh kong docker-start
