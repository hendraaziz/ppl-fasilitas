import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema validation for facility data
const facilitySchema = z.object({
  nama: z.string().min(1, 'Nama fasilitas harus diisi'),
  lokasi: z.string().min(1, 'Lokasi harus diisi'),
  jenis: z.string().min(1, 'Jenis fasilitas harus diisi'),
  kapasitas: z.number().min(1, 'Kapasitas minimal 1 orang'),
  deskripsi: z.string().optional()
})

// GET /api/facilities - Get all facilities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { lokasi: { contains: search, mode: 'insensitive' } },
        { jenis: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get facilities with pagination
    const [facilities, total] = await Promise.all([
      prisma.fasilitas.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.fasilitas.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: facilities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data fasilitas' },
      { status: 500 }
    )
  }
}

// POST /api/facilities - Create new facility
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
    const validatedData = facilitySchema.parse(body)

    // Check if facility name already exists
    const existingFacility = await prisma.fasilitas.findFirst({
      where: { nama: validatedData.nama }
    })

    if (existingFacility) {
      return NextResponse.json(
        { success: false, error: 'Nama fasilitas sudah digunakan' },
        { status: 400 }
      )
    }

    // Create facility
    const facility = await prisma.fasilitas.create({
      data: {
        nama: validatedData.nama,
        lokasi: validatedData.lokasi,
        jenis: validatedData.jenis,
        kapasitas: validatedData.kapasitas,
        deskripsi: validatedData.deskripsi
      }
    })

    return NextResponse.json({
      success: true,
      data: facility,
      message: 'Fasilitas berhasil ditambahkan'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating facility:', error)
    
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
      { success: false, error: 'Gagal menambahkan fasilitas' },
      { status: 500 }
    )
  }
}