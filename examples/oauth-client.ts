/**
 * OAuth 2.0 Client Helper for Zest Auth
 * 
 * Copy this file to your client application:
 * - lib/oauth.ts (Next.js)
 * - utils/oauth.ts (React/Vue)
 * 
 * Usage:
 *   import { initiateLogin, handleCallback } from '@/lib/oauth'
 */

import pkceChallenge from 'pkce-challenge'

// Environment variables - configure these in your .env.local
const AUTH_SERVER_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.zestacademy.tech'
const CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID // e.g., 'zest_academy'
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI // e.g., 'https://zestacademy.tech/auth/callback'

/**
 * Generate PKCE challenge and redirect to authorization endpoint
 * Call this when user clicks "Login" button
 */
export async function initiateLogin() {
    try {
        // Generate PKCE challenge
        const challenge = await pkceChallenge()

        // Store code_verifier in sessionStorage (needed for token exchange)
        sessionStorage.setItem('pkce_code_verifier', challenge.code_verifier)

        // Generate random state for CSRF protection
        const state = generateRandomString(32)
        sessionStorage.setItem('oauth_state', state)

        // Build authorization URL
        const authUrl = new URL(`${AUTH_SERVER_URL}/api/oauth/authorize`)
        authUrl.searchParams.set('client_id', CLIENT_ID)
        authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('scope', 'openid profile email')
        authUrl.searchParams.set('state', state)
        authUrl.searchParams.set('code_challenge', challenge.code_challenge)
        authUrl.searchParams.set('code_challenge_method', 'S256')

        // Redirect to auth server
        window.location.href = authUrl.toString()
    } catch (error) {
        console.error('Failed to initiate login:', error)
        throw error
    }
}

/**
 * Handle OAuth callback and exchange code for tokens
 * Call this from your /auth/callback page
 * 
 * @param code - Authorization code from URL params
 * @param state - State parameter from URL params
 * @returns Tokens and user info
 */
export async function handleCallback(code: string, state: string) {
    // Verify state parameter (CSRF protection)
    const savedState = sessionStorage.getItem('oauth_state')
    if (state !== savedState) {
        throw new Error('Invalid state parameter - possible CSRF attack')
    }

    // Get code_verifier
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier')
    if (!codeVerifier) {
        throw new Error('Missing PKCE code verifier')
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`${AUTH_SERVER_URL}/api/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
        }),
    })

    if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`)
    }

    const tokens = await tokenResponse.json()

    // Get user info using access token
    const userInfoResponse = await fetch(`${AUTH_SERVER_URL}/api/oauth/userinfo`, {
        headers: {
            Authorization: `Bearer ${tokens.access_token}`,
        },
    })

    if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info')
    }

    const user = await userInfoResponse.json()

    // Clean up session storage
    sessionStorage.removeItem('pkce_code_verifier')
    sessionStorage.removeItem('oauth_state')

    return {
        tokens,
        user,
    }
}

/**
 * Refresh the access token using a refresh token
 * 
 * @param refreshToken - The refresh token
 * @returns New tokens
 */
export async function refreshAccessToken(refreshToken: string) {
    const response = await fetch(`${AUTH_SERVER_URL}/api/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: CLIENT_ID,
        }),
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`)
    }

    return response.json()
}

/**
 * Revoke a token (logout)
 * 
 * @param token - The token to revoke (access or refresh token)
 * @param tokenType - Type hint: 'access_token' or 'refresh_token'
 */
export async function revokeToken(token: string, tokenType: 'access_token' | 'refresh_token' = 'refresh_token') {
    const response = await fetch(`${AUTH_SERVER_URL}/api/oauth/revoke`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token,
            token_type_hint: tokenType,
        }),
    })

    if (!response.ok) {
        console.error('Token revocation failed')
    }
}

/**
 * Generate a random string (for state parameter)
 */
function generateRandomString(length: number): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}
