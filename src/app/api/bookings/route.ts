import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema validation for booking data
const bookingSchema = z.object({
  fasilitasId: z.string().min(1, 'Fasilitas harus dipilih'),
  userId: z.string().min(1, 'User ID harus ada').optional(),
  namaPeminjam: z.string().optional(),
  emailPeminjam: z.string().email().optional(),
  tipePengguna: z.enum(['MAHASISWA', 'EKSTERNAL']).optional(),
  tglMulai: z.string().refine((date) => {
    const bookingDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookingDate >= today
  }, 'Tanggal mulai tidak boleh di masa lalu'),
  tglSelesai: z.string(),
  jamMulai: z.string().optional(),
  jamSelesai: z.string().optional(),
  tanggalMulai: z.string().optional(), // For admin form compatibility
  tanggalSelesai: z.string().optional(), // For admin form compatibility
  tujuan: z.string().min(1, 'Tujuan peminjaman harus diisi'),
  keterangan: z.string().optional()
}).refine((data) => {
  const startDateStr = data.tglMulai || data.tanggalMulai
  const endDateStr = data.tglSelesai || data.tanggalSelesai
  if (startDateStr && endDateStr) {
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    return endDate >= startDate
  }
  return true
}, {
  message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai',
  path: ['tglSelesai']
})

// GET /api/bookings - Get all bookings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const fasilitasId = searchParams.get('fasilitasId') || ''
    const userId = searchParams.get('userId') || ''
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (search) {
      where.OR = [
        { tujuan: { contains: search, mode: 'insensitive' } },
        { keterangan: { contains: search, mode: 'insensitive' } },
        { 
          user: {
            nama: { contains: search, mode: 'insensitive' }
          }
        },
        {
          fasilitas: {
            nama: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (fasilitasId) {
      where.fasilitasId = fasilitasId
    }
    
    if (userId) {
      where.userId = userId
    }

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      prisma.peminjaman.findMany({
        where,
        include: {
          fasilitas: {
            select: {
              id: true,
              nama: true,
              lokasi: true,
              jenis: true
            }
          },
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.peminjaman.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data peminjaman' },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check when NextAuth is properly configured
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    let body: any
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData from admin form
      const formData = await request.formData()
      body = {}
      for (const [key, value] of formData.entries()) {
        if (key !== 'dokumenFile') {
          body[key] = value
        }
      }
    } else {
      // Handle JSON from regular form
      body = await request.json()
    }
    
    // Normalize field names for compatibility
    if (body.tanggalMulai && !body.tglMulai) {
      body.tglMulai = body.tanggalMulai
    }
    if (body.tanggalSelesai && !body.tglSelesai) {
      body.tglSelesai = body.tanggalSelesai
    }
    
    // Validate input
    const validatedData = bookingSchema.parse(body)
    
    // Ensure userId is present (either from session or admin form)
    let userId = validatedData.userId
    if (!userId && validatedData.emailPeminjam) {
      // For admin-created bookings, try to find or create user
      let user = await prisma.pengguna.findUnique({
        where: { email: validatedData.emailPeminjam }
      })
      
      if (!user) {
        // Create new user for external booking
         user = await prisma.pengguna.create({
           data: {
             nama: validatedData.namaPeminjam || 'Unknown',
             email: validatedData.emailPeminjam,
             role: validatedData.tipePengguna === 'MAHASISWA' ? 'MAHASISWA' : 'EKSTERNAL',
             tipePengguna: validatedData.tipePengguna || 'EKSTERNAL'
           }
         })
      }
      userId = user.id
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID atau email peminjam harus ada' },
        { status: 400 }
      )
    }

    // Check if facility exists and is available
    const facility = await prisma.fasilitas.findUnique({
      where: { id: validatedData.fasilitasId }
    })

    if (!facility) {
      return NextResponse.json(
        { success: false, error: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      )
    }

    // Note: Capacity check removed as jumlahPeserta is not in the schema
    // This can be added later if needed in the business logic

    // Check for booking conflicts - improved logic to handle all overlap cases
    const startDate = new Date(validatedData.tglMulai || validatedData.tanggalMulai!)
    const endDate = new Date(validatedData.tglSelesai || validatedData.tanggalSelesai!)
    
    const conflictingBookings = await prisma.peminjaman.findMany({
      where: {
        fasilitasId: validatedData.fasilitasId,
        status: {
          in: ['DIPROSES', 'DISETUJUI', 'PERLU_REVISI']
        },
        // Two bookings overlap if:
        // start1 < end2 AND start2 < end1
        AND: [
          { tglMulai: { lt: endDate } },
          { tglSelesai: { gt: startDate } }
        ]
      },
      select: {
        id: true,
        tglMulai: true,
        tglSelesai: true,
        tujuan: true,
        status: true,
        user: {
          select: {
            nama: true
          }
        }
      }
    })

    if (conflictingBookings.length > 0) {
      const conflictDetails = conflictingBookings.map(booking => ({
        id: booking.id,
        tglMulai: booking.tglMulai,
        tglSelesai: booking.tglSelesai,
        tujuan: booking.tujuan,
        status: booking.status,
        peminjam: booking.user.nama
      }))
      
      const conflictInfo = conflictingBookings.map(booking => {
        const startTime = new Date(booking.tglMulai).toLocaleString('id-ID')
        const endTime = new Date(booking.tglSelesai).toLocaleString('id-ID')
        return `${booking.user.nama} (${startTime} - ${endTime}, Status: ${booking.status})`
      }).join('; ')
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Fasilitas sudah dibooking pada waktu tersebut oleh: ${conflictInfo}`,
          conflicts: conflictDetails
        },
        { status: 409 } // 409 Conflict is more appropriate than 400
      )
    }

    // Verify user exists
    const user = await prisma.pengguna.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Create booking
    const booking = await prisma.peminjaman.create({
      data: {
        fasilitasId: validatedData.fasilitasId,
        userId: userId,
        tglMulai: new Date(validatedData.tglMulai || validatedData.tanggalMulai!),
        tglSelesai: new Date(validatedData.tglSelesai || validatedData.tanggalSelesai!),
        tujuan: validatedData.tujuan,
        keterangan: validatedData.keterangan,
        status: 'DIPROSES'
      },
      include: {
        fasilitas: {
          select: {
            nama: true,
            lokasi: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Peminjaman berhasil diajukan'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    
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
      { success: false, error: 'Gagal membuat peminjaman' },
      { status: 500 }
    )
  }
}