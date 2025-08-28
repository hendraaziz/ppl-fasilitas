import { prisma } from '@/lib/prisma'
import { JenisNotifikasi } from '@prisma/client'
import nodemailer from 'nodemailer'
import { AuditLogger } from './audit-logger'

// Interface untuk data notifikasi
export interface NotificationData {
  userId: string
  judul: string
  pesan: string
  jenis: JenisNotifikasi
  tujuan: string
  peminjamanId?: string
  metadata?: Record<string, unknown>
}

// Interface untuk template email
export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

// Interface untuk konfigurasi email
export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter | null = null
  private auditLogger: AuditLogger

  constructor() {
    this.auditLogger = new AuditLogger()
    this.initializeEmailTransporter()
  }

  private initializeEmailTransporter() {
    try {
      const emailConfig: EmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      }

      if (emailConfig.auth.user && emailConfig.auth.pass) {
        this.emailTransporter = nodemailer.createTransport(emailConfig)
      } else {
        console.warn('Email configuration not found. Email notifications will be disabled.')
      }
    } catch (error) {
      console.error('Failed to initialize email transporter:', error)
    }
  }

  // Buat notifikasi baru
  async createNotification(data: NotificationData): Promise<void> {
    try {
      await prisma.notifikasi.create({
        data: {
          userId: data.userId,
          judul: data.judul,
          pesan: data.pesan,
          jenis: data.jenis,
          tujuan: data.tujuan,
          statusDibaca: false
        }
      })

      // Kirim email jika diperlukan dan konfigurasi tersedia
      if (data.tujuan && this.emailTransporter) {
        await this.sendEmailNotification(data)
      }

      console.log(`Notification created for user ${data.userId}: ${data.judul}`)
    } catch (error) {
      console.error('Failed to create notification:', error)
      await AuditLogger.logSystemError(
        data.userId,
        error as Error,
        'notification_creation'
      )
      throw error
    }
  }

  // Kirim notifikasi email
  private async sendEmailNotification(data: NotificationData): Promise<void> {
    if (!this.emailTransporter || !data.tujuan) {
      return
    }

    try {
      const template = this.generateEmailTemplate(data)
      
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: data.tujuan,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      console.log(`Email sent to ${data.tujuan}: ${data.judul}`)
    } catch (error) {
      console.error('Failed to send email notification:', error)
      await AuditLogger.logSystemError(
        data.userId,
        error as Error,
        'email_notification'
      )
    }
  }

  // Generate template email
  private generateEmailTemplate(data: NotificationData): EmailTemplate {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const template: EmailTemplate = {
      subject: `[Sistem Booking Fasilitas] ${data.judul}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${data.judul}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${data.judul}</h2>
            </div>
            <div class="content">
              <p>${data.pesan.replace(/\n/g, '<br>')}</p>
              ${data.peminjamanId ? `<a href="${baseUrl}/dashboard/bookings/${data.peminjamanId}" class="button">Lihat Detail Peminjaman</a>` : ''}
            </div>
            <div class="footer">
              <p>Email ini dikirim secara otomatis oleh Sistem Booking Fasilitas.</p>
              <p>Jangan membalas email ini.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${data.judul}\n\n${data.pesan}\n\n${data.peminjamanId ? `Lihat detail: ${baseUrl}/dashboard/bookings/${data.peminjamanId}` : ''}`
    }

    return template
  }

  // Notifikasi untuk peminjaman baru
  async notifyNewBooking(userId: string, peminjamanId: string, fasilitasName: string, userEmail: string): Promise<void> {
    await this.createNotification({
      userId,
      judul: 'Peminjaman Berhasil Dibuat',
      pesan: `Peminjaman fasilitas ${fasilitasName} berhasil dibuat dan sedang menunggu persetujuan dari petugas.`,
      jenis: JenisNotifikasi.DISETUJUI,
      tujuan: userEmail,
      peminjamanId
    })
  }

  // Notifikasi untuk persetujuan peminjaman
  async notifyBookingApproved(userId: string, peminjamanId: string, fasilitasName: string, userEmail: string): Promise<void> {
    await this.createNotification({
      userId,
      judul: 'Peminjaman Disetujui',
      pesan: `Peminjaman fasilitas ${fasilitasName} telah disetujui. Silakan lakukan pembayaran untuk mengkonfirmasi peminjaman.`,
      jenis: JenisNotifikasi.DISETUJUI,
      tujuan: userEmail,
      peminjamanId
    })
  }

  // Notifikasi untuk penolakan peminjaman
  async notifyBookingRejected(userId: string, peminjamanId: string, fasilitasName: string, userEmail: string, alasan?: string): Promise<void> {
    await this.createNotification({
      userId,
      judul: 'Peminjaman Ditolak',
      pesan: `Peminjaman fasilitas ${fasilitasName} ditolak.${alasan ? ` Alasan: ${alasan}` : ''}`,
      jenis: JenisNotifikasi.DITOLAK,
      tujuan: userEmail,
      peminjamanId
    })
  }

  // Notifikasi untuk pembayaran berhasil
  async notifyPaymentConfirmed(userId: string, peminjamanId: string, fasilitasName: string, userEmail: string): Promise<void> {
    await this.createNotification({
      userId,
      judul: 'Pembayaran Dikonfirmasi',
      pesan: `Pembayaran untuk peminjaman fasilitas ${fasilitasName} telah dikonfirmasi. Peminjaman Anda telah aktif.`,
      jenis: JenisNotifikasi.PEMBAYARAN,
      tujuan: userEmail,
      peminjamanId
    })
  }

  // Notifikasi reminder
  async notifyBookingReminder(userId: string, peminjamanId: string, fasilitasName: string, userEmail: string, reminderType: 'upcoming' | 'overdue'): Promise<void> {
    const messages = {
      upcoming: `Pengingat: Peminjaman fasilitas ${fasilitasName} akan dimulai besok. Pastikan Anda sudah siap.`,
      overdue: `Peringatan: Peminjaman fasilitas ${fasilitasName} telah berakhir. Harap segera mengembalikan fasilitas.`
    }

    await this.createNotification({
      userId,
      judul: reminderType === 'upcoming' ? 'Pengingat Peminjaman' : 'Peringatan Keterlambatan',
      pesan: messages[reminderType],
      jenis: JenisNotifikasi.REVISI,
      tujuan: userEmail,
      peminjamanId
    })
  }

  // Notifikasi untuk admin/petugas
  async notifyAdminNewBooking(adminUserId: string, peminjamanId: string, fasilitasName: string, userName: string, adminEmail: string): Promise<void> {
    await this.createNotification({
      userId: adminUserId,
      judul: 'Peminjaman Baru Menunggu Persetujuan',
      pesan: `Peminjaman baru untuk fasilitas ${fasilitasName} dari ${userName} menunggu persetujuan Anda.`,
      jenis: JenisNotifikasi.DISETUJUI,
      tujuan: adminEmail,
      peminjamanId
    })
  }

  // Notifikasi untuk upload file
  async notifyFileUploaded(userId: string, peminjamanId: string, fileName: string, fileType: string, userEmail: string): Promise<void> {
    await this.createNotification({
      userId,
      judul: 'File Berhasil Diupload',
      pesan: `File ${fileType} (${fileName}) berhasil diupload untuk peminjaman Anda.`,
      jenis: JenisNotifikasi.REVISI,
      tujuan: userEmail,
      peminjamanId
    })
  }

  // Ambil notifikasi user
  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const [notifications, total] = await Promise.all([
        prisma.notifikasi.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,

        }),
        prisma.notifikasi.count({
          where: { userId }
        })
      ])

      const unreadCount = await prisma.notifikasi.count({
        where: {
          userId,
          statusDibaca: false
        }
      })

      return {
        notifications,
        total,
        unreadCount,
        hasMore: offset + notifications.length < total
      }
    } catch (error) {
      console.error('Failed to get user notifications:', error)
      throw error
    }
  }

  // Tandai notifikasi sebagai dibaca
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notifikasi.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          statusDibaca: true
        }
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  // Tandai semua notifikasi sebagai dibaca
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notifikasi.updateMany({
        where: {
          userId,
          statusDibaca: false
        },
        data: {
          statusDibaca: true
        }
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  // Hapus notifikasi lama (cleanup)
  async cleanupOldNotifications(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await prisma.notifikasi.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          statusDibaca: true
        }
      })

      console.log(`Cleaned up ${result.count} old notifications`)
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error)
      throw error
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()