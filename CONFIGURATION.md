# Configuration Guide

## Environment Variables

All configuration is done through environment variables. Copy `.env.example` to `.env` and update the values.

### Required Variables

#### Firebase Configuration

Get these from your Firebase Console (Project Settings → Your Apps → Web App):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

#### Allowed Redirect URLs

**Important:** Only URLs listed here can receive authentication callbacks. This is a security feature to prevent unauthorized redirects.

```env
NEXT_PUBLIC_ALLOWED_REDIRECT_URLS=http://localhost:3001,https://zestacademy.tech,https://www.zestacademy.tech
```

Format:
- Comma-separated list of URLs
- Include protocol (http:// or https://)
- No trailing slashes
- Include all subdomains explicitly

## Adding New Applications

To allow a new application to use Zest Auth:

### 1. Development Environment

Add the local development URL:
```env
NEXT_PUBLIC_ALLOWED_REDIRECT_URLS=http://localhost:3001,http://localhost:3002,https://zestacademy.tech
```

### 2. Production Environment

Add the production domain:
```env
NEXT_PUBLIC_ALLOWED_REDIRECT_URLS=http://localhost:3001,https://zestacademy.tech,https://newapp.zestacademy.tech
```

### 3. Multiple Environments

Example with dev, staging, and production:
```env
NEXT_PUBLIC_ALLOWED_REDIRECT_URLS=http://localhost:3001,http://localhost:3002,https://staging.zestacademy.tech,https://zestacademy.tech,https://www.zestacademy.tech,https://app.zestacademy.tech
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Follow the setup wizard

### 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable sign-in methods:
   - Email/Password ✅
   - Google ✅
   - (Optional) Other providers

### 3. Configure Authorized Domains

**Important:** Add all domains that will integrate with Zest Auth:

1. Go to Authentication → Settings → Authorized domains
2. Add:
   - `localhost` (for development)
   - `your-zest-auth-domain.com` (where Zest Auth is hosted)
   - All domains that will integrate (e.g., `zestacademy.tech`)

Example:
```
localhost
auth.zestacademy.tech
zestacademy.tech
www.zestacademy.tech
app.zestacademy.tech
```

### 4. Get Web App Credentials

1. Go to Project Settings → General
2. Scroll to "Your apps"
3. Click the Web icon (</>) to create a web app
4. Copy the config values to your `.env` file

## Security Configuration

### Email Verification

To require email verification:

1. Go to Authentication → Settings
2. Under "User account management":
   - Enable "Email enumeration protection" ✅
   - Configure email templates

### Password Requirements

1. Go to Authentication → Sign-in method
2. Click Email/Password → Edit
3. Configure:
   - Password length: Minimum 8 characters
   - Require uppercase, lowercase, numbers, special characters

### Token Expiration

Firebase ID tokens expire after 1 hour by default. This is not configurable but is a security best practice.

## Deployment Configuration

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# ... add all other env variables
```

Or use the Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env`
3. Select appropriate environments (Production, Preview, Development)

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables
netlify env:set NEXT_PUBLIC_FIREBASE_API_KEY your_value
# ... add all other env variables
```

Or use  Netlify dashboard:
1. Go to Site Settings → Environment Variables
2. Add all variables from `.env`

### Docker

Create a `.env.production` file (DO NOT commit to git):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=prod_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=auth.zestacademy.tech
# ... other production values
```

Then build and run:

```bash
# Build
docker build -t zest-auth .

# Run
docker run -p 3000:3000 --env-file .env.production zest-auth
```

## Environment-Specific Configuration

### Development (.env.local)

```env
NEXT_PUBLIC_ALLOWED_REDIRECT_URLS=http://localhost:3001,http://localhost:3002,http://localhost:8000
```

### Staging (.env.staging)

```env
NEXT_PUBLIC_ALLOWED_REDIRECT_URLS=https://staging-auth.zestacademy.tech,https://staging.zestacademy.tech
```

### Production (.env.production)

```env
NEXT_PUBLIC_ALLOWED_REDIRECT_URLS=https://zestacademy.tech,https://www.zestacademy.tech,https://app.zestacademy.tech
```

## Monitoring

### Firebase Console

Monitor authentication activity:
1. Go to Authentication → Users
2. View sign-ups, sign-ins, and active users

### Custom Analytics

Add analytics to track:
- Successful authentications
- Failed login attempts
- User registrations
- Password reset requests

Example with Google Analytics:

```javascript
// In your auth callback
gtag('event', 'login', {
  method: 'Zest Auth'
})
```

## Troubleshooting

### "Unauthorized domain" error

**Solution:** Add the domain to Firebase Console → Authentication → Settings → Authorized domains

### "Invalid redirect URL" error

**Solution:** Add the URL to `NEXT_PUBLIC_ALLOWED_REDIRECT_URLS` in `.env`

### CORS errors

**Solution:** Ensure all domains are added to Firebase authorized domains

### Environment variables not working

**Solution:** 
- Restart the dev server after changing `.env`
- In Next.js, only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Rebuild your production app after changing variables

## Best Practices

1. **Never commit `.env` files** to version control
2. **Use different Firebase projects** for dev/staging/production
3. **Rotate secrets regularly** in production
4. **Monitor authentication logs** for suspicious activity
5. **Keep allowed URLs minimal** - only add what you need
6. **Use environment-specific configs** - don't mix dev and prod URLs

## Support

For configuration help:
- Email: devops@zestacademy.tech
- Slack: #zest-auth-support
- Documentation: https://docs.zestacademy.tech/auth/config
