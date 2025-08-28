import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Role, TipePengguna, StatusPeminjaman, StatusPembayaran, JenisNotifikasi } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed data for development and testing
 */
export class SeedDataService {
  /**
   * Create admin user
   */
  static async createAdminUser() {
    const adminEmail = 'admin@fasilitas.ugm.ac.id'
    const adminPassword = 'admin123'
    
    const existingAdmin = await prisma.pengguna.findUnique({
      where: { email: adminEmail }
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      
      await prisma.pengguna.create({
        data: {
          email: adminEmail,
          nama: 'Administrator Sistem',
          password: hashedPassword,
          role: Role.PETUGAS,
          tipePengguna: TipePengguna.PETUGAS
        }
      })
      
      console.log('✅ Admin user created:', adminEmail)
    } else {
      console.log('ℹ️ Admin user already exists:', adminEmail)
    }
  }

  /**
   * Create sample facilities
   */
  static async createSampleFacilities() {
    const facilities = [
      {
        nama: 'Ruang Kuliah A101',
        jenis: 'Ruang Kuliah',
        kapasitas: 50,
        lokasi: 'Gedung A Lantai 1',
        deskripsi: 'Ruang kuliah dengan kapasitas 50 orang, dilengkapi proyektor dan AC'
      },
      {
        nama: 'Ruang Kuliah A102',
        jenis: 'Ruang Kuliah',
        kapasitas: 40,
        lokasi: 'Gedung A Lantai 1',
        deskripsi: 'Ruang kuliah dengan kapasitas 40 orang, dilengkapi proyektor dan AC'
      },
      {
        nama: 'Laboratorium Komputer 1',
        jenis: 'Laboratorium',
        kapasitas: 30,
        lokasi: 'Gedung B Lantai 2',
        deskripsi: 'Laboratorium komputer dengan 30 unit PC, dilengkapi software terbaru'
      },
      {
        nama: 'Laboratorium Komputer 2',
        jenis: 'Laboratorium',
        kapasitas: 25,
        lokasi: 'Gedung B Lantai 2',
        deskripsi: 'Laboratorium komputer dengan 25 unit PC untuk praktikum'
      },
      {
        nama: 'Aula Serbaguna',
        jenis: 'Aula',
        kapasitas: 200,
        lokasi: 'Gedung C Lantai 1',
        deskripsi: 'Aula serbaguna untuk acara besar, seminar, dan wisuda'
      },
      {
        nama: 'Ruang Seminar 1',
        jenis: 'Ruang Seminar',
        kapasitas: 80,
        lokasi: 'Gedung C Lantai 2',
        deskripsi: 'Ruang seminar dengan kapasitas 80 orang untuk acara formal'
      },
      {
        nama: 'Ruang Seminar 2',
        jenis: 'Ruang Seminar',
        kapasitas: 60,
        lokasi: 'Gedung C Lantai 2',
        deskripsi: 'Ruang seminar dengan kapasitas 60 orang'
      },
      {
        nama: 'Lapangan Basket',
        jenis: 'Olahraga',
        kapasitas: 20,
        lokasi: 'Area Olahraga',
        deskripsi: 'Lapangan basket outdoor untuk kegiatan olahraga'
      },
      {
        nama: 'Lapangan Futsal',
        jenis: 'Olahraga',
        kapasitas: 14,
        lokasi: 'Area Olahraga',
        deskripsi: 'Lapangan futsal indoor dengan rumput sintetis'
      },
      {
        nama: 'Studio Musik',
        jenis: 'Studio',
        kapasitas: 15,
        lokasi: 'Gedung D Lantai 1',
        deskripsi: 'Studio musik dengan peralatan lengkap untuk latihan band'
      }
    ]

    for (const facility of facilities) {
      const existing = await prisma.fasilitas.findFirst({
        where: { nama: facility.nama }
      })

      if (!existing) {
        await prisma.fasilitas.create({
          data: facility
        })
        console.log('✅ Facility created:', facility.nama)
      } else {
        console.log('ℹ️ Facility already exists:', facility.nama)
      }
    }
  }

  /**
   * Create sample users
   */
  static async createSampleUsers() {
    const users = [
      {
        email: 'mahasiswa1@mail.ugm.ac.id',
        nama: 'Ahmad Fauzi',
        role: Role.MAHASISWA,
        tipePengguna: TipePengguna.MAHASISWA,
        googleId: 'google_id_1'
      },
      {
        email: 'mahasiswa2@mail.ugm.ac.id',
        nama: 'Siti Nurhaliza',
        role: Role.MAHASISWA,
        tipePengguna: TipePengguna.MAHASISWA,
        googleId: 'google_id_2'
      },
      {
        email: 'eksternal1@gmail.com',
        nama: 'Budi Santoso',
        password: await bcrypt.hash('password123', 12),
        role: Role.EKSTERNAL,
        tipePengguna: TipePengguna.EKSTERNAL
      },
      {
        email: 'eksternal2@yahoo.com',
        nama: 'Dewi Sartika',
        password: await bcrypt.hash('password123', 12),
        role: Role.EKSTERNAL,
        tipePengguna: TipePengguna.EKSTERNAL
      },
      {
        email: 'petugas1@fasilitas.ugm.ac.id',
        nama: 'Pak Joko',
        password: await bcrypt.hash('petugas123', 12),
        role: Role.PETUGAS,
        tipePengguna: TipePengguna.PETUGAS
      }
    ]

    for (const user of users) {
      const existing = await prisma.pengguna.findUnique({
        where: { email: user.email }
      })

      if (!existing) {
        await prisma.pengguna.create({
          data: user
        })
        console.log('✅ User created:', user.email)
      } else {
        console.log('ℹ️ User already exists:', user.email)
      }
    }
  }

  /**
   * Create sample bookings
   */
  static async createSampleBookings() {
    const users = await prisma.pengguna.findMany({
      where: {
        role: { in: [Role.MAHASISWA, Role.EKSTERNAL] }
      }
    })

    const facilities = await prisma.fasilitas.findMany()

    if (users.length === 0 || facilities.length === 0) {
      console.log('⚠️ No users or facilities found for creating sample bookings')
      return
    }

    const bookings = [
      {
        userId: users[0].id,
        fasilitasId: facilities[0].id,
        tglMulai: new Date('2024-02-01'),
        tglSelesai: new Date('2024-02-01'),
        tujuan: 'Kuliah Pemrograman Web',
        status: StatusPeminjaman.DISETUJUI
      },
      {
        userId: users[1].id,
        fasilitasId: facilities[1].id,
        tglMulai: new Date('2024-02-02'),
        tglSelesai: new Date('2024-02-02'),
        tujuan: 'Seminar Teknologi',
        status: StatusPeminjaman.DIPROSES
      },
      {
        userId: users[2]?.id || users[0].id,
        fasilitasId: facilities[2].id,
        tglMulai: new Date('2024-02-03'),
        tglSelesai: new Date('2024-02-03'),
        tujuan: 'Workshop Programming',
        status: StatusPeminjaman.DISETUJUI
      }
    ]

    for (const booking of bookings) {
      try {
        const peminjaman = await prisma.peminjaman.create({
          data: booking
        })

        // Create tagihan for approved bookings
        if (booking.status === StatusPeminjaman.DISETUJUI) {
          await prisma.tagihan.create({
            data: {
              peminjamanId: peminjaman.id,
              biaya: 100000,
              statusPembayaran: StatusPembayaran.BELUM_BAYAR
            }
          })
        }

        console.log('✅ Booking created:', peminjaman.id)
      } catch (error) {
        console.log('⚠️ Error creating booking:', error)
      }
    }
  }

  /**
   * Create sample notifications
   */
  static async createSampleNotifications() {
    const users = await prisma.pengguna.findMany()
    const peminjaman = await prisma.peminjaman.findMany()

    if (users.length === 0) {
      console.log('⚠️ No users found for creating sample notifications')
      return
    }

    const notifications = [
      {
        userId: users[0].id,
        judul: 'Peminjaman Disetujui',
        pesan: 'Peminjaman Ruang Kuliah A101 telah disetujui. Silakan lakukan pembayaran.',
        tujuan: users[0].email,
        jenis: JenisNotifikasi.DISETUJUI,
        peminjamanId: peminjaman[0]?.id
      },
      {
        userId: users[1].id,
        judul: 'Peminjaman Menunggu Persetujuan',
        pesan: 'Peminjaman Anda sedang dalam proses review oleh petugas.',
        tujuan: users[1].email,
        jenis: JenisNotifikasi.REVISI
      },
      {
        userId: users[0].id,
        judul: 'Pembayaran Berhasil',
        pesan: 'Pembayaran untuk peminjaman fasilitas telah berhasil dikonfirmasi.',
        tujuan: users[0].email,
        jenis: JenisNotifikasi.PEMBAYARAN,
        peminjamanId: peminjaman[0]?.id
      }
    ]

    for (const notification of notifications) {
      try {
        await prisma.notifikasi.create({
          data: notification
        })
        console.log('✅ Notification created:', notification.judul)
      } catch (error) {
        console.log('⚠️ Error creating notification:', error)
      }
    }
  }

  /**
   * Run all seed operations
   */
  static async seedAll() {
    try {
      console.log('🌱 Starting database seeding...')
      
      await this.createAdminUser()
      await this.createSampleFacilities()
      await this.createSampleUsers()
      await this.createSampleBookings()
      await this.createSampleNotifications()
      
      console.log('✅ Database seeding completed successfully!')
    } catch (error) {
      console.error('❌ Error during seeding:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Clear all data (for testing)
   */
  static async clearAll() {
    try {
      console.log('🧹 Clearing database...')
      
      // Delete in correct order to avoid foreign key constraints
      await prisma.auditLog.deleteMany()
      await prisma.notifikasi.deleteMany()
      await prisma.tagihan.deleteMany()
      await prisma.peminjaman.deleteMany()
      await prisma.fasilitas.deleteMany()
      await prisma.pengguna.deleteMany()
      
      console.log('✅ Database cleared successfully!')
    } catch (error) {
      console.error('❌ Error clearing database:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Reset database (clear + seed)
   */
  static async reset() {
    await this.clearAll()
    await this.seedAll()
  }
}

// Export individual functions for flexibility
export const {
  createAdminUser,
  createSampleFacilities,
  createSampleUsers,
  createSampleBookings,
  createSampleNotifications,
  seedAll,
  clearAll,
  reset
} = SeedDataService

// Default export for convenience
export default SeedDataService