/**
 * OAuth 2.0 Token Revocation Endpoint
 * POST /api/oauth/revoke
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { revokeAccessToken, revokeRefreshToken } from '@/lib/oauth'

export async function POST(request: Request) {
    try {
        const body = await request.formData()

        const token = body.get('token') as string
        const token_type_hint = body.get('token_type_hint') as string | undefined
        const client_id = body.get('client_id') as string
        const client_secret = body.get('client_secret') as string

        if (!token) {
            return NextResponse.json(
                { error: 'invalid_request', error_description: 'token is required' },
                { status: 400 }
            )
        }

        // Verify client credentials (optional but recommended)
        if (client_id && client_secret) {
            const client = await prisma.oAuthClient.findUnique({
                where: { clientId: client_id }
            })

            if (!client || !(await verifyPassword(client.clientSecret, client_secret))) {
                return NextResponse.json(
                    { error: 'invalid_client' },
                    { status: 401 }
                )
            }
        }

        // Try to revoke based on hint or try both
        try {
            if (token_type_hint === 'access_token') {
                await revokeAccessToken(token)
            } else if (token_type_hint === 'refresh_token') {
                await revokeRefreshToken(token)
            } else {
                // Try refresh token first (more common)
                try {
                    await revokeRefreshToken(token)
                } catch {
                    // If not a refresh token, try as access token JTI
                    await revokeAccessToken(token)
                }
            }
        } catch (error) {
            // Token doesn't exist or already revoked
            // RFC 7009: The endpoint should ignore invalid tokens
        }

        // Always return 200 OK (per RFC 7009)
        return new NextResponse(null, { status: 200 })
    } catch (error) {
        console.error('Revocation error:', error)
        return new NextResponse(null, { status: 200 })
    }
}
