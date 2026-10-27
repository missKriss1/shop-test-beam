FROM node:22-alpine AS frontend

WORKDIR /app
ENV SKIP_WAYFINDER_GENERATION=true

COPY package.json package-lock.json ./
COPY pnpm-workspace.yaml .npmrc ./

RUN npm ci

COPY . .

ARG VITE_REVERB_APP_KEY=shop-test-key
ARG VITE_REVERB_HOST=localhost
ARG VITE_REVERB_PORT=8080
ARG VITE_REVERB_SCHEME=http

ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

RUN npm run build


# Stage 2: PHP application
FROM php:8.4-fpm-alpine AS app

RUN apk add --no-cache \
    postgresql-dev \
    oniguruma-dev \
    icu-dev \
    libzip-dev \
    linux-headers \
    $PHPIZE_DEPS

RUN docker-php-ext-install \
    pdo_pgsql \
    mbstring \
    intl \
    bcmath \
    opcache \
    zip \
    pcntl \
    sockets

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

COPY . .

COPY --from=frontend /app/public/build ./public/build

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
    && composer dump-autoload --optimize \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]
