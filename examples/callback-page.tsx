/**
 * OAuth Callback Page - Next.js App Router
 * 
 * Copy this to: app/auth/callback/page.tsx in your client application
 * 
 * This page handles the OAuth callback from Zest Auth.
 * It verifies the state, retrieves the PKCE code_verifier, and sends to backend API
 * for token exchange.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(true)

    useEffect(() => {
        const processCallback = async () => {
            const code = searchParams.get('code')
            const state = searchParams.get('state')
            const errorParam = searchParams.get('error')
            const errorDescription = searchParams.get('error_description')

            // Handle OAuth error
            if (errorParam) {
                setError(errorDescription || errorParam)
                setIsProcessing(false)
                setTimeout(() => router.push(`/login?error=${errorParam}`), 3000)
                return
            }

            // Validate parameters
            if (!code || !state) {
                setError('Missing required parameters')
                setIsProcessing(false)
                setTimeout(() => router.push('/login?error=missing_params'), 3000)
                return
            }

            // Verify state (CSRF protection)
            const savedState = sessionStorage.getItem('oauth_state')
            if (state !== savedState) {
                setError('Invalid state parameter')
                setIsProcessing(false)
                setTimeout(() => router.push('/login?error=invalid_state'), 3000)
                return
            }

            // Get code_verifier from sessionStorage
            const codeVerifier = sessionStorage.getItem('pkce_code_verifier')
            if (!codeVerifier) {
                setError('Missing PKCE verifier')
                setIsProcessing(false)
                setTimeout(() => router.push('/login?error=missing_verifier'), 3000)
                return
            }

            try {
                // Send to backend API with code_verifier for token exchange
                const response = await fetch('/api/auth/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code,
                        state,
                        code_verifier: codeVerifier,
                    }),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Authentication failed')
                }

                // Clean up sessionStorage
                sessionStorage.removeItem('pkce_code_verifier')
                sessionStorage.removeItem('oauth_state')

                // Redirect to dashboard
                router.push('/dashboard')
            } catch (err: any) {
                console.error('Callback error:', err)
                setError(err.message || 'Authentication failed')
                setIsProcessing(false)
                setTimeout(() => router.push('/login?error=auth_failed'), 3000)
            }
        }

        processCallback()
    }, [router, searchParams])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                {error ? (
                    <>
                        <div className="mb-4 text-red-600">
                            <svg
                                className="mx-auto h-12 w-12"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <p className="text-sm text-gray-500">Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        <div className="mb-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Completing authentication...</h2>
                        <p className="text-gray-600">Please wait while we sign you in</p>
                    </>
                )}
            </div>
        </div>
    )
}
