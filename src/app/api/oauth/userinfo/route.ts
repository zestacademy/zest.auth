/**
 * OAuth 2.0 UserInfo Endpoint
 * GET /api/oauth/userinfo
 * 
 * Returns user information based on access token
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/oauth'

export async function GET(request: Request) {
    try {
        // Get access token from Authorization header
        const authHeader = request.headers.get('Authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'invalid_token', error_description: 'Missing or invalid Authorization header' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7) // Remove "Bearer " prefix

        // Verify access token
        let payload
        try {
            payload = await verifyAccessToken(token)
        } catch (error) {
            return NextResponse.json(
                { error: 'invalid_token', error_description: 'Invalid or expired access token' },
                { status: 401 }
            )
        }

        const userId = payload.sub as string

        // Get user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                emailVerified: true,
                name: true,
                picture: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'invalid_token', error_description: 'User not found' },
                { status: 404 }
            )
        }

        // Return user info based on granted scope
        const scope = (payload.scope as string || '').split(' ')

        const userInfo: any = {
            sub: user.id
        }

        if (scope.includes('email')) {
            userInfo.email = user.email
            userInfo.email_verified = user.emailVerified
        }

        if (scope.includes('profile')) {
            if (user.name) userInfo.name = user.name
            if (user.picture) userInfo.picture = user.picture
        }

        return NextResponse.json(userInfo)
    } catch (error) {
        console.error('UserInfo error:', error)
        return NextResponse.json(
            { error: 'server_error', error_description: 'Internal server error' },
            { status: 500 }
        )
    }
}
