/**
 * Session API Route - Next.js App Router
 * 
 * Copy this to: app/api/auth/session/route.ts
 * 
 * This API route creates a session by storing tokens in httpOnly cookies
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { access_token, refresh_token, id_token, user } = body

        if (!access_token || !user) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Create response
        const response = NextResponse.json({ success: true })

        // Store access token in httpOnly cookie (expires in 1 hour)
        response.cookies.set('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60, // 1 hour
            path: '/',
        })

        // Store refresh token if provided (expires in 30 days)
        if (refresh_token) {
            response.cookies.set('refresh_token', refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60, // 30 days
                path: '/',
            })
        }

        // Store ID token if provided
        if (id_token) {
            response.cookies.set('id_token', id_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60, // 1 hour
                path: '/',
            })
        }

        // Store user info (not sensitive - can be accessed by client)
        response.cookies.set('user', JSON.stringify(user), {
            httpOnly: false, // Allow client to read this
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60, // 1 hour
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Session creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        )
    }
}

/**
 * Logout - clear all cookies
 */
export async function DELETE(request: NextRequest) {
    const response = NextResponse.json({ success: true })

    // Clear all auth cookies
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    response.cookies.delete('id_token')
    response.cookies.delete('user')

    return response
}
