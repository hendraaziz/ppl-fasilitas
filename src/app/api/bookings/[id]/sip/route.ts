import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSIPPDF } from '@/lib/pdf-generator'

// GET /api/bookings/[id]/sip - Generate or get existing SIP
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Check if booking exists and is approved
    const booking = await prisma.peminjaman.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            nama: true,
            email: true,
            tipePengguna: true
          }
        },
        fasilitas: {
          select: {
            nama: true,
            lokasi: true,
            jenis: true,
            kapasitas: true
          }
        },
        sip: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Peminjaman tidak ditemukan' },
        { status: 404 }
      )
    }

    if (booking.status !== 'DISETUJUI') {
      return NextResponse.json(
        { success: false, error: 'SIP hanya dapat dibuat untuk peminjaman yang disetujui' },
        { status: 400 }
      )
    }

    // Check if SIP already exists
    if (booking.sip) {
      return NextResponse.json({
        success: true,
        data: {
          id: booking.sip.id,
          noSurat: booking.sip.noSurat,
          fileUrl: booking.sip.fileUrl,
          tanggalTerbit: booking.sip.tanggalTerbit
        }
      })
    }

    // Generate new SIP
    const sipNumber = `SIP/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`
    
    // Generate PDF
    const pdfBuffer = await generateSIPPDF({
      noSurat: sipNumber,
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

    // Save PDF file (in production, save to cloud storage)
    const fileName = `sip-${booking.id}-${Date.now()}.pdf`
    const fileUrl = `/uploads/sip/${fileName}`
    
    // For now, we'll store the file path in database
    // In production, upload to cloud storage and get the URL
    
    // Create SIP record
    const sip = await prisma.sIP.create({
      data: {
        peminjamanId: booking.id,
        noSurat: sipNumber,
        fileUrl: fileUrl
      }
    })

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-SIP-ID': sip.id,
        'X-SIP-Number': sipNumber
      }
    })

  } catch (error) {
    console.error('Error generating SIP:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat SIP' },
      { status: 500 }
    )
  }
}

// POST /api/bookings/[id]/sip - Force regenerate SIP
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Delete existing SIP if any
    await prisma.sIP.deleteMany({
      where: { peminjamanId: id }
    })

    // Redirect to GET to generate new SIP
    return GET(request, context)

  } catch (error) {
    console.error('Error regenerating SIP:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat ulang SIP' },
      { status: 500 }
    )
  }
}