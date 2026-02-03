/**
 * User Logout API
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server'
import { getCurrentUser, clearSession } from '@/lib/session'
import { revokeAllUserTokens } from '@/lib/oauth'

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (user) {
            // Revoke all OAuth tokens for this user
            await revokeAllUserTokens(user.id)
        }

        // Clear session cookie
        await clearSession()

        const { searchParams } = new URL(request.url)
        const returnTo = searchParams.get('returnTo') || '/'

        return NextResponse.redirect(new URL(returnTo, request.url))
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
