/**
 * Login Button Component
 * 
 * Simple component that initiates the OAuth login flow
 * 
 * Usage:
 *   import { LoginButton } from '@/components/LoginButton'
 *   <LoginButton />
 */

'use client'

import { initiateLogin } from '@/lib/oauth'

export function LoginButton() {
    const handleLogin = async () => {
        try {
            await initiateLogin()
        } catch (error) {
            console.error('Login failed:', error)
            alert('Failed to initiate login. Please try again.')
        }
    }

    return (
        <button
            onClick={handleLogin}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
            Sign in with Zest Account
        </button>
    )
}

/**
 * Alternative: Button with Icon
 */
export function LoginButtonWithIcon() {
    const handleLogin = async () => {
        try {
            await initiateLogin()
        } catch (error) {
            console.error('Login failed:', error)
            alert('Failed to initiate login. Please try again.')
        }
    }

    return (
        <button
            onClick={handleLogin}
            className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign in with Zest Account
        </button>
    )
}

/**
 * Logout Component
 */
export function LogoutButton() {
    const handleLogout = async () => {
        try {
            // Call your logout API
            await fetch('/api/auth/session', { method: 'DELETE' })

            // Redirect to home
            window.location.href = '/'
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
            Sign out
        </button>
    )
}
