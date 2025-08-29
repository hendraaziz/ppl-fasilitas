import jsPDF from 'jspdf'

interface SIPData {
  noSurat: string
  peminjam: {
    nama: string
    email: string
    tipePengguna: string
  }
  fasilitas: {
    nama: string
    lokasi: string
    jenis: string
    kapasitas?: number
  }
  peminjaman: {
    tglMulai: Date
    tglSelesai: Date
    tujuan: string
    keterangan?: string | null
  }
  tanggalTerbit: Date
}

export async function generateSIPPDF(data: SIPData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF()
      let yPosition = 30
      const margin = 20
      const lineHeight = 7

      // Helper function to add text
      const addText = (text: string, x: number, y: number, options: { align?: 'left' | 'center' | 'right', fontSize?: number } = {}) => {
        if (options.fontSize) {
          doc.setFontSize(options.fontSize)
        }
        
        if (options.align === 'center') {
          const pageWidth = doc.internal.pageSize.width
          doc.text(text, pageWidth / 2, y, { align: 'center' })
        } else if (options.align === 'right') {
          const pageWidth = doc.internal.pageSize.width
          doc.text(text, pageWidth - margin, y, { align: 'right' })
        } else {
          doc.text(text, x, y)
        }
      }

      // Header
      doc.setFontSize(16)
      addText('UNIVERSITAS GADJAH MADA', margin, yPosition, { align: 'center' })
      yPosition += lineHeight
      
      doc.setFontSize(14)
      addText('DIREKTORAT KEMAHASISWAAN', margin, yPosition, { align: 'center' })
      yPosition += lineHeight
      
      doc.setFontSize(12)
      addText('Jl. Sekip Utara, Bulaksumur, Yogyakarta 55281', margin, yPosition, { align: 'center' })
      yPosition += lineHeight * 2

      // Title
      doc.setFontSize(14)
      addText('SURAT IZIN PENGGUNAAN FASILITAS', margin, yPosition, { align: 'center' })
      yPosition += lineHeight
      
      doc.setFontSize(12)
      addText(`Nomor: ${data.noSurat}`, margin, yPosition, { align: 'center' })
      yPosition += lineHeight * 2

      // Content
      const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(date)
      }

      const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jakarta'
        }).format(date)
      }

      doc.setFontSize(11)
      addText('Yang bertanda tangan di bawah ini, Dekan Fakultas Matematika dan Ilmu Pengetahuan Alam', margin, yPosition)
      yPosition += lineHeight
      addText('Universitas Gadjah Mada, dengan ini memberikan izin kepada:', margin, yPosition)
      yPosition += lineHeight * 1.5

      // Peminjam details
      addText(`Nama                    : ${data.peminjam.nama}`, margin, yPosition)
      yPosition += lineHeight
      addText(`Email                   : ${data.peminjam.email}`, margin, yPosition)
      yPosition += lineHeight
      addText(`Status                  : ${data.peminjam.tipePengguna}`, margin, yPosition)
      yPosition += lineHeight * 1.5

      addText('Untuk menggunakan fasilitas dengan ketentuan sebagai berikut:', margin, yPosition)
      yPosition += lineHeight * 1.5

      // Fasilitas details
      addText(`Fasilitas               : ${data.fasilitas.nama}`, margin, yPosition)
      yPosition += lineHeight
      addText(`Jenis                   : ${data.fasilitas.jenis}`, margin, yPosition)
      yPosition += lineHeight
      addText(`Lokasi                  : ${data.fasilitas.lokasi}`, margin, yPosition)
      yPosition += lineHeight
      
      if (data.fasilitas.kapasitas) {
        addText(`Kapasitas               : ${data.fasilitas.kapasitas} orang`, margin, yPosition)
        yPosition += lineHeight
      }
      
      addText(`Tanggal Mulai           : ${formatDate(data.peminjaman.tglMulai)} pukul ${formatTime(data.peminjaman.tglMulai)} WIB`, margin, yPosition)
      yPosition += lineHeight
      addText(`Tanggal Selesai         : ${formatDate(data.peminjaman.tglSelesai)} pukul ${formatTime(data.peminjaman.tglSelesai)} WIB`, margin, yPosition)
      yPosition += lineHeight
      addText(`Tujuan                  : ${data.peminjaman.tujuan}`, margin, yPosition)
      yPosition += lineHeight
      
      if (data.peminjaman.keterangan) {
        addText(`Keterangan              : ${data.peminjaman.keterangan}`, margin, yPosition)
        yPosition += lineHeight
      }
      
      yPosition += lineHeight * 1.5

      // Terms and conditions
      doc.setFontSize(11)
      addText('KETENTUAN PENGGUNAAN:', margin, yPosition)
      yPosition += lineHeight
      addText('1. Peminjam wajib menjaga kebersihan dan kerapihan fasilitas', margin, yPosition)
      yPosition += lineHeight
      addText('2. Peminjam bertanggung jawab atas kerusakan yang terjadi selama penggunaan', margin, yPosition)
      yPosition += lineHeight
      addText('3. Peminjam wajib mengembalikan fasilitas dalam kondisi semula', margin, yPosition)
      yPosition += lineHeight
      addText('4. Dilarang menggunakan fasilitas untuk kegiatan yang melanggar hukum', margin, yPosition)
      yPosition += lineHeight
      addText('5. Peminjam wajib mematuhi protokol kesehatan yang berlaku', margin, yPosition)
      yPosition += lineHeight
      addText('6. Surat izin ini harus ditunjukkan kepada petugas jaga ruang', margin, yPosition)
      yPosition += lineHeight
      addText('7. Penggunaan fasilitas harus sesuai dengan waktu yang telah ditentukan', margin, yPosition)
      yPosition += lineHeight * 2

      // Footer
      doc.setFontSize(12)
      addText(`Yogyakarta, ${formatDate(data.tanggalTerbit)}`, margin, yPosition, { align: 'right' })
      yPosition += lineHeight
      addText('Direktur Kemahasiswaan UGM', margin, yPosition, { align: 'right' })
      yPosition += lineHeight * 3
      addText('Dr. Hempri Suyatna, S.Sos., M.Si.', margin, yPosition, { align: 'right' })
      yPosition += lineHeight
      addText('NIP. 196908121987031002', margin, yPosition, { align: 'right' })

      // Watermark
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128) // Gray color
      const pageHeight = doc.internal.pageSize.height
      addText(`Dokumen ini dibuat secara otomatis pada ${new Date().toLocaleString('id-ID')}`, margin, pageHeight - 10)

      // Convert to buffer
      const pdfOutput = doc.output('arraybuffer')
      resolve(Buffer.from(pdfOutput))
    } catch (error) {
      reject(error)
    }
  })
}