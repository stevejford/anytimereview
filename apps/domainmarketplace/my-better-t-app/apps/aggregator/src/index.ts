import { neon, drizzle, schema, clickRollups } from '@my-better-t-app/db';
import type { ScheduledEvent, ExecutionContext } from '@cloudflare/workers-types';

import type { CloudflareBindings } from './types/bindings';
import { queryDailyRollups } from './lib/ae-queries';

const DAY_MS = 24 * 60 * 60 * 1000;

async function aggregateYesterday(env: CloudflareBindings): Promise<void> {
  // Create Worker-specific db connection using Neon HTTP driver
  const sql = neon(env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const today = new Date();
  const yesterday = new Date(today.getTime() - DAY_MS);
  const date = yesterday.toISOString().split('T')[0] as string;

  const rollups = await queryDailyRollups(env, date);

  for (const rollup of rollups) {
    await db
      .insert(clickRollups)
      .values({
        day: date,
        rentalId: rollup.rentalId,
        validClicks: rollup.validClicks,
        invalidClicks: rollup.invalidClicks,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [clickRollups.day, clickRollups.rentalId],
        set: {
          validClicks: rollup.validClicks,
          invalidClicks: rollup.invalidClicks,
          updatedAt: new Date(),
        },
      });
  }
}

export default {
  async scheduled(_event: ScheduledEvent, env: CloudflareBindings, ctx: ExecutionContext) {
    ctx.waitUntil(
      aggregateYesterday(env).catch((error) => {
        console.error('Failed to aggregate click rollups', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }),
    );
  },
};

