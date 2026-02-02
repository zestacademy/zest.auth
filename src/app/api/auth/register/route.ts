/**
 * User Registration API
 * POST /api/auth/register
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { z } from 'zod'

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required').optional()
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input
        const validation = registerSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { email, password, name } = validation.data

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const passwordHash = await hashPassword(password)

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                name: name || null,
                emailVerified: false
            },
            select: {
                id: true,
                email: true,
                name: true,
                emailVerified: true,
                createdAt: true
            }
        })

        return NextResponse.json(
            {
                success: true,
                user
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
