const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface Domain {
	id: string;
	fqdn: string;
	verificationStatus: "pending" | "verified" | "failed";
	verificationMethod?: "cf_saas" | "domain_connect" | "manual" | null;
	verifiedAt?: string | null;
	cnameTarget?: string | null;
}

export interface Listing {
	id: string;
	domainId: string;
	mode: "exclusive" | "shared_slugs";
	pricePeriodCents: number | null;
	priceClickCents: number | null;
	currency: string;
	status: "draft" | "active" | "paused";
	createdAt: string;
	updatedAt: string;
	domain?: {
		id: string;
		fqdn: string;
		verificationStatus?: "pending" | "verified" | "failed";
	} | null;
}

export interface CreateListingRequest {
	domainId: string;
	mode: "exclusive" | "shared_slugs";
	pricePeriodCents?: number;
	priceClickCents?: number;
}

export interface UpdateListingRequest {
	status?: "draft" | "active" | "paused";
	pricePeriodCents?: number | null;
	priceClickCents?: number | null;
}

export interface SearchListingsParams {
	search?: string;
	status?: "draft" | "active" | "paused";
	mode?: "exclusive" | "shared_slugs";
	page?: number;
	limit?: number;
}

export interface Hire {
	id: string;
	listingId: string;
	hirerId: string;
	type: "period" | "per_click";
	status: "active" | "ended" | "suspended";
	startAt: string;
	endAt: string | null;
	createdAt: string;
	updatedAt: string;
	listing?: Listing & {
		domain?: {
			id: string;
			fqdn: string;
		} | null;
	} | null;
}

export interface Route {
  id: string;
  hireId: string;
  host: string;
  path: string;
  targetUrl: string;
  redirectCode: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRouteRequest {
  host: string;
  path: string;
  targetUrl: string;
  redirectCode: number;
}

export interface UpdateRouteRequest {
  host?: string;
  path?: string;
  targetUrl?: string;
  redirectCode?: number;
}

export interface BulkCreateRoutesResponse {
  created: Route[];
  failed: Array<{
    index: number;
    errors: Array<{ field: string; message: string }>;
  }>;
  summary: {
    total: number;
    created: number;
    failed: number;
  };
}

export interface AnalyticsSummary {
	validClicks: number;
	invalidClicks: number;
	totalClicks: number;
}

export interface TimeSeriesPoint {
	date: string;
	validClicks: number;
	invalidClicks: number;
}

export interface GeoBreakdown {
	country: string;
	clicks: number;
}

export interface ReferrerBreakdown {
	referrer: string;
	clicks: number;
}

export interface BotBreakdown {
	botBucket: string;
	clicks: number;
}

export interface AnalyticsResponse {
	summary: AnalyticsSummary;
	timeSeries: TimeSeriesPoint[];
	breakdowns: {
		geo: GeoBreakdown[];
		referrer: ReferrerBreakdown[];
		bot: BotBreakdown[];
	};
}

export interface AnalyticsParams {
	range?: string;
	startDate?: string;
	endDate?: string;
}

export interface CreateHireRequest {
	listingId: string;
	type: "period" | "per_click";
}

export interface SearchHiresParams {
	status?: "active" | "ended" | "suspended";
	page?: number;
	limit?: number;
}

export interface DomainVerificationRequest {
	method: "cf_saas" | "domain_connect" | "manual";
	returnUrl?: string | null;
}

export interface DomainVerificationResponse {
	verificationMethod: DomainVerificationRequest["method"] | null;
	verificationStatus?: Domain["verificationStatus"];
	txtRecord?: { name: string; value: string } | null;
	httpToken?: { url: string; body: string } | null;
	redirectUrl?: string;
	instructions?: { type: string; cnameTarget?: string };
}

class ApiError extends Error {
	status: number;
	body: unknown;

	constructor(status: number, message: string, body: unknown) {
		super(message);
		this.status = status;
		this.body = body;
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
		...init,
	});

	const contentType = response.headers.get("content-type");
	const isJson = contentType?.includes("application/json");
	const payload = isJson ? await response.json().catch(() => undefined) : undefined;

	if (!response.ok) {
		throw new ApiError(response.status, "API request failed", payload);
	}

	return (payload ?? null) as T;
}

export async function createDomain(fqdn: string): Promise<Domain> {
	return request<Domain>("/api/v1/domains", {
		method: "POST",
		body: JSON.stringify({ fqdn }),
	});
}

export async function getDomains(): Promise<Domain[]> {
	return request<Domain[]>("/api/v1/domains");
}

export async function getDomain(id: string): Promise<Domain> {
	return request<Domain>(`/api/v1/domains/${id}`);
}

export async function verifyDomain(
	id: string,
	requestBody: DomainVerificationRequest,
): Promise<DomainVerificationResponse> {
	return request<DomainVerificationResponse>(`/api/v1/domains/${id}/verify`, {
		method: "POST",
		body: JSON.stringify(requestBody),
	});
}

export async function getDomainStatus(id: string): Promise<Domain> {
	return request<Domain>(`/api/v1/domains/${id}/status`);
}

export async function createListing(
	data: CreateListingRequest,
): Promise<Listing> {
	return request<Listing>("/api/listings", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function getListings(
	params?: SearchListingsParams,
): Promise<Listing[]> {
	const query = params
		? `?${new URLSearchParams(
			Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
				if (value === undefined || value === null) return acc;
				return {
					...acc,
					[key]: String(value),
				};
			}, {}),
		)}`
		: "";
	return request<Listing[]>(`/api/listings${query}`);
}

export async function getListing(id: string): Promise<Listing> {
	return request<Listing>(`/api/listings/${id}`);
}

export async function getPublicListing(id: string): Promise<Listing> {
	return request<Listing>(`/api/listings/public/${id}`);
}

// Alias for getPublicListing for consistency
export async function getListingById(id: string): Promise<Listing> {
	return getPublicListing(id);
}

export async function getPublicListings(
	params?: SearchListingsParams,
): Promise<Listing[]> {
	const query = params
		? `?${new URLSearchParams(
			Object.entries(params).reduce<Record<string, string>>(
				(acc, [key, value]) => {
					if (value === undefined || value === null) return acc;
					return {
						...acc,
						[key]: String(value),
					};
				},
				{}, // Initial value for reduce
			),
		)}`
		: "";

	return request<Listing[]>(`/api/listings/public${query}`);
}

export async function updateListing(
	id: string,
	data: UpdateListingRequest,
): Promise<Listing> {
	return request<Listing>(`/api/listings/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function createHire(
	data: CreateHireRequest,
): Promise<Hire> {
	return request<Hire>("/api/hires", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function getHires(
	params?: SearchHiresParams,
): Promise<Hire[]> {
	const query = params
		? `?${new URLSearchParams(
			Object.entries(params).reduce<Record<string, string>>(
				(acc, [key, value]) => {
					if (value === undefined || value === null) return acc;
					return {
						...acc,
						[key]: String(value),
					};
				},
				{}, // Initial value for reduce
			),
		)}`
		: "";

	return request<Hire[]>(`/api/hires${query}`);
}

export async function getHire(id: string): Promise<Hire> {
	return request<Hire>(`/api/hires/${id}`);
}

export async function createRoute(
  hireId: string,
  data: CreateRouteRequest,
): Promise<Route> {
  return request<Route>(`/api/hires/${hireId}/routes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getRoutes(hireId: string): Promise<Route[]> {
  return request<Route[]>(`/api/hires/${hireId}/routes`);
}

export async function updateRoute(
  hireId: string,
  routeId: string,
  data: UpdateRouteRequest,
): Promise<Route> {
  return request<Route>(`/api/hires/${hireId}/routes/${routeId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteRoute(
  hireId: string,
  routeId: string,
): Promise<void> {
  await request<void>(`/api/hires/${hireId}/routes/${routeId}`, {
    method: "DELETE",
  });
}

export async function bulkCreateRoutes(
  hireId: string,
  data: CreateRouteRequest[],
): Promise<BulkCreateRoutesResponse> {
  return request<BulkCreateRoutesResponse>(`/api/hires/${hireId}/routes/bulk`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getHireAnalytics(
	hireId: string,
	params?: AnalyticsParams,
): Promise<AnalyticsResponse> {
	const searchParams = params
		? `?${new URLSearchParams(
			Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
				if (value === undefined || value === null) return acc;
				acc[key] = String(value);
				return acc;
			}, {}),
		)}`
		: "";

	return request<AnalyticsResponse>(`/api/hires/${hireId}/analytics${searchParams}`);
}

// Connect API

export interface ConnectOnboardingRequest {
	returnUrl: string;
	refreshUrl: string;
}

export interface ConnectOnboardingResponse {
	accountLinkUrl: string;
	accountId: string;
}

export interface ConnectStatusResponse {
	accountId: string | null;
	onboardingComplete: boolean;
	chargesEnabled: boolean;
	payoutsEnabled: boolean;
	detailsSubmitted: boolean;
}

export async function startConnectOnboarding(
	data: ConnectOnboardingRequest,
): Promise<ConnectOnboardingResponse> {
	return request<ConnectOnboardingResponse>("/api/connect/onboarding", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function getConnectStatus(): Promise<ConnectStatusResponse> {
	return request<ConnectStatusResponse>("/api/connect/status");
}

export async function refreshConnectOnboarding(
	data: ConnectOnboardingRequest,
): Promise<ConnectOnboardingResponse> {
	return request<ConnectOnboardingResponse>("/api/connect/refresh", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

// Billing API

export interface PeriodCheckoutRequest {
	hireId: string;
}

export interface PeriodCheckoutResponse {
	clientSecret: string;
	invoiceId: string | null;
}

export interface Invoice {
	id: string;
	stripeInvoiceId: string | null;
	amountCents: number;
	type: "period" | "usage";
	status: "draft" | "open" | "paid" | "void" | "uncollectible";
	hireId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Payout {
	id: string;
	amountCents: number;
	status: "pending" | "paid" | "failed";
	stripeTransferId: string | null;
	periodStart: string | null;
	periodEnd: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Dispute {
	id: string;
	hireId: string | null;
	claimantId: string;
	claimantRole: "owner" | "hirer";
	reason: string;
	category: string | null;
	status: "open" | "investigating" | "resolved" | "rejected";
	resolution: string | null;
	creditAmountCents: number | null;
	stripeReferenceId: string | null;
	resolvedAt: string | null;
	resolvedBy: string | null;
	createdAt: string;
	updatedAt: string;
	hire?: {
		id: string;
		type: string;
		status: string;
		listing: {
			id: string;
			mode: string;
			domain: {
				id: string;
				fqdn: string;
			};
		};
	} | null;
	claimant?: {
		id: string;
		name: string | null;
		email: string;
	} | null;
}

export interface CreateDisputeRequest {
	hireId: string;
	reason: string;
	category?: "ivt" | "quality" | "billing" | "other";
}

export interface ResolveDisputeRequest {
	status: "resolved" | "rejected";
	resolution: string;
	creditAmountCents?: number;
}

export interface SearchDisputesParams {
	status?: string;
	claimantRole?: string;
	page?: number;
	limit?: number;
}

export async function createPeriodCheckout(
	data: PeriodCheckoutRequest,
): Promise<PeriodCheckoutResponse> {
	return request<PeriodCheckoutResponse>("/api/billing/period/checkout", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function getInvoices(hireId?: string): Promise<Invoice[]> {
	const query = hireId ? `?hireId=${encodeURIComponent(hireId)}` : "";
	return request<Invoice[]>(`/api/billing/invoices${query}`);
}

export async function getPayouts(): Promise<Payout[]> {
	return request<Payout[]>("/api/billing/payouts");
}

export async function createDispute(
	data: CreateDisputeRequest,
): Promise<Dispute> {
	return request<Dispute>("/api/disputes", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function getDisputes(
	params?: SearchDisputesParams,
): Promise<Dispute[]> {
	const searchParams = new URLSearchParams();
	if (params?.status) searchParams.append("status", params.status);
	if (params?.claimantRole) searchParams.append("claimantRole", params.claimantRole);
	if (params?.page) searchParams.append("page", String(params.page));
	if (params?.limit) searchParams.append("limit", String(params.limit));
	const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
	return request<Dispute[]>(`/api/disputes${query}`);
}

export async function getDispute(id: string): Promise<Dispute> {
	return request<Dispute>(`/api/disputes/${id}`);
}

export async function resolveDispute(
	id: string,
	data: ResolveDisputeRequest,
): Promise<Dispute> {
	return request<Dispute>(`/api/disputes/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

// Admin interfaces
export interface User {
	id: string;
	name: string | null;
	email: string;
	role: "owner" | "hirer" | "admin";
	suspended: boolean;
	suspendedAt: string | null;
	suspendedReason: string | null;
	bannedAt: string | null;
	createdAt: string;
	updatedAt: string;
	stripeConnectAccountId: string | null;
	stripeConnectOnboardingComplete: boolean;
}

export interface SearchUsersParams {
	search?: string;
	role?: string;
	page?: number;
	limit?: number;
}

export interface ModerateUserRequest {
	action: "suspend" | "unsuspend" | "ban";
	reason: string;
}

export interface ModerateListingRequest {
	status: "active" | "paused";
	reason?: string;
}

export interface AdminListingsParams {
	search?: string;
	status?: string;
	page?: number;
	limit?: number;
}

// Admin API functions
export async function getAdminListings(
	params?: AdminListingsParams,
): Promise<Listing[]> {
	const searchParams = new URLSearchParams();
	if (params?.search) searchParams.append("search", params.search);
	if (params?.status) searchParams.append("status", params.status);
	if (params?.page) searchParams.append("page", String(params.page));
	if (params?.limit) searchParams.append("limit", String(params.limit));
	const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
	return request<Listing[]>(`/api/admin/listings${query}`);
}

export async function moderateListing(
	id: string,
	data: ModerateListingRequest,
): Promise<Listing> {
	return request<Listing>(`/api/admin/listings/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function getAdminUsers(
	params?: SearchUsersParams,
	init?: RequestInit,
): Promise<User[]> {
	const searchParams = new URLSearchParams();
	if (params?.search) searchParams.append("search", params.search);
	if (params?.role) searchParams.append("role", params.role);
	if (params?.page) searchParams.append("page", String(params.page));
	if (params?.limit) searchParams.append("limit", String(params.limit));
	const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
	return request<User[]>(`/api/admin/users${query}`, init);
}

export async function moderateUser(
	id: string,
	data: ModerateUserRequest,
): Promise<User> {
	return request<User>(`/api/admin/users/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export { ApiError };

