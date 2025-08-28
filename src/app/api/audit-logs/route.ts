import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const auditLogSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  peminjamanId: z.string().optional(),
  aksi: z.string().min(1, 'Aksi is required').max(100),
  deskripsi: z.string().min(1, 'Deskripsi is required'),
  statusLama: z.string().optional(),
  statusBaru: z.string().optional()
})

// GET /api/audit-logs - Get audit logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')
    const peminjamanId = searchParams.get('peminjamanId')
    const aksi = searchParams.get('aksi')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (userId) {
      where.userId = userId
    }

    if (peminjamanId) {
      where.peminjamanId = peminjamanId
    }

    if (aksi) {
      where.aksi = {
        contains: aksi,
        mode: 'insensitive'
      }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    if (search) {
      where.OR = [
        {
          aksi: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          deskripsi: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Get audit logs with pagination
    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
              role: true
            }
          },
          peminjaman: {
            select: {
              id: true,
              tujuan: true,
              status: true,
              fasilitas: {
                select: {
                  nama: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    return NextResponse.json({
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/audit-logs - Create a new audit log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = auditLogSchema.parse(body)

    // Check if user exists
    const user = await prisma.pengguna.findUnique({
      where: { id: validatedData.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if peminjaman exists (if provided)
    if (validatedData.peminjamanId) {
      const peminjaman = await prisma.peminjaman.findUnique({
        where: { id: validatedData.peminjamanId }
      })

      if (!peminjaman) {
        return NextResponse.json(
          { error: 'Peminjaman not found' },
          { status: 404 }
        )
      }
    }

    // Create audit log
    const auditLog = await prisma.auditLog.create({
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true
          }
        },
        peminjaman: {
          select: {
            id: true,
            tujuan: true,
            status: true,
            fasilitas: {
              select: {
                nama: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(auditLog, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Error creating audit log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}