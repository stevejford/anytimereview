I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

**Key Findings:**

1. **DB Package Structure**: Already uses \`@neondatabase/serverless\` with \`drizzle-orm/neon-http\` which is Worker-compatible. The issue is NOT the driver choice in the package itself.

2. **usage-reporter Problem**: Reimplements database connection using \`postgres\` driver (lines 2-3, 41-42 of usage-reporter/src/index.ts) instead of importing the shared \`db\` connection from the package. This is unnecessary duplication.

3. **Export Resolution**: The package.json wildcard exports (\`\"./dist/*.js\"\`) work for the main export but fail for subpath imports like \`@my-better-t-app/db/schema/rentals\` because esbuild can't resolve the wildcard pattern.

4. **TypeScript Configuration Inconsistency**:
   - redirector: Has project references but missing path mappings
   - aggregator: Has path mappings for local imports only, missing workspace package paths
   - usage-reporter: Has neither path mappings nor project references

5. **Build Dependencies**: Only redirector has prebuild scripts. Turbo.json has dev dependencies configured but not all build dependencies.

6. **Wrangler Configuration**: Only redirector has a custom build command. aggregator and usage-reporter rely on default Wrangler bundling which doesn't handle workspace packages well.

### Approach

The root causes are:

1. **Wildcard exports don't work with Wrangler/esbuild**: The db package uses \`\"./dist/*.js\"\` which fails when workers try to import specific schema files like \`@my-better-t-app/db/schema/rentals\`

2. **usage-reporter uses wrong database driver**: It imports \`postgres\` (Node.js driver) instead of using the Neon HTTP driver that's already in the db package and works in Cloudflare Workers

3. **Missing TypeScript path mappings**: aggregator and usage-reporter don't have path mappings for the workspace package, causing resolution failures

4. **Missing prebuild scripts**: aggregator and usage-reporter don't ensure the db package is built before they start

The solution is to:
- Add explicit exports for each schema file in db package.json
- Update usage-reporter to use the shared db connection from the package (which already uses Neon HTTP driver)
- Add TypeScript path mappings to all three workers
- Add prebuild scripts to aggregator and usage-reporter
- Configure Wrangler to properly bundle workspace packages

### Reasoning

I explored all three Cloudflare Workers (redirector, aggregator, usage-reporter), examined their tsconfig files, wrangler configs, package.json files, and source code. I discovered that:
- redirector has path mappings and prebuild scripts but minimal tsconfig
- aggregator has basic tsconfig but no path mappings or prebuild scripts
- usage-reporter has no path mappings, no prebuild scripts, and uses the wrong database driver (postgres instead of Neon)
- The db package already uses Neon's HTTP driver which works in Workers
- The db package exports use wildcards which don't resolve properly with esbuild

## Proposed File Changes

### my-better-t-app\\packages\\db\\package.json(MODIFY)

Add explicit exports for each schema file to replace wildcard patterns that don't work with esbuild:

**Update exports section (lines 7-16):**
- Keep the main export as-is: \`\".\"\` pointing to \`./dist/index.js\`
- Replace the wildcard export \`\"./*\"\` with explicit exports for each schema:
  - \`\"./schema/analytics\"\`: \`{ \"types\": \"./dist/schema/analytics.d.ts\", \"import\": \"./dist/schema/analytics.js\" }\`
  - \`\"./schema/auth\"\`: \`{ \"types\": \"./dist/schema/auth.d.ts\", \"import\": \"./dist/schema/auth.js\" }\`
  - \`\"./schema/billing\"\`: \`{ \"types\": \"./dist/schema/billing.d.ts\", \"import\": \"./dist/schema/billing.js\" }\`
  - \`\"./schema/disputes\"\`: \`{ \"types\": \"./dist/schema/disputes.d.ts\", \"import\": \"./dist/schema/disputes.js\" }\`
  - \`\"./schema/domains\"\`: \`{ \"types\": \"./dist/schema/domains.d.ts\", \"import\": \"./dist/schema/domains.js\" }\`
  - \`\"./schema/listings\"\`: \`{ \"types\": \"./dist/schema/listings.d.ts\", \"import\": \"./dist/schema/listings.js\" }\`
  - \`\"./schema/rentals\"\`: \`{ \"types\": \"./dist/schema/rentals.d.ts\", \"import\": \"./dist/schema/rentals.js\" }\`

**Why this works:**
- esbuild can resolve explicit paths but struggles with wildcard patterns
- Each schema file is built by tsdown (as seen in the build output)
- This matches how the files are actually imported in the codebase
- Maintains backward compatibility with existing imports

### my-better-t-app\\apps\\usage-reporter\\src\\index.ts(MODIFY)

References: 

- my-better-t-app\\packages\\db\\src\\index.ts(MODIFY)

Replace the custom postgres connection with the shared db connection from the package:

**Remove postgres imports (lines 2-3):**
- Remove \`import { drizzle } from \"drizzle-orm/postgres-js\";\`
- Remove \`import postgres from \"postgres\";\`

**Update db package imports (line 6-8):**
- Change from individual schema imports to: \`import { db, rentals, usageLedger, clickRollups } from \"@my-better-t-app/db\";\`
- Remove the separate imports for \`rentals\`, \`usageLedger\`, \`clickRollups\` from schema subpaths
- Keep the drizzle-orm utility imports: \`import { eq, and, sql, sum } from \"drizzle-orm\";\`

**Remove custom database connection (lines 40-42):**
- Remove the \`const client = postgres(env.DATABASE_URL);\` line
- Remove the \`const db = drizzle(client);\` line
- The \`db\` is now imported from the package and will use the Neon HTTP driver

**Remove client cleanup (line 228):**
- Remove \`await client.end();\` since we're using the HTTP driver which doesn't need cleanup

**Update DATABASE_URL usage:**
- The db package's connection will use \`env.DATABASE_URL\` automatically through the Neon driver
- No changes needed to how DATABASE_URL is passed to the worker

**Benefits:**
- Uses the Worker-compatible Neon HTTP driver instead of postgres
- Eliminates code duplication
- Consistent database connection across all services
- No need to bundle the postgres driver
Create a Worker-specific database connection using the Neon driver from the db package:

**Update imports (lines 1-9):**
- Remove \`import { drizzle } from \"drizzle-orm/postgres-js\";\`
- Remove \`import postgres from \"postgres\";\`
- Update db package imports to:
  - \`import { neon, drizzle, schema, rentals, usageLedger, clickRollups } from \"@my-better-t-app/db\";\`
- Keep \`import { eq, and, sql, sum } from \"drizzle-orm\";\`
- Keep Stripe and type imports

**Create Worker-specific db connection (in reportYesterdayUsage function, lines 40-42):**
- Replace the postgres connection with:
  - \`const sql = neon(env.DATABASE_URL);\`
  - \`const db = drizzle(sql, { schema });\`
- This uses the Neon HTTP driver which works in Cloudflare Workers
- The schema is imported from the db package

**Remove client cleanup (line 228):**
- Remove \`await client.end();\`
- The Neon HTTP driver doesn't require cleanup
- Just remove this line entirely

**Benefits:**
- Uses Worker-compatible Neon HTTP driver
- Reuses schema definitions from the db package
- No need to bundle postgres driver
- Consistent with how the db package is designed

### my-better-t-app\\apps\\usage-reporter\\tsconfig.json(MODIFY)

References: 

- my-better-t-app\\apps\\redirector\\tsconfig.json(MODIFY)
- my-better-t-app\\packages\\db\\tsconfig.json

Add TypeScript path mappings and project references for workspace package resolution:

**Add baseUrl (in compilerOptions):**
- Add \`\"baseUrl\": \".\"\` to enable path mappings

**Add paths configuration (in compilerOptions):**
- Add \`\"paths\"\` object:
  - \`\"@my-better-t-app/db\": [\"../../packages/db/src/index.ts\"]\`
  - \`\"@my-better-t-app/db/*\": [\"../../packages/db/src/*\"]\`

**Add project references (at root level):**
- Add \`\"references\": [{ \"path\": \"../../packages/db\" }]\`

**Update include array:**
- Change from \`[\"src/**/*\"]\` to \`[\"src/**/*\", \"../../packages/db/src/**/*\"]\`
- This ensures TypeScript can find types from the workspace package

**Keep existing configuration:**
- Keep \`\"extends\": \"../../tsconfig.base.json\"\`
- Keep \`\"outDir\": \"./dist\"\`
- Keep \`\"rootDir\": \"./src\"\`
- Keep \`\"types\": [\"@cloudflare/workers-types\"]\`

### my-better-t-app\\apps\\aggregator\\tsconfig.json(MODIFY)

References: 

- my-better-t-app\\apps\\redirector\\tsconfig.json(MODIFY)

Add workspace package path mappings and project references:

**Update paths configuration (line 7-9):**
- Keep the existing \`\"@/*\": [\"./src/*\"]\` mapping
- Add workspace package mappings:
  - \`\"@my-better-t-app/db\": [\"../../packages/db/src/index.ts\"]\`
  - \`\"@my-better-t-app/db/*\": [\"../../packages/db/src/*\"]\`

**Add project references (at root level):**
- Add \`\"references\": [{ \"path\": \"../../packages/db\" }]\`

**Update include array (line 11):**
- Change from \`[\"src\"]\` to \`[\"src\", \"../../packages/db/src/**/*\"]\`

**Keep existing configuration:**
- Keep \`\"extends\": \"../../tsconfig.base.json\"\`
- Keep \`\"composite\": true\`
- Keep \`\"outDir\": \"dist\"\`
- Keep \`\"baseUrl\": \".\"\` (already present)

### my-better-t-app\\apps\\redirector\\tsconfig.json(MODIFY)

Add missing path mappings to the minimal tsconfig:

**Add paths configuration (in compilerOptions after baseUrl):**
- Add \`\"paths\"\` object:
  - \`\"@my-better-t-app/db\": [\"../../packages/db/src/index.ts\"]\`
  - \`\"@my-better-t-app/db/*\": [\"../../packages/db/src/*\"]\`

**Update include array (line 7):**
- Change from \`[\"src/**/*\"]\` to \`[\"src/**/*\", \"../../packages/db/src/**/*\"]\`

**Keep existing configuration:**
- Keep \`\"extends\": \"../../tsconfig.base.json\"\`
- Keep \`\"outDir\": \"dist\"\`
- Keep \`\"baseUrl\": \".\"\` (already present)
- Keep \`\"exclude\": [\"dist\", \"node_modules\"]\`
- Keep \`\"references\": [{\"path\": \"../../packages/db\"}]\` (already present)

### my-better-t-app\\apps\\usage-reporter\\package.json(MODIFY)

References: 

- my-better-t-app\\apps\\redirector\\package.json

Add prebuild scripts to ensure db package is compiled before the worker starts:

**Add predev script (in scripts section):**
- Add \`\"predev\": \"pnpm --filter @my-better-t-app/db build\"\`
- This runs automatically before the \`dev\` script

**Add prebuild script (in scripts section):**
- Add \`\"prebuild\": \"pnpm --filter @my-better-t-app/db build\"\`
- This runs automatically before any \`build\` script

**Add build script:**
- Add \`\"build\": \"wrangler deploy --dry-run\"\`
- Provides a way to test the build without deploying

**Add build:deps script (optional but recommended):**
- Add \`\"build:deps\": \"pnpm --filter @my-better-t-app/db build\"\`
- Provides explicit control over dependency building

**Keep existing scripts:**
- Keep \`\"dev\": \"wrangler dev --test-scheduled\"\`
- Keep \`\"deploy\": \"wrangler deploy\"\`
- Keep \`\"cf-typegen\": \"wrangler types --env-interface CloudflareBindings\"\`

**Remove postgres dependency:**
- The \`postgres\` package is not listed in dependencies, so no changes needed there
- The worker will now use the Neon driver from the db package

### my-better-t-app\\apps\\aggregator\\package.json(MODIFY)

References: 

- my-better-t-app\\apps\\redirector\\package.json

Add prebuild scripts to ensure db package is compiled before the worker starts:

**Add predev script (in scripts section):**
- Add \`\"predev\": \"pnpm --filter @my-better-t-app/db build\"\`
- This runs automatically before the \`dev\` script

**Add prebuild script (in scripts section):**
- Add \`\"prebuild\": \"pnpm --filter @my-better-t-app/db build\"\`
- This runs automatically before any \`build\` script

**Add build script:**
- Add \`\"build\": \"wrangler deploy --dry-run\"\`
- Provides a way to test the build without deploying

**Add build:deps script (optional but recommended):**
- Add \`\"build:deps\": \"pnpm --filter @my-better-t-app/db build\"\`
- Provides explicit control over dependency building

**Keep existing scripts:**
- Keep \`\"dev\": \"wrangler dev --test-scheduled\"\`
- Keep \`\"deploy\": \"wrangler deploy\"\`
- Keep \`\"check-types\": \"tsc -b\"\`
- Keep \`\"cf-typegen\": \"wrangler types\"\`

### my-better-t-app\\apps\\usage-reporter\\wrangler.jsonc(MODIFY)

References: 

- my-better-t-app\\apps\\redirector\\wrangler.jsonc

Add build configuration and tsconfig reference to properly handle workspace packages:

**Add tsconfig reference (after line 5):**
- Add \`\"tsconfig\": \"tsconfig.json\"\`
- This tells Wrangler to use the TypeScript configuration with path mappings

**Add build configuration (after tsconfig):**
- Add \`\"build\"\` object:
  - \`\"command\": \"esbuild src/index.ts --bundle --format=esm --outfile=dist/index.js --external:cloudflare:*\"\`
  - \`\"watch_dirs\": [\"src\", \"../../packages/db/src\"]\`
- The custom build command gives explicit control over bundling
- The \`--external:cloudflare:*\` prevents bundling Cloudflare runtime APIs
- The \`watch_dirs\` ensures changes to the db package trigger rebuilds

**Keep existing configuration:**
- Keep \`\"name\": \"usage-reporter\"\`
- Keep \`\"main\": \"src/index.ts\"\`
- Keep \`\"compatibility_date\": \"2025-01-10\"\`
- Keep \`\"compatibility_flags\": [\"nodejs_compat\"]\`
- Keep \`\"triggers\"\` with cron schedule
- Keep \`\"observability\"\` settings
- Keep \`\"vars\"\` with STRIPE_PLATFORM_FEE_PERCENT
- Keep comments about secrets

### my-better-t-app\\apps\\aggregator\\wrangler.jsonc(MODIFY)

References: 

- my-better-t-app\\apps\\redirector\\wrangler.jsonc

Add build configuration and tsconfig reference to properly handle workspace packages:

**Add tsconfig reference (after line 6):**
- Add \`\"tsconfig\": \"tsconfig.json\"\`
- This tells Wrangler to use the TypeScript configuration with path mappings

**Add build configuration (after tsconfig):**
- Add \`\"build\"\` object:
  - \`\"command\": \"esbuild src/index.ts --bundle --format=esm --outfile=dist/index.js --external:cloudflare:*\"\`
  - \`\"watch_dirs\": [\"src\", \"../../packages/db/src\"]\`
- The custom build command gives explicit control over bundling
- The \`--external:cloudflare:*\` prevents bundling Cloudflare runtime APIs
- The \`watch_dirs\` ensures changes to the db package trigger rebuilds

**Keep existing configuration:**
- Keep \`\"name\": \"my-better-t-app-aggregator\"\`
- Keep \`\"main\": \"src/index.ts\"\`
- Keep \`\"compatibility_date\": \"2025-06-15\"\`
- Keep \`\"compatibility_flags\": [\"nodejs_compat\"]\`
- Keep \`\"triggers\"\` with cron schedule and comments
- Keep \`\"vars\"\` with DATABASE_URL
- Keep \`\"analytics_engine_datasets\"\` binding

### my-better-t-app\\turbo.json(MODIFY)

Add build pipeline configurations for aggregator and usage-reporter:

**Add aggregator#build pipeline (after redirector#build):**
- Add \`\"aggregator#build\"\` task:
  - \`\"dependsOn\": [\"@my-better-t-app/db#build\"]\`
  - \`\"outputs\": [\".wrangler/**\", \"dist/**\"]\`
- This ensures the db package builds before the aggregator

**Add usage-reporter#build pipeline (after aggregator#build):**
- Add \`\"usage-reporter#build\"\` task:
  - \`\"dependsOn\": [\"@my-better-t-app/db#build\"]\`
  - \`\"outputs\": [\".wrangler/**\", \"dist/**\"]\`
- This ensures the db package builds before the usage-reporter

**Add usage-reporter#dev pipeline (after aggregator#dev):**
- Add \`\"usage-reporter#dev\"\` task:
  - \`\"dependsOn\": [\"@my-better-t-app/db#build\"]\`
  - \`\"cache\": false\`
  - \`\"persistent\": true\`
- This ensures the db package is built before starting the dev server

**Keep existing configuration:**
- Keep all existing build, dev, and other task configurations
- Keep the global \`\"build\"\` task with \`\"dependsOn\": [\"^build\"]\`
- Keep \`\"@my-better-t-app/db#build\"\` configuration
- Keep \`\"redirector#build\"\` and \`\"redirector#dev\"\` configurations
- Keep \`\"aggregator#dev\"\` configuration (already present)
- Keep \`\"server#dev\"\` configuration

### my-better-t-app\\packages\\db\\src\\index.ts(MODIFY)

Update the database connection to accept DATABASE_URL from Cloudflare Workers environment:

**Update getDatabaseUrl function (lines 29-35):**
- The current implementation only checks \`process.env.DATABASE_URL\`
- This works for Node.js but not for Cloudflare Workers where env vars come from bindings
- However, since the db connection is created at module load time, we can't access Worker bindings here
- The solution is to make the db connection lazy or accept DATABASE_URL as a parameter

**Option 1: Keep current implementation (RECOMMENDED):**
- The current code is actually fine because:
  - In Workers, the db package will be bundled and the connection string will be empty at module load
  - Workers should create their own db connection using the Neon driver with their env.DATABASE_URL
  - The shared \`db\` export is primarily for the Next.js app (server) which has process.env

**Option 2: Export a factory function:**
- Add \`export function createDb(databaseUrl: string)\` that creates a new db instance
- Workers can call this with their \`env.DATABASE_URL\`
- This is more explicit but requires changes to all consumers

**Recommended approach: Add a comment explaining usage:**
- Add a JSDoc comment above the \`db\` export explaining:
  - This db instance uses process.env.DATABASE_URL and is suitable for Node.js environments
  - Cloudflare Workers should create their own connection: \`const sql = neon(env.DATABASE_URL); const db = drizzle(sql, { schema });\`
  - Or import the neon driver and drizzle function to create a custom connection

**Update exports (lines 40-47):**
- Add export for neon and drizzle so Workers can create their own connections:
  - \`export { neon } from \"@neondatabase/serverless\";\`
  - \`export { drizzle } from \"drizzle-orm/neon-http\";\`
- This allows Workers to create connections with their env.DATABASE_URL

**Note:** The usage-reporter and aggregator will need to create their own db connections using the exported utilities and their env.DATABASE_URL, rather than importing the pre-configured \`db\` instance.

### my-better-t-app\\apps\\aggregator\\src\\index.ts(MODIFY)

References: 

- my-better-t-app\\packages\\db\\src\\index.ts(MODIFY)
- my-better-t-app\\apps\\usage-reporter\\src\\index.ts(MODIFY)

Create a Worker-specific database connection instead of using the pre-configured db instance:

**Update imports (line 1):**
- Change from \`import { db, clickRollups } from '@my-better-t-app/db';\`
- To: \`import { neon, drizzle, schema, clickRollups } from '@my-better-t-app/db';\`
- This imports the utilities needed to create a Worker-specific connection

**Create Worker-specific db connection (in aggregateYesterday function, after line 8):**
- Add at the beginning of the \`aggregateYesterday\` function:
  - \`const sql = neon(env.DATABASE_URL);\`
  - \`const db = drizzle(sql, { schema });\`
- This creates a db connection using the Worker's DATABASE_URL from bindings
- The Neon HTTP driver works in Cloudflare Workers

**Keep the rest of the function unchanged:**
- The db operations (insert, select, etc.) remain the same
- The schema and table references work the same way

**Benefits:**
- Uses Worker-compatible Neon HTTP driver
- Properly accesses DATABASE_URL from Worker bindings
- Consistent with the usage-reporter pattern

### my-better-t-app\\apps\\redirector\\src\\durable-objects\\route-coordinator.ts(MODIFY)

References: 

- my-better-t-app\\packages\\db\\src\\index.ts(MODIFY)
- my-better-t-app\\apps\\usage-reporter\\src\\index.ts(MODIFY)

Create a Worker-specific database connection instead of using the pre-configured db instance:

**Update imports (lines 2-6):**
- Change from \`import { db } from \"@my-better-t-app/db\";\`
- To: \`import { neon, drizzle, schema } from \"@my-better-t-app/db\";\`
- Keep the schema imports: \`import { routes, rentals } from \"@my-better-t-app/db/schema/rentals\";\`
- Keep: \`import { listings } from \"@my-better-t-app/db/schema/listings\";\`
- Keep: \`import { domains } from \"@my-better-t-app/db/schema/domains\";\`
- Keep: \`import { eq } from \"drizzle-orm\";\`

**Add db connection initialization (in RouteCoordinator class):**
- Add a private property: \`private db: ReturnType<typeof drizzle>;\`
- Add a constructor that initializes the db connection:
  \`\`\`typescript
  constructor(state: DurableObjectState, env: CloudflareBindings) {
    super(state, env);
    const sql = neon(env.DATABASE_URL);
    this.db = drizzle(sql, { schema });
  }
  \`\`\`
- This creates a db connection using the Worker's DATABASE_URL from bindings

**Update all db usage:**
- Replace all instances of \`db.select()\`, \`db.insert()\`, etc. with \`this.db.select()\`, \`this.db.insert()\`, etc.
- This uses the instance-specific db connection
- Affected lines: 95, 116, 136 (all the database query calls)

**Benefits:**
- Uses Worker-compatible Neon HTTP driver
- Properly accesses DATABASE_URL from Worker bindings
- Each Durable Object instance has its own db connection
- Consistent with the usage-reporter and aggregator patterns