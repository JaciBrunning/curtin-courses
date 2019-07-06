#!/bin/bash

echo "Running Entrypoint Script"

if [ -f /run/secrets/secretkeybase ]; then
export "SECRET_KEY_BASE"=$(cat /run/secrets/secretkeybase)
fi

if [ -f /run/secrets/dbpass ]; then
export "POSTGRES_PASSWORD"=$(cat /run/secrets/dbpass)
fi

if [ -f /run/secrets/master ]; then
export "RAILS_MASTER_KEY"=$(cat /run/secrets/master)
fi

exec "$@"