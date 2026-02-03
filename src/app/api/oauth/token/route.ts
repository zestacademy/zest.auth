/**
 * OAuth 2.0 Token Endpoint
 * POST /api/oauth/token
 * 
 * Exchanges authorization code for access tokens
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import {
    verifyAuthorizationCode,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken
} from '@/lib/oauth'

export async function POST(request: Request) {
    try {
        const body = await request.formData()

        const grant_type = body.get('grant_type') as string
        const client_id = body.get('client_id') as string
        const client_secret = body.get('client_secret') as string

        // Validate client credentials
        if (!client_id || !client_secret) {
            return NextResponse.json(
                {
                    error: 'invalid_client',
                    error_description: 'Client authentication failed'
                },
                { status: 401 }
            )
        }

        const client = await prisma.oAuthClient.findUnique({
            where: { clientId: client_id }
        })

        if (!client) {
            return NextResponse.json(
                {
                    error: 'invalid_client',
                    error_description: 'Client not found'
                },
                { status: 401 }
            )
        }

        // Verify client secret
        const isValidSecret = await verifyPassword(client.clientSecret, client_secret)
        if (!isValidSecret) {
            return NextResponse.json(
                {
                    error: 'invalid_client',
                    error_description: 'Invalid client credentials'
                },
                { status: 401 }
            )
        }

        // Handle different grant types
        if (grant_type === 'authorization_code') {
            return await handleAuthorizationCodeGrant(body, client)
        } else if (grant_type === 'refresh_token') {
            return await handleRefreshTokenGrant(body, client)
        } else {
            return NextResponse.json(
                {
                    error: 'unsupported_grant_type',
                    error_description: `Grant type "${grant_type}" is not supported`
                },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Token endpoint error:', error)
        return NextResponse.json(
            {
                error: 'server_error',
                error_description: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

/**
 * Handle authorization_code grant type
 */
async function handleAuthorizationCodeGrant(
    body: FormData,
    client: any
) {
    const code = body.get('code') as string
    const redirect_uri = body.get('redirect_uri') as string
    const code_verifier = body.get('code_verifier') as string | undefined

    if (!code || !redirect_uri) {
        return NextResponse.json(
            {
                error: 'invalid_request',
                error_description: 'code and redirect_uri are required'
            },
            { status: 400 }
        )
    }

    try {
        // Verify and consume authorization code
        const authCode = await verifyAuthorizationCode(
            code,
            client.id,
            redirect_uri,
            code_verifier
        )

        // Generate tokens
        const accessToken = await generateAccessToken(
            authCode.userId,
            client.id,
            authCode.scope
        )

        const refreshToken = await generateRefreshToken(
            authCode.userId,
            client.id,
            authCode.scope
        )

        // Get user info for ID token
        const user = await prisma.user.findUnique({
            where: { id: authCode.userId },
            select: {
                id: true,
                email: true,
                name: true,
                emailVerified: true,
                picture: true
            }
        })

        // Create ID token (OpenID Connect)
        const idToken = accessToken // For simplicity, using same as access token
        // In production, you'd create a separate ID token with different claims

        return NextResponse.json({
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: parseInt(process.env.OAUTH_ACCESS_TOKEN_TTL || '3600'),
            refresh_token: refreshToken,
            id_token: idToken,
            scope: authCode.scope
        })
    } catch (error: any) {
        return NextResponse.json(
            {
                error: 'invalid_grant',
                error_description: error.message || 'Invalid authorization code'
            },
            { status: 400 }
        )
    }
}

/**
 * Handle refresh_token grant type
 */
async function handleRefreshTokenGrant(
    body: FormData,
    client: any
) {
    const refresh_token = body.get('refresh_token') as string

    if (!refresh_token) {
        return NextResponse.json(
            {
                error: 'invalid_request',
                error_description: 'refresh_token is required'
            },
            { status: 400 }
        )
    }

    try {
        // Verify refresh token
        const refreshTokenData = await verifyRefreshToken(refresh_token)

        if (refreshTokenData.clientId !== client.id) {
            return NextResponse.json(
                {
                    error: 'invalid_grant',
                    error_description: 'Refresh token was issued to a different client'
                },
                { status: 400 }
            )
        }

        // Revoke old refresh token (token rotation)
        await revokeRefreshToken(refresh_token)

        // Generate new tokens
        const accessToken = await generateAccessToken(
            refreshTokenData.userId,
            client.id,
            refreshTokenData.scope
        )

        const newRefreshToken = await generateRefreshToken(
            refreshTokenData.userId,
            client.id,
            refreshTokenData.scope
        )

        return NextResponse.json({
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: parseInt(process.env.OAUTH_ACCESS_TOKEN_TTL || '3600'),
            refresh_token: newRefreshToken,
            scope: refreshTokenData.scope
        })
    } catch (error: any) {
        return NextResponse.json(
            {
                error: 'invalid_grant',
                error_description: error.message || 'Invalid refresh token'
            },
            { status: 400 }
        )
    }
}
