/**
 * User Login API
 * POST /api/auth/login
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
})

const SESSION_SECRET = new TextEncoder().encode(
    process.env.SESSION_SECRET || 'default-session-secret-change-in-production'
)

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input
        const validation = loginSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { email, password } = validation.data

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Verify password
        const isValidPassword = await verifyPassword(user.passwordHash, password)

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Create session token
        const sessionToken = await new SignJWT({
            userId: user.id,
            email: user.email
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(SESSION_SECRET)

        // Set session cookie
        const cookieStore = await cookies()
        cookieStore.set('session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        })

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                emailVerified: user.emailVerified
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
