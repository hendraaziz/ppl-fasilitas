import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { StatusPeminjaman, TipePengguna } from '@prisma/client'

// GET /api/reports - Generate various reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const fasilitasId = searchParams.get('fasilitasId')
    const status = searchParams.get('status') as StatusPeminjaman | null
    const format = searchParams.get('format') || 'json' // json or csv

    if (!reportType) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      )
    }

    let data: Record<string, unknown>
    let filename: string

    switch (reportType) {
      case 'bookings':
        data = await generateBookingsReport(startDate, endDate, fasilitasId, status)
        filename = `laporan-peminjaman-${new Date().toISOString().split('T')[0]}`
        break

      case 'facilities':
        data = await generateFacilitiesReport(startDate, endDate)
        filename = `laporan-fasilitas-${new Date().toISOString().split('T')[0]}`
        break

      case 'users':
        data = await generateUsersReport()
        filename = `laporan-pengguna-${new Date().toISOString().split('T')[0]}`
        break

      case 'revenue':
        data = await generateRevenueReport(startDate, endDate)
        filename = `laporan-pendapatan-${new Date().toISOString().split('T')[0]}`
        break

      case 'utilization':
        data = await generateUtilizationReport(startDate, endDate, fasilitasId)
        filename = `laporan-utilisasi-${new Date().toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    if (format === 'csv') {
      const csv = convertToCSV(((data as { items?: unknown[] }).items || data) as unknown[])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      })
    }

    return NextResponse.json({
      ...data,
      metadata: {
        reportType,
        generatedAt: new Date().toISOString(),
        filters: {
          startDate,
          endDate,
          fasilitasId,
          status
        }
      }
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate bookings report
async function generateBookingsReport(
  startDate?: string | null,
  endDate?: string | null,
  fasilitasId?: string | null,
  status?: StatusPeminjaman | null
) {
  const where: Record<string, unknown> = {}

  if (startDate || endDate) {
    where.tglMulai = {}
    if (startDate) (where.tglMulai as Record<string, unknown>).gte = new Date(startDate)
    if (endDate) (where.tglMulai as Record<string, unknown>).lte = new Date(endDate)
  }

  if (fasilitasId) {
    where.fasilitasId = fasilitasId
  }

  if (status) {
    where.status = status
  }

  const [bookings, summary] = await Promise.all([
    prisma.peminjaman.findMany({
      where,
      include: {
        user: {
          select: {
            nama: true,
            email: true,
            role: true,
            tipePengguna: true
          }
        },
        fasilitas: {
          select: {
            nama: true,
            jenis: true,
            kapasitas: true
          }
        },
        tagihan: {
          select: {
            biaya: true,
            statusPembayaran: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    // Summary statistics
    Promise.all([
      prisma.peminjaman.count({ where }),
      prisma.peminjaman.count({ where: { ...where, status: 'DISETUJUI' } }),
      prisma.peminjaman.count({ where: { ...where, status: 'DITOLAK' } }),
      prisma.peminjaman.count({ where: { ...where, status: 'DIPROSES' } })
    ])
  ])

  return {
    items: bookings,
    summary: {
      total: summary[0],
      approved: summary[1],
      rejected: summary[2],
      pending: summary[3]
    }
  }
}

// Generate facilities report
async function generateFacilitiesReport(startDate?: string | null, endDate?: string | null) {
  const facilities = await prisma.fasilitas.findMany({
    include: {
      _count: {
        select: {
          peminjaman: {
            where: {
              ...(startDate && { tglMulai: { gte: new Date(startDate) } }),
              ...(endDate && { tglSelesai: { lte: new Date(endDate) } })
            }
          }
        }
      },
      peminjaman: {
        where: {
          status: 'DISETUJUI',
          ...(startDate && { tglMulai: { gte: new Date(startDate) } }),
          ...(endDate && { tglSelesai: { lte: new Date(endDate) } })
        },
        include: {
          tagihan: {
            select: {
              biaya: true
            }
          }
        }
      }
    }
  })

  const facilitiesWithStats = facilities.map(facility => ({
    ...facility,
    totalBookings: facility._count.peminjaman,
    totalRevenue: facility.peminjaman.reduce(
      (sum, booking) => sum + (Number(booking.tagihan?.biaya) || 0),
      0
    ),
    utilizationRate: facility.kapasitas > 0 
      ? (facility._count.peminjaman / facility.kapasitas * 100).toFixed(2)
      : 0
  }))

  return {
    items: facilitiesWithStats,
    summary: {
      totalFacilities: facilities.length,
      totalBookings: facilities.reduce((sum, f) => sum + f._count.peminjaman, 0),
      totalRevenue: facilities.reduce(
        (sum, f) => sum + f.peminjaman.reduce(
          (bookingSum, booking) => bookingSum + (Number(booking.tagihan?.biaya) || 0),
          0
        ),
        0
      )
    }
  }
}

// Generate users report
async function generateUsersReport() {
  const [users, userStats] = await Promise.all([
    prisma.pengguna.findMany({
      include: {
        _count: {
          select: {
            peminjaman: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    Promise.all([
      prisma.pengguna.count(),
      prisma.pengguna.count({ where: { role: 'MAHASISWA' } }),
      prisma.pengguna.count({ where: { role: 'PETUGAS' } }),
      prisma.pengguna.count({ where: { tipePengguna: TipePengguna.MAHASISWA } }),
      prisma.pengguna.count({ where: { tipePengguna: TipePengguna.EKSTERNAL } })
    ])
  ])

  return {
    items: users,
    summary: {
      total: userStats[0],
      mahasiswa: userStats[1],
      petugas: userStats[2],
      mahasiswaByType: userStats[3],
      external: userStats[4]
    }
  }
}

// Generate revenue report
async function generateRevenueReport(startDate?: string | null, endDate?: string | null) {
  const where: Record<string, unknown> = {
    statusPembayaran: 'SUDAH_BAYAR'
  }

  if (startDate || endDate) {
    where.peminjaman = {}
    if (startDate) (where.peminjaman as Record<string, unknown>).tglMulai = { gte: new Date(startDate) }
    if (endDate) (where.peminjaman as Record<string, unknown>).tglSelesai = { lte: new Date(endDate) }
  }

  const [revenue, monthlyRevenue] = await Promise.all([
    prisma.tagihan.findMany({
      where,
      include: {
        peminjaman: {
          include: {
            user: {
              select: {
                nama: true,
                tipePengguna: true
              }
            },
            fasilitas: {
              select: {
                nama: true,
                jenis: true
              }
            }
          }
        }
      }
    }),
    // Monthly revenue breakdown
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', p."tglMulai") as month,
        COUNT(*) as bookings,
        SUM(t.biaya) as revenue
      FROM "Tagihan" t
      JOIN "Peminjaman" p ON t."peminjamanId" = p.id
      WHERE t."statusPembayaran" = 'SUDAH_BAYAR'
        ${startDate ? `AND p."tglMulai" >= '${startDate}'` : ''}
        ${endDate ? `AND p."tglSelesai" <= '${endDate}'` : ''}
      GROUP BY DATE_TRUNC('month', p."tglMulai")
      ORDER BY month DESC
    `
  ])

  const totalRevenue = revenue.reduce((sum, item) => sum + Number(item.biaya), 0)

  return {
    items: revenue,
    monthlyBreakdown: monthlyRevenue,
    summary: {
      totalRevenue,
      totalTransactions: revenue.length,
      averageTransaction: revenue.length > 0 ? totalRevenue / revenue.length : 0
    }
  }
}

// Generate utilization report
async function generateUtilizationReport(
  startDate?: string | null,
  endDate?: string | null,
  fasilitasId?: string | null
) {
  const where: Record<string, unknown> = {
    status: 'DISETUJUI'
  }

  if (startDate || endDate) {
    if (startDate) where.tglMulai = { gte: new Date(startDate) }
    if (endDate) where.tglSelesai = { lte: new Date(endDate) }
  }

  if (fasilitasId) {
    where.fasilitasId = fasilitasId
  }

  const utilization = await prisma.fasilitas.findMany({
    where: fasilitasId ? { id: fasilitasId } : {},
    include: {
      peminjaman: {
        where,
        select: {
          tglMulai: true,
          tglSelesai: true,
          user: {
            select: {
              tipePengguna: true
            }
          }
        }
      }
    }
  })

  const utilizationStats = utilization.map(facility => {
    const bookings = facility.peminjaman
    const totalDays = bookings.reduce((sum, booking) => {
      const start = new Date(booking.tglMulai)
      const end = new Date(booking.tglSelesai)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return sum + diffDays
    }, 0)

    const internalBookings = bookings.filter(b => b.user.tipePengguna === TipePengguna.MAHASISWA).length
    const externalBookings = bookings.filter(b => b.user.tipePengguna === TipePengguna.EKSTERNAL).length

    return {
      ...facility,
      totalBookings: bookings.length,
      totalDaysBooked: totalDays,
      internalBookings,
      externalBookings,
      utilizationRate: facility.kapasitas > 0 
        ? (bookings.length / facility.kapasitas * 100).toFixed(2)
        : 0
    }
  })

  return {
    items: utilizationStats,
    summary: {
      totalFacilities: utilization.length,
      averageUtilization: utilizationStats.length > 0
        ? (utilizationStats.reduce((sum, f) => sum + parseFloat(f.utilizationRate as string), 0) / utilizationStats.length).toFixed(2)
        : 0
    }
  }
}

// Convert data to CSV format
function convertToCSV(data: unknown[]): string {
  if (!data || data.length === 0) {
    return ''
  }

  const headers = Object.keys(data[0] as Record<string, unknown>)
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = (row as Record<string, unknown>)[header]
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value).replace(/"/g, '""')
        }
        return `"${String(value || '').replace(/"/g, '""')}"`
      }).join(',')
    )
  ].join('\n')

  return csvContent
}