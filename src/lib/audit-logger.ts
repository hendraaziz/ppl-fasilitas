import { prisma } from './prisma'
import { StatusPeminjaman } from '@prisma/client'

// Interface untuk data audit log
export interface AuditLogData {
  userId: string
  peminjamanId?: string
  aksi: string
  deskripsi: string
  statusLama?: string
  statusBaru?: string
}

// Interface untuk query audit logs
export interface AuditLogQuery {
  userId?: string
  peminjamanId?: string
  aksi?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// Enum untuk jenis aksi audit
export enum AuditAction {
  // Peminjaman actions
  PEMINJAMAN_CREATED = 'PEMINJAMAN_CREATED',
  PEMINJAMAN_UPDATED = 'PEMINJAMAN_UPDATED',
  PEMINJAMAN_DELETED = 'PEMINJAMAN_DELETED',
  PEMINJAMAN_STATUS_CHANGED = 'PEMINJAMAN_STATUS_CHANGED',
  
  // File actions
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DELETED = 'FILE_DELETED',
  
  // Payment actions
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_STATUS_CHANGED = 'PAYMENT_STATUS_CHANGED',
  PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',
  
  // User actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  
  // Admin actions
  ADMIN_ACTION = 'ADMIN_ACTION',
  FACILITY_CREATED = 'FACILITY_CREATED',
  FACILITY_UPDATED = 'FACILITY_UPDATED',
  FACILITY_DELETED = 'FACILITY_DELETED',
  
  // System actions
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT'
}

export class AuditLogger {
  /**
   * Log aktivitas audit
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          peminjamanId: data.peminjamanId,
          aksi: data.aksi,
          deskripsi: data.deskripsi,
          statusLama: data.statusLama,
          statusBaru: data.statusBaru
        }
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Don't throw error to prevent breaking main functionality
    }
  }

  /**
   * Log pembuatan peminjaman baru
   */
  static async logPeminjamanCreated(
    userId: string,
    peminjamanId: string,
    fasilitasName: string,
    tglMulai: Date,
    tglSelesai: Date
  ): Promise<void> {
    await this.log({
      userId,
      peminjamanId,
      aksi: AuditAction.PEMINJAMAN_CREATED,
      deskripsi: `Peminjaman baru dibuat untuk fasilitas ${fasilitasName} (${tglMulai.toLocaleDateString()} - ${tglSelesai.toLocaleDateString()})`
    })
  }

  /**
   * Log perubahan status peminjaman
   */
  static async logPeminjamanStatusChanged(
    userId: string,
    peminjamanId: string,
    statusLama: StatusPeminjaman,
    statusBaru: StatusPeminjaman,
    alasan?: string
  ): Promise<void> {
    await this.log({
      userId,
      peminjamanId,
      aksi: AuditAction.PEMINJAMAN_STATUS_CHANGED,
      deskripsi: `Status peminjaman diubah dari ${statusLama} ke ${statusBaru}${alasan ? ` - ${alasan}` : ''}`,
      statusLama,
      statusBaru
    })
  }

  /**
   * Log upload file
   */
  static async logFileUploaded(
    userId: string,
    peminjamanId: string,
    fileType: 'surat_permohonan' | 'bukti_transfer' | 'sip',
    fileName: string,
    fileSize: number
  ): Promise<void> {
    await this.log({
      userId,
      peminjamanId,
      aksi: AuditAction.FILE_UPLOADED,
      deskripsi: `File ${fileType} berhasil diupload: ${fileName} (${Math.round(fileSize / 1024)} KB)`
    })
  }

  /**
   * Log pembayaran
   */
  static async logPaymentAction(
    userId: string,
    peminjamanId: string,
    action: 'created' | 'verified' | 'rejected',
    amount?: number,
    verifiedBy?: string
  ): Promise<void> {
    const actionMap = {
      created: 'Tagihan pembayaran dibuat',
      verified: 'Pembayaran diverifikasi',
      rejected: 'Pembayaran ditolak'
    }

    await this.log({
      userId,
      peminjamanId,
      aksi: AuditAction.PAYMENT_STATUS_CHANGED,
      deskripsi: `${actionMap[action]}${amount ? ` - Rp ${amount.toLocaleString()}` : ''}${verifiedBy ? ` oleh ${verifiedBy}` : ''}`
    })
  }

  /**
   * Log login user
   */
  static async logUserLogin(
    userId: string,
    loginMethod: 'password' | 'google' | 'otp',
    ipAddress?: string,

  ): Promise<void> {
    await this.log({
      userId,
      aksi: AuditAction.USER_LOGIN,
      deskripsi: `User login menggunakan ${loginMethod}${ipAddress ? ` dari ${ipAddress}` : ''}`
    })
  }

  /**
   * Log aksi admin
   */
  static async logAdminAction(
    adminUserId: string,
    action: string,
    targetUserId?: string,
    targetResource?: string,
    
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      aksi: AuditAction.ADMIN_ACTION,
      deskripsi: `Admin melakukan aksi: ${action}${targetResource ? ` pada ${targetResource}` : ''}`
    })
  }

  /**
   * Log error sistem
   */
  static async logSystemError(
    userId: string,
    error: Error,
    context?: string,
    
  ): Promise<void> {
    await this.log({
      userId,
      aksi: AuditAction.SYSTEM_ERROR,
      deskripsi: `System error: ${error.message}${context ? ` (${context})` : ''}`
    })
  }

  /**
   * Log export data
   */
  static async logDataExport(
    userId: string,
    exportType: string,
    _filters?: Record<string, unknown>,
    recordCount?: number
  ): Promise<void> {
    await this.log({
      userId,
      aksi: AuditAction.DATA_EXPORT,
      deskripsi: `Data export: ${exportType}${recordCount ? ` (${recordCount} records)` : ''}`
    })
  }

  /**
   * Query audit logs dengan filter
   */
  static async queryLogs(query: AuditLogQuery) {
    try {
      const whereClause: Record<string, unknown> = {}

      if (query.userId) {
        whereClause.userId = query.userId
      }

      if (query.peminjamanId) {
        whereClause.peminjamanId = query.peminjamanId
      }

      if (query.aksi) {
        whereClause.aksi = query.aksi
      }

      if (query.startDate || query.endDate) {
        whereClause.createdAt = {}
        if (query.startDate) {
          (whereClause.createdAt as Record<string, unknown>).gte = query.startDate
        }
        if (query.endDate) {
          (whereClause.createdAt as Record<string, unknown>).lte = query.endDate
        }
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                nama: true,
                email: true,
                role: true
              }
            },
            peminjaman: {
              select: {
                id: true,
                tglMulai: true,
                tglSelesai: true,
                status: true,
                fasilitas: {
                  select: {
                    nama: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: query.limit || 50,
          skip: query.offset || 0
        }),
        prisma.auditLog.count({ where: whereClause })
      ])

      return {
        logs,
        total,
        hasMore: (query.offset || 0) + logs.length < total
      }
    } catch (error) {
      console.error('Failed to query audit logs:', error)
      throw new Error('Gagal mengambil audit logs')
    }
  }

  /**
   * Get audit summary untuk dashboard
   */
  static async getAuditSummary(startDate?: Date, endDate?: Date) {
    try {
      const whereClause: Record<string, unknown> = {}
      
      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) {
          (whereClause.createdAt as Record<string, unknown>).gte = startDate
        }
        if (endDate) {
          (whereClause.createdAt as Record<string, unknown>).lte = endDate
        }
      }

      const [totalLogs, actionCounts, userActivity, recentErrors] = await Promise.all([
        // Total logs
        prisma.auditLog.count({ where: whereClause }),
        
        // Count by action type
        prisma.auditLog.groupBy({
          by: ['aksi'],
          where: whereClause,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 10
        }),
        
        // User activity
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: whereClause,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 10
        }),
        
        // Recent errors
        prisma.auditLog.findMany({
          where: {
            ...whereClause,
            aksi: AuditAction.SYSTEM_ERROR
          },
          include: {
            user: {
              select: {
                nama: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        })
      ])

      return {
        totalLogs,
        actionCounts: actionCounts.map(item => ({
          action: item.aksi,
          count: item._count.id
        })),
        userActivity: userActivity.map(item => ({
          userId: item.userId,
          count: item._count.id
        })),
        recentErrors
      }
    } catch (error) {
      console.error('Failed to get audit summary:', error)
      throw new Error('Gagal mengambil ringkasan audit')
    }
  }

  /**
   * Clean up old audit logs (untuk maintenance)
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      })

      console.log(`Cleaned up ${result.count} old audit logs`)
      return result.count
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error)
      throw new Error('Gagal membersihkan audit logs lama')
    }
  }
}

// Export utility functions
export const AuditUtils = {
  /**
   * Format audit log untuk display
   */
  formatLogForDisplay(log: { createdAt: Date | string, user?: { nama?: string }, deskripsi: string }): string {
    const timestamp = new Date(log.createdAt).toLocaleString('id-ID')
    const user = log.user?.nama || 'System'
    return `[${timestamp}] ${user}: ${log.deskripsi}`
  },

  /**
   * Get action description dalam bahasa Indonesia
   */
  getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      [AuditAction.PEMINJAMAN_CREATED]: 'Peminjaman Dibuat',
      [AuditAction.PEMINJAMAN_UPDATED]: 'Peminjaman Diperbarui',
      [AuditAction.PEMINJAMAN_STATUS_CHANGED]: 'Status Peminjaman Diubah',
      [AuditAction.FILE_UPLOADED]: 'File Diupload',
      [AuditAction.PAYMENT_STATUS_CHANGED]: 'Status Pembayaran Diubah',
      [AuditAction.USER_LOGIN]: 'User Login',
      [AuditAction.ADMIN_ACTION]: 'Aksi Admin',
      [AuditAction.SYSTEM_ERROR]: 'Error Sistem',
      [AuditAction.DATA_EXPORT]: 'Export Data'
    }
    
    return descriptions[action] || action
  },

  /**
   * Get severity level untuk action
   */
  getActionSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      [AuditAction.USER_LOGIN]: 'low',
      [AuditAction.PEMINJAMAN_CREATED]: 'medium',
      [AuditAction.PEMINJAMAN_STATUS_CHANGED]: 'medium',
      [AuditAction.PAYMENT_STATUS_CHANGED]: 'high',
      [AuditAction.ADMIN_ACTION]: 'high',
      [AuditAction.SYSTEM_ERROR]: 'critical'
    }
    
    return severityMap[action] || 'medium'
  }
}