import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSIPPDF } from '@/lib/pdf-generator'
import fs from 'fs'
import path from 'path'

// GET /api/bookings/[id]/generate-sip - Generate SIP PDF
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Get booking data with relations
    const booking = await prisma.peminjaman.findUnique({
      where: { id },
      include: {
        user: true,
        fasilitas: true,
        sip: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Peminjaman tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if booking is approved
    if (booking.status !== 'DISETUJUI') {
      return NextResponse.json(
        { success: false, error: 'SIP hanya dapat dibuat untuk peminjaman yang disetujui' },
        { status: 400 }
      )
    }

    // Generate SIP number if not exists
    let sipRecord = booking.sip
    if (!sipRecord) {
      const sipNumber = await generateSipNumber()
      sipRecord = await prisma.sIP.create({
        data: {
          peminjamanId: booking.id,
          noSurat: sipNumber,
          fileUrl: '', // Will be updated after PDF generation
        }
      })
    }

    // Generate PDF
    const pdfBuffer = await generateSIPPDF({
      noSurat: sipRecord.noSurat,
      peminjam: {
        nama: booking.user.nama,
        email: booking.user.email,
        tipePengguna: booking.user.tipePengguna
      },
      fasilitas: {
        nama: booking.fasilitas.nama,
        lokasi: booking.fasilitas.lokasi,
        jenis: booking.fasilitas.jenis,
        kapasitas: booking.fasilitas.kapasitas
      },
      peminjaman: {
        tglMulai: booking.tglMulai,
        tglSelesai: booking.tglSelesai,
        tujuan: booking.tujuan,
        keterangan: booking.keterangan
      },
      tanggalTerbit: new Date()
    })

    // Save PDF file
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'sip')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const fileName = `SIP-${sipRecord.noSurat.replace(/\//g, '-')}.pdf`
    const filePath = path.join(uploadsDir, fileName)
    fs.writeFileSync(filePath, pdfBuffer)

    // Update SIP record with file URL
    const fileUrl = `/uploads/sip/${fileName}`
    await prisma.sIP.update({
      where: { id: sipRecord.id },
      data: { fileUrl }
    })

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })

  } catch (error) {
    console.error('Error generating SIP:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat SIP' },
      { status: 500 }
    )
  }
}

// Generate unique SIP number
async function generateSipNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // Count existing SIPs this month
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59)
  
  const count = await prisma.sIP.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  })
  
  const sequence = (count + 1).toString().padStart(3, '0')
  const monthStr = currentMonth.toString().padStart(2, '0')
  
  return `SIP/${sequence}/UGM/${monthStr}/${currentYear}`
}