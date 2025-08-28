import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create users
  const mahasiswa = await prisma.pengguna.create({
    data: {
      nama: 'Septyan Mahasiswa',
      email: 'septyan@ugm.ac.id',
      role: 'MAHASISWA',
      tipePengguna: 'MAHASISWA',
      googleId: 'septyan.ugm'
    }
  })

  const petugas = await prisma.pengguna.create({
    data: {
      nama: 'Putera Petugas',
      email: 'putera@ugm.ac.id',
      role: 'PETUGAS',
      tipePengguna: 'PETUGAS',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // password
    }
  })

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.pengguna.create({
    data: {
      nama: 'Administrator',
      email: 'admin@ugm.ac.id',
      role: 'PETUGAS',
      tipePengguna: 'PETUGAS',
      password: hashedAdminPassword
    }
  })

  const eksternal = await prisma.pengguna.create({
    data: {
      nama: 'Pak Budi Eksternal',
      email: 'budi@external.com',
      role: 'EKSTERNAL',
      tipePengguna: 'EKSTERNAL'
    }
  })

  console.log('✅ Users created')

  // Create 5 fasilitas demo
  const fasilitas = await Promise.all([
    prisma.fasilitas.create({
      data: {
        nama: 'Auditorium Utama',
        lokasi: 'Gedung A Lantai 1',
        jenis: 'Auditorium',
        kapasitas: 500,
        deskripsi: 'Auditorium utama dengan fasilitas lengkap untuk acara besar'
      }
    }),
    prisma.fasilitas.create({
      data: {
        nama: 'Ruang Seminar 1',
        lokasi: 'Gedung B Lantai 2',
        jenis: 'Ruang Seminar',
        kapasitas: 100,
        deskripsi: 'Ruang seminar dengan proyektor dan sound system'
      }
    }),
    prisma.fasilitas.create({
      data: {
        nama: 'Lapangan Basket',
        lokasi: 'Area Olahraga',
        jenis: 'Lapangan Olahraga',
        kapasitas: 50,
        deskripsi: 'Lapangan basket outdoor dengan pencahayaan malam'
      }
    }),
    prisma.fasilitas.create({
      data: {
        nama: 'Ruang Meeting Kecil',
        lokasi: 'Gedung C Lantai 3',
        jenis: 'Ruang Meeting',
        kapasitas: 20,
        deskripsi: 'Ruang meeting kecil untuk diskusi dan rapat'
      }
    }),
    prisma.fasilitas.create({
      data: {
        nama: 'Aula Serbaguna',
        lokasi: 'Gedung D Lantai 1',
        jenis: 'Aula',
        kapasitas: 200,
        deskripsi: 'Aula serbaguna untuk berbagai kegiatan'
      }
    })
  ])

  console.log('✅ Fasilitas created')

  // Create jadwal random untuk seminggu ke depan
  const today = new Date()
  const jadwalData = []

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(today)
    currentDate.setDate(today.getDate() + i)
    
    // Skip weekend untuk beberapa fasilitas
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
    
    for (const fas of fasilitas) {
      // Skip weekend untuk ruang meeting dan seminar
      if (isWeekend && (fas.jenis === 'Ruang Meeting' || fas.jenis === 'Ruang Seminar')) {
        continue
      }

      // Create multiple time slots per day
      const timeSlots = [
        { start: '08:00', end: '10:00' },
        { start: '10:00', end: '12:00' },
        { start: '13:00', end: '15:00' },
        { start: '15:00', end: '17:00' },
        { start: '19:00', end: '21:00' }
      ]

      for (const slot of timeSlots) {
        // Random availability (80% tersedia)
        const isAvailable = Math.random() > 0.2
        
        jadwalData.push({
          fasilitasId: fas.id,
          tanggal: currentDate,
          waktuMulai: new Date(`1970-01-01T${slot.start}:00.000Z`),
          waktuSelesai: new Date(`1970-01-01T${slot.end}:00.000Z`),
          statusBooking: isAvailable ? ('TERSEDIA' as const) : ('TERBOOKED' as const)
        })
      }
    }
  }

  await prisma.jadwalFasilitas.createMany({
    data: jadwalData
  })

  console.log('✅ Jadwal fasilitas created')

  // Create panduan
  await prisma.panduan.createMany({
    data: [
      {
        tipePengguna: 'MAHASISWA',
        judul: 'Panduan Peminjaman untuk Mahasiswa',
        isi: `
# Panduan Peminjaman Fasilitas untuk Mahasiswa

## Langkah-langkah:
1. Login menggunakan akun SSO UGM
2. Pilih fasilitas yang ingin dipinjam
3. Pilih tanggal dan waktu yang tersedia
4. Isi form peminjaman dengan lengkap
5. Submit dan tunggu verifikasi dari petugas
6. Jika disetujui, lakukan pembayaran sesuai tagihan
7. Dapatkan Surat Izin Peminjaman (SIP)

## Catatan Penting:
- Pastikan tidak ada konflik jadwal
- Isi tujuan peminjaman dengan jelas
- Periksa notifikasi secara berkala
        `
      },
      {
        tipePengguna: 'EKSTERNAL',
        judul: 'Panduan Permohonan untuk Pengguna Eksternal',
        isi: `
# Panduan Permohonan Fasilitas untuk Pengguna Eksternal

## Langkah-langkah:
1. Lihat ketersediaan fasilitas tanpa perlu login
2. Isi form permohonan dengan lengkap
3. Upload surat permohonan resmi (PDF, max 2MB)
4. Submit permohonan
5. Pantau status permohonan melalui email
6. Jika disetujui, lakukan pembayaran sesuai instruksi
7. Upload bukti pembayaran
8. Dapatkan Surat Izin Peminjaman (SIP)

## Persyaratan:
- Surat permohonan resmi dari instansi
- Format PDF, maksimal 2MB
- Kontak yang dapat dihubungi
        `
      }
    ]
  })

  console.log('✅ Panduan created')

  // Create dummy bookings for August 2025
  const august2025Bookings = [
    {
      userId: mahasiswa.id,
      fasilitasId: fasilitas[0].id, // Auditorium Utama
      tglMulai: new Date('2025-08-05T08:00:00.000Z'),
      tglSelesai: new Date('2025-08-05T12:00:00.000Z'),
      tujuan: 'Seminar Nasional Teknologi',
      keterangan: 'Seminar dengan 300 peserta dari berbagai universitas',
      status: 'DISETUJUI' as const
    },
    {
      userId: eksternal.id,
      fasilitasId: fasilitas[1].id, // Ruang Seminar 1
      tglMulai: new Date('2025-08-10T13:00:00.000Z'),
      tglSelesai: new Date('2025-08-10T17:00:00.000Z'),
      tujuan: 'Workshop Pelatihan Karyawan',
      keterangan: 'Pelatihan internal perusahaan untuk 80 karyawan',
      status: 'DIPROSES' as const
    },
    {
      userId: mahasiswa.id,
      fasilitasId: fasilitas[2].id, // Lapangan Basket
      tglMulai: new Date('2025-08-15T16:00:00.000Z'),
      tglSelesai: new Date('2025-08-15T18:00:00.000Z'),
      tujuan: 'Turnamen Basket Antar Fakultas',
      keterangan: 'Final turnamen basket dengan 40 peserta',
      status: 'DITOLAK' as const,
      alasanTolak: 'Bentrok dengan jadwal maintenance lapangan'
    },
    {
      userId: eksternal.id,
      fasilitasId: fasilitas[3].id, // Ruang Meeting Kecil
      tglMulai: new Date('2025-08-20T09:00:00.000Z'),
      tglSelesai: new Date('2025-08-20T11:00:00.000Z'),
      tujuan: 'Rapat Koordinasi Proyek',
      keterangan: 'Meeting dengan tim eksternal untuk koordinasi proyek',
      status: 'PERLU_REVISI' as const
    },
    {
      userId: mahasiswa.id,
      fasilitasId: fasilitas[4].id, // Aula Serbaguna
      tglMulai: new Date('2025-08-25T18:00:00.000Z'),
      tglSelesai: new Date('2025-08-25T22:00:00.000Z'),
      tujuan: 'Malam Kebudayaan Mahasiswa',
      keterangan: 'Acara seni dan budaya dengan 150 peserta',
      status: 'DISETUJUI' as const
    },
    {
      userId: eksternal.id,
      fasilitasId: fasilitas[0].id, // Auditorium Utama
      tglMulai: new Date('2025-08-28T14:00:00.000Z'),
      tglSelesai: new Date('2025-08-28T16:00:00.000Z'),
      tujuan: 'Konferensi Internasional',
      keterangan: 'Konferensi dengan pembicara dari 5 negara',
      status: 'DIPROSES' as const
    }
  ]

  const createdBookings = []
  for (const bookingData of august2025Bookings) {
    const booking = await prisma.peminjaman.create({
      data: bookingData
    })
    createdBookings.push(booking)
  }

  console.log('✅ Dummy bookings created')

  console.log('🎉 Seed completed successfully!')
  console.log(`
📊 Summary:
- Users: 4 (1 Mahasiswa, 2 Petugas, 1 Eksternal)
- Fasilitas: 5
- Jadwal: ${jadwalData.length} time slots
- Panduan: 2
- Dummy Bookings: ${createdBookings.length} (August 2025)
`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })