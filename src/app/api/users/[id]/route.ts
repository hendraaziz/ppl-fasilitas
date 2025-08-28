import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth'

// Schema validation for user update
const userUpdateSchema = z.object({
  nama: z.string().min(1, 'Nama harus diisi').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  role: z.enum(['MAHASISWA', 'PETUGAS', 'EKSTERNAL']).optional(),
  tipePengguna: z.enum(['MAHASISWA', 'EKSTERNAL']).optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  googleId: z.string().optional(),
  telepon: z.string().optional(),
  alamat: z.string().optional(),
  tanggalLahir: z.string().optional() // Will be converted to DateTime
})

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    // TODO: Add authentication check when NextAuth is properly configured
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const user = await prisma.pengguna.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        tipePengguna: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
        peminjaman: {
          select: {
            id: true,
            tglMulai: true,
            tglSelesai: true,
            tujuan: true,
            status: true,
            fasilitas: {
              select: {
                nama: true,
                lokasi: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            peminjaman: true,
            notifikasi: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data pengguna' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication check when NextAuth is properly configured
    // const session = await getServerSession(authOptions)
    // if (!session || (session.user.role !== 'PETUGAS' && session.user.id !== id)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const { id } = await context.params
    const body = await request.json()
    
    // Validate input
    const validatedData = userUpdateSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.pengguna.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if email already exists (if email is being updated)
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const duplicateUser = await prisma.pengguna.findFirst({
        where: { 
          email: validatedData.email,
          id: { not: id }
        }
      })

      if (duplicateUser) {
        return NextResponse.json(
          { success: false, error: 'Email sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined
    if (validatedData.password) {
      hashedPassword = await hashPassword(validatedData.password)
    }

    // Convert tanggalLahir string to DateTime if provided
    let tanggalLahirDate: Date | undefined
    if (validatedData.tanggalLahir) {
      tanggalLahirDate = new Date(validatedData.tanggalLahir)
    }

    // Update user
    const updatedUser = await prisma.pengguna.update({
      where: { id },
      data: {
        ...(validatedData.nama && { nama: validatedData.nama }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.role && { role: validatedData.role }),
        ...(validatedData.tipePengguna && { tipePengguna: validatedData.tipePengguna }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(validatedData.googleId !== undefined && { googleId: validatedData.googleId }),
        ...(validatedData.telepon !== undefined && { telepon: validatedData.telepon }),
        ...(validatedData.alamat !== undefined && { alamat: validatedData.alamat }),
        ...(tanggalLahirDate && { tanggalLahir: tanggalLahirDate })
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        tipePengguna: true,
        googleId: true,
        telepon: true,
        alamat: true,
        tanggalLahir: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Pengguna berhasil diperbarui'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    
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
      { success: false, error: 'Gagal memperbarui pengguna' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication check when NextAuth is properly configured
    // const session = await getServerSession(authOptions)
    // if (!session || session.user.role !== 'PETUGAS') {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const { id } = await context.params

    // Check if user exists
    const existingUser = await prisma.pengguna.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            peminjaman: {
              where: {
                status: {
                  in: ['DIPROSES', 'DISETUJUI']
                }
              }
            }
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if user has active bookings
    if (existingUser._count.peminjaman > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tidak dapat menghapus pengguna yang memiliki peminjaman aktif' 
        },
        { status: 400 }
      )
    }

    // Delete user (cascade will handle related records)
    await prisma.pengguna.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus pengguna' },
      { status: 500 }
    )
  }
}