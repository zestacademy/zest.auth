/**
 * OAuth Callback Page - Next.js App Router
 * 
 * Copy this to: app/auth/callback/page.tsx
 * 
 * This page handles the OAuth callback from Zest Auth,
 * exchanges the authorization code for tokens, and redirects to the dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { handleCallback } from '@/lib/oauth'

export default function AuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const processCallback = async () => {
            const code = searchParams.get('code')
            const state = searchParams.get('state')
            const errorParam = searchParams.get('error')
            const errorDescription = searchParams.get('error_description')

            // Handle OAuth error
            if (errorParam) {
                setError(errorDescription || errorParam)
                setTimeout(() => router.push(`/login?error=${errorParam}`), 3000)
                return
            }

            // Validate parameters
            if (!code || !state) {
                setError('Missing required parameters')
                setTimeout(() => router.push('/login?error=missing_params'), 3000)
                return
            }

            try {
                // Exchange code for tokens and get user info
                const { tokens, user } = await handleCallback(code, state)

                // Send tokens to your backend API to create a session
                const response = await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token,
                        id_token: tokens.id_token,
                        user,
                    }),
                })

                if (!response.ok) {
                    throw new Error('Failed to create session')
                }

                // Redirect to dashboard
                router.push('/dashboard')
            } catch (err: any) {
                console.error('Callback error:', err)
                setError(err.message || 'Authentication failed')
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
