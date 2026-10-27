#!/bin/sh
set -e

cd /var/www/html

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    if [ -z "$APP_KEY" ]; then
        echo "Generating APP_KEY..."
        export APP_KEY="$(php -r 'echo "base64:".base64_encode(random_bytes(32));')"
    fi

    php artisan migrate --force --no-interaction

    if [ "${DB_SEED:-false}" = "true" ]; then
        php artisan db:seed --force --no-interaction
    fi
fi

exec "$@"
