# Shop Test Beam

Laravel-приложение для демонстрации CRUD, связей Eloquent, REST API и WebSocket-уведомлений.

## Что реализовано

- **CRUD:** пользователи, профили, категории, товары, теги
- **Связи:** один к одному (`User`–`Profile`), один ко многим / многие к одному (`Category`–`Product`), многие ко многим (`Product`–`Tag`)
- **WebSockets:** Laravel Reverb (протокол Pusher). События при создании, изменении и удалении товара и пользователя
- **REST API + документация:** `/docs/api` (Dedoc Scramble / OpenAPI)
- **Демо-страница:** `/demo`

## Локальный запуск

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
npm install
composer run dev
```

Отдельным процессом:

```bash
php artisan reverb:start
```

Приложение: `http://localhost:8000`  
Демо: `http://localhost:8000/demo`  
API docs: `http://localhost:8000/docs/api`

## Docker

```bash
export APP_KEY=base64:$(openssl rand -base64 32)
docker compose up --build
```

Веб: `http://localhost:8000`  
WebSocket: `ws://localhost:8080`

## Сдача задания

- Развёрнутое приложение: добавьте ссылку после деплоя (Railway / Render / Laravel Cloud)
- GitHub: этот репозиторий
- Видео: загрузите запись экрана на Google Drive или YouTube
