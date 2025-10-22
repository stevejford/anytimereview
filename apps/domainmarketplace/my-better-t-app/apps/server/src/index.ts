import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import domainsRouter from "./routes/domains";
import listingsRouter from "./routes/listings";
import hiresRouter from "./routes/hires";
import routesRouter from "./routes/routes";
import analyticsRouter from "./routes/analytics";
import billingRouter from "./routes/billing";
import connectRouter from "./routes/connect";
import webhooksRouter from "./routes/webhooks";
import disputesRouter from "./routes/disputes";
import adminRouter from "./routes/admin";
import {
	authMiddleware,
	type AuthenticatedVariables,
} from "./middleware/auth";
import type { CloudflareBindings } from "./types/bindings";

// Type app with Bindings so c.env is available throughout
const app = new Hono<AuthenticatedVariables & { Bindings: CloudflareBindings }>();

app.use(logger());

// CORS middleware that reads origin from c.env at runtime
app.use(
	"/*",
	async (c, next) => {
		const corsMiddleware = cors({
			origin: c.env?.CORS_ORIGIN || "",
			allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		});
		return corsMiddleware(c, next);
	}
);

// Per-request Clerk auth middleware
app.use("*", authMiddleware);

// Dev-only diagnostics route: returns available binding keys (no values)
app.get("/__bindings", (c) => {
	if (process.env.NODE_ENV !== "development") {
		return c.json({ error: "Not found" }, 404);
	}
	const keys = Object.keys(c.env || {});
	return c.json({ bindings: keys });
});

app.route("/api/webhooks", webhooksRouter);

app.route("/api/v1/domains", domainsRouter);
app.route("/api/domains", domainsRouter);
app.route("/api/listings", listingsRouter);
app.route("/api/hires", hiresRouter);
app.route("/api/hires", analyticsRouter);
app.route("/api/hires", routesRouter);
app.route("/api/billing", billingRouter);
app.route("/api/connect", connectRouter);
app.route("/api/disputes", disputesRouter);
app.route("/api/admin", adminRouter);

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
