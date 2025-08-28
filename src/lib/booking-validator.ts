import { prisma } from './prisma'
import { StatusPeminjaman } from '@prisma/client'

// Interface untuk data peminjaman yang akan divalidasi
export interface BookingValidationData {
  fasilitasId: string
  tglMulai: Date
  tglSelesai: Date
  userId?: string
  excludePeminjamanId?: string // Untuk update peminjaman
}

// Interface untuk hasil validasi
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  conflictingBookings?: ConflictingBooking[]
}

// Interface untuk peminjaman yang konflik
export interface ConflictingBooking {
  id: string
  userId: string
  userName: string
  tglMulai: Date
  tglSelesai: Date
  status: StatusPeminjaman
  tujuan: string
}

// Interface untuk aturan bisnis
export interface BusinessRules {
  maxBookingDaysInAdvance: number
  minBookingDaysInAdvance: number
  maxBookingDuration: number
  allowWeekendBooking: boolean
  allowHolidayBooking: boolean
  workingHours: {
    start: string // Format: "HH:mm"
    end: string   // Format: "HH:mm"
  }
}

// Default business rules
const DEFAULT_BUSINESS_RULES: BusinessRules = {
  maxBookingDaysInAdvance: 30,
  minBookingDaysInAdvance: 1,
  maxBookingDuration: 7, // maksimal 7 hari
  allowWeekendBooking: false,
  allowHolidayBooking: false,
  workingHours: {
    start: "08:00",
    end: "17:00"
  }
}

export class BookingValidator {
  private rules: BusinessRules

  constructor(customRules?: Partial<BusinessRules>) {
    this.rules = { ...DEFAULT_BUSINESS_RULES, ...customRules }
  }

  /**
   * Validasi peminjaman baru atau update
   */
  async validateBooking(data: BookingValidationData): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    let conflictingBookings: ConflictingBooking[] = []

    try {
      // 1. Validasi format tanggal
      const dateValidation = this.validateDates(data.tglMulai, data.tglSelesai)
      if (!dateValidation.isValid) {
        errors.push(...dateValidation.errors)
      }

      // 2. Validasi aturan bisnis
      const businessValidation = this.validateBusinessRules(data.tglMulai, data.tglSelesai)
      if (!businessValidation.isValid) {
        errors.push(...businessValidation.errors)
        warnings.push(...businessValidation.warnings)
      }

      // 3. Cek konflik dengan peminjaman lain
      if (errors.length === 0) {
        const conflictValidation = await this.checkBookingConflicts(data)
        if (!conflictValidation.isValid) {
          errors.push(...conflictValidation.errors)
          conflictingBookings = conflictValidation.conflictingBookings || []
        }
      }

      // 4. Validasi kapasitas fasilitas (jika diperlukan)
      const capacityValidation = await this.validateFacilityCapacity(data.fasilitasId)
      if (!capacityValidation.isValid) {
        warnings.push(...capacityValidation.warnings)
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        conflictingBookings: conflictingBookings.length > 0 ? conflictingBookings : undefined
      }

    } catch (error) {
      console.error('Booking validation error:', error)
      return {
        isValid: false,
        errors: ['Terjadi kesalahan saat validasi peminjaman'],
        warnings: []
      }
    }
  }

  /**
   * Validasi format dan logika tanggal
   */
  private validateDates(tglMulai: Date, tglSelesai: Date): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Cek apakah tanggal valid
    if (isNaN(tglMulai.getTime())) {
      errors.push('Tanggal mulai tidak valid')
    }

    if (isNaN(tglSelesai.getTime())) {
      errors.push('Tanggal selesai tidak valid')
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    // Cek urutan tanggal
    if (tglMulai >= tglSelesai) {
      errors.push('Tanggal mulai harus lebih awal dari tanggal selesai')
    }

    // Cek apakah tanggal di masa lalu
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (tglMulai < today) {
      errors.push('Tanggal mulai tidak boleh di masa lalu')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validasi aturan bisnis
   */
  private validateBusinessRules(tglMulai: Date, tglSelesai: Date): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Cek jarak hari dari sekarang
    const daysFromNow = Math.ceil((tglMulai.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysFromNow < this.rules.minBookingDaysInAdvance) {
      errors.push(`Peminjaman harus dilakukan minimal ${this.rules.minBookingDaysInAdvance} hari sebelumnya`)
    }

    if (daysFromNow > this.rules.maxBookingDaysInAdvance) {
      errors.push(`Peminjaman tidak dapat dilakukan lebih dari ${this.rules.maxBookingDaysInAdvance} hari ke depan`)
    }

    // Cek durasi peminjaman
    const duration = Math.ceil((tglSelesai.getTime() - tglMulai.getTime()) / (1000 * 60 * 60 * 24))
    
    if (duration > this.rules.maxBookingDuration) {
      errors.push(`Durasi peminjaman maksimal ${this.rules.maxBookingDuration} hari`)
    }

    // Cek hari weekend
    if (!this.rules.allowWeekendBooking) {
      const startDay = tglMulai.getDay()
      const endDay = tglSelesai.getDay()
      
      if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
        warnings.push('Peminjaman di hari weekend mungkin tidak diizinkan')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Cek konflik dengan peminjaman lain
   */
  private async checkBookingConflicts(data: BookingValidationData): Promise<ValidationResult> {
    const errors: string[] = []
    const conflictingBookings: ConflictingBooking[] = []

    try {
      // Query peminjaman yang berpotensi konflik
      const whereClause: Record<string, unknown> = {
        fasilitasId: data.fasilitasId,
        status: {
          in: [StatusPeminjaman.DIPROSES, StatusPeminjaman.DISETUJUI]
        },
        OR: [
          {
            // Peminjaman yang dimulai di antara tanggal yang diminta
            tglMulai: {
              gte: data.tglMulai,
              lt: data.tglSelesai
            }
          },
          {
            // Peminjaman yang berakhir di antara tanggal yang diminta
            tglSelesai: {
              gt: data.tglMulai,
              lte: data.tglSelesai
            }
          },
          {
            // Peminjaman yang mencakup seluruh periode yang diminta
            AND: [
              { tglMulai: { lte: data.tglMulai } },
              { tglSelesai: { gte: data.tglSelesai } }
            ]
          }
        ]
      }

      // Exclude peminjaman yang sedang diupdate
      if (data.excludePeminjamanId) {
        whereClause.id = {
          not: data.excludePeminjamanId
        }
      }

      const conflictingPeminjaman = await prisma.peminjaman.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              nama: true
            }
          }
        }
      })

      if (conflictingPeminjaman.length > 0) {
        errors.push('Fasilitas sudah dipesan pada periode yang diminta')
        
        conflictingBookings.push(...conflictingPeminjaman.map(p => ({
          id: p.id,
          userId: p.userId,
          userName: p.user.nama,
          tglMulai: p.tglMulai,
          tglSelesai: p.tglSelesai,
          status: p.status,
          tujuan: p.tujuan
        })))
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: [],
        conflictingBookings
      }

    } catch (error) {
      console.error('Error checking booking conflicts:', error)
      return {
        isValid: false,
        errors: ['Gagal memeriksa konflik peminjaman'],
        warnings: []
      }
    }
  }

  /**
   * Validasi kapasitas fasilitas
   */
  private async validateFacilityCapacity(fasilitasId: string): Promise<ValidationResult> {
    const warnings: string[] = []

    try {
      const fasilitas = await prisma.fasilitas.findUnique({
        where: { id: fasilitasId },
        select: {
          kapasitas: true,
          nama: true
        }
      })

      if (!fasilitas) {
        return {
          isValid: false,
          errors: ['Fasilitas tidak ditemukan'],
          warnings: []
        }
      }

      if (fasilitas.kapasitas < 10) {
        warnings.push(`Fasilitas ${fasilitas.nama} memiliki kapasitas terbatas (${fasilitas.kapasitas} orang)`)
      }

      return {
        isValid: true,
        errors: [],
        warnings
      }

    } catch (error) {
      console.error('Error validating facility capacity:', error)
      return {
        isValid: true,
        errors: [],
        warnings: ['Gagal memeriksa kapasitas fasilitas']
      }
    }
  }

  /**
   * Cek ketersediaan fasilitas pada periode tertentu
   */
  async checkAvailability(fasilitasId: string, tglMulai: Date, tglSelesai: Date): Promise<boolean> {
    try {
      const conflictingBookings = await prisma.peminjaman.count({
        where: {
          fasilitasId,
          status: {
            in: [StatusPeminjaman.DIPROSES, StatusPeminjaman.DISETUJUI]
          },
          OR: [
            {
              tglMulai: {
                gte: tglMulai,
                lt: tglSelesai
              }
            },
            {
              tglSelesai: {
                gt: tglMulai,
                lte: tglSelesai
              }
            },
            {
              AND: [
                { tglMulai: { lte: tglMulai } },
                { tglSelesai: { gte: tglSelesai } }
              ]
            }
          ]
        }
      })

      return conflictingBookings === 0
    } catch (error) {
      console.error('Error checking availability:', error)
      return false
    }
  }

  /**
   * Dapatkan slot waktu yang tersedia untuk fasilitas
   */
  async getAvailableSlots(fasilitasId: string, startDate: Date, endDate: Date): Promise<{ start: Date, end: Date }[]> {
    try {
      const bookedSlots = await prisma.peminjaman.findMany({
        where: {
          fasilitasId,
          status: {
            in: [StatusPeminjaman.DIPROSES, StatusPeminjaman.DISETUJUI]
          },
          OR: [
            {
              tglMulai: {
                gte: startDate,
                lte: endDate
              }
            },
            {
              tglSelesai: {
                gte: startDate,
                lte: endDate
              }
            },
            {
              AND: [
                { tglMulai: { lte: startDate } },
                { tglSelesai: { gte: endDate } }
              ]
            }
          ]
        },
        select: {
          tglMulai: true,
          tglSelesai: true
        },
        orderBy: {
          tglMulai: 'asc'
        }
      })

      // Algoritma sederhana untuk mencari slot kosong
      const availableSlots: { start: Date, end: Date }[] = []
      let currentStart = new Date(startDate)

      for (const booking of bookedSlots) {
        if (currentStart < booking.tglMulai) {
          availableSlots.push({
            start: new Date(currentStart),
            end: new Date(booking.tglMulai)
          })
        }
        currentStart = new Date(Math.max(currentStart.getTime(), booking.tglSelesai.getTime()))
      }

      // Tambahkan slot terakhir jika ada
      if (currentStart < endDate) {
        availableSlots.push({
          start: new Date(currentStart),
          end: new Date(endDate)
        })
      }

      return availableSlots
    } catch (error) {
      console.error('Error getting available slots:', error)
      return []
    }
  }
}

// Export instance default
export const bookingValidator = new BookingValidator()

// Export utility functions
export const BookingUtils = {
  /**
   * Format tanggal untuk display
   */
  formatDateRange(tglMulai: Date, tglSelesai: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    
    const startStr = tglMulai.toLocaleDateString('id-ID', options)
    const endStr = tglSelesai.toLocaleDateString('id-ID', options)
    
    return `${startStr} - ${endStr}`
  },

  /**
   * Hitung durasi dalam hari
   */
  calculateDuration(tglMulai: Date, tglSelesai: Date): number {
    return Math.ceil((tglSelesai.getTime() - tglMulai.getTime()) / (1000 * 60 * 60 * 24))
  },

  /**
   * Cek apakah tanggal adalah weekend
   */
  isWeekend(date: Date): boolean {
    const day = date.getDay()
    return day === 0 || day === 6
  },

  /**
   * Dapatkan hari kerja berikutnya
   */
  getNextWorkingDay(date: Date): Date {
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    
    while (this.isWeekend(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1)
    }
    
    return nextDay
  }
}