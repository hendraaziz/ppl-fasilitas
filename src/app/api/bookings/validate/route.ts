import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BookingValidator, BookingValidationData } from '@/lib/booking-validator'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// Schema untuk validasi request
const ValidateBookingSchema = z.object({
  fasilitasId: z.string().min(1, 'ID fasilitas harus diisi'),
  tglMulai: z.string().transform((str) => new Date(str)),
  tglSelesai: z.string().transform((str) => new Date(str)),
  excludePeminjamanId: z.string().optional()
})

const CheckAvailabilitySchema = z.object({
  fasilitasId: z.string().min(1, 'ID fasilitas harus diisi'),
  tglMulai: z.string().transform((str) => new Date(str)),
  tglSelesai: z.string().transform((str) => new Date(str))
})

const GetAvailableSlotsSchema = z.object({
  fasilitasId: z.string().min(1, 'ID fasilitas harus diisi'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str))
})

export async function POST(request: NextRequest) {
  try {
    // Autentikasi
    const authContext = await getAuthenticatedUser(request)
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'validate':
        return await handleValidateBooking(body, authContext.user.id)
      
      case 'check-availability':
        return await handleCheckAvailability(body)
      
      case 'get-available-slots':
        return await handleGetAvailableSlots(body)
      
      default:
        return NextResponse.json({
          error: 'Invalid action',
          message: 'Supported actions: validate, check-availability, get-available-slots'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Booking validation API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Autentikasi
    const authContext = await getAuthenticatedUser(request)
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'check-availability') {
      const fasilitasId = searchParams.get('fasilitasId')
      const tglMulai = searchParams.get('tglMulai')
      const tglSelesai = searchParams.get('tglSelesai')

      if (!fasilitasId || !tglMulai || !tglSelesai) {
        return NextResponse.json({
          error: 'Missing required parameters',
          message: 'fasilitasId, tglMulai, and tglSelesai are required'
        }, { status: 400 })
      }

      const validator = new BookingValidator()
      const isAvailable = await validator.checkAvailability(
        fasilitasId,
        new Date(tglMulai),
        new Date(tglSelesai)
      )

      return NextResponse.json({
        success: true,
        available: isAvailable,
        message: isAvailable ? 'Fasilitas tersedia' : 'Fasilitas tidak tersedia'
      })
    }

    if (action === 'get-available-slots') {
      const fasilitasId = searchParams.get('fasilitasId')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      if (!fasilitasId || !startDate || !endDate) {
        return NextResponse.json({
          error: 'Missing required parameters',
          message: 'fasilitasId, startDate, and endDate are required'
        }, { status: 400 })
      }

      const validator = new BookingValidator()
      const availableSlots = await validator.getAvailableSlots(
        fasilitasId,
        new Date(startDate),
        new Date(endDate)
      )

      return NextResponse.json({
        success: true,
        slots: availableSlots,
        count: availableSlots.length
      })
    }

    return NextResponse.json({
      error: 'Invalid action',
      message: 'Supported actions: check-availability, get-available-slots'
    }, { status: 400 })

  } catch (error) {
    console.error('Booking validation GET API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handler untuk validasi peminjaman
async function handleValidateBooking(body: Record<string, unknown>, userId: string) {
  try {
    const validatedData = ValidateBookingSchema.parse(body)
    
    const bookingData: BookingValidationData = {
      fasilitasId: validatedData.fasilitasId,
      tglMulai: validatedData.tglMulai,
      tglSelesai: validatedData.tglSelesai,
      userId,
      excludePeminjamanId: validatedData.excludePeminjamanId
    }

    const validator = new BookingValidator()
    const result = await validator.validateBooking(bookingData)

    return NextResponse.json({
      success: result.isValid,
      validation: result,
      message: result.isValid ? 'Validasi berhasil' : 'Validasi gagal'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }
    throw error
  }
}

// Handler untuk cek ketersediaan
async function handleCheckAvailability(body: Record<string, unknown>) {
  try {
    const validatedData = CheckAvailabilitySchema.parse(body)
    
    const validator = new BookingValidator()
    const isAvailable = await validator.checkAvailability(
      validatedData.fasilitasId,
      validatedData.tglMulai,
      validatedData.tglSelesai
    )

    return NextResponse.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Fasilitas tersedia' : 'Fasilitas tidak tersedia'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }
    throw error
  }
}

// Handler untuk mendapatkan slot yang tersedia
async function handleGetAvailableSlots(body: Record<string, unknown>) {
  try {
    const validatedData = GetAvailableSlotsSchema.parse(body)
    
    const validator = new BookingValidator()
    const availableSlots = await validator.getAvailableSlots(
      validatedData.fasilitasId,
      validatedData.startDate,
      validatedData.endDate
    )

    return NextResponse.json({
      success: true,
      slots: availableSlots,
      count: availableSlots.length,
      message: `Ditemukan ${availableSlots.length} slot tersedia`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }
    throw error
  }
}