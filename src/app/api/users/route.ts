import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth'

// Schema validation for user data
const userSchema = z.object({
  nama: z.string().min(1, 'Nama harus diisi'),
  email: z.string().email('Format email tidak valid'),
  role: z.enum(['MAHASISWA', 'PETUGAS', 'EKSTERNAL']),
  tipePengguna: z.enum(['MAHASISWA', 'EKSTERNAL']),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  googleId: z.string().optional()
}).refine((data) => {
  // Password required for PETUGAS role
  if (data.role === 'PETUGAS' && !data.password) {
    return false
  }
  // GoogleId required for MAHASISWA
  if (data.role === 'MAHASISWA' && !data.googleId) {
    return false
  }
  return true
}, {
  message: 'Password diperlukan untuk petugas, GoogleId diperlukan untuk mahasiswa'
})

// GET /api/users - Get all users with filters
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check when NextAuth is properly configured
    // const session = await getServerSession(authOptions)
    // if (!session || session.user.role !== 'PETUGAS') {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const tipePengguna = searchParams.get('tipePengguna') || ''
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role && role !== 'ALL') {
      where.role = role
    }
    
    if (tipePengguna && tipePengguna !== 'ALL') {
      where.tipePengguna = tipePengguna
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.pengguna.findMany({
        where,
        select: {
          id: true,
          nama: true,
          email: true,
          role: true,
          tipePengguna: true,
          googleId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              peminjaman: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.pengguna.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data pengguna' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check when NextAuth is properly configured
    // const session = await getServerSession(authOptions)
    // if (!session || session.user.role !== 'PETUGAS') {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const body = await request.json()
    
    // Validate input
    const validatedData = userSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.pengguna.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email sudah digunakan' },
        { status: 400 }
      )
    }

    // Hash password if provided
    let hashedPassword: string | undefined
    if (validatedData.password) {
      hashedPassword = await hashPassword(validatedData.password)
    }

    // Create user
    const user = await prisma.pengguna.create({
      data: {
        nama: validatedData.nama,
        email: validatedData.email,
        role: validatedData.role,
        tipePengguna: validatedData.tipePengguna,
        password: hashedPassword,
        googleId: validatedData.googleId
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        tipePengguna: true,
        googleId: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Pengguna berhasil dibuat'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Data tidak valid',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Gagal membuat pengguna' },
      { status: 500 }
    )
  }
}