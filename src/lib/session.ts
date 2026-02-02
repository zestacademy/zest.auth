/**
 * Session management utilities
 */

import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const SESSION_SECRET = new TextEncoder().encode(
    process.env.SESSION_SECRET || 'default-session-secret-change-in-production'
)

export interface SessionUser {
    userId: string
    email: string
}

/**
 * Get current logged-in user from session
 */
export async function getCurrentUser() {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('session')?.value

        if (!sessionToken) {
            return null
        }

        // Verify session token
        const { payload } = await jwtVerify(sessionToken, SESSION_SECRET, {
            algorithms: ['HS256']
        })

        const userId = payload.userId as string

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                emailVerified: true,
                picture: true
            }
        })

        return user
    } catch (error) {
        return null
    }
}

/**
 * Require authentication - throws if not logged in
 */
export async function requireAuth() {
    const user = await getCurrentUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    return user
}

/**
 * Clear session cookie
 */
export async function clearSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}
