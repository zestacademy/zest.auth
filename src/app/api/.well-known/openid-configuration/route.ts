/**
 * OpenID Connect Discovery Document
 * GET /.well-known/openid-configuration
 */

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const config = {
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
        token_endpoint: `${baseUrl}/api/oauth/token`,
        userinfo_endpoint: `${baseUrl}/api/oauth/userinfo`,
        jwks_uri: `${baseUrl}/api/.well-known/jwks.json`,
        revocation_endpoint: `${baseUrl}/api/oauth/revoke`,

        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],

        scopes_supported: ['openid', 'email', 'profile'],

        token_endpoint_auth_methods_supported: [
            'client_secret_post',
            'client_secret_basic'
        ],

        code_challenge_methods_supported: ['S256'],

        claims_supported: [
            'sub',
            'iss',
            'aud',
            'exp',
            'iat',
            'email',
            'email_verified',
            'name',
            'picture'
        ]
    }

    return NextResponse.json(config, {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
        }
    })
}
