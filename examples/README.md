# OAuth Client Examples

Ready-to-use code examples for integrating your applications with Zest Auth.

## 📁 Files in this Folder

### 1. `oauth-client.ts`
Complete OAuth helper library with all the functions you need:
- `initiateLogin()` - Start the OAuth flow
- `handleCallback()` - Process the OAuth callback
- `refreshAccessToken()` - Refresh expired tokens
- `revokeToken()` - Logout/revoke tokens

**Copy to:** `lib/oauth.ts` or `utils/oauth.ts`

### 2. `callback-page.tsx`
OAuth callback page with loading states and error handling.

**Copy to:** `app/auth/callback/page.tsx`

### 3. `session-api-route.ts`
API route to create sessions and store tokens in httpOnly cookies.

**Copy to:** `app/api/auth/session/route.ts`

### 4. `login-button.tsx`
Ready-to-use login/logout button components.

**Copy to:** `components/LoginButton.tsx`

## 🚀 Quick Integration Steps

### 1. Install Dependencies
```bash
npm install pkce-challenge
```

### 2. Setup Environment Variables
Create `.env.local` with your client credentials:

```env
# For Zest Academy
NEXT_PUBLIC_AUTH_URL=https://auth.zestacademy.tech
NEXT_PUBLIC_OAUTH_CLIENT_ID=zest_academy
NEXT_PUBLIC_REDIRECT_URI=https://zestacademy.tech/auth/callback

# Server-side
AUTH_SERVER_URL=https://auth.zestacademy.tech
OAUTH_CLIENT_ID=zest_academy
REDIRECT_URI=https://zestacademy.tech/auth/callback
```

### 3. Copy the Files

```bash
# Copy OAuth helper
cp examples/oauth-client.ts lib/oauth.ts

# Copy callback page
cp examples/callback-page.tsx app/auth/callback/page.tsx

# Copy session API
cp examples/session-api-route.ts app/api/auth/session/route.ts

# Copy login button
cp examples/login-button.tsx components/LoginButton.tsx
```

### 4. Use in Your App

```tsx
import { LoginButton } from '@/components/LoginButton'

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Zest Academy</h1>
      <LoginButton />
    </div>
  )
}
```

## 🎯 Client IDs for Each App

| Application | Client ID | Local Port |
|------------|-----------|-----------|
| Zest Academy | `zest_academy` | 3001 |
| Zestfolio | `zestfolio` | 3002 |
| Zest Compilers | `zest_compilers` | 3003 |

## 📚 More Information

- See `../CLIENT_INTEGRATION.md` for detailed implementation guide
- See `../QUICK_START.md` for setup instructions
- See `../OAUTH_IMPLEMENTATION.md` for server-side details

## 🧪 Testing

1. Start the auth server: `cd .. && npm run dev`
2. Start your app: `npm run dev`
3. Click login button
4. Should redirect to auth server and back

## ⚠️ Important Notes

- These examples are for Next.js App Router (13+)
- Adjust imports and syntax for other frameworks
- Always use HTTPS in production
- Never expose tokens to client-side JavaScript
- Implement proper error handling for production

Happy coding! 🎉
