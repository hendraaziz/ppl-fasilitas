import * as XLSX from 'xlsx'
import { NextResponse } from 'next/server'

export interface ExcelColumn {
  key: string
  header: string
  width?: number
  format?: 'text' | 'number' | 'date' | 'currency'
}

export interface ExcelExportOptions {
  filename: string
  sheetName?: string
  columns: ExcelColumn[]
  data: Record<string, unknown>[]
  title?: string
  subtitle?: string
}

/**
 * Excel Export Service
 */
export class ExcelExportService {
  /**
   * Format cell value based on column format
   */
  private static formatCellValue(value: unknown, format?: string): unknown {
    if (value === null || value === undefined) {
      return ''
    }

    switch (format) {
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString('id-ID')
        }
        if (typeof value === 'string') {
          const date = new Date(value)
          return isNaN(date.getTime()) ? value : date.toLocaleDateString('id-ID')
        }
        return value

      case 'currency':
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(numValue)
        }
        return value

      case 'number':
        const num = typeof value === 'string' ? parseFloat(value) : value
        if (typeof num === 'number' && !isNaN(num)) {
          return new Intl.NumberFormat('id-ID').format(num)
        }
        return value

      case 'text':
      default:
        return String(value)
    }
  }

  /**
   * Create Excel workbook from data
   */
  static createWorkbook(options: ExcelExportOptions): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new()
    const sheetName = options.sheetName || 'Data'

    // Prepare data for worksheet
    const worksheetData: unknown[][] = []

    // Add title and subtitle if provided
    if (options.title) {
      worksheetData.push([options.title])
      worksheetData.push([]) // Empty row
    }
    if (options.subtitle) {
      worksheetData.push([options.subtitle])
      worksheetData.push([]) // Empty row
    }

    // Add headers
    const headers = options.columns.map(col => col.header)
    worksheetData.push(headers)

    // Add data rows
    options.data.forEach(row => {
      const dataRow = options.columns.map(col => {
        const value = this.getNestedValue(row, col.key)
        return this.formatCellValue(value, col.format)
      })
      worksheetData.push(dataRow)
    })

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    const colWidths = options.columns.map(col => ({
      wch: col.width || 15
    }))
    worksheet['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    return workbook
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      return current && typeof current === 'object' && current !== null && (current as Record<string, unknown>)[key] !== undefined ? (current as Record<string, unknown>)[key] : ''
    }, obj)
  }

  /**
   * Export data to Excel buffer
   */
  static exportToBuffer(options: ExcelExportOptions): Buffer {
    const workbook = this.createWorkbook(options)
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  }

  /**
   * Create Excel download response
   */
  static createDownloadResponse(options: ExcelExportOptions): NextResponse {
    const buffer = this.exportToBuffer(options)
    
    const response = new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${options.filename}.xlsx"`,
        'Content-Length': buffer.length.toString()
      }
    })

    return response
  }

  /**
   * Export peminjaman data to Excel
   */
  static exportPeminjamanData(data: Record<string, unknown>[], filename: string = 'laporan-peminjaman'): NextResponse {
    const columns: ExcelColumn[] = [
      { key: 'nomorPeminjaman', header: 'Nomor Peminjaman', width: 20 },
      { key: 'pengguna.nama', header: 'Nama Peminjam', width: 25 },
      { key: 'pengguna.email', header: 'Email', width: 30 },
      { key: 'fasilitas.nama', header: 'Fasilitas', width: 25 },
      { key: 'tanggalMulai', header: 'Tanggal Mulai', width: 15, format: 'date' },
      { key: 'tanggalSelesai', header: 'Tanggal Selesai', width: 15, format: 'date' },
      { key: 'waktuMulai', header: 'Waktu Mulai', width: 12 },
      { key: 'waktuSelesai', header: 'Waktu Selesai', width: 12 },
      { key: 'status', header: 'Status', width: 15 },
      { key: 'keperluan', header: 'Keperluan', width: 30 },
      { key: 'tagihan.biaya', header: 'Biaya', width: 15, format: 'currency' },
      { key: 'tagihan.statusPembayaran', header: 'Status Pembayaran', width: 18 },
      { key: 'createdAt', header: 'Tanggal Dibuat', width: 18, format: 'date' }
    ]

    return this.createDownloadResponse({
      filename,
      sheetName: 'Laporan Peminjaman',
      columns,
      data,
      title: 'LAPORAN PEMINJAMAN FASILITAS',
      subtitle: `Periode: ${new Date().toLocaleDateString('id-ID')}`
    })
  }

  /**
   * Export fasilitas data to Excel
   */
  static exportFasilitasData(data: Record<string, unknown>[], filename: string = 'laporan-fasilitas'): NextResponse {
    const columns: ExcelColumn[] = [
      { key: 'nama', header: 'Nama Fasilitas', width: 25 },
      { key: 'kategori', header: 'Kategori', width: 20 },
      { key: 'kapasitas', header: 'Kapasitas', width: 12, format: 'number' },
      { key: 'lokasi', header: 'Lokasi', width: 25 },
      { key: 'harga', header: 'Harga per Jam', width: 15, format: 'currency' },
      { key: 'status', header: 'Status', width: 15 },
      { key: '_count.peminjaman', header: 'Total Peminjaman', width: 18, format: 'number' },
      { key: 'deskripsi', header: 'Deskripsi', width: 40 }
    ]

    return this.createDownloadResponse({
      filename,
      sheetName: 'Laporan Fasilitas',
      columns,
      data,
      title: 'LAPORAN DATA FASILITAS',
      subtitle: `Tanggal: ${new Date().toLocaleDateString('id-ID')}`
    })
  }

  /**
   * Export pengguna data to Excel
   */
  static exportPenggunaData(data: Record<string, unknown>[], filename: string = 'laporan-pengguna'): NextResponse {
    const columns: ExcelColumn[] = [
      { key: 'nama', header: 'Nama', width: 25 },
      { key: 'email', header: 'Email', width: 30 },
      { key: 'role', header: 'Role', width: 15 },
      { key: 'tipePengguna', header: 'Tipe Pengguna', width: 15 },
      { key: 'nomorTelepon', header: 'Nomor Telepon', width: 18 },
      { key: '_count.peminjaman', header: 'Total Peminjaman', width: 18, format: 'number' },
      { key: 'createdAt', header: 'Tanggal Daftar', width: 18, format: 'date' },
      { key: 'lastLogin', header: 'Login Terakhir', width: 18, format: 'date' }
    ]

    return this.createDownloadResponse({
      filename,
      sheetName: 'Laporan Pengguna',
      columns,
      data,
      title: 'LAPORAN DATA PENGGUNA',
      subtitle: `Tanggal: ${new Date().toLocaleDateString('id-ID')}`
    })
  }

  /**
   * Export pendapatan data to Excel
   */
  static exportPendapatanData(data: Record<string, unknown>[], filename: string = 'laporan-pendapatan'): NextResponse {
    const columns: ExcelColumn[] = [
      { key: 'periode', header: 'Periode', width: 15 },
      { key: 'fasilitas.nama', header: 'Fasilitas', width: 25 },
      { key: 'totalPeminjaman', header: 'Total Peminjaman', width: 18, format: 'number' },
      { key: 'totalPendapatan', header: 'Total Pendapatan', width: 20, format: 'currency' },
      { key: 'rataRataPendapatan', header: 'Rata-rata per Peminjaman', width: 25, format: 'currency' }
    ]

    return this.createDownloadResponse({
      filename,
      sheetName: 'Laporan Pendapatan',
      columns,
      data,
      title: 'LAPORAN PENDAPATAN FASILITAS',
      subtitle: `Periode: ${new Date().toLocaleDateString('id-ID')}`
    })
  }

  /**
   * Export utilitas data to Excel
   */
  static exportUtilitasData(data: Record<string, unknown>[], filename: string = 'laporan-utilitas'): NextResponse {
    const columns: ExcelColumn[] = [
      { key: 'fasilitas.nama', header: 'Fasilitas', width: 25 },
      { key: 'totalJamTersedia', header: 'Total Jam Tersedia', width: 20, format: 'number' },
      { key: 'totalJamDigunakan', header: 'Total Jam Digunakan', width: 20, format: 'number' },
      { key: 'persentaseUtilitas', header: 'Persentase Utilitas (%)', width: 22, format: 'number' },
      { key: 'totalPeminjaman', header: 'Total Peminjaman', width: 18, format: 'number' },
      { key: 'rataRataDurasi', header: 'Rata-rata Durasi (jam)', width: 22, format: 'number' }
    ]

    return this.createDownloadResponse({
      filename,
      sheetName: 'Laporan Utilitas',
      columns,
      data,
      title: 'LAPORAN UTILITAS FASILITAS',
      subtitle: `Periode: ${new Date().toLocaleDateString('id-ID')}`
    })
  }
}

/**
 * Utility functions for Excel export
 */
export function formatDataForExcel(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map(item => {
    // Convert dates to proper format
    const formatted = { ...item }
    
    Object.keys(formatted).forEach(key => {
      const value = formatted[key]
      
      // Handle Date objects
      if (value instanceof Date) {
        formatted[key] = value.toISOString().split('T')[0]
      }
      
      // Handle nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        formatted[key] = formatDataForExcel([value as Record<string, unknown>])[0]
      }
    })
    
    return formatted
  })
}

/**
 * Create CSV from data (alternative to Excel)
 */
export function createCSV(data: Record<string, unknown>[], columns: ExcelColumn[]): string {
  const headers = columns.map(col => col.header).join(',')
  
  const rows = data.map(row => {
    return columns.map(col => {
      const value = ExcelExportService['getNestedValue'](row, col.key)
      const formatted = ExcelExportService['formatCellValue'](value, col.format)
      
      // Escape commas and quotes in CSV
      if (typeof formatted === 'string' && (formatted.includes(',') || formatted.includes('"'))) {
        return `"${formatted.replace(/"/g, '""')}"`
      }
      
      return formatted
    }).join(',')
  })
  
  return [headers, ...rows].join('\n')
}

/**
 * Create CSV download response
 */
export function createCSVResponse(data: Record<string, unknown>[], columns: ExcelColumn[], filename: string): NextResponse {
  const csv = createCSV(data, columns)
  
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
      'Content-Length': Buffer.byteLength(csv, 'utf8').toString()
    }
  })
}