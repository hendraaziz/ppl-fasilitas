import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Format email tidak valid')
export const passwordSchema = z.string().min(6, 'Password minimal 6 karakter')
export const nameSchema = z.string().min(1, 'Nama harus diisi')
export const phoneSchema = z.string().regex(/^[0-9+\-\s()]+$/, 'Format nomor telepon tidak valid')

// Date validation helpers
export const dateSchema = z.string().refine((date) => {
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}, 'Format tanggal tidak valid')

export const futureDateSchema = z.string().refine((date) => {
  const bookingDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return bookingDate >= today
}, 'Tanggal tidak boleh di masa lalu')

// Time validation
export const timeSchema = z.string().regex(
  /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  'Format jam tidak valid (HH:MM)'
)

// File validation
export const fileSchema = z.object({
  name: z.string(),
  size: z.number().max(5 * 1024 * 1024, 'Ukuran file maksimal 5MB'),
  type: z.string().refine(
    (type) => type === 'application/pdf',
    'Hanya file PDF yang diizinkan'
  )
})

// Booking validation schema
export const bookingValidationSchema = z.object({
  fasilitasId: z.string().min(1, 'Fasilitas harus dipilih'),
  tglMulai: futureDateSchema,
  tglSelesai: dateSchema,
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

// Facility validation schema
export const facilityValidationSchema = z.object({
  nama: z.string().min(1, 'Nama fasilitas harus diisi'),
  lokasi: z.string().min(1, 'Lokasi harus diisi'),
  jenis: z.string().min(1, 'Jenis fasilitas harus diisi'),
  kapasitas: z.number().min(1, 'Kapasitas minimal 1 orang'),
  deskripsi: z.string().optional()
})

// User validation schema
export const userValidationSchema = z.object({
  nama: nameSchema,
  email: emailSchema,
  role: z.enum(['MAHASISWA', 'PETUGAS', 'EKSTERNAL']),
  tipePengguna: z.enum(['MAHASISWA', 'EKSTERNAL']),
  password: passwordSchema.optional(),
  googleId: z.string().optional()
}).refine((data) => {
  // Password required for PETUGAS role
  if (data.role === 'PETUGAS' && !data.password) {
    return false
  }
  return true
}, {
  message: 'Password diperlukan untuk petugas'
})

// Profile update schema
export const profileUpdateSchema = z.object({
  nama: nameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional()
})

// Login validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password harus diisi')
})

// OTP validation schema
export const otpSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, 'OTP harus 6 digit')
})

// Validation helper functions
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success
}

export function validateDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return end >= start
}

export function validateTimeRange(startTime: string, endTime: string): boolean {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  return endMinutes > startMinutes
}

export function validateFileSize(size: number, maxSize: number = 5 * 1024 * 1024): boolean {
  return size <= maxSize
}

export function validateFileType(type: string, allowedTypes: string[] = ['application/pdf']): boolean {
  return allowedTypes.includes(type)
}

// Business logic validation
export function validateBookingConflict(
  existingBookings: Array<{
    tglMulai: Date
    tglSelesai: Date
  }>,
  newBooking: {
    tglMulai: Date
    tglSelesai: Date
  }
): boolean {
  return existingBookings.some(booking => {
    return (
      (newBooking.tglMulai >= booking.tglMulai && newBooking.tglMulai <= booking.tglSelesai) ||
      (newBooking.tglSelesai >= booking.tglMulai && newBooking.tglSelesai <= booking.tglSelesai) ||
      (newBooking.tglMulai <= booking.tglMulai && newBooking.tglSelesai >= booking.tglSelesai)
    )
  })
}

export function validateCapacity(requestedCapacity: number, facilityCapacity: number): boolean {
  return requestedCapacity <= facilityCapacity
}

// Error formatting helper
export function formatValidationErrors(errors: z.ZodIssue[]): Record<string, string> {
  return errors.reduce((acc, error) => {
    const path = error.path.join('.')
    acc[path] = error.message
    return acc
  }, {} as Record<string, string>)
}