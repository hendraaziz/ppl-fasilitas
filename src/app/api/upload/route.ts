import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = ['application/pdf']

// POST /api/upload - Upload file
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check when NextAuth is properly configured
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'surat_permohonan' or 'bukti_transfer'
    const peminjamanId = formData.get('peminjamanId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    if (!type || !['surat_permohonan', 'bukti_transfer'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipe file tidak valid' },
        { status: 400 }
      )
    }

    if (!peminjamanId) {
      return NextResponse.json(
        { success: false, error: 'ID peminjaman diperlukan' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file terlalu besar (maksimal 5MB)' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipe file tidak didukung (hanya PDF)' },
        { status: 400 }
      )
    }

    // Check if peminjaman exists
    const peminjaman = await prisma.peminjaman.findUnique({
      where: { id: peminjamanId }
    })

    if (!peminjaman) {
      return NextResponse.json(
        { success: false, error: 'Peminjaman tidak ditemukan' },
        { status: 404 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', type)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${peminjamanId}_${timestamp}_${originalName}`
    const filepath = path.join(uploadDir, filename)
    const relativePath = path.join('uploads', type, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update database based on file type
    if (type === 'surat_permohonan') {
      // Create or update surat permohonan
      await prisma.suratPermohonan.upsert({
        where: { peminjamanId },
        update: {
          fileUrl: relativePath
        },
        create: {
          peminjamanId,
          fileUrl: relativePath
        }
      })
    } else if (type === 'bukti_transfer') {
      // Update tagihan with bukti transfer
      await prisma.tagihan.upsert({
        where: { peminjamanId },
        update: {
          buktiTransferUrl: relativePath,
          statusPembayaran: 'VERIFIKASI'
        },
        create: {
          peminjamanId,
          biaya: 0, // Default value, should be set by admin
          buktiTransferUrl: relativePath,
          statusPembayaran: 'VERIFIKASI'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        filename,
        filepath: relativePath,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      },
      message: 'File berhasil diupload'
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal mengupload file' },
      { status: 500 }
    )
  }
}

// GET /api/upload - Get uploaded files for a peminjaman
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const peminjamanId = searchParams.get('peminjamanId')

    if (!peminjamanId) {
      return NextResponse.json(
        { success: false, error: 'ID peminjaman diperlukan' },
        { status: 400 }
      )
    }

    // Get uploaded files for the peminjaman
    const [suratPermohonan, tagihan] = await Promise.all([
      prisma.suratPermohonan.findUnique({
        where: { peminjamanId },
        select: {
          fileUrl: true,
          tanggalTerbit: true
        }
      }),
      prisma.tagihan.findUnique({
        where: { peminjamanId },
        select: {
          buktiTransferUrl: true,
          statusPembayaran: true
        }
      })
    ])

    const files = {
      suratPermohonan: suratPermohonan?.fileUrl ? {
        url: suratPermohonan.fileUrl,
        uploadedAt: suratPermohonan.tanggalTerbit
      } : null,
      buktiTransfer: tagihan?.buktiTransferUrl ? {
        url: tagihan.buktiTransferUrl,
        status: tagihan.statusPembayaran
      } : null
    }

    return NextResponse.json({
      success: true,
      data: files
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data file' },
      { status: 500 }
    )
  }
}