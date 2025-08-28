import { prisma } from './prisma'
import { StatusPeminjaman, StatusPembayaran, JenisNotifikasi } from '@prisma/client'

// Status workflow management
export class BookingWorkflow {
  static readonly VALID_TRANSITIONS: Record<StatusPeminjaman, StatusPeminjaman[]> = {
    DIPROSES: ['DISETUJUI', 'DITOLAK', 'PERLU_REVISI'],
    DISETUJUI: ['DITOLAK'], // Can be cancelled by admin
    DITOLAK: [], // Final state
    PERLU_REVISI: ['DIPROSES', 'DITOLAK'] // User can resubmit or admin can reject
  }

  static canTransition(from: StatusPeminjaman, to: StatusPeminjaman): boolean {
    return this.VALID_TRANSITIONS[from]?.includes(to) || false
  }

  static getAvailableTransitions(currentStatus: StatusPeminjaman): StatusPeminjaman[] {
    return this.VALID_TRANSITIONS[currentStatus] || []
  }

  static async updateBookingStatus(
    bookingId: string,
    newStatus: StatusPeminjaman,
    userId: string,
    reason?: string
  ) {
    const booking = await prisma.peminjaman.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        fasilitas: true
      }
    })

    if (!booking) {
      throw new Error('Peminjaman tidak ditemukan')
    }

    if (!this.canTransition(booking.status, newStatus)) {
      throw new Error(`Tidak dapat mengubah status dari ${booking.status} ke ${newStatus}`)
    }

    // Update booking status
    const updatedBooking = await prisma.peminjaman.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        ...(newStatus === 'DITOLAK' && reason && { alasanTolak: reason })
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        peminjamanId: bookingId,
        aksi: `STATUS_CHANGE_${newStatus}`,
        deskripsi: `Status peminjaman diubah dari ${booking.status} ke ${newStatus}${reason ? ` dengan alasan: ${reason}` : ''}`,
        statusLama: booking.status,
        statusBaru: newStatus
      }
    })

    // Send notification
    await this.sendStatusNotification(booking, newStatus, reason)

    return updatedBooking
  }

  private static async sendStatusNotification(
    booking: { fasilitas: { nama: string }, userId: string, user: { email: string } },
    newStatus: StatusPeminjaman,
    reason?: string
  ) {
    let jenisNotifikasi: JenisNotifikasi
    let judul: string
    let pesan: string

    switch (newStatus) {
      case 'DISETUJUI':
        jenisNotifikasi = 'DISETUJUI'
        judul = 'Peminjaman Disetujui'
        pesan = `Peminjaman fasilitas ${booking.fasilitas.nama} Anda telah disetujui.`
        break
      case 'DITOLAK':
        jenisNotifikasi = 'DITOLAK'
        judul = 'Peminjaman Ditolak'
        pesan = `Peminjaman fasilitas ${booking.fasilitas.nama} Anda ditolak.${reason ? ` Alasan: ${reason}` : ''}`
        break
      case 'PERLU_REVISI':
        jenisNotifikasi = 'REVISI'
        judul = 'Peminjaman Perlu Revisi'
        pesan = `Peminjaman fasilitas ${booking.fasilitas.nama} Anda perlu direvisi.${reason ? ` Catatan: ${reason}` : ''}`
        break
      default:
        return // No notification for other statuses
    }

    await prisma.notifikasi.create({
      data: {
        userId: booking.userId,
        jenis: jenisNotifikasi,
        judul,
        pesan,
        tujuan: booking.user.email
      }
    })
  }
}

// Payment workflow management
export class PaymentWorkflow {
  static readonly VALID_TRANSITIONS: Record<StatusPembayaran, StatusPembayaran[]> = {
    BELUM_BAYAR: ['VERIFIKASI'],
    VERIFIKASI: ['SUDAH_BAYAR', 'BELUM_BAYAR'], // Can approve or reject
    SUDAH_BAYAR: [] // Final state
  }

  static canTransition(from: StatusPembayaran, to: StatusPembayaran): boolean {
    return this.VALID_TRANSITIONS[from]?.includes(to) || false
  }

  static getAvailableTransitions(currentStatus: StatusPembayaran): StatusPembayaran[] {
    return this.VALID_TRANSITIONS[currentStatus] || []
  }

  static async updatePaymentStatus(
    peminjamanId: string,
    newStatus: StatusPembayaran,
    userId: string
  ) {
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
      throw new Error('Tagihan tidak ditemukan')
    }

    if (!this.canTransition(tagihan.statusPembayaran, newStatus)) {
      throw new Error(`Tidak dapat mengubah status pembayaran dari ${tagihan.statusPembayaran} ke ${newStatus}`)
    }

    // Update payment status
    const updatedTagihan = await prisma.tagihan.update({
      where: { peminjamanId },
      data: {
        statusPembayaran: newStatus
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        peminjamanId,
        aksi: `PAYMENT_STATUS_CHANGE_${newStatus}`,
        deskripsi: `Status pembayaran diubah dari ${tagihan.statusPembayaran} ke ${newStatus}`,
        statusLama: tagihan.statusPembayaran,
        statusBaru: newStatus
      }
    })

    // Send notification
    if (newStatus === 'SUDAH_BAYAR') {
      await prisma.notifikasi.create({
        data: {
          userId: tagihan.peminjaman.userId,
          jenis: 'PEMBAYARAN',
          judul: 'Pembayaran Dikonfirmasi',
          pesan: `Pembayaran untuk peminjaman fasilitas ${tagihan.peminjaman.fasilitas.nama} telah dikonfirmasi.`,
          tujuan: tagihan.peminjaman.user.email
        }
      })
    }

    return updatedTagihan
  }
}

// Booking conflict checker
export class ConflictChecker {
  static async checkBookingConflict(
    fasilitasId: string,
    tglMulai: Date,
    tglSelesai: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const conflictingBookings = await prisma.peminjaman.findMany({
      where: {
        fasilitasId,
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        status: {
          in: ['DIPROSES', 'DISETUJUI']
        },
        OR: [
          {
            AND: [
              { tglMulai: { lte: tglMulai } },
              { tglSelesai: { gte: tglMulai } }
            ]
          },
          {
            AND: [
              { tglMulai: { lte: tglSelesai } },
              { tglSelesai: { gte: tglSelesai } }
            ]
          },
          {
            AND: [
              { tglMulai: { gte: tglMulai } },
              { tglSelesai: { lte: tglSelesai } }
            ]
          }
        ]
      }
    })

    return conflictingBookings.length > 0
  }

  static async getConflictingBookings(
    fasilitasId: string,
    tglMulai: Date,
    tglSelesai: Date,
    excludeBookingId?: string
  ) {
    return await prisma.peminjaman.findMany({
      where: {
        fasilitasId,
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        status: {
          in: ['DIPROSES', 'DISETUJUI']
        },
        OR: [
          {
            AND: [
              { tglMulai: { lte: tglMulai } },
              { tglSelesai: { gte: tglMulai } }
            ]
          },
          {
            AND: [
              { tglMulai: { lte: tglSelesai } },
              { tglSelesai: { gte: tglSelesai } }
            ]
          },
          {
            AND: [
              { tglMulai: { gte: tglMulai } },
              { tglSelesai: { lte: tglSelesai } }
            ]
          }
        ]
      },
      include: {
        user: {
          select: {
            nama: true,
            email: true
          }
        }
      }
    })
  }
}

// Document generator
export class DocumentGenerator {
  static async generateSIP(peminjamanId: string): Promise<string> {
    const peminjaman = await prisma.peminjaman.findUnique({
      where: { id: peminjamanId },
      include: {
        user: true,
        fasilitas: true
      }
    })

    if (!peminjaman) {
      throw new Error('Peminjaman tidak ditemukan')
    }

    if (peminjaman.status !== 'DISETUJUI') {
      throw new Error('SIP hanya dapat dibuat untuk peminjaman yang disetujui')
    }

    // Generate SIP number
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const count = await prisma.sIP.count({
      where: {
        tanggalTerbit: {
          gte: new Date(year, new Date().getMonth(), 1)
        }
      }
    })
    const sipNumber = `SIP/${year}/${month}/${String(count + 1).padStart(3, '0')}`

    // Create SIP record
    const sip = await prisma.sIP.create({
      data: {
        peminjamanId,
        noSurat: sipNumber,
        fileUrl: `sip/${sipNumber.replace(/\//g, '_')}.pdf` // Placeholder for actual file
      }
    })

    // TODO: Generate actual PDF file using a PDF library
    // This would involve creating a PDF with the booking details
    // and saving it to the file system

    return sip.noSurat
  }
}

// Notification helper
export class NotificationHelper {
  static async createNotification(
    userId: string,
    jenis: JenisNotifikasi,
    judul: string,
    pesan: string,
    tujuan: string
  ) {
    return await prisma.notifikasi.create({
      data: {
        userId,
        jenis,
        judul,
        pesan,
        tujuan
      }
    })
  }

  static async markAsRead(notificationId: string) {
    return await prisma.notifikasi.update({
      where: { id: notificationId },
      data: { statusDibaca: true }
    })
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notifikasi.count({
      where: {
        userId,
        statusDibaca: false
      }
    })
  }
}