const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createPendingBooking() {
  try {
    // Get first user and facility
    const user = await prisma.user.findFirst()
    const facility = await prisma.fasilitas.findFirst()
    
    if (!user || !facility) {
      console.log('User atau fasilitas tidak ditemukan')
      return
    }

    // Create booking with PENDING status
    const booking = await prisma.peminjaman.create({
      data: {
        nomorBooking: `BK${Date.now()}`,
        userId: user.id,
        fasilitasId: facility.id,
        tglMulai: new Date('2025-02-01T10:00:00Z'),
        tglSelesai: new Date('2025-02-01T12:00:00Z'),
        tujuan: 'Testing tombol tolak',
        keterangan: 'Booking untuk test fungsionalitas tombol tolak',
        status: 'DIPROSES' // This maps to PENDING in frontend
      }
    })

    console.log('Booking PENDING berhasil dibuat:', booking)
  } catch (error) {
    console.error('Error creating booking:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPendingBooking()