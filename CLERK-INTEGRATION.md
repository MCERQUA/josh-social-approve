# Clerk Authentication Integration Guide

## Current Status
The app is prepared for Clerk authentication with placeholder user data in the Header component.

## Files to Modify

### 1. Header Component (`components/Header.tsx`)

**Current Placeholder:**
```typescript
const user = {
  name: 'Josh Cotner',
  email: 'josh@contractorschoiceagency.com',
  imageUrl: null,
  isSignedIn: true
};
```

**Replace with Clerk:**
```typescript
import { UserButton, useUser } from '@clerk/nextjs';

export default function Header() {
  const { user, isSignedIn } = useUser();

  // Use user?.firstName, user?.emailAddresses[0]?.emailAddress, user?.imageUrl
}
```

**Sign Out Button:**
```typescript
// Current placeholder
console.log('Sign out - Clerk integration pending');

// Replace with
import { useClerk } from '@clerk/nextjs';
const { signOut } = useClerk();
await signOut();
```

**Sign In Button:**
```typescript
// Current placeholder
console.log('Sign in - Clerk integration pending');

// Replace with
import { useClerk } from '@clerk/nextjs';
const { openSignIn } = useClerk();
openSignIn();
```

### 2. Layout (`app/layout.tsx`)

**Add Clerk Provider:**
```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          <div className="pt-16">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 3. Environment Variables

**Add to `.env.local`:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 4. Middleware (Optional - for protected routes)

**Create `middleware.ts` in root:**
```typescript
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: ['/sign-in', '/sign-up'],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## Installation

```bash
npm install @clerk/nextjs
```

## Setup Steps

1. Sign up for Clerk at https://clerk.com
2. Create a new application
3. Copy API keys to `.env.local`
4. Install `@clerk/nextjs` package
5. Wrap layout with `ClerkProvider`
6. Replace placeholder user data in Header with Clerk hooks
7. Test sign in/sign out flow
8. Add middleware for route protection (optional)

## Current Design
- Fixed header with user menu on the right
- User avatar shows initials (will use Clerk's user image)
- Dropdown menu with Dashboard, Social Media links, and Sign Out
- Mobile responsive with hidden email on small screens
- Professional backdrop blur and transitions

## Notes
- Header is already styled and ready for Clerk integration
- All user data placeholders are clearly marked with comments
- No changes needed to existing pages - they'll inherit authentication
- Clerk's UserButton component can replace the custom dropdown if preferred
