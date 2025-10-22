import { getPublicListing, type Listing } from "@/lib/api-client";
import { getSeedListings, isSeedListing } from "@/lib/seed-data";

/**
 * Get a listing by ID, handling both seed listings and real API listings.
 * 
 * @param id - The listing ID to fetch
 * @returns Promise<Listing> - The listing data
 * @throws Error if seed listing not found or API call fails
 */
export async function getListingById(id: string): Promise<Listing> {
	if (isSeedListing(id)) {
		const seedListings = getSeedListings();
		const found = seedListings.find((l) => l.id === id);
		if (!found) {
			throw new Error("Seed listing not found");
		}
		return found;
	}
	return getPublicListing(id);
}

