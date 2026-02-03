/**
 * Prisma Seed File
 * Creates initial database data for development
 * 
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create test user
    const testUser = await prisma.user.upsert({
        where: { email: 'test@zestacademy.tech' },
        update: {},
        create: {
            email: 'test@zestacademy.tech',
            passwordHash: await hashPassword('password123'),
            name: 'Test User',
            emailVerified: true
        }
    })
    console.log('✅ Created test user:', testUser.email)

    // Create Zest Academy OAuth Client
    const zestAcademyClient = await prisma.oAuthClient.upsert({
        where: { clientId: 'zest_academy' },
        update: {},
        create: {
            clientId: 'zest_academy',
            clientSecret: await hashPassword('zest_academy_secret_key'),
            name: 'Zest Academy',
            description: 'Main Zest Academy learning platform',
            logo: 'https://zestacademy.tech/logo.png',
            redirectUris: [
                'http://localhost:3001/auth/callback',
                'https://zestacademy.tech/auth/callback',
                'https://www.zestacademy.tech/auth/callback'
            ],
            allowedScopes: ['openid', 'email', 'profile'],
            trusted: true // Skip consent screen
        }
    })
    console.log('✅ Created OAuth client:', zestAcademyClient.name)

    // Create Zestfolio OAuth Client
    const zestfolioClient = await prisma.oAuthClient.upsert({
        where: { clientId: 'zestfolio' },
        update: {},
        create: {
            clientId: 'zestfolio',
            clientSecret: await hashPassword('zestfolio_secret_key'),
            name: 'Zestfolio',
            description: 'Portfolio builder for students',
            logo: 'https://zestfolio.zestacademy.tech/logo.png',
            redirectUris: [
                'http://localhost:3002/auth/callback',
                'https://zestfolio.zestacademy.tech/auth/callback'
            ],
            allowedScopes: ['openid', 'email', 'profile'],
            trusted: true
        }
    })
    console.log('✅ Created OAuth client:', zestfolioClient.name)

    // Create Zest Compilers OAuth Client
    const compilersClient = await prisma.oAuthClient.upsert({
        where: { clientId: 'zest_compilers' },
        update: {},
        create: {
            clientId: 'zest_compilers',
            clientSecret: await hashPassword('zest_compilers_secret_key'),
            name: 'Zest Compilers',
            description: 'Online code compiler and editor',
            logo: 'https://compilers.zestacademy.tech/logo.png',
            redirectUris: [
                'http://localhost:3003/auth/callback',
                'https://compilers.zestacademy.tech/auth/callback'
            ],
            allowedScopes: ['openid', 'email', 'profile'],
            trusted: true
        }
    })
    console.log('✅ Created OAuth client:', compilersClient.name)

    // Create a test third-party client (non-trusted)
    const testClient = await prisma.oAuthClient.upsert({
        where: { clientId: 'test_client' },
        update: {},
        create: {
            clientId: 'test_client',
            clientSecret: await hashPassword('test_client_secret'),
            name: 'Test Application',
            description: 'For testing OAuth flow',
            redirectUris: [
                'http://localhost:3004/callback',
                'https://example.com/callback'
            ],
            allowedScopes: ['openid', 'email', 'profile'],
            trusted: false // Will show consent screen
        }
    })
    console.log('✅ Created OAuth client:', testClient.name)

    console.log('\n🎉 Seed completed successfully!')
    console.log('\n📝 Test Credentials:')
    console.log('   Email: test@zestacademy.tech')
    console.log('   Password: password123')
    console.log('\n🔑 OAuth Clients:')
    console.log(`   - ${zestAcademyClient.name} (client_id: ${zestAcademyClient.clientId})`)
    console.log(`   - ${zestfolioClient.name} (client_id: ${zestfolioClient.clientId})`)
    console.log(`   - ${compilersClient.name} (client_id: ${compilersClient.clientId})`)
    console.log(`   - ${testClient.name} (client_id: ${testClient.clientId})`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
