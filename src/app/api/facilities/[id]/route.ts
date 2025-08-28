import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema validation for facility update
const facilityUpdateSchema = z.object({
  nama: z.string().min(1, 'Nama fasilitas harus diisi').optional(),
  lokasi: z.string().min(1, 'Lokasi harus diisi').optional(),
  jenis: z.string().min(1, 'Jenis fasilitas harus diisi').optional(),
  kapasitas: z.number().min(1, 'Kapasitas minimal 1 orang').optional(),
  deskripsi: z.string().optional(),
  tersedia: z.boolean().optional() // Status aktif/tidak aktif fasilitas
})

// GET /api/facilities/[id] - Get facility by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const facility = await prisma.fasilitas.findUnique({
      where: { id },
      include: {
        jadwalFasilitas: {
          where: {
            tanggal: {
              gte: new Date()
            }
          },
          orderBy: {
            tanggal: 'asc'
          }
        },
        _count: {
          select: {
            peminjaman: true
          }
        }
      }
    })

    if (!facility) {
      return NextResponse.json(
        { success: false, error: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: facility
    })
  } catch (error) {
    console.error('Error fetching facility:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data fasilitas' },
      { status: 500 }
    )
  }
}

// PUT /api/facilities/[id] - Update facility
export async function PUT(
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
    const body = await request.json()
    
    // Validate input
    const validatedData = facilityUpdateSchema.parse(body)

    // Check if facility exists
    const existingFacility = await prisma.fasilitas.findUnique({
      where: { id }
    })

    if (!existingFacility) {
      return NextResponse.json(
        { success: false, error: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if facility name already exists (if name is being updated)
    if (validatedData.nama && validatedData.nama !== existingFacility.nama) {
      const duplicateFacility = await prisma.fasilitas.findFirst({
        where: { 
          nama: validatedData.nama,
          id: { not: id }
        }
      })

      if (duplicateFacility) {
        return NextResponse.json(
          { success: false, error: 'Nama fasilitas sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Update facility
    const updatedFacility = await prisma.fasilitas.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: updatedFacility,
      message: 'Fasilitas berhasil diperbarui'
    })
  } catch (error) {
    console.error('Error updating facility:', error)
    
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
      { success: false, error: 'Gagal memperbarui fasilitas' },
      { status: 500 }
    )
  }
}

// DELETE /api/facilities/[id] - Delete facility
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

    // Check if facility exists
    const existingFacility = await prisma.fasilitas.findUnique({
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

    if (!existingFacility) {
      return NextResponse.json(
        { success: false, error: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if facility has active bookings
    if (existingFacility._count.peminjaman > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tidak dapat menghapus fasilitas yang memiliki peminjaman aktif' 
        },
        { status: 400 }
      )
    }

    // Delete facility (cascade will handle related records)
    await prisma.fasilitas.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Fasilitas berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting facility:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus fasilitas' },
      { status: 500 }
    )
  }
}