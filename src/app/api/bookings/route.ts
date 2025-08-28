import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema validation for booking data
const bookingSchema = z.object({
  fasilitasId: z.string().min(1, 'Fasilitas harus dipilih'),
  tglMulai: z.string().refine((date) => {
    const bookingDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookingDate >= today
  }, 'Tanggal mulai tidak boleh di masa lalu'),
  tglSelesai: z.string(),
  tujuan: z.string().min(1, 'Tujuan peminjaman harus diisi'),
  keterangan: z.string().optional()
}).refine((data) => {
  const startDate = new Date(data.tglMulai)
  const endDate = new Date(data.tglSelesai)
  return endDate >= startDate
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

    const body = await request.json()
    
    // Validate input
    const validatedData = bookingSchema.parse(body)

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
    const startDate = new Date(validatedData.tglMulai)
    const endDate = new Date(validatedData.tglSelesai)
    
    const conflictingBookings = await prisma.peminjaman.findMany({
      where: {
        fasilitasId: validatedData.fasilitasId,
        status: {
          in: ['DIPROSES', 'DISETUJUI']
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
        peminjam: booking.user.nama
      }))
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Fasilitas sudah dibooking pada tanggal dan waktu tersebut',
          conflicts: conflictDetails
        },
        { status: 409 } // 409 Conflict is more appropriate than 400
      )
    }

    // Create booking
    const booking = await prisma.peminjaman.create({
      data: {
        fasilitasId: validatedData.fasilitasId,
        userId: 'cmeusutb5000b9kvsvrpti7ou', // Using sample mahasiswa user ID for testing
        tglMulai: new Date(validatedData.tglMulai),
        tglSelesai: new Date(validatedData.tglSelesai),
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