import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'


const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Creiamo un pool di connessioni usando la nostra URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
