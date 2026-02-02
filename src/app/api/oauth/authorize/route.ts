/**
 * OAuth 2.0 Authorization Endpoint
 * GET /api/oauth/authorize
 * 
 * Initiates the OAuth authorization flow
 */

import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import {
    validateRedirectUri,
    validateScope,
    hasUserConsent,
    generateAuthorizationCode
} from '@/lib/oauth'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        // Extract OAuth parameters
        const response_type = searchParams.get('response_type')
        const client_id = searchParams.get('client_id')
        const redirect_uri = searchParams.get('redirect_uri')
        const scope = searchParams.get('scope') || 'openid'
        const state = searchParams.get('state')
        const code_challenge = searchParams.get('code_challenge')
        const code_challenge_method = searchParams.get('code_challenge_method')

        // Validate required parameters
        if (!response_type || response_type !== 'code') {
            return NextResponse.json(
                { error: 'invalid_request', error_description: 'response_type must be "code"' },
                { status: 400 }
            )
        }

        if (!client_id) {
            return NextResponse.json(
                { error: 'invalid_request', error_description: 'client_id is required' },
                { status: 400 }
            )
        }

        if (!redirect_uri) {
            return NextResponse.json(
                { error: 'invalid_request', error_description: 'redirect_uri is required' },
                { status: 400 }
            )
        }

        // Get OAuth client
        const client = await prisma.oAuthClient.findUnique({
            where: { clientId: client_id }
        })

        if (!client) {
            return NextResponse.json(
                { error: 'invalid_client', error_description: 'Client not found' },
                { status: 401 }
            )
        }

        // Validate redirect URI
        if (!validateRedirectUri(client.redirectUris, redirect_uri)) {
            return NextResponse.json(
                {
                    error: 'invalid_request',
                    error_description: 'redirect_uri is not registered for this client'
                },
                { status: 400 }
            )
        }

        // Validate scope
        if (!validateScope(client.allowedScopes, scope)) {
            const errorUrl = new URL(redirect_uri)
            errorUrl.searchParams.set('error', 'invalid_scope')
            errorUrl.searchParams.set('error_description', 'Requested scope is not allowed')
            if (state) errorUrl.searchParams.set('state', state)
            return redirect(errorUrl.toString())
        }

        // Check if user is logged in
        const user = await getCurrentUser()

        if (!user) {
            // Redirect to login with return URL
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('returnTo', request.url)
            return redirect(loginUrl.toString())
        }

        // Check if user has already given consent
        const hasConsent = await hasUserConsent(user.id, client.id, scope)

        // Skip consent for trusted clients or if already consented
        if (!client.trusted && !hasConsent) {
            // Redirect to consent screen
            const consentUrl = new URL('/consent', request.url)
            consentUrl.searchParams.set('client_id', client_id)
            consentUrl.searchParams.set('redirect_uri', redirect_uri)
            consentUrl.searchParams.set('scope', scope)
            if (state) consentUrl.searchParams.set('state', state)
            if (code_challenge) consentUrl.searchParams.set('code_challenge', code_challenge)
            if (code_challenge_method) consentUrl.searchParams.set('code_challenge_method', code_challenge_method)
            return redirect(consentUrl.toString())
        }

        // Generate authorization code
        const code = await generateAuthorizationCode(
            user.id,
            client.id,
            redirect_uri,
            scope,
            code_challenge || undefined,
            code_challenge_method || undefined
        )

        // Redirect back to client with authorization code
        const callbackUrl = new URL(redirect_uri)
        callbackUrl.searchParams.set('code', code)
        if (state) callbackUrl.searchParams.set('state', state)

        return redirect(callbackUrl.toString())
    } catch (error) {
        console.error('Authorization error:', error)
        return NextResponse.json(
            { error: 'server_error', error_description: 'Internal server error' },
            { status: 500 }
        )
    }
}
