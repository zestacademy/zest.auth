# Integration Guide - Zest Auth

This guide explains how to integrate your application with Zest Auth for centralized authentication.

## Quick Start

### 1. Redirect to Zest Auth

When a user needs to authenticate, redirect them to Zest Auth with your callback URL:

```javascript
const callbackUrl = encodeURIComponent('https://yourapp.com/auth/callback')
window.location.href = `https://auth.zestacademy.tech/login?redirect=${callbackUrl}`
```

For new users (registration):
```javascript
const callbackUrl = encodeURIComponent('https://yourapp.com/auth/callback')
window.location.href = `https://auth.zestacademy.tech/register?redirect=${callbackUrl}`
```

### 2. Handle the Callback

Zest Auth will redirect users back to your specified URL with an ID token:

```
https://yourapp.com/auth/callback?token=<firebase_id_token>
```

### 3. Verify the Token

**IMPORTANT:** Always verify the token on your backend before creating a session.

#### Node.js / Express Example

```javascript
const admin = require('firebase-admin')

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'your-firebase-project-id'
})

// Auth callback endpoint
app.get('/auth/callback', async (req, res) => {
  const idToken = req.query.token
  
  if (!idToken) {
    return res.status(400).send('No token provided')
  }
  
  try {
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    
    // Extract user information
    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email,
      emailVerified: decodedToken.email_verified,
      picture: decodedToken.picture
    }
    
    // Create session (example using express-session)
    req.session.user = user
    
    // Redirect to your app's dashboard
    res.redirect('/dashboard')
  } catch (error) {
    console.error('Token verification failed:', error)
    res.status(401).send('Invalid authentication token')
  }
})
```

#### Python / Flask Example

```python
from firebase_admin import auth, credentials, initialize_app
from flask import Flask, request, redirect, session

# Initialize Firebase Admin SDK
cred = credentials.ApplicationDefault()
initialize_app(cred)

app = Flask(__name__)
app.secret_key = 'your-secret-key'

@app.route('/auth/callback')
def auth_callback():
    id_token = request.args.get('token')
    
    if not id_token:
        return 'No token provided', 400
    
    try:
        # Verify the token
        decoded_token = auth.verify_id_token(id_token)
        
        # Extract user information
        user = {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'name': decoded_token.get('name', decoded_token.get('email')),
            'email_verified': decoded_token.get('email_verified', False),
            'picture': decoded_token.get('picture')
        }
        
        # Create session
        session['user'] = user
        
        # Redirect to dashboard
        return redirect('/dashboard')
    except Exception as e:
        print(f'Token verification failed: {e}')
        return 'Invalid authentication token', 401
```

#### PHP Example

```php
<?php
require_once 'vendor/autoload.php';

use Kreait\Firebase\Factory;

// Initialize Firebase
$factory = (new Factory)->withServiceAccount('path/to/serviceAccount.json');
$auth = $factory->createAuth();

// Handle callback
if (isset($_GET['token'])) {
    $idToken = $_GET['token'];
    
    try {
        // Verify token
        $verifiedIdToken = $auth->verifyIdToken($idToken);
        
        // Get user data
        $uid = $verifiedIdToken->claims()->get('sub');
        $user = $auth->getUser($uid);
        
        // Store in session
        $_SESSION['user'] = [
            'uid' => $uid,
            'email' => $user->email,
            'name' => $user->displayName ?? $user->email,
            'emailVerified' => $user->emailVerified,
            'photoUrl' => $user->photoUrl
        ];
        
        // Redirect to dashboard
        header('Location: /dashboard');
        exit;
    } catch (Exception $e) {
        http_response_code(401);
        echo 'Invalid authentication token';
        exit;
    }
}
?>
```

## Frontend Integration

### React Example

```typescript
// src/hooks/useAuth.ts
import { useEffect } from 'react'
import { useRouter } from 'next/router'

const ZEST_AUTH_URL = process.env.NEXT_PUBLIC_ZEST_AUTH_URL || 'https://auth.zestacademy.tech'

export function useAuth() {
  const router = useRouter()
  
  const login = () => {
    const callbackUrl = encodeURIComponent(`${window.location.origin}/auth/callback`)
    window.location.href = `${ZEST_AUTH_URL}/login?redirect=${callbackUrl}`
  }
  
  const register = () => {
    const callbackUrl = encodeURIComponent(`${window.location.origin}/auth/callback`)
    window.location.href = `${ZEST_AUTH_URL}/register?redirect=${callbackUrl}`
  }
  
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }
  
  return { login, register, logout }
}

// pages/auth/callback.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AuthCallback() {
  const router = useRouter()
  
  useEffect(() => {
    const token = router.query.token as string
    
    if (token) {
      // Send token to your backend for verification
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            router.push('/dashboard')
          } else {
            router.push('/login?error=auth_failed')
          }
        })
        .catch(() => {
          router.push('/login?error=auth_failed')
        })
    }
  }, [router])
  
  return <div>Authenticating...</div>
}
```

### Vue.js Example

```vue
<!-- LoginButton.vue -->
<template>
  <button @click="handleLogin" class="btn-primary">
    Sign In with Zest Auth
  </button>
</template>

<script setup>
const ZEST_AUTH_URL = import.meta.env.VITE_ZEST_AUTH_URL || 'https://auth.zestacademy.tech'

function handleLogin() {
  const callbackUrl = encodeURIComponent(`${window.location.origin}/auth/callback`)
  window.location.href = `${ZEST_AUTH_URL}/login?redirect=${callbackUrl}`
}
</script>

<!-- AuthCallback.vue -->
<template>
  <div class="auth-callback">
    <p>Authenticating...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  
  if (token) {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push('/dashboard')
      } else {
        router.push('/login?error=auth_failed')
      }
    } catch (error) {
      router.push('/login?error=auth_failed')
    }
  }
})
</script>
```

## Security Best Practices

### 1. Always Verify Tokens Server-Side

Never trust tokens on the client side. Always verify them on your backend using Firebase Admin SDK.

### 2. Use HTTPS

Ensure your callback URLs use HTTPS in production to prevent token interception.

### 3. Whitelist Your Domains

Contact the Zest Auth administrator to whitelist your callback URLs. Unlisted domains will be rejected.

### 4. Token Expiration

Firebase ID tokens expire after 1 hour. Implement token refresh logic or require re-authentication.

```javascript
// Example refresh logic
app.use(async (req, res, next) => {
  if (req.session.user) {
    try {
      // Verify the user still exists
      await admin.auth().getUser(req.session.user.uid)
      next()
    } catch (error) {
      // Token expired or user deleted
      delete req.session.user
      res.redirect('/login')
    }
  } else {
    next()
  }
})
```

### 5. Session Security

- Use secure, httpOnly cookies
- Implement CSRF protection
- Set appropriate session timeouts
- Use session stores (Redis, MongoDB) for production

```javascript
// Express.js example
const session = require('express-session')
const RedisStore = require('connect-redis')(session)

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))
```

## Testing

### Local Testing

1. Run Zest Auth locally on port 3000
2. Add `http://localhost:YOUR_PORT/auth/callback` to allowed redirect URLs
3. Use the integration-example.html file as a reference

### Production Testing

1. Deploy your app
2. Request your production callback URLs to be whitelisted
3. Test the complete flow in your production environment

## Troubleshooting

### Token Verification Fails

- Ensure you're using the same Firebase project
- Check that Firebase Admin SDK is properly initialized
- Verify the token hasn't expired

### Redirect Not Working

- Check that your callback URL is whitelisted
- Ensure URL encoding is correct
- Verify HTTPS in production

### User Data Missing

- Some fields (name, picture) may be null if not provided during registration
- Always provide fallback values

## Support

For integration support:
- Email: dev-support@zestacademy.tech
- Documentation: https://docs.zestacademy.tech/auth
- GitHub Issues: https://github.com/zestacademy/zest.auth/issues

## Example Projects

Check out these complete integration examples:
- [Node.js + Express](https://github.com/zestacademy/zest-auth-node-example)
- [Next.js](https://github.com/zestacademy/zest-auth-nextjs-example)
- [Python + Flask](https://github.com/zestacademy/zest-auth-python-example)
