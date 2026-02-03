# Quick Start: Integrating Your Apps with Zest Auth

## ✅ What's Already Done

1. **OAuth Server is Ready** ✅
   - Fixed the redirect flow bug
   - OAuth endpoints are working: `/api/oauth/authorize`, `/api/oauth/token`, `/api/oauth/userinfo`, `/api/oauth/revoke`

2. **OAuth Clients Registered** ✅
   - **Zest Academy** → `client_id: zest_academy`
   - **Zestfolio** → `client_id: zestfolio`
   - **Zest Compilers** → `client_id: zest_compilers`

3. **Test User Created** ✅
   - Email: `test@zestacademy.tech`
   - Password: `password123`

---

## 🚀 What You Need to Do on Each Website

For each of your 3 websites (Zest Academy, Zestfolio, Zest Compilers), you need to add OAuth client code.

### Quick Checklist for Each Website:

#### 1. **Install Dependency**
```bash
npm install pkce-challenge
```

#### 2. **Add Environment Variables**

Create or update `.env.local`:

**For Zest Academy:**
```env
NEXT_PUBLIC_AUTH_URL=https://auth.zestacademy.tech
NEXT_PUBLIC_OAUTH_CLIENT_ID=zest_academy
NEXT_PUBLIC_REDIRECT_URI=https://zestacademy.tech/auth/callback

AUTH_SERVER_URL=https://auth.zestacademy.tech
OAUTH_CLIENT_ID=zest_academy
REDIRECT_URI=https://zestacademy.tech/auth/callback
```

**For Zestfolio:**
```env
NEXT_PUBLIC_AUTH_URL=https://auth.zestacademy.tech
NEXT_PUBLIC_OAUTH_CLIENT_ID=zestfolio
NEXT_PUBLIC_REDIRECT_URI=https://zestfolio.zestacademy.tech/auth/callback

AUTH_SERVER_URL=https://auth.zestacademy.tech
OAUTH_CLIENT_ID=zestfolio
REDIRECT_URI=https://zestfolio.zestacademy.tech/auth/callback
```

**For Zest Compilers:**
```env
NEXT_PUBLIC_AUTH_URL=https://auth.zestacademy.tech
NEXT_PUBLIC_OAUTH_CLIENT_ID=zest_compilers
NEXT_PUBLIC_REDIRECT_URI=https://compilers.zestacademy.tech/auth/callback

AUTH_SERVER_URL=https://auth.zestacademy.tech
OAUTH_CLIENT_ID=zest_compilers
REDIRECT_URI=https://compilers.zestacademy.tech/auth/callback
```

#### 3. **Copy These Files to Each Website**

You need to create these files in each website (see `CLIENT_INTEGRATION.md` for full code):

```
your-website/
├── lib/oauth.ts                    # OAuth helper functions
├── app/auth/callback/page.tsx      # OAuth callback page  
└── app/api/auth/callback/route.ts  # Token exchange endpoint
```

#### 4. **Update Your Login Button**

Replace your current login logic with:

```tsx
import { initiateLogin } from '@/lib/oauth'

<button onClick={initiateLogin}>
  Sign in with Zest Account
</button>
```

---

## 📚 Full Documentation

- **`CLIENT_INTEGRATION.md`** → Complete step-by-step guide with all code examples
- **`OAUTH_IMPLEMENTATION.md`** → Server-side OAuth implementation details
- **`INTEGRATION.md`** → Old Firebase integration (deprecated, but kept for reference)

---

## 🧪 Testing the Flow

### Local Testing:

1. **Start Auth Server:**
   ```bash
   cd zest.auth
   npm run dev  # localhost:3000
   ```

2. **Start Your App** (e.g., Zest Academy):
   ```bash
   cd zest-academy
   npm run dev  # localhost:3001
   ```

3. **Test Login Flow:**
   - Click "Sign in"
   - Redirected to `http://localhost:3000/api/oauth/authorize`
   - Login with `test@zestacademy.tech` / `password123`
   - Redirected back to your app at `/auth/callback`
   - Successfully authenticated!

### Production Testing:

1. Deploy your auth server to `https://auth.zestacademy.tech`
2. Deploy your apps to their respective domains
3. Test the login flow from each app

---

## 🔑 OAuth Client Credentials

Each website has its own client_id:

| Website | Client ID | Callback URL (Production) |
|---------|-----------|---------------------------|
| Zest Academy | `zest_academy` | https://zestacademy.tech/auth/callback |
| Zestfolio | `zestfolio` | https://zestfolio.zestacademy.tech/auth/callback |
| Zest Compilers | `zest_compilers` | https://compilers.zestacademy.tech/auth/callback |

All are marked as **trusted**, so users won't see a consent screen.

---

## 💡 Important Notes

1. **No Client Secret Needed**: You're using PKCE (Proof Key for Code Exchange), which is more secure for public clients and doesn't require a client secret to be sent from the frontend.

2. **Trusted Clients**: Your apps are marked as "trusted", meaning users won't see a consent screen asking for permissions.

3. **Session Management**: You'll need to implement your own session management. The examples in `CLIENT_INTEGRATION.md` show how to store tokens in httpOnly cookies.

4. **Token Refresh**: Access tokens expire after 1 hour. Implement refresh logic using the refresh token (examples provided in the guide).

---

## 🆘 Need Help?

Refer to `CLIENT_INTEGRATION.md` for:
- Complete code examples
- Error handling
- Token management
- Security best practices
- Common issues and solutions

Good luck! 🚀
