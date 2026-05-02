# Foodlink

Портал: анкета ресторана, меню с ценами (Яндекс Еда / Uzum Tezkor), экспорт PDF и ZIP, API по ключу, суперадминка.

## Локальный запуск

1. Скопируйте [`.env.example`](.env.example) в `.env.local` и укажите URL и ключи Supabase.
2. В [Supabase SQL Editor](https://supabase.com/dashboard) выполните скрипт [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql).
3. Включите провайдер Email в Authentication → Providers (если нужна регистрация по почте).
4. Установка и dev-сервер:

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Суперадмин

После первой регистрации в SQL:

```sql
update public.profiles set role = 'superadmin' where email = 'ваш@email.com';
```

Раздел: `/admin`.

## API

Создайте ключ в кабинете: **API-ключи**. Запрос:

`GET /api/v1/restaurants/{id}` с заголовком `X-API-Key: <ключ>`.

Для маршрута нужен `SUPABASE_SERVICE_ROLE_KEY` в `.env.local`.
