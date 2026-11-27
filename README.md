# WaveChat — 1-on-1 private chat

A full-stack real-time messaging app, structured for production use:
layered backend (routes → controllers → services → repositories),
feature-based frontend, centralized error handling, input validation,
rate limiting, Docker images, and a Postgres migration system.

- **Server:** Express, PostgreSQL (`pg`), Socket.IO, JWT auth, bcrypt,
  zod validation, helmet, rate limiting
- **Client:** React (Vite), React Router, Socket.IO client, axios

## Folder structure

```
chat-app/
├── server/
│   ├── src/
│   │   ├── config/          # env, db pool, socket options — single source of truth
│   │   ├── modules/         # one folder per domain, each layered:
│   │   │   ├── auth/        #   routes -> controller -> service (-> repository)
│   │   │   ├── users/       #   routes -> controller -> service -> repository
│   │   │   └── messages/    #   routes -> controller -> service -> repository
│   │   ├── sockets/         # Socket.IO auth, presence, event handlers
│   │   ├── middlewares/     # authenticate, validate, centralized error handler
│   │   ├── validators/      # zod schemas per module
│   │   ├── errors/          # AppError + asyncHandler
│   │   ├── utils/           # jwt, password hashing, logger
│   │   ├── db/migrate.js    # migration runner
│   │   ├── app.js           # Express app assembly (no listen — testable)
│   │   └── server.js        # entry point: http + socket.io + graceful shutdown
│   ├── migrations/          # numbered .sql files, tracked in schema_migrations
│   └── Dockerfile
├── client/
│   ├── src/
│   │   ├── app/             # App.jsx (routes), providers.jsx
│   │   ├── config/          # env.js
│   │   ├── lib/             # apiClient (axios), socketClient (socket.io) singletons
│   │   ├── shared/          # route guards, shared components, utils used app-wide
│   │   └── features/
│   │       ├── auth/        # api, context, pages
│   │       └── chat/        # api, hooks (socket logic), components, pages
│   ├── styles/global.css
│   └── Dockerfile           # multi-stage build served via nginx
├── docker-compose.yml        # postgres + server + client
└── package.json               # npm workspaces root (server + client)
```

**Why this shape:**
- Each backend module (`auth`, `users`, `messages`) is layered so raw SQL
  never leaks into controllers, and business rules (message length,
  self-messaging, etc.) live in one testable place — the service.
- `app.js` builds the Express app without starting a listener, so it can
  be imported directly by integration tests; `server.js` is the only file
  that boots the process.
- The frontend mirrors this by feature (`auth`, `chat`) rather than by
  file type — everything about chat, including its one custom hook that
  owns all Socket.IO wiring, lives in `features/chat/`.
- `shared/` and `lib/` hold only things genuinely used across features
  (route guards, the API/socket clients, date formatting) — not a
  catch-all dumping ground.

## Running locally (without Docker)

### 1. PostgreSQL

```bash
createdb chatapp
```

### 2. Install everything (npm workspaces)

From the repo root:

```bash
npm install
```

### 3. Configure environment

```bash
cp server/.env.example server/.env     # set PG credentials + a real JWT_SECRET
cp client/.env.example client/.env     # defaults to http://localhost:4000
```

### 4. Run migrations

```bash
npm run migrate
```

### 5. Start both apps

```bash
npm run dev
```

This runs the server (`:4000`) and client (`:5173`) concurrently. Open
http://localhost:5173, create two accounts (e.g. two browser
profiles/incognito windows), and message between them.

## Running with Docker

```bash
docker compose up --build
docker compose run --rm server npm run migrate   # first time only
```

- Client: http://localhost:5173
- Server: http://localhost:4000
- Postgres: localhost:5432 (user/pass `postgres`/`postgres`, db `chatapp`)

Set a real `JWT_SECRET` via an `.env` file next to `docker-compose.yml`
(Compose reads `JWT_SECRET` from the environment/`.env` automatically) —
don't ship the default in production.

## How the real-time layer works

- On login, the client opens a Socket.IO connection authenticated with
  the JWT (`socket.handshake.auth.token`), verified in
  `sockets/socket.auth.js`.
- Each connection joins a private room `user:<id>` (`sockets/chat.handlers.js`).
- `message:send` persists via `messages.service` → `messages.repository`,
  then emits `message:new` to both the sender's and receiver's rooms.
- `message:typing` and `presence:update` are ephemeral, not persisted.

### Message receipts (ticks)

A message you sent is in one of these states, derived from two columns on
`messages` (`delivered_at`, `read_at`):

| State     | Tick            | When                                                        |
| --------- | --------------- | ----------------------------------------------------------- |
| sending   | clock           | optimistic bubble, server has not acknowledged yet          |
| sent      | one grey tick   | saved on the server                                         |
| delivered | two grey ticks  | receiver had a live connection (now, or when they next connect) |
| seen      | two blue ticks  | receiver opened the chat while the tab was visible          |

- `message:send` accepts an optional `clientId`; it is echoed back on
  `message:new` / the ack so the optimistic bubble is replaced in place.
- `message:delivered` `{ by, ids, deliveredAt }` is sent to senders when a
  user connects and picks up messages that were waiting for them.
- `message:read` `{ by, ids, readAt }` is sent to the sender when the receiver
  opens the conversation. Loading history over HTTP does **not** mark messages
  as seen; only the socket event does.
- Migration `002_message_delivery.sql` adds `delivered_at`. Run
  `npm run migrate` in `server/` after pulling.

### Theme

`<html data-theme="dark|light">` switches the palette defined at the top of
`client/src/styles/global.css`. The choice is saved in `localStorage`
(`wavechat_theme`); with no saved choice the OS preference is used. An inline
script in `index.html` applies it before first paint to avoid a flash.
- Presence is tracked in-memory (`sockets/presence.js`); if you scale to
  multiple server instances, swap this for a shared store (e.g. Redis)
  and add the `socket.io-redis` adapter so rooms/broadcasts work across
  instances.

## Production notes

- All input is validated at the edge with zod (`validate` middleware) —
  controllers never touch unvalidated `req.body`/`params`/`query`.
- Errors are centralized: throw an `AppError` (or a subclass like
  `AppError.badRequest(...)`) anywhere in a service, and the error
  middleware turns it into the right HTTP response — no per-route
  try/catch needed thanks to `asyncHandler`.
- `helmet`, CORS restricted to `CLIENT_ORIGIN`, and rate limiting on the
  auth endpoints are on by default.
- Migrations are tracked in a `schema_migrations` table — add new
  numbered files to `server/migrations/`, they run automatically and
  exactly once.
- `server.js` shuts down the HTTP server and Postgres pool cleanly on
  `SIGTERM`/`SIGINT`, so container restarts / rolling deploys don't drop
  in-flight requests.
- The schema only supports 1-on-1 messaging; group chat would need a
  `conversations` / `conversation_members` layer instead of `sender_id` /
  `receiver_id` on `messages`.
