import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendBookingStatusEmail } from '@/lib/email'

// Schema validation for booking update
const bookingUpdateSchema = z.object({
  tglMulai: z.string().optional(),
  tglSelesai: z.string().optional(),
  tujuan: z.string().min(1, 'Tujuan peminjaman harus diisi').optional(),
  keterangan: z.string().optional(),
  status: z.enum(['DIPROSES', 'DISETUJUI', 'DITOLAK', 'PERLU_REVISI']).optional(),
  alasanTolak: z.string().optional()
}).refine((data) => {
  if (data.tglMulai && data.tglSelesai) {
    const startDate = new Date(data.tglMulai)
    const endDate = new Date(data.tglSelesai)
    return endDate >= startDate
  }
  return true
}, {
  message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai',
  path: ['tglSelesai']
}).refine((data) => {
  if (data.status === 'DITOLAK' && !data.alasanTolak) {
    return false
  }
  return true
}, {
  message: 'Alasan tolak harus diisi jika status ditolak',
  path: ['alasanTolak']
})

// GET /api/bookings/[id] - Get booking by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const booking = await prisma.peminjaman.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
            tipePengguna: true
          }
        },
        fasilitas: {
          select: {
            id: true,
            nama: true,
            lokasi: true,
            jenis: true,
            kapasitas: true,
            deskripsi: true
          }
        },
        suratPermohonan: true,
        sip: true,
        tagihan: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Peminjaman tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: booking
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data peminjaman' },
      { status: 500 }
    )
  }
}

// PUT /api/bookings/[id] - Update booking
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication check when NextAuth is properly configured
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const { id } = await context.params
    const body = await request.json()
    
    // Validate input
    const validatedData = bookingUpdateSchema.parse(body)

    // Check if booking exists
    const existingBooking = await prisma.peminjaman.findUnique({
      where: { id },
      include: {
        fasilitas: true
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Peminjaman tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if booking can be updated (only if status is DIPROSES or PERLU_REVISI)
    if (!['DIPROSES', 'PERLU_REVISI'].includes(existingBooking.status) && 
        validatedData.status && 
        !['DISETUJUI', 'DITOLAK'].includes(validatedData.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Peminjaman tidak dapat diubah karena sudah diproses' 
        },
        { status: 400 }
      )
    }

    // Check for booking conflicts if dates are being updated
    if (validatedData.tglMulai || validatedData.tglSelesai) {
      const startDate = validatedData.tglMulai ? new Date(validatedData.tglMulai) : existingBooking.tglMulai
      const endDate = validatedData.tglSelesai ? new Date(validatedData.tglSelesai) : existingBooking.tglSelesai

      const conflictingBookings = await prisma.peminjaman.findMany({
        where: {
          fasilitasId: existingBooking.fasilitasId,
          id: { not: id },
          status: {
            in: ['DIPROSES', 'DISETUJUI']
          },
          OR: [
            {
              AND: [
                { tglMulai: { lte: startDate } },
                { tglSelesai: { gte: startDate } }
              ]
            },
            {
              AND: [
                { tglMulai: { lte: endDate } },
                { tglSelesai: { gte: endDate } }
              ]
            },
            {
              AND: [
                { tglMulai: { gte: startDate } },
                { tglSelesai: { lte: endDate } }
              ]
            }
          ]
        }
      })

      if (conflictingBookings.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Fasilitas sudah dibooking pada tanggal tersebut' 
          },
          { status: 400 }
        )
      }
    }

    // Update booking
    const updatedBooking = await prisma.peminjaman.update({
      where: { id },
      data: {
        ...(validatedData.tglMulai && { tglMulai: new Date(validatedData.tglMulai) }),
        ...(validatedData.tglSelesai && { tglSelesai: new Date(validatedData.tglSelesai) }),
        ...(validatedData.tujuan && { tujuan: validatedData.tujuan }),
        ...(validatedData.keterangan !== undefined && { keterangan: validatedData.keterangan }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.alasanTolak !== undefined && { alasanTolak: validatedData.alasanTolak })
      },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true
          }
        },
        fasilitas: {
          select: {
            nama: true,
            lokasi: true
          }
        }
      }
    })

    // Send email notification
    try {
      const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date)
      }

      const bookingDetails = {
        fasilitas: updatedBooking.fasilitas.nama,
        tanggalMulai: formatDate(updatedBooking.tglMulai),
        tanggalSelesai: formatDate(updatedBooking.tglSelesai),
        tujuan: updatedBooking.tujuan
      }

      if (validatedData.status === 'DISETUJUI') {
        await sendBookingStatusEmail(
          updatedBooking.user.email,
          updatedBooking.user.id,
          'approved',
          bookingDetails
        )
      } else if (validatedData.status === 'DITOLAK') {
        await sendBookingStatusEmail(
          updatedBooking.user.email,
          updatedBooking.user.id,
          'rejected',
          bookingDetails,
          validatedData.alasanTolak
        )
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: 'Peminjaman berhasil diperbarui'
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    
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
      { success: false, error: 'Gagal memperbarui peminjaman' },
      { status: 500 }
    )
  }
}

// DELETE /api/bookings/[id] - Delete booking
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication check when NextAuth is properly configured
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const { id } = await context.params

    // Check if booking exists
    const existingBooking = await prisma.peminjaman.findUnique({
      where: { id }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Peminjaman tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if booking can be deleted (only if status is DIPROSES or DITOLAK)
    if (!['DIPROSES', 'DITOLAK'].includes(existingBooking.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Peminjaman tidak dapat dihapus karena sudah diproses atau disetujui' 
        },
        { status: 400 }
      )
    }

    // Delete booking (cascade will handle related records)
    await prisma.peminjaman.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Peminjaman berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus peminjaman' },
      { status: 500 }
    )
  }
}