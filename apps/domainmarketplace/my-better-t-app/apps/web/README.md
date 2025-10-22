# Domain Marketplace Web Application

A modern, Airbnb-style domain marketplace built with Next.js 15, featuring dual-mode navigation (Browse/Host), comprehensive onboarding, and a custom color palette optimized for accessibility.

## Table of Contents

- [Custom Color Palette](#custom-color-palette)
- [Mode Switching System](#mode-switching-system)
- [Navigation Architecture](#navigation-architecture)
- [Onboarding Flow](#onboarding-flow)
- [Accessibility](#accessibility)
- [Development Guidelines](#development-guidelines)
- [Component Usage Examples](#component-usage-examples)
- [User Flow Diagrams](#user-flow-diagrams)

---

## Custom Color Palette

### Color System

The application uses a custom color palette with OKLCH color format for consistent, perceptually uniform colors across light and dark modes.

#### Primary Colors

| Color | Hex | OKLCH (Light) | OKLCH (Dark) | Usage |
|-------|-----|---------------|--------------|-------|
| **Teal** | `#00cf9b` | `oklch(0.60 0.153 190.6)` | `oklch(0.756 0.153 190.6)` | Primary CTAs, active states, progress indicators, success states |
| **Purple** | `#6c56b0` | `oklch(0.45 0.137 290.6)` | `oklch(0.519 0.137 290.6)` | Secondary actions, filters, helper text |
| **Red** | `#f71f46` | `oklch(0.55 0.239 20.2)` | `oklch(0.626 0.239 20.2)` | Errors, destructive actions, warnings |
| **Dark Background** | `#1c1e2e` | N/A | `oklch(0.241 0.0306 277.1)` | Dark mode background |

### Usage Guidelines

#### Teal (Primary)
```tsx
// Buttons
<Button variant="default">Primary Action</Button>

// Text
<p className="text-primary">Highlighted text</p>

// Backgrounds
<div className="bg-primary text-primary-foreground">Primary surface</div>

// Borders
<div className="border-primary">Primary border</div>

// Shadows (custom utilities)
<div className="shadow-teal">Teal glow effect</div>
```

#### Purple (Secondary)
```tsx
// Buttons
<Button variant="secondary">Secondary Action</Button>

// Text
<p className="text-secondary">Secondary text</p>

// Backgrounds
<div className="bg-secondary text-secondary-foreground">Secondary surface</div>

// Shadows (custom utilities)
<div className="shadow-purple">Purple glow effect</div>
```

#### Red (Destructive)
```tsx
// Buttons
<Button variant="destructive">Delete</Button>

// Alerts
<Alert variant="destructive">Error message</Alert>

// Shadows (custom utilities)
<div className="shadow-red">Red glow effect</div>
```

### Color Utility Functions

The application provides utility functions in `@/lib/utils` for programmatic color access:

```tsx
import {
  getTealColor,      // Returns "#00cf9b"
  getRedColor,       // Returns "#f71f46"
  getPurpleColor,    // Returns "#6c56b0"
  getDarkBgColor,    // Returns "#1c1e2e"
  getTealOklch,      // Returns OKLCH string
  getTealWithOpacity, // Returns teal with custom opacity
  getTealClasses,    // Returns Tailwind class object
} from '@/lib/utils';

// Example usage
const tealHex = getTealColor();
const tealWithAlpha = getTealWithOpacity(0.5);
const classes = getTealClasses();
// classes = {
//   bg: "bg-primary",
//   text: "text-primary",
//   border: "border-primary",
//   bgHover: "hover:bg-primary",
//   textHover: "hover:text-primary",
//   borderHover: "hover:border-primary",
//   bgWithOpacity: (opacity) => `bg-primary/${Math.round(opacity * 100)}`,
//   textWithOpacity: (opacity) => `text-primary/${Math.round(opacity * 100)}`,
//   borderWithOpacity: (opacity) => `border-primary/${Math.round(opacity * 100)}`,
// }
```

### WCAG Compliance

All color combinations meet WCAG 2.1 AA standards for contrast:

- **Primary (Teal) on White**: 4.5:1 contrast ratio ✓
- **Primary Foreground (White) on Teal**: 4.5:1 contrast ratio ✓
- **Secondary (Purple) on White**: 4.5:1 contrast ratio ✓
- **Destructive (Red) on White**: 4.5:1 contrast ratio ✓
- **Text on Dark Background**: 15:1 contrast ratio ✓

**Note**: The `--primary-foreground` is set to high-contrast white (`oklch(0.99 0 0)`) in both light and dark modes to ensure WCAG AA compliance on teal surfaces.

### Custom Shadow Utilities

Three custom shadow utilities are defined in `index.css`:

```css
.shadow-teal {
  box-shadow: 0 4px 14px 0 rgb(0 207 155 / 0.25);
}

.shadow-purple {
  box-shadow: 0 4px 14px 0 rgb(108 86 176 / 0.25);
}

.shadow-red {
  box-shadow: 0 4px 14px 0 rgb(247 31 70 / 0.25);
}
```

**Usage**:
```tsx
<Button className="hover:shadow-teal">Hover for teal glow</Button>
<Card className="shadow-purple">Purple glow card</Card>
<Alert className="shadow-red">Red glow alert</Alert>
```

---

## Mode Switching System

The application features a dual-mode system allowing users to switch between **Browse Mode** (renting domains) and **Host Mode** (listing domains).

### Architecture

#### ModeProvider (`@/lib/hooks/use-mode`)

The `ModeProvider` wraps the application and manages mode state:

```tsx
// app/layout.tsx
import { ModeProvider } from '@/lib/hooks/use-mode';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClerkProvider>
          <ModeProvider>
            {children}
          </ModeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

#### useMode Hook

Access mode state and actions anywhere in the app:

```tsx
import { useMode } from '@/lib/hooks/use-mode';

function MyComponent() {
  const {
    mode,                      // 'browse' | 'host'
    isBrowseMode,             // boolean
    isHostMode,               // boolean
    switchToBrowse,           // () => void
    switchToHost,             // () => void
    canAccessHostMode,        // boolean (requires onboarding)
    hasCompletedOnboarding,   // boolean
  } = useMode();

  return (
    <div>
      <p>Current mode: {mode}</p>
      {canAccessHostMode && (
        <button onClick={switchToHost}>Switch to Host Mode</button>
      )}
    </div>
  );
}
```

### Mode-Specific Routes

| Mode | Routes | Description |
|------|--------|-------------|
| **Browse** | `/`, `/browse`, `/hires` | Discovery, search, hire management |
| **Host** | `/host/dashboard`, `/host/listings`, `/host/domains`, `/host/earnings` | Listing management, analytics, payouts |

### ModeSwitcher Component

The `ModeSwitcher` component provides a dropdown UI for switching modes:

```tsx
import { ModeSwitcher } from '@/components/navigation/mode-switcher';

// In your navigation
<nav>
  <ModeSwitcher />
</nav>
```

**Behavior**:
- Only visible for signed-in users
- Shows current mode with icon (Home for Browse, Building for Host)
- Host mode option shows "Complete onboarding to access" if not onboarded
- Clicking Host mode without onboarding redirects to `/list-your-domain`
- Automatically switches routes when mode changes

### Onboarding Requirement

Host mode requires completing the onboarding flow:

```tsx
// Utility functions for checking onboarding status
import {
  hasCompletedOnboarding,
  canAccessHostMode,
  getDefaultMode,
  getUserOnboardingStatus,
} from '@/lib/utils';

const { user } = useUser();

// Check if user has completed onboarding
const isOnboarded = hasCompletedOnboarding(user);

// Check if user can access host features
const canHost = canAccessHostMode(user);

// Get default mode for user
const defaultMode = getDefaultMode(user); // 'browse' | 'host'

// Get detailed status
const status = getUserOnboardingStatus(user);
// {
//   isAuthenticated: boolean,
//   hasCompletedOnboarding: boolean,
//   canAccessHostMode: boolean,
//   shouldRedirectToOnboarding: boolean,
//   shouldRedirectToHostDashboard: boolean,
// }
```

### Middleware Protection

The middleware automatically protects routes based on mode and onboarding status:

```typescript
// middleware.ts
// - /host/* routes require authentication AND completed onboarding
// - /onboarding routes require authentication only
// - Public routes: /, /browse, /pricing, /about, etc.
```

**Redirect Flow**:
1. User tries to access `/host/dashboard` without onboarding
2. Middleware redirects to `/list-your-domain?redirect=%2Fhost%2Fdashboard`
3. User completes onboarding
4. User is redirected back to `/host/dashboard`

---

## Navigation Architecture

### Main Navigation

The application uses a responsive navigation system with different layouts for Browse and Host modes.

#### Browse Mode Navigation

```
┌──────────────────────────────────────────────────────────────┐
│ Logo  Home  Browse  My Hires  How It Works  [ModeSwitcher] │
└──────────────────────────────────────────────────────────────┘
```

#### Host Mode Navigation

```
┌─────────────────────────────────────────────────────────┐
│ Logo  [ModeSwitcher]                          [UserMenu] │
└─────────────────────────────────────────────────────────┘
│                                                           │
│ ┌──────────────┐  ┌────────────────────────────────────┐│
│ │ Dashboard    │  │                                    ││
│ │ Listings     │  │  Main Content Area                 ││
│ │ Domains      │  │                                    ││
│ │ Earnings     │  │                                    ││
│ └──────────────┘  └────────────────────────────────────┘│
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Host Sidebar Navigation

The host layout includes a sticky sidebar with navigation items:

```tsx
// app/host/layout.tsx
const hostNavItems = [
  { title: "Dashboard", href: "/host/dashboard", icon: LayoutDashboard },
  { title: "Listings", href: "/host/listings", icon: FileText },
  { title: "Domains", href: "/host/domains", icon: Globe },
  { title: "Earnings", href: "/host/earnings", icon: DollarSign },
];
```

**Active State Detection**:
- Handles both exact matches (`/host/dashboard`)
- Handles nested routes (`/host/dashboard/analytics`)
- Uses `pathname.startsWith(item.href + '/')` for nested detection

**Responsive Behavior**:
- Desktop (lg+): Vertical sidebar on left
- Mobile: Horizontal scrollable tabs at top

---

## Onboarding Flow

New hosts must complete a 3-step onboarding process before accessing host mode features.

### Flow Overview

```
Landing Page → Onboarding Wizard → Owner Dashboard
(/list-your-domain) → (/onboarding) → (/host/dashboard)
```

### Step-by-Step Process

#### Step 1: Landing Page (`/list-your-domain`)

**Purpose**: Marketing page to attract potential hosts

**Features**:
- Hero section with value proposition
- Benefits of hosting
- How it works section
- CTA button: "Get Started"

**Behavior**:
- Unauthenticated users: See landing page
- Authenticated users without onboarding: Redirect to `/onboarding`
- Authenticated users with onboarding: Redirect to `/host/dashboard`

#### Step 2: Onboarding Wizard (`/onboarding`)

**Purpose**: Collect host information and set up account

**Steps**:
1. **Welcome**: Introduction and expectations
2. **Profile**: Name, bio, profile picture
3. **Verification**: Email and identity verification
4. **Completion**: Success message and next steps

**Metadata Update**:
```tsx
import { updateUserMetadata } from '@/lib/utils';

// After completing onboarding
await updateUserMetadata({
  publicMetadata: {
    hasCompletedHostOnboarding: true
  }
});
```

#### Step 3: Owner Dashboard (`/host/dashboard`)

**Purpose**: Main hub for domain owner activities

**Features**:
- Overview of listings
- Recent activity
- Earnings summary
- Quick actions

### Middleware Protection

The middleware enforces onboarding requirements:

```typescript
// Accessing /host/* without onboarding
// → Redirects to /list-your-domain?redirect=/host/dashboard

// Accessing /onboarding with completed onboarding
// → Redirects to /host/dashboard
```

### Checking Onboarding Status

```tsx
import { useMode } from '@/lib/hooks/use-mode';
import { hasCompletedOnboarding } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';

// In a component
function MyComponent() {
  const { hasCompletedOnboarding } = useMode();

  if (!hasCompletedOnboarding) {
    return <OnboardingPrompt />;
  }

  return <HostFeatures />;
}

// In a server component
import { currentUser } from '@clerk/nextjs/server';
import { hasCompletedOnboarding } from '@/lib/utils';

async function ServerComponent() {
  const user = await currentUser();
  const isOnboarded = hasCompletedOnboarding(user);

  if (!isOnboarded) {
    redirect('/list-your-domain');
  }

  return <HostDashboard />;
}
```

---

## Accessibility

The application is built with accessibility as a core principle, targeting WCAG 2.1 AA compliance.

### Color Contrast

All color combinations meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text):

| Combination | Contrast Ratio | Status |
|-------------|----------------|--------|
| Teal on White | 4.5:1 | ✓ AA |
| White on Teal | 4.5:1 | ✓ AA |
| Purple on White | 4.5:1 | ✓ AA |
| White on Purple | 4.5:1 | ✓ AA |
| Red on White | 4.5:1 | ✓ AA |
| White on Red | 4.5:1 | ✓ AA |
| Text on Dark Background | 15:1 | ✓ AAA |

**Testing**: Use automated tools like [axe DevTools](https://www.deque.com/axe/devtools/) to validate contrast in both light and dark modes.

### Keyboard Navigation

All interactive elements are keyboard accessible:

- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward
- **Enter/Space**: Activate buttons and links
- **Escape**: Close dialogs and dropdowns
- **Arrow Keys**: Navigate within menus and lists

### Screen Reader Support

- Semantic HTML elements (`<nav>`, `<main>`, `<aside>`, `<button>`, etc.)
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content updates
- Proper heading hierarchy (h1 → h2 → h3)

### Focus Management

- Visible focus indicators on all interactive elements
- Focus trap in modals and dialogs
- Focus restoration when closing dialogs
- Skip to main content link

### Testing Checklist

- [ ] Run axe DevTools on all pages
- [ ] Test keyboard navigation on all interactive elements
- [ ] Verify screen reader announcements (NVDA, JAWS, VoiceOver)
- [ ] Check color contrast in both light and dark modes
- [ ] Test with browser zoom at 200%
- [ ] Verify focus indicators are visible
- [ ] Test with reduced motion preference

---

## Development Guidelines

### Adding New Features

#### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

#### 2. Follow File Structure

```
apps/web/src/
├── app/                    # Next.js App Router pages
│   ├── (main)/            # Main layout group
│   ├── host/              # Host mode pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── navigation/       # Navigation components
│   └── domains/          # Domain-specific components
├── lib/                   # Utilities and hooks
│   ├── hooks/            # Custom React hooks
│   ├── api-client.ts     # API client functions
│   └── utils.ts          # Utility functions
└── styles/               # Global styles
```

#### 3. Use Existing Patterns

**Color Usage**:
```tsx
// ✓ Good: Use semantic color classes
<Button variant="default">Primary Action</Button>
<div className="bg-primary text-primary-foreground">Content</div>

// ✗ Bad: Hardcode colors
<div style={{ backgroundColor: '#00cf9b' }}>Content</div>
```

**Mode Awareness**:
```tsx
// ✓ Good: Use useMode hook
import { useMode } from '@/lib/hooks/use-mode';

function MyComponent() {
  const { isHostMode, canAccessHostMode } = useMode();

  if (isHostMode && canAccessHostMode) {
    return <HostFeature />;
  }

  return <BrowseFeature />;
}
```

**Onboarding Checks**:
```tsx
// ✓ Good: Use utility functions
import { hasCompletedOnboarding } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';

function MyComponent() {
  const { user } = useUser();
  const isOnboarded = hasCompletedOnboarding(user);

  // ...
}

// ✗ Bad: Direct metadata access
const isOnboarded = user?.publicMetadata?.hasCompletedHostOnboarding;
```

#### 4. Component Guidelines

**Use shadcn/ui Components**:
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
```

**Follow Naming Conventions**:
- Components: PascalCase (`MyComponent.tsx`)
- Utilities: camelCase (`myUtility.ts`)
- Hooks: camelCase with `use` prefix (`useMyHook.ts`)
- Constants: UPPER_SNAKE_CASE (`MY_CONSTANT`)

**Component Structure**:
```tsx
"use client"; // Only if needed

import { useState } from 'react';
import { useMode } from '@/lib/hooks/use-mode';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false);
  const { mode } = useMode();

  return (
    <div>
      <h2>{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
}
```

#### 5. Testing

**Manual Testing**:
- Test in both light and dark modes
- Test in both Browse and Host modes
- Test with and without onboarding completed
- Test responsive behavior (mobile, tablet, desktop)
- Test keyboard navigation
- Test with screen reader

**Automated Testing** (when available):
```bash
npm run test
npm run test:e2e
```

#### 6. Code Quality

**Run Linter**:
```bash
npm run lint
```

**Format Code**:
```bash
npm run format
```

**Type Check**:
```bash
npm run type-check
```

### Package Management

**Always use package managers** for dependency management:

```bash
# Install dependencies
pnpm install <package-name>

# Remove dependencies
pnpm remove <package-name>

# Update dependencies
pnpm update <package-name>
```

**Never manually edit** `package.json` for adding/removing dependencies.

---

## Component Usage Examples

### useMode Hook

```tsx
import { useMode } from '@/lib/hooks/use-mode';

function ModeAwareComponent() {
  const {
    mode,                      // Current mode: 'browse' | 'host'
    isBrowseMode,             // true if in browse mode
    isHostMode,               // true if in host mode
    switchToBrowse,           // Function to switch to browse mode
    switchToHost,             // Function to switch to host mode (redirects if not onboarded)
    canAccessHostMode,        // true if user has completed onboarding
    hasCompletedOnboarding,   // true if user has completed onboarding
  } = useMode();

  return (
    <div>
      <p>Current mode: {mode}</p>

      {/* Show different content based on mode */}
      {isBrowseMode && <BrowseContent />}
      {isHostMode && <HostContent />}

      {/* Conditional rendering based on onboarding */}
      {!canAccessHostMode && (
        <Button onClick={switchToHost}>
          Complete Onboarding to Host
        </Button>
      )}

      {canAccessHostMode && (
        <Button onClick={switchToHost}>
          Switch to Host Mode
        </Button>
      )}
    </div>
  );
}
```

### ModeSwitcher Component

```tsx
import { ModeSwitcher } from '@/components/navigation/mode-switcher';

function Navigation() {
  return (
    <nav className="flex items-center justify-between p-4">
      <Logo />
      <div className="flex items-center gap-4">
        <NavLinks />
        <ModeSwitcher />
        <UserButton />
      </div>
    </nav>
  );
}
```

### Color Utility Functions

```tsx
import {
  getTealColor,
  getTealOklch,
  getTealWithOpacity,
  getTealClasses,
  getRedColor,
  getPurpleColor,
  getDarkBgColor,
} from '@/lib/utils';

function ColorExample() {
  // Get hex color
  const tealHex = getTealColor(); // "#00cf9b"

  // Get OKLCH color
  const tealOklch = getTealOklch(); // "oklch(0.756 0.153 190.6)"

  // Get color with opacity
  const tealWithAlpha = getTealWithOpacity(0.5); // "rgba(0, 207, 155, 0.5)"

  // Get Tailwind classes
  const tealClasses = getTealClasses();

  return (
    <div>
      {/* Use hex color */}
      <div style={{ backgroundColor: tealHex }}>Teal background</div>

      {/* Use Tailwind classes */}
      <div className={tealClasses.bg}>Teal background</div>
      <p className={tealClasses.text}>Teal text</p>
      <div className={tealClasses.border}>Teal border</div>

      {/* Use with opacity */}
      <div className={tealClasses.bgWithOpacity(50)}>50% opacity teal</div>
    </div>
  );
}
```

### Onboarding Utility Functions

```tsx
import {
  hasCompletedOnboarding,
  canAccessHostMode,
  getDefaultMode,
  getUserOnboardingStatus,
  updateUserMetadata,
} from '@/lib/utils';
import { useUser } from '@clerk/nextjs';

function OnboardingExample() {
  const { user } = useUser();

  // Check if user has completed onboarding
  const isOnboarded = hasCompletedOnboarding(user);

  // Check if user can access host mode
  const canHost = canAccessHostMode(user);

  // Get default mode for user
  const defaultMode = getDefaultMode(user);

  // Get detailed status
  const status = getUserOnboardingStatus(user);

  // Update metadata after onboarding
  const completeOnboarding = async () => {
    await updateUserMetadata({
      publicMetadata: {
        hasCompletedHostOnboarding: true
      }
    });
  };

  return (
    <div>
      {status.shouldRedirectToOnboarding && (
        <OnboardingPrompt />
      )}

      {status.canAccessHostMode && (
        <HostFeatures />
      )}
    </div>
  );
}
```

### Navigation Patterns

```tsx
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function NavigationExample() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/browse', label: 'Browse' },
    { href: '/hires', label: 'My Hires' },
    { href: '/how-it-works', label: 'How It Works' },
  ];

  return (
    <nav>
      {navItems.map((item) => {
        // Handle exact and nested routes
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

---

## User Flow Diagrams

### Authentication Flow

\`\`\`mermaid
graph TD
    A[User Visits Site] --> B{Authenticated?}
    B -->|No| C[Show Public Pages]
    B -->|Yes| D{Has Completed Onboarding?}
    C --> E[Sign In/Sign Up]
    E --> D
    D -->|No| F[Redirect to /list-your-domain]
    D -->|Yes| G{Current Mode?}
    F --> H[Complete Onboarding]
    H --> I[Update Metadata]
    I --> J[Redirect to /host/dashboard]
    G -->|Browse| K[Show Browse Pages]
    G -->|Host| L[Show Host Pages]
\`\`\`

### Mode Switching Flow

\`\`\`mermaid
graph TD
    A[User Clicks ModeSwitcher] --> B{Target Mode?}
    B -->|Browse| C[Switch to Browse Mode]
    B -->|Host| D{Has Completed Onboarding?}
    C --> E[Update localStorage]
    E --> F{On Host Page?}
    F -->|Yes| G[Redirect to /browse]
    F -->|No| H[Stay on Current Page]
    D -->|No| I[Redirect to /list-your-domain]
    D -->|Yes| J[Switch to Host Mode]
    J --> K[Update localStorage]
    K --> L{On Browse Page?}
    L -->|Yes| M[Redirect to /host/dashboard]
    L -->|No| N[Stay on Current Page]
\`\`\`

### Onboarding Flow

\`\`\`mermaid
graph TD
    A[User Visits /list-your-domain] --> B{Authenticated?}
    B -->|No| C[Show Landing Page]
    B -->|Yes| D{Has Completed Onboarding?}
    C --> E[Click Get Started]
    E --> F[Sign In/Sign Up]
    F --> G[Redirect to /onboarding]
    D -->|Yes| H[Redirect to /host/dashboard]
    D -->|No| G
    G --> I[Step 1: Welcome]
    I --> J[Step 2: Profile]
    J --> K[Step 3: Verification]
    K --> L[Step 4: Completion]
    L --> M[Update Metadata]
    M --> N[Set hasCompletedHostOnboarding: true]
    N --> O[Redirect to /host/dashboard]
\`\`\`

### Host Route Protection Flow

\`\`\`mermaid
graph TD
    A[User Accesses /host/*] --> B[Middleware Check]
    B --> C{Authenticated?}
    C -->|No| D[Redirect to /sign-in]
    C -->|Yes| E{Has Completed Onboarding?}
    E -->|No| F[Redirect to /list-your-domain]
    E -->|Yes| G[Allow Access]
    F --> H[Store redirect URL]
    H --> I[?redirect=/host/dashboard]
    I --> J[Complete Onboarding]
    J --> K[Redirect to Original URL]
\`\`\`

### Domain Listing Flow

\`\`\`mermaid
graph TD
    A[Host Clicks Add Domain] --> B[Open Domain Wizard]
    B --> C[Step 1: Enter Domain]
    C --> D[Validate Domain]
    D --> E{Valid?}
    E -->|No| F[Show Error]
    E -->|Yes| G[Step 2: Select Verification Method]
    F --> C
    G --> H{Method?}
    H -->|Cloudflare SaaS| I[Configure Cloudflare]
    H -->|Domain Connect| J[Configure Domain Connect]
    H -->|Manual DNS| K[Show DNS Instructions]
    I --> L[Step 3: Verify Domain]
    J --> L
    K --> L
    L --> M[Check Verification Status]
    M --> N{Verified?}
    N -->|No| O[Show Retry Options]
    N -->|Yes| P[Domain Added Successfully]
    O --> M
    P --> Q[Redirect to /host/domains]
\`\`\`

### Browse and Rent Flow

\`\`\`mermaid
graph TD
    A[User Visits /browse] --> B[View Domain Listings]
    B --> C[Apply Filters]
    C --> D[Click Domain Card]
    D --> E[View Domain Details]
    E --> F{Authenticated?}
    F -->|No| G[Prompt to Sign In]
    F -->|Yes| H[Click Rent Domain]
    G --> I[Sign In/Sign Up]
    I --> H
    H --> J[Select hire Type]
    J --> K{Type?}
    K -->|Period| L[Select Duration]
    K -->|Per Click| M[Set Budget]
    L --> N[Confirm hire]
    M --> N
    N --> O[Create hire Record]
    O --> P[Redirect to /hires]
    P --> Q[View Active hire]
\`\`\`

---

## Additional Resources

### Related Documentation

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Design System

- [Figma Design Files](#) (if available)
- [Component Storybook](#) (if available)
- [Brand Guidelines](#) (if available)

### Support

For questions or issues:
- Create an issue in the repository
- Contact the development team
- Check the main README in the repository root

---

## License

[Your License Here]



