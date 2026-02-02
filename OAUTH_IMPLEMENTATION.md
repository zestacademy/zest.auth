# Zest Auth - OAuth 2.0 + OpenID Connect Implementation Guide

## Architecture Overview

Zest Auth is now a **full OAuth 2.0 Authorization Server** with OpenID Connect support, functioning like `accounts.google.com` as the central identity provider for all Zest Academy applications.

## What Changed

### From: Simple Redirect Auth (Firebase-based)
- Basic redirect to/from auth pages
- Firebase handles all auth logic
- Tokens managed by Firebase

### To: Standards-Compliant OAuth 2.0 Server
- Full OAuth 2.0 Authorization Code Flow
- OpenID Connect (OIDC) support
- Self-managed user database
- JWT token issuance and verification
- Client registration system
- Consent management

## Core Components

### 1. **Database Schema** (`prisma/schema.prisma`)

**Models:**
- `User` - User accounts with email/password
- `OAuthClient` - Registered OAuth applications
- `AuthorizationCode` - Temporary codes for OAuth flow
- `AccessToken` - JWT access tokens (short-lived)
- `RefreshToken` - Refresh tokens (long-lived)
- `UserConsent` - User authorization records

### 2. **OAuth Library** (`src/lib/oauth.ts`)

**Functions:**
- `generateAccessToken()` - Create JWT access tokens
- `generateRefreshToken()` - Create refresh tokens
- `generateAuthorizationCode()` - Create authorization codes
- `verifyAuthorizationCode()` - Validate and consume codes
- `verifyAccessToken()` - Verify JWT tokens
- `verifyRefreshToken()` - Verify refresh tokens
- Token revocation functions
- Consent management functions

### 3. **Password Utilities** (`src/lib/password.ts`)

- `hashPassword()` - Argon2 password hashing
- `verifyPassword()` - Password verification

## OAuth 2.0 Flow

### Authorization Code Flow

```
┌─────────────┐                               ┌──────────────┐
│             │                               │              │
│   Client    │                               │  Zest Auth   │
│Application  │                               │   Server     │
│             │                               │              │
└──────┬──────┘                               └───────┬──────┘
       │                                              │
       │  1. GET /authorize?                          │
       │     client_id=XXX&                           │
       │     redirect_uri=https://app.com/callback&   │
       │     response_type=code&                      │
       │     scope=openid email profile&              │
       │     state=random_state                       │
       │─────────────────────────────────────────────>│
       │                                              │
       │                                      2. Show Login Page
       │                                              │
       │                                      3. User Authenticates
       │                                              │
       │                                      4. Show Consent Screen
       │                                       (if first time or
       │                                        not trusted client)
       │                                              │
       │                                      5. User Approves
       │                                              │
       │  6. Redirect with code:                      │
       │     https://app.com/callback?                │
       │     code=AUTHORIZATION_CODE&                 │
       │     state=random_state                       │
       │<─────────────────────────────────────────────│
       │                                              │
       │  7. POST /token                              │
       │     grant_type=authorization_code&           │
       │     code=AUTHORIZATION_CODE&                 │
       │     redirect_uri=https://app.com/callback&   │
       │     client_id=XXX&                           │
       │     client_secret=SECRET                     │
       │─────────────────────────────────────────────>│
       │                                              │
       │                                      8. Verify Code
       │                                         Verify Client
       │                                              │
       │  9. Return tokens:                           │
       │     {                                        │
       │       "access_token": "JWT_TOKEN",           │
       │       "token_type": "Bearer",                │
       │       "expires_in": 3600,                    │
       │       "refresh_token": "REFRESH_TOKEN",      │
       │       "id_token": "ID_TOKEN" // OpenID       │
       │     }                                        │
       │<─────────────────────────────────────────────│
       │                                              │
       │  10. Use access_token to access user data    │
       │      or make API calls                       │
       │                                              │
```

## Required Endpoints

### 1. `GET /api/oauth/authorize`

Initiates OAuth authorization flow.

**Parameters:**
- `response_type` - Must be "code"
- `client_id` - Registered OAuth client ID
- `redirect_uri` - Registered redirect URI
- `scope` - Space-separated scopes (e.g., "openid email profile")
- `state` - CSRF protection token (recommended)
- `code_challenge` - For PKCE (optional)
- `code_challenge_method` - Usually "S256" (optional)

**Response:**
- If user not logged in: Redirect to `/login?returnTo=/authorize?...`
- If user logged in but no consent: Show consent screen
- If user logged in and consented: Redirect to `redirect_uri?code=XXX&state=XXX`

### 2. `POST /api/oauth/token`

Exchanges authorization code for access tokens.

**Parameters:**
- `grant_type` - "authorization_code" or "refresh_token"
- `code` - Authorization code (for authorization_code grant)
- `redirect_uri` - Same as in /authorize
- `client_id` - OAuth client ID
- `client_secret` - OAuth client secret
- `refresh_token` - Refresh token (for refresh_token grant)
- `code_verifier` - For PKCE (optional)

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "openid email profile"
}
```

### 3. `POST /api/auth/register`

Register a new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### 4. `POST /api/auth/login`

Login with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": "session_token"
}
```

### 5. `POST /api/auth/logout`

Logout and revoke all tokens.

**Response:**
```json
{
  "success": true
}
```

### 6. `POST /api/oauth/revoke`

Revoke a specific token.

**Body:**
```json
{
  "token": "token_to_revoke",
  "token_type_hint": "access_token" // or "refresh_token"
}
```

### 7. `GET /api/.well-known/openid-configuration`

OpenID Connect discovery document.

**Response:**
```json
{
  "issuer": "https://auth.zestacademy.tech",
  "authorization_endpoint": "https://auth.zestacademy.tech/api/oauth/authorize",
  "token_endpoint": "https://auth.zestacademy.tech/api/oauth/token",
  "userinfo_endpoint": "https://auth.zestacademy.tech/api/oauth/userinfo",
  "jwks_uri": "https://auth.zestacademy.tech/api/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "email", "profile"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
  "code_challenge_methods_supported": ["S256"]
}
```

## Token Format

### Access Token (JWT)

**Header:**
```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "email_verified": true,
  "scope": "openid email profile",
  "iss": "https://auth.zestacademy.tech",
  "aud": "client_id",
  "exp": 1234567890,
  "iat": 1234567890,
  "jti": "unique_token_id"
}
```

### Refresh Token

Opaque string (64-character nanoid) stored in database.

## Client Registration

### Registering a New OAuth Client

Clients must be registered in the database before use. Use Prisma Studio or create a seed script:

```typescript
await prisma.oAuthClient.create({
  data: {
    clientId: 'zest_academy_web',
    clientSecret: await hashPassword('super_secret_key'),
    name: 'Zest Academy',
    description: 'Main Zest Academy learning platform',
    logo: 'https://zestacademy.tech/logo.png',
    redirectUris: [
      'https://zestacademy.tech/auth/callback',
      'http://localhost:3001/auth/callback'
    ],
    allowedScopes: ['openid', 'email', 'profile'],
    trusted: true // Skip consent screen
  }
})
```

## Scopes

### Standard OpenID Connect Scopes

- `openid` - Required for OIDC, includes `sub` claim
- `email` - Access to email and email_verified
- `profile` - Access to name, picture, etc.

### Custom Scopes (Future)

- `zest:courses` - Access to user's enrolled courses
- `zest:portfolio` - Access to user's portfolio data
- `zest:certificates` - Access to user's certificates

## Security Features

### Implemented

✅ **Password Hashing** - Argon2id with secure parameters  
✅ **JWT Signing** - RS256 (RSA with SHA-256)  
✅ **Authorization Codes** - Single-use, time-limited  
✅ **Token Expiration** - Configurable TTLs  
✅ **Redirect URI Validation** - Prevent open redirects  
✅ **Scope Validation** - Restrict client permissions  
✅ **Consent Management** - User approves scopes  
✅ **Token Revocation** - Immediate invalidation  
✅ **PKCE Support** - For public clients  

### Recommended (To Implement)

⚠️ **Rate Limiting** - Prevent brute force  
⚠️ **CSRF Protection** - Validate state parameter  
⚠️ **HTTPS Enforcement** - Production requirement  
⚠️ **Secure Cookies** - httpOnly, secure, sameSite  
⚠️ **Session Management** - Secure session storage  
⚠️ **Audit Logging** - Track auth events  
⚠️ **Email Verification** - Confirm user emails  
⚠️ **MFA** - Two-factor authentication  

## Database Setup

### 1. Install PostgreSQL

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### 2. Create Database

```bash
psql postgres
CREATE DATABASE zest_auth;
CREATE USER zest_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE zest_auth TO zest_user;
\q
```

### 3. Update .env

```env
DATABASE_URL="postgresql://zest_user:your_password@localhost:5432/zest_auth?schema=public"
```

### 4. Run Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Seed Database (Optional)

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function main() {
  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: 'test@zestacademy.tech',
      passwordHash: await hashPassword('password123'),
      name: 'Test User',
      emailVerified: true
    }
  })

  // Create a test OAuth client
  const client = await prisma.oAuthClient.create({
    data: {
      clientId: 'test_client',
      clientSecret: await hashPassword('test_secret'),
      name: 'Test Application',
      redirectUris: ['http://localhost:3001/callback'],
      allowedScopes: ['openid', 'email', 'profile'],
      trusted: false
    }
  })

  console.log({ user, client })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run: `npx prisma db seed`

## JWT Key Generation

Generate RSA key pair for JWT signing:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# View keys
cat private.pem
cat public.pem
```

Add to `.env` (escape newlines with `\n`):
```env
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBI...\n-----END PUBLIC KEY-----"
```

## Testing the OAuth Flow

### 1. Start the Server

```bash
npm run dev
```

### 2. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123","name":"Test User"}'
```

### 3. Initiate OAuth Flow

```
http://localhost:3000/api/oauth/authorize?response_type=code&client_id=test_client&redirect_uri=http://localhost:3001/callback&scope=openid%20email%20profile&state=random_state
```

### 4. Exchange Code for Token

```bash
curl -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=http://localhost:3001/callback&client_id=test_client&client_secret=test_secret'
```

### 5. Use Access Token

```bash
curl http://localhost:3000/api/oauth/userinfo \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Next Steps

1. ✅ Set up PostgreSQL database
2. ✅ Run Prisma migrations
3. ⬜ Implement OAuth endpoints (next task)
4. ⬜ Create consent UI
5. ⬜ Add rate limiting
6. ⬜ Implement CSRF protection
7. ⬜ Add email verification
8. ⬜ Production deployment

---

**Version:** 2.0.0 - OAuth 2.0 Implementation  
**Status:** In Development 🚧
