import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify, importX509 } from 'jose'
import { prisma } from '@/lib/prisma'

const SESSION_SECRET = new TextEncoder().encode(
    process.env.SESSION_SECRET || 'default-session-secret-change-in-production'
)

// Cache for Google's public keys
let publicKeys: Record<string, string> | null = null
let publicKeysExpiry: number = 0

async function getFirebasePublicKeys() {
    const now = Date.now()
    if (publicKeys && now < publicKeysExpiry) {
        return publicKeys
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', {
            signal: controller.signal,
            next: { revalidate: 3600 } // Next.js cache
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error('Failed to fetch public keys')
        }

        const keys = await response.json()

        // Parse cache-control header
        const cacheControl = response.headers.get('cache-control')
        const maxAge = cacheControl?.match(/max-age=(\d+)/)?.[1]
        const ttl = maxAge ? parseInt(maxAge) * 1000 : 3600 * 1000

        publicKeys = keys
        publicKeysExpiry = now + ttl
        return keys
    } catch (error) {
        console.error('Error fetching Firebase public keys:', error)
        // Fallback or rethrow?
        if (publicKeys) return publicKeys // Return stale if available
        throw error
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { idToken } = body

        if (!idToken) {
            return NextResponse.json({ error: 'ID token is required' }, { status: 400 })
        }

        // 1. Get Public Keys
        const keys = await getFirebasePublicKeys()

        // 2. Decode header to find 'kid'
        // We can use a simpler parse to get header if jose doesn't do it automatically
        // but jwtVerify can take a function as key to resolve 'kid'

        // Verify Token
        const { payload } = await jwtVerify(
            idToken,
            async (protectedHeader: any) => {
                const kid = protectedHeader.kid
                if (!kid || !keys[kid]) {
                    throw new Error('Invalid or missing "kid" in token header')
                }
                return importX509(keys[kid], 'RS256')
            },
            {
                issuer: `https://securetoken.google.com/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
                audience: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                algorithms: ['RS256']
            }
        )

        // Token is valid!
        const email = payload.email as string
        const name = (payload.name as string) || email.split('@')[0]
        const picture = payload.picture as string

        if (!email) {
            return NextResponse.json({ error: 'Email not found in token' }, { status: 400 })
        }

        // Upsert User
        const user = await prisma.user.upsert({
            where: { email: email.toLowerCase() },
            update: {
                name: name,
                picture: picture,
                emailVerified: true
            },
            create: {
                email: email.toLowerCase(),
                name: name,
                picture: picture,
                emailVerified: true,
                passwordHash: '' // No password
            }
        })

        // Create session token (custom JWT)
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
            path: '/',
        })

        return NextResponse.json({ success: true, user })

    } catch (error: any) {
        console.error('Google login error:', error)
        return NextResponse.json(
            { error: 'Authentication failed', details: error.message },
            { status: 401 }
        )
    }
}
