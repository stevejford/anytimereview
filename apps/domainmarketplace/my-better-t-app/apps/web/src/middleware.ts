import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { PublicMetadata } from '@/lib/utils';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/api/webhooks/clerk(.*)',
  '/api/webhooks/stripe(.*)',
  '/browse(.*)',
  '/hires(.*)',
  '/how-it-works',
  '/pricing',
  '/about',
  '/legal(.*)',
  '/login(.*)',
  '/sign-up(.*)',
]);

// Define host mode routes that require completed onboarding
const isHostRoute = createRouteMatcher(['/host(.*)']);

// Define onboarding routes
const isOnboardingRoute = createRouteMatcher(['/onboarding', '/list-your-domain']);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes without any checks
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Get authentication status
  const authResult = await auth();

  // For onboarding routes
  if (isOnboardingRoute(req)) {
    // Require authentication
    await auth.protect();

    // Check if user has already completed onboarding
    try {
      const metadata = authResult.sessionClaims?.publicMetadata as PublicMetadata | undefined;
      const hasCompletedOnboarding = metadata?.hasCompletedHostOnboarding === true;

      if (hasCompletedOnboarding) {
        // User already completed onboarding, redirect to host dashboard
        return NextResponse.redirect(new URL('/host/dashboard', req.url));
      }
    } catch (error) {
      // Log warning but allow access to onboarding on error
      console.warn('Error checking onboarding status in middleware:', error);
    }

    return NextResponse.next();
  }

  // For host routes
  if (isHostRoute(req)) {
    // Require authentication
    await auth.protect();

    // Check if user has completed onboarding
    try {
      const metadata = authResult.sessionClaims?.publicMetadata as PublicMetadata | undefined;
      const hasCompletedOnboarding = metadata?.hasCompletedHostOnboarding === true;

      if (!hasCompletedOnboarding) {
        // User hasn't completed onboarding, redirect to onboarding with return URL
        const redirectUrl = new URL('/list-your-domain', req.url);
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      // Log warning and redirect to onboarding on error (safe default)
      console.warn('Error checking onboarding status in middleware:', error);
      const redirectUrl = new URL('/list-your-domain', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // For all other routes, require authentication
  await auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

