import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingWorkflow, PaymentWorkflow } from '@/lib/business-logic'
import { sendBookingStatusEmail, sendPaymentConfirmationEmail } from '@/lib/email'
import { z } from 'zod'
import { StatusPeminjaman, StatusPembayaran } from '@prisma/client'

// Validation schemas
const bookingStatusSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  newStatus: z.nativeEnum(StatusPeminjaman),
  userId: z.string().min(1, 'User ID is required'),
  reason: z.string().optional()
})

const paymentStatusSchema = z.object({
  peminjamanId: z.string().min(1, 'Peminjaman ID is required'),
  newStatus: z.nativeEnum(StatusPembayaran),
  userId: z.string().min(1, 'User ID is required')
})

// POST /api/workflow - Handle workflow operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'updateBookingStatus':
        return await handleBookingStatusUpdate(body)
      case 'updatePaymentStatus':
        return await handlePaymentStatusUpdate(body)
      case 'getAvailableTransitions':
        return await handleGetAvailableTransitions(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in workflow API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle booking status update
async function handleBookingStatusUpdate(body: Record<string, unknown>) {
  try {
    const validatedData = bookingStatusSchema.parse(body)
    const { bookingId, newStatus, userId, reason } = validatedData

    // Get booking details before update
    const booking = await prisma.peminjaman.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        fasilitas: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Update booking status using workflow
    const updatedBooking = await BookingWorkflow.updateBookingStatus(
      bookingId,
      newStatus,
      userId,
      reason
    )

    // Send email notification
    const bookingDetails = {
      fasilitas: booking.fasilitas.nama,
      tanggalMulai: booking.tglMulai.toLocaleDateString('id-ID'),
      tanggalSelesai: booking.tglSelesai.toLocaleDateString('id-ID'),
      tujuan: booking.tujuan
    }

    let emailType: 'approved' | 'rejected' | 'revision'
    switch (newStatus) {
      case 'DISETUJUI':
        emailType = 'approved'
        break
      case 'DITOLAK':
        emailType = 'rejected'
        break
      case 'PERLU_REVISI':
        emailType = 'revision'
        break
      default:
        // No email for other statuses
        return NextResponse.json({
          booking: updatedBooking,
          message: 'Booking status updated successfully'
        })
    }

    // Send email notification
    await sendBookingStatusEmail(
      booking.user.email,
      booking.userId,
      emailType,
      bookingDetails,
      reason
    )

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking status updated and notification sent successfully'
    })
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

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    throw error
  }
}

// Handle payment status update
async function handlePaymentStatusUpdate(body: Record<string, unknown>) {
  try {
    const validatedData = paymentStatusSchema.parse(body)
    const { peminjamanId, newStatus, userId } = validatedData

    // Get payment details before update
    const tagihan = await prisma.tagihan.findUnique({
      where: { peminjamanId },
      include: {
        peminjaman: {
          include: {
            user: true,
            fasilitas: true
          }
        }
      }
    })

    if (!tagihan) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Update payment status using workflow
    const updatedTagihan = await PaymentWorkflow.updatePaymentStatus(
      peminjamanId,
      newStatus,
      userId
    )

    // Send email notification for payment confirmation
    if (newStatus === 'SUDAH_BAYAR') {
      const bookingDetails = {
        fasilitas: tagihan.peminjaman.fasilitas.nama,
        tanggalMulai: tagihan.peminjaman.tglMulai.toLocaleDateString('id-ID'),
        tanggalSelesai: tagihan.peminjaman.tglSelesai.toLocaleDateString('id-ID')
      }

      await sendPaymentConfirmationEmail(
        tagihan.peminjaman.user.email,
        tagihan.peminjaman.userId,
        bookingDetails,
        Number(tagihan.biaya)
      )
    }

    return NextResponse.json({
      payment: updatedTagihan,
      message: 'Payment status updated successfully'
    })
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

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    throw error
  }
}

// Handle get available transitions
async function handleGetAvailableTransitions(body: Record<string, unknown>) {
  try {
    const { type, currentStatus } = body

    if (!type || !currentStatus) {
      return NextResponse.json(
        { error: 'Type and currentStatus are required' },
        { status: 400 }
      )
    }

    let availableTransitions: unknown[]

    if (type === 'booking') {
      availableTransitions = BookingWorkflow.getAvailableTransitions(currentStatus as StatusPeminjaman)
    } else if (type === 'payment') {
      availableTransitions = PaymentWorkflow.getAvailableTransitions(currentStatus as StatusPembayaran)
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "booking" or "payment"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      currentStatus,
      availableTransitions
    })
  } catch (error) {
    console.error('Error getting available transitions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/workflow - Get workflow information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'getWorkflowRules') {
      return NextResponse.json({
        bookingWorkflow: {
          validTransitions: BookingWorkflow.VALID_TRANSITIONS,
          description: 'Valid status transitions for booking workflow'
        },
        paymentWorkflow: {
          validTransitions: PaymentWorkflow.VALID_TRANSITIONS,
          description: 'Valid status transitions for payment workflow'
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing action parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in workflow GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}