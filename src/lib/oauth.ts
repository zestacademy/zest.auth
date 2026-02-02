/**
 * OAuth 2.0 + OpenID Connect Server Implementation
 * Core utilities for JWT, tokens, and authorization codes
 */

import { SignJWT, jwtVerify } from 'jose'
import { nanoid } from 'nanoid'
import { prisma } from './prisma'

const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') || ''
const JWT_ISSUER = process.env.JWT_ISSUER || 'https://auth.zestacademy.tech'

const AUTHORIZATION_CODE_TTL = parseInt(process.env.OAUTH_AUTHORIZATION_CODE_TTL || '600')
const ACCESS_TOKEN_TTL = parseInt(process.env.OAUTH_ACCESS_TOKEN_TTL || '3600')
const REFRESH_TOKEN_TTL = parseInt(process.env.OAUTH_REFRESH_TOKEN_TTL || '2592000')

/**
 * Get RSA private key for signing JWTs
 */
async function getPrivateKey() {
    const key = await crypto.subtle.importKey(
        'pkcs8',
        Buffer.from(JWT_PRIVATE_KEY),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        true,
        ['sign']
    )
    return key
}

/**
 * Get RSA public key for verifying JWTs
 */
async function getPublicKey() {
    const pemContents = JWT_PUBLIC_KEY
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s/g, '')

    const binaryDer = Buffer.from(pemContents, 'base64')

    const key = await crypto.subtle.importKey(
        'spki',
        binaryDer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        true,
        ['verify']
    )
    return key
}

/**
 * Generate JWT Access Token
 */
export async function generateAccessToken(
    userId: string,
    clientId: string,
    scope: string
): Promise<string> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, emailVerified: true }
    })

    if (!user) throw new Error('User not found')

    const jti = nanoid()
    const now = Math.floor(Date.now() / 1000)
    const exp = now + ACCESS_TOKEN_TTL

    const token = await new SignJWT({
        sub: userId,
        email: user.email,
        name: user.name,
        email_verified: user.emailVerified,
        scope: scope
    })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuedAt(now)
        .setExpirationTime(exp)
        .setIssuer(JWT_ISSUER)
        .setAudience(clientId)
        .setJti(jti)
        .sign(new TextEncoder().encode(JWT_PRIVATE_KEY))

    // Store token in database
    await prisma.accessToken.create({
        data: {
            token: jti,
            userId,
            clientId,
            scope,
            expiresAt: new Date(exp * 1000)
        }
    })

    return token
}

/**
 * Generate Refresh Token
 */
export async function generateRefreshToken(
    userId: string,
    clientId: string,
    scope: string
): Promise<string> {
    const token = nanoid(64)
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000)

    await prisma.refreshToken.create({
        data: {
            token,
            userId,
            clientId,
            scope,
            expiresAt
        }
    })

    return token
}

/**
 * Generate Authorization Code
 */
export async function generateAuthorizationCode(
    userId: string,
    clientId: string,
    redirectUri: string,
    scope: string,
    codeChallenge?: string,
    codeChallengeMethod?: string
): Promise<string> {
    const code = nanoid(32)
    const expiresAt = new Date(Date.now() + AUTHORIZATION_CODE_TTL * 1000)

    await prisma.authorizationCode.create({
        data: {
            code,
            userId,
            clientId,
            redirectUri,
            scope,
            codeChallenge,
            codeChallengeMethod,
            expiresAt
        }
    })

    return code
}

/**
 * Verify and consume authorization code
 */
export async function verifyAuthorizationCode(
    code: string,
    clientId: string,
    redirectUri: string,
    codeVerifier?: string
) {
    const authCode = await prisma.authorizationCode.findUnique({
        where: { code },
        include: { user: true, client: true }
    })

    if (!authCode) {
        throw new Error('Invalid authorization code')
    }

    if (authCode.used) {
        throw new Error('Authorization code already used')
    }

    if (authCode.expiresAt < new Date()) {
        throw new Error('Authorization code expired')
    }

    if (authCode.clientId !== clientId) {
        throw new Error('Client ID mismatch')
    }

    if (authCode.redirectUri !== redirectUri) {
        throw new Error('Redirect URI mismatch')
    }

    // PKCE validation
    if (authCode.codeChallenge) {
        if (!codeVerifier) {
            throw new Error('Code verifier required for PKCE')
        }
        // TODO: Implement PKCE challenge verification
    }

    // Mark code as used
    await prisma.authorizationCode.update({
        where: { code },
        data: { used: true }
    })

    return authCode
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string) {
    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_PUBLIC_KEY),
            {
                issuer: JWT_ISSUER,
                algorithms: ['RS256']
            }
        )

        // Check if token is revoked
        const storedToken = await prisma.accessToken.findUnique({
            where: { token: payload.jti as string }
        })

        if (!storedToken || storedToken.revoked) {
            throw new Error('Token revoked')
        }

        return payload
    } catch (error) {
        throw new Error('Invalid or expired token')
    }
}

/**
 * Verify and use refresh token
 */
export async function verifyRefreshToken(token: string) {
    const refreshToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
    })

    if (!refreshToken) {
        throw new Error('Invalid refresh token')
    }

    if (refreshToken.revoked) {
        throw new Error('Refresh token revoked')
    }

    if (refreshToken.expiresAt < new Date()) {
        throw new Error('Refresh token expired')
    }

    return refreshToken
}

/**
 * Revoke access token
 */
export async function revokeAccessToken(jti: string) {
    await prisma.accessToken.update({
        where: { token: jti },
        data: { revoked: true }
    })
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(token: string) {
    await prisma.refreshToken.update({
        where: { token },
        data: { revoked: true }
    })
}

/**
 * Revoke all tokens for a user
 */
export async function revokeAllUserTokens(userId: string) {
    await prisma.accessToken.updateMany({
        where: { userId },
        data: { revoked: true }
    })

    await prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true }
    })
}

/**
 * Validate redirect URI against client's registered URIs
 */
export function validateRedirectUri(clientRedirectUris: string[], redirectUri: string): boolean {
    return clientRedirectUris.includes(redirectUri)
}

/**
 * Validate scope against client's allowed scopes
 */
export function validateScope(clientScopes: string[], requestedScopes: string): boolean {
    const requested = requestedScopes.split(' ')
    return requested.every(scope => clientScopes.includes(scope))
}

/**
 * Check if user has given consent for this client and scope
 */
export async function hasUserConsent(
    userId: string,
    clientId: string,
    scope: string
): Promise<boolean> {
    const consent = await prisma.userConsent.findUnique({
        where: {
            userId_clientId: {
                userId,
                clientId
            }
        }
    })

    if (!consent) return false

    // Check if all requested scopes are in the consent
    const requestedScopes = scope.split(' ')
    const consentedScopes = consent.scope.split(' ')

    return requestedScopes.every(s => consentedScopes.includes(s))
}

/**
 * Save user consent
 */
export async function saveUserConsent(
    userId: string,
    clientId: string,
    scope: string
) {
    await prisma.userConsent.upsert({
        where: {
            userId_clientId: {
                userId,
                clientId
            }
        },
        update: {
            scope,
            updatedAt: new Date()
        },
        create: {
            userId,
            clientId,
            scope
        }
    })
}
