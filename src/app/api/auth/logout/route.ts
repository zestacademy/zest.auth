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

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        })
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
