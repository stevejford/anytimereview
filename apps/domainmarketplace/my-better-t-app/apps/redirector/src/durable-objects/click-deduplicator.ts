import { DurableObject } from "cloudflare:workers";

interface DedupRecord {
	expiresAt: number;
}

function buildStorageKey(routeId: string, fingerprint: string): string {
	return `${routeId}:${fingerprint}`;
}

function fingerprint(ip: string, userAgent: string): string {
	return `${ip.trim().toLowerCase()}::${userAgent.trim().toLowerCase()}`;
}

const TTL_MS = 30 * 60 * 1000;

export class ClickDeduplicator extends DurableObject {
	async fetch(request: Request): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", { status: 405 });
		}

		const url = new URL(request.url);
		const routeId = url.pathname.replace(/^\//, "");

		if (!routeId) {
			return new Response(JSON.stringify({ error: "Missing route id" }), {
				status: 400,
				headers: { "content-type": "application/json" },
			});
		}

		let payload: { ip?: string; userAgent?: string };
		try {
			payload = (await request.json()) as { ip?: string; userAgent?: string };
		} catch {
			return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
				status: 400,
				headers: { "content-type": "application/json" },
			});
		}

		const ip = payload.ip?.trim();
		const userAgent = payload.userAgent?.trim();

		if (!ip || !userAgent) {
			return new Response(
				JSON.stringify({ error: "ip and userAgent are required" }),
				{
					status: 400,
					headers: { "content-type": "application/json" },
				},
			);
		}

		const key = buildStorageKey(routeId, fingerprint(ip, userAgent));
		const existing = await this.state.storage.get<DedupRecord>(key);
		const now = Date.now();

		if (existing && existing.expiresAt > now) {
			return new Response(JSON.stringify({ duplicate: true }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		}

		await this.state.storage.put(key, {
			expiresAt: now + TTL_MS,
		});

		this.state.storage.deleteAlarm();
		this.state.storage.setAlarm(new Date(now + TTL_MS));

		return new Response(JSON.stringify({ duplicate: false }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	}

	async alarm(): Promise<void> {
		const now = Date.now();
		const entries = await this.state.storage.list<DedupRecord>();
		const deletions: Array<Promise<void>> = [];

		for (const [key, value] of entries) {
			if (!value || value.expiresAt <= now) {
				deletions.push(this.state.storage.delete(key));
			}
		}

		if (deletions.length > 0) {
			await Promise.all(deletions);
		}

		if ((await this.state.storage.list()).size > 0) {
			this.state.storage.setAlarm(new Date(now + TTL_MS));
		}
	}
}


