# 🚀 Zest Auth - Complete Setup Guide

## ✅ Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed
- Git installed

## 📦 Step 1: Initial Setup

Your repository already has all the necessary code installed. The OAuth 2.0 server infrastructure is complete!

## 🗄️ Step 2: Database Setup

### Option A: Windows (Recommended Method)

1. **Download PostgreSQL**
   - Visit https://www.postgresql.org/download/windows/
   - Download the installer for PostgreSQL 14 or later
   - Run the installer
   - Remember the password you set for the `postgres` user!

2. **Create Database**
   ```powershell
   # Open PowerShell and connect to PostgreSQL
   psql -U postgres
   
   # At the postgres=# prompt, run:
   CREATE DATABASE zest_auth;
   CREATE USER zest_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE zest_auth TO zest_user;
   \q
   ```

### Option B: Use Free Cloud Database

**Railway.app** (Free tier with credit card):
1. Go to https://railway.app/
2. Create account
3. Click "New Project" → "Provision PostgreSQL"
4. Copy the DATABASE_URL from connection settings

**Supabase** (Free tier, no card needed):
1. Go to https://supabase.com
2. Create account and new project
3. Go to Project Settings → Database
4. Copy the CONNECTION STRING (URI format)

## 🔑 Step 3: Generate JWT Keys

Run these commands in PowerShell:

```powershell
# Generate private key
openssl genrsa -out private.pem 2048

# Generate public key
openssl rsa -in private.pem -pubout -out public.pem

# View keys (you'll need to copy these)
cat private.pem
cat public.pem
```

**Don't have OpenSSL?** Install via:
```powershell
winget install OpenSSL.Light
```

Or use this online tool: https://travistidwell.com/jsencrypt/demo/

## ⚙️ Step 4: Configure Environment Variables

Update your `.env` file with the generated keys:

```env
# Database (use your own password or Railway/Supabase URL)
DATABASE_URL="postgresql://zest_user:your_secure_password@localhost:5432/zest_auth?schema=public"

# JWT Keys (copy from private.pem and public.pem)
# IMPORTANT: Replace \n with actual newlines when copying, then escape them as \\n
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\\nMIIEpAIBAAKCAQEA...\\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\\n-----END PUBLIC KEY-----"
JWT_ISSUER="https://auth.zestacademy.tech"

# Session Secret (generate random string)
SESSION_SECRET="your-random-session-secret-change-this"
NEXTAUTH_SECRET="your-random-nextauth-secret-change-this"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Server Config (leave as is)
OAUTH_AUTHORIZATION_CODE_TTL=600
OAUTH_ACCESS_TOKEN_TTL=3600
OAUTH_REFRESH_TOKEN_TTL=2592000
```

**Generate random secrets** with PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

## 🏗️ Step 5: Initialize Database

Run Prisma migrations to create all tables:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed initial data (test user + OAuth clients)
npx prisma db seed
```

Expected output:
```
🌱 Seeding database...
✅ Created test user: test@zestacademy.tech
✅ Created OAuth client: Zest Academy
✅ Created OAuth client: Zestfolio
✅ Created OAuth client: Test Application
🎉 Seed completed successfully!
```

## ✨ Step 6: Verify Setup

Open Prisma Studio to view your database:

```bash
npx prisma studio
```

This opens http://localhost:5555 where you can see:
- **Users** table with test user
- **OAuthClient** table with 3 clients
- All other OAuth tables (empty for now)

## 🎯 Step 7: Start Development Server

```bash
npm run dev
```

Server runs on http://localhost:3000

## 🧪 Step 8: Test the OAuth Flow

### Test 1: Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newuser@test.com\",\"password\":\"password123\",\"name\":\"New User\"}"
```

Expected: `{"success":true,"user":{...}}`

### Test 2: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@zestacademy.tech\",\"password\":\"password123\"}" \
  -c cookies.txt
```

Expected: `{"success":true,"user":{...}}` + session cookie saved

### Test 3: OpenID Discovery

Visit: http://localhost:3000/api/.well-known/openid-configuration

Should see JSON with all OAuth endpoints.

### Test 4: OAuth Authorization Flow

1. **Start authorization** (paste in browser):
   ```
   http://localhost:3000/api/oauth/authorize?response_type=code&client_id=test_client&redirect_uri=http://localhost:3003/callback&scope=openid%20email%20profile&state=random123
   ```

2. **Expected flow:**
   - If not logged in → Redirects to `/login`
   - After login → Shows consent screen
   - After consent → Redirects to callback with code

3. **Exchange code for token** (replace CODE_HERE):
   ```bash
   curl -X POST http://localhost:3000/api/oauth/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code&code=CODE_HERE&redirect_uri=http://localhost:3003/callback&client_id=test_client&client_secret=test_client_secret"
   ```

4. **Expected response:**
   ```json
   {
     "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "refresh_token": "...",
     "id_token": "...",
     "scope": "openid email profile"
   }
   ```

5. **Test userinfo endpoint** (replace TOKEN):
   ```bash
   curl http://localhost:3000/api/oauth/userinfo \
     -H "Authorization: Bearer TOKEN_HERE"
   ```

## 📊 What's Been Created

### API Endpoints ✅

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout & revoke tokens
- `GET /api/oauth/authorize` - Start OAuth flow
- `POST /api/oauth/token` - Exchange code for tokens
- `GET /api/oauth/userinfo` - Get user info
- `POST /api/oauth/revoke` - Revoke tokens
- `GET /api/.well-known/openid-configuration` - OIDC discovery

### Database Models ✅

- User (with argon2 hashed passwords)
- OAuthClient (registered applications)
- AuthorizationCode (OAuth flow)
- AccessToken (JWT tokens)
- RefreshToken (long-lived tokens)
- UserConsent (approval records)

### Security Features ✅

- Argon2id password hashing
- RS256 JWT signing
- Refresh token rotation
- Authorization code flow
- Scope validation
- Redirect URI validation
- PKCE support

## 🎓 Seeded Test Data

After running `npx prisma db seed`, you have:

### Test User
- Email: `test@zestacademy.tech`
- Password: `password123`

### OAuth Clients

1. **Zest Academy** (`zest_academy`)
   - Secret: `zest_academy_secret_key`
   - Redirects: localhost:3001, zestacademy.tech
   - Trusted: Yes (skips consent)

2. **Zestfolio** (`zestfolio`)
   - Secret: `zestfolio_secret_key`
   - Redirects: localhost:3002, zestfolio.zestacademy.tech
   - Trusted: Yes

3. **Test Client** (`test_client`)
   - Secret: `test_client_secret`
   - Redirects: localhost:3003, example.com
   - Trusted: No (shows consent screen)

## 🎨 Next Steps

### Immediate (Backend Complete ✅)
- [x] All OAuth endpoints functional
- [x] Database setup
- [x] Token generation/verification
- [ ] Create consent screen UI
- [ ] Update login page to handle returnTo parameter
- [ ] Add rate limiting middleware

### Future Enhancements
- [ ] Email verification
- [ ] Password reset flow
- [ ] Two-factor authentication
- [ ] Admin panel for managing clients
- [ ] Audit logging
- [ ] Account management UI

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Can't reach database server
```
**Fix:** Check PostgreSQL is running, DATABASE_URL is correct

### JWT Errors
```
Error: Invalid key format
```
**Fix:** Ensure JWT keys are properly escaped with `\\n` in .env

### Prisma Client Not Generated
```
Error: @prisma/client did not initialize yet
```
**Fix:** Run `npx prisma generate`

### Seed Fails
```
Error: PrismaClient is unable to connect
```
**Fix:** Run `npx prisma migrate dev` first

## 📞 Support

- Documentation: See OAUTH_IMPLEMENTATION.md
- Database GUI: Run `npx prisma studio`
- Reset database: `npx prisma migrate reset`

## ✅ Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created with correct name
- [ ] JWT keys generated and added to .env
- [ ] DATABASE_URL configured in .env
- [ ] `npx prisma generate` completed
- [ ] `npx prisma migrate dev` completed
- [ ] `npx prisma db seed` completed
- [ ] `npm run dev` server running
- [ ] OpenID discovery endpoint accessible
- [ ] Test user login successful
- [ ] OAuth authorization flow works

---

**Status:** 🎉 OAuth 2.0 Server Ready for Testing  
**Time to Setup:** ~15-30 minutes  
**Next:** Create consent screen UI and integrate with frontend
