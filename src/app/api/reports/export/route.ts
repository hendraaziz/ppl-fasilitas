import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { ExcelExportService } from '@/lib/excel-export'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { StatusPeminjaman, StatusPembayaran } from '@prisma/client'

// Schema untuk query parameters
const exportQuerySchema = z.object({
  type: z.enum(['bookings', 'facilities', 'users', 'audit']),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  status: z.nativeEnum(StatusPeminjaman).optional(),
  fasilitasId: z.string().optional(),
  userId: z.string().optional()
})

// GET /api/reports/export - Export laporan ke Excel
export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthenticatedUser(request)
    if (!authContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admin/petugas can export reports
    if (authContext.user.role !== 'PETUGAS') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = exportQuerySchema.parse({
      type: searchParams.get('type'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      status: searchParams.get('status'),
      fasilitasId: searchParams.get('fasilitasId'),
      userId: searchParams.get('userId')
    })

    let buffer: Buffer
    let filename: string

    switch (query.type) {
      case 'bookings':
        const bookingsData = await getBookingsData({
          startDate: query.startDate,
          endDate: query.endDate,
          status: query.status,
          fasilitasId: query.fasilitasId,
          userId: query.userId
        })
        
        const bookingsColumns = [
          { key: 'nomorPeminjaman', header: 'Nomor Peminjaman', width: 20 },
          { key: 'namaUser', header: 'Nama Peminjam', width: 25 },
          { key: 'emailUser', header: 'Email', width: 30 },
          { key: 'namaFasilitas', header: 'Fasilitas', width: 25 },
          { key: 'tglMulai', header: 'Tanggal Mulai', width: 15 },
          { key: 'tglSelesai', header: 'Tanggal Selesai', width: 15 },
          { key: 'tujuan', header: 'Tujuan', width: 30 },
          { key: 'status', header: 'Status', width: 15 },
          { key: 'biaya', header: 'Biaya', width: 15, format: 'currency' as const },
          { key: 'statusPembayaran', header: 'Status Pembayaran', width: 18 },
          { key: 'tanggalDibuat', header: 'Tanggal Dibuat', width: 18 }
        ]
        
        buffer = ExcelExportService.exportToBuffer({
          filename: 'laporan-peminjaman',
          sheetName: 'Laporan Peminjaman',
          columns: bookingsColumns,
          data: bookingsData,
          title: 'LAPORAN PEMINJAMAN FASILITAS',
          subtitle: `Periode: ${query.startDate?.toLocaleDateString('id-ID') || 'Semua'} - ${query.endDate?.toLocaleDateString('id-ID') || 'Semua'}`
        })
        filename = `laporan-peminjaman-${new Date().toISOString().split('T')[0]}`
        break

      case 'facilities':
        const facilitiesData = await getFacilitiesData()
        
        const facilitiesColumns = [
          { key: 'nama', header: 'Nama Fasilitas', width: 25 },
          { key: 'lokasi', header: 'Lokasi', width: 25 },
          { key: 'jenis', header: 'Jenis', width: 20 },
          { key: 'kapasitas', header: 'Kapasitas', width: 12, format: 'number' as const },
          { key: 'totalPeminjaman', header: 'Total Peminjaman', width: 18, format: 'number' as const },
          { key: 'totalPendapatan', header: 'Total Pendapatan', width: 18, format: 'currency' as const },
          { key: 'tingkatUtilisasi', header: 'Tingkat Utilisasi', width: 18 }
        ]
        
        buffer = ExcelExportService.exportToBuffer({
          filename: 'laporan-fasilitas',
          sheetName: 'Laporan Fasilitas',
          columns: facilitiesColumns,
          data: facilitiesData,
          title: 'LAPORAN DATA FASILITAS',
          subtitle: `Tanggal: ${new Date().toLocaleDateString('id-ID')}`
        })
        filename = `laporan-fasilitas-${new Date().toISOString().split('T')[0]}`
        break

      case 'users':
        const usersData = await getUsersData()
        
        const usersColumns = [
          { key: 'nama', header: 'Nama', width: 25 },
          { key: 'email', header: 'Email', width: 30 },
          { key: 'role', header: 'Role', width: 15 },
          { key: 'tipePengguna', header: 'Tipe Pengguna', width: 15 },
          { key: 'totalPeminjaman', header: 'Total Peminjaman', width: 18, format: 'number' as const },
          { key: 'totalPengeluaran', header: 'Total Pengeluaran', width: 18, format: 'currency' as const },
          { key: 'tanggalDaftar', header: 'Tanggal Daftar', width: 15 }
        ]
        
        buffer = ExcelExportService.exportToBuffer({
          filename: 'laporan-pengguna',
          sheetName: 'Laporan Pengguna',
          columns: usersColumns,
          data: usersData,
          title: 'LAPORAN DATA PENGGUNA',
          subtitle: `Tanggal: ${new Date().toLocaleDateString('id-ID')}`
        })
        filename = `laporan-pengguna-${new Date().toISOString().split('T')[0]}`
        break

      case 'audit':
        const auditData = await getAuditData({
          startDate: query.startDate,
          endDate: query.endDate
        })
        
        const auditColumns = [
          { key: 'namaUser', header: 'Nama User', width: 25 },
          { key: 'emailUser', header: 'Email User', width: 30 },
          { key: 'aksi', header: 'Aksi', width: 20 },
          { key: 'deskripsi', header: 'Deskripsi', width: 40 },
          { key: 'statusLama', header: 'Status Lama', width: 15 },
          { key: 'statusBaru', header: 'Status Baru', width: 15 },
          { key: 'fasilitas', header: 'Fasilitas', width: 25 },
          { key: 'tanggal', header: 'Tanggal', width: 15 },
          { key: 'waktu', header: 'Waktu', width: 15 }
        ]
        
        buffer = ExcelExportService.exportToBuffer({
          filename: 'laporan-audit-log',
          sheetName: 'Laporan Audit Log',
          columns: auditColumns,
          data: auditData,
          title: 'LAPORAN AUDIT LOG',
          subtitle: `Periode: ${query.startDate?.toLocaleDateString('id-ID') || 'Semua'} - ${query.endDate?.toLocaleDateString('id-ID') || 'Semua'}`
        })
        filename = `laporan-audit-log-${new Date().toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        )
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        'Content-Length': buffer.length.toString()
      }
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

    console.error('Failed to export report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions untuk mengambil data
async function getBookingsData(filter: {
  startDate?: Date
  endDate?: Date
  status?: StatusPeminjaman
  fasilitasId?: string
  userId?: string
}) {
  const whereClause: Record<string, unknown> = {}

  if (filter.startDate && filter.endDate) {
    whereClause.createdAt = {
      gte: filter.startDate,
      lte: filter.endDate
    }
  }

  if (filter.status) {
    whereClause.status = filter.status
  }

  if (filter.fasilitasId) {
    whereClause.fasilitasId = filter.fasilitasId
  }

  if (filter.userId) {
    whereClause.userId = filter.userId
  }

  const bookings = await prisma.peminjaman.findMany({
    where: whereClause,
    include: {
      user: true,
      fasilitas: true,
      tagihan: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return bookings.map((booking, index) => ({
    nomorPeminjaman: `BK${String(index + 1).padStart(4, '0')}`,
    namaUser: booking.user.nama,
    emailUser: booking.user.email,
    namaFasilitas: booking.fasilitas.nama,
    tglMulai: booking.tglMulai.toLocaleDateString('id-ID'),
    tglSelesai: booking.tglSelesai.toLocaleDateString('id-ID'),
    tujuan: booking.tujuan,
    status: translateStatus(booking.status),
    biaya: booking.tagihan?.biaya ? Number(booking.tagihan.biaya) : 0,
    statusPembayaran: booking.tagihan ? translatePaymentStatus(booking.tagihan.statusPembayaran) : 'Belum Ada Tagihan',
    tanggalDibuat: booking.createdAt.toLocaleDateString('id-ID')
  }))
}

async function getFacilitiesData() {
  const facilities = await prisma.fasilitas.findMany({
    include: {
      peminjaman: {
        include: {
          tagihan: true
        }
      }
    }
  })

  return facilities.map(facility => {
    const totalBookings = facility.peminjaman.length
    const totalRevenue = facility.peminjaman.reduce((sum, booking) => {
      return sum + (booking.tagihan?.biaya ? Number(booking.tagihan.biaya) : 0)
    }, 0)

    const approvedBookings = facility.peminjaman.filter(b => b.status === StatusPeminjaman.DISETUJUI).length
    const utilizationRate = totalBookings > 0 ? ((approvedBookings / totalBookings) * 100).toFixed(2) : '0.00'

    return {
      nama: facility.nama,
      lokasi: facility.lokasi,
      jenis: facility.jenis,
      kapasitas: facility.kapasitas,
      totalPeminjaman: totalBookings,
      totalPendapatan: totalRevenue,
      tingkatUtilisasi: `${utilizationRate}%`
    }
  })
}

async function getUsersData() {
  const users = await prisma.pengguna.findMany({
    include: {
      peminjaman: {
        include: {
          tagihan: true
        }
      }
    }
  })

  return users.map(user => {
    const totalBookings = user.peminjaman.length
    const totalSpending = user.peminjaman.reduce((sum, booking) => {
      return sum + (booking.tagihan?.biaya ? Number(booking.tagihan.biaya) : 0)
    }, 0)

    return {
      nama: user.nama,
      email: user.email,
      role: user.role,
      tipePengguna: user.tipePengguna || 'N/A',
      totalPeminjaman: totalBookings,
      totalPengeluaran: totalSpending,
      tanggalDaftar: user.createdAt.toLocaleDateString('id-ID')
    }
  })
}

async function getAuditData(filter: { startDate?: Date; endDate?: Date }) {
  const whereClause: Record<string, unknown> = {}

  if (filter.startDate && filter.endDate) {
    whereClause.createdAt = {
      gte: filter.startDate,
      lte: filter.endDate
    }
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: whereClause,
    include: {
      user: true,
      peminjaman: {
        include: {
          fasilitas: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return auditLogs.map(log => ({
    namaUser: log.user.nama,
    emailUser: log.user.email,
    aksi: log.aksi,
    deskripsi: log.deskripsi,
    statusLama: log.statusLama || 'N/A',
    statusBaru: log.statusBaru || 'N/A',
    fasilitas: log.peminjaman?.fasilitas.nama || 'N/A',
    tanggal: log.createdAt.toLocaleDateString('id-ID'),
    waktu: log.createdAt.toLocaleTimeString('id-ID')
  }))
}

// Helper functions untuk translate status
function translateStatus(status: StatusPeminjaman): string {
  const statusMap = {
    [StatusPeminjaman.DIPROSES]: 'Diproses',
    [StatusPeminjaman.DISETUJUI]: 'Disetujui',
    [StatusPeminjaman.DITOLAK]: 'Ditolak',
    [StatusPeminjaman.PERLU_REVISI]: 'Perlu Revisi'
  }
  return statusMap[status] || status
}

function translatePaymentStatus(status: StatusPembayaran): string {
  const statusMap = {
    [StatusPembayaran.BELUM_BAYAR]: 'Belum Bayar',
    [StatusPembayaran.SUDAH_BAYAR]: 'Sudah Bayar',
    [StatusPembayaran.VERIFIKASI]: 'Verifikasi'
  }
  return statusMap[status] || status
}