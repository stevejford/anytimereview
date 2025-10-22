import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db, user as userSchema } from '@my-better-t-app/db';
import { stripeEvents } from '@my-better-t-app/db/schema/billing';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
	const payload = await req.text();
	const svixId = req.headers.get('svix-id');
	const svixTimestamp = req.headers.get('svix-timestamp');
	const svixSignature = req.headers.get('svix-signature');

	if (!svixId || !svixTimestamp || !svixSignature) {
		console.error('Missing svix headers');
		return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
	}

	const secret = process.env.CLERK_WEBHOOK_SECRET;
	if (!secret) {
		console.error('Clerk webhook secret is not configured');
		return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
	}

	let event: any;
	try {
		const wh = new Webhook(secret);
		event = wh.verify(payload, {
			'svix-id': svixId,
			'svix-timestamp': svixTimestamp,
			'svix-signature': svixSignature,
		});
	} catch (error) {
		console.error('Clerk webhook verification failed', error);
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
	}

	// Check if event already processed (idempotency)
	try {
		const [existingEvent] = await db
			.select()
			.from(stripeEvents)
			.where(eq(stripeEvents.id, svixId))
			.limit(1);

		if (existingEvent) {
			return NextResponse.json({ status: 'ok' }, { status: 200 });
		}
	} catch (error) {
		console.error('Error checking event idempotency', error);
		// Continue processing if idempotency check fails
	}

	try {
		// Handle user.created and user.updated events
		if (event.type === 'user.created' || event.type === 'user.updated') {
			const clerkUser = event.data;
			const primaryEmail = clerkUser.email_addresses?.find(
				(email: any) => email.id === clerkUser.primary_email_address_id
			);

			if (!primaryEmail?.email_address) {
				console.error('Clerk user has no primary email', { userId: clerkUser.id });
				return NextResponse.json({ error: 'No primary email found' }, { status: 400 });
			}

			const firstName = clerkUser.first_name || '';
			const lastName = clerkUser.last_name || '';
			const fullName = `${firstName} ${lastName}`.trim() || primaryEmail.email_address;
			const role = (clerkUser.public_metadata?.role as string) || 'hirer';

			// Upsert user into local database
			await db
				.insert(userSchema)
				.values({
					id: clerkUser.id,
					email: primaryEmail.email_address,
					name: fullName,
					role: role,
					image: clerkUser.image_url || null,
					emailVerified: primaryEmail.verification?.status === 'verified',
					createdAt: new Date(clerkUser.created_at),
					updatedAt: new Date(clerkUser.updated_at),
				})
				.onConflictDoUpdate({
					target: userSchema.id,
					set: {
						email: primaryEmail.email_address,
						name: fullName,
						image: clerkUser.image_url || null,
						emailVerified: primaryEmail.verification?.status === 'verified',
						updatedAt: new Date(clerkUser.updated_at),
					},
				});

			console.log('Clerk user synced', { userId: clerkUser.id, event: event.type });
		}

		// Mark event as processed
		await db.insert(stripeEvents).values({
			id: svixId,
			type: event.type,
			processed: true,
			processedAt: new Date(),
			payload: event,
		});

		return NextResponse.json({ status: 'ok' }, { status: 200 });
	} catch (error) {
		console.error('Clerk webhook handling failed', {
			eventId: svixId,
			eventType: event.type,
			error,
		});
		return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
	}
}

