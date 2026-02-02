# Zest Auth - Centralized Authentication Service

A secure, centralized authentication service for Zest Academy applications built with Next.js and Firebase Auth.

## Overview

Zest Auth provides SSO (Single Sign-On) functionality for all Zest Academy services. Users authenticate once and can access all connected applications seamlessly.

## Features

- 🔐 **Secure Authentication** - Firebase Auth with industry-standard security
- 🚀 **Fast Redirects** - Seamless redirect back to originating applications
- 🎨 **Modern UI** - Premium dark-themed interface
- 📧 **Email/Password** - Traditional sign-up and login
- 🔑 **OAuth Support** - Google sign-in integration
- 🔄 **Password Recovery** - Forgot password flow
- ✅ **Email Verification** - Account verification via email

## How It Works

### For Application Developers

1. **Redirect to Zest Auth**
   ```javascript
   const redirectUrl = encodeURIComponent('https://yourapp.com/auth/callback')
   window.location.href = `https://auth.zestacademy.tech/login?redirect=${redirectUrl}`
   ```

2. **Handle the Callback**
   After successful authentication, users are redirected back to your specified URL with an ID token:
   ```
   https://yourapp.com/auth/callback?token=<firebase_id_token>
   ```

3. **Verify the Token**
   ```javascript
   // On your backend
   const admin = require('firebase-admin')
   
   async function verifyAuth(idToken) {
     try {
       const decodedToken = await admin.auth().verifyIdToken(idToken)
       const uid = decodedToken.uid
       // User is authenticated
       return decodedToken
     } catch (error) {
       // Invalid token
       throw error
     }
   }
   ```

### Allowed Redirect URLs

For security, only whitelisted URLs can receive authentication callbacks. Configure allowed URLs in your `.env` file:

```env
NEXT_PUBLIC_ALLOWED_REDIRECT_URLS=http://localhost:3001,https://zestacademy.tech,https://www.zestacademy.tech
```

## Setup

### Prerequisites

- Node.js 18 or higher
- Firebase project with Authentication enabled
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zestacademy/zest.auth.git
   cd zest.auth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and fill in your Firebase credentials:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
   
   # Comma-separated list of allowed redirect URLs
   NEXT_PUBLIC_ALLOWED_REDIRECT_URLS=http://localhost:3001,https://yourapp.com
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Examples

### Sign Up Flow

```
User clicks "Sign Up" on your app
→ Redirect to: https://auth.zestacademy.tech/register?redirect=https://yourapp.com/callback
→ User creates account
→ Redirect back to: https://yourapp.com/callback?token=<id_token>
→ Your app verifies token and creates session
```

### Sign In Flow

```
User clicks "Sign In" on your app
→ Redirect to: https://auth.zestacademy.tech/login?redirect=https://yourapp.com/callback
→ User enters credentials
→ Redirect back to: https://yourapp.com/callback?token=<id_token>
→ Your app verifies token and creates session
```

### Forgot Password Flow

```
User clicks "Forgot Password"
→ Redirect to: https://auth.zestacademy.tech/forgot-password?redirect=https://yourapp.com/callback
→ User enters email
→ Receives password reset email
→ Clicks link in email
→ Sets new password
→ Returns to login page with redirect preserved
```

## Security

### Token Validation

Always validate Firebase ID tokens on your backend:

```javascript
// Node.js example
const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'your-project-id'
})

app.get('/auth/callback', async (req, res) => {
  const idToken = req.query.token
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    }
    
    // Create your session here
    req.session.user = user
    res.redirect('/dashboard')
  } catch (error) {
    res.status(401).send('Unauthorized')
  }
})
```

### CORS and Redirect Validation

- Only domains listed in `NEXT_PUBLIC_ALLOWED_REDIRECT_URLS` can receive callbacks
- URL validation happens both client-side and server-side
- Malicious redirect attempts are blocked

## API Reference

### URL Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `redirect` | string | URL to redirect after auth | `https://yourapp.com/callback` |
| `returnUrl` | string | Alternative param name | Same as redirect |
| `token` | string | Firebase ID token (in callback) | Auto-generated |

### Redirect URL Format

Callbacks include the ID token as a query parameter:
```
{your_redirect_url}?token={firebase_id_token}
```

## Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

### Environment Variables for Production

Ensure these are set in your deployment platform:
- All `NEXT_PUBLIC_FIREBASE_*` variables
- `NEXT_PUBLIC_ALLOWED_REDIRECT_URLS` with production domains

## Tech Stack

- **Framework**: Next.js 16
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Language**: TypeScript

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: https://github.com/zestacademy/zest.auth/issues
- Email: support@zestacademy.tech

---

Built with ❤️ by Zest Academy
