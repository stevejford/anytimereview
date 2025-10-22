import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface UpdateMetadataRequest {
	publicMetadata?: Record<string, any>;
	privateMetadata?: Record<string, any>;
	unsafeMetadata?: Record<string, any>;
}

export async function POST(req: NextRequest) {
	try {
		// Get authenticated user ID
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Parse request body
		const body = (await req.json()) as UpdateMetadataRequest;
		const { publicMetadata, privateMetadata, unsafeMetadata } = body;

		// Validate that at least one metadata field is provided
		if (!publicMetadata && !privateMetadata && !unsafeMetadata) {
			return NextResponse.json(
				{ error: "At least one metadata field must be provided" },
				{ status: 400 }
			);
		}

		// Update user metadata using Clerk
		await clerkClient.users.updateUserMetadata(userId, {
			publicMetadata: publicMetadata || {},
			privateMetadata: privateMetadata || {},
			unsafeMetadata: unsafeMetadata || {},
		});

		return NextResponse.json(
			{ success: true, message: "Metadata updated" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error updating user metadata:", error);
		return NextResponse.json(
			{ error: "Failed to update metadata" },
			{ status: 500 }
		);
	}
}

