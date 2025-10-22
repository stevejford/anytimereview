# Database Package

This package configures Drizzle ORM for the monorepo and re-exports the helpers
used by the apps.

- Driver: `drizzle-orm/neon-http`
  - Optimised for HTTP fetch calls
  - Does **not** support interactive transactions

If interactive transactions become necessary, migrate to
`drizzle-orm/neon-serverless` with a WebSocket-enabled Neon client (or another
driver that supports pooling, such as `node-postgres` or Hyperdrive). Update
`src/index.ts` accordingly, and continue to import database utilities from
`@my-better-t-app/db` in application code.

