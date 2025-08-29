const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createApprovedBooking() {
  try {
    // Find user hendraaziz@ugm.ac.id
    const user = await prisma.pengguna.findUnique({
      where: { email: 'hendraaziz@ugm.ac.id' }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    // Get first facility
    const fasilitas = await prisma.fasilitas.findFirst()
    if (!fasilitas) {
      console.log('❌ No facilities found')
      return
    }

    // Create approved booking
    const approvedBooking = await prisma.peminjaman.create({
      data: {
        userId: user.id,
        fasilitasId: fasilitas.id,
        tglMulai: new Date('2025-01-30T09:00:00Z'),
        tglSelesai: new Date('2025-01-30T12:00:00Z'),
        tujuan: 'Testing SIP Download',
        keterangan: 'Booking untuk test download SIP',
        status: 'DISETUJUI'
      }
    })

    console.log('✅ Approved booking created:', approvedBooking.id)
    console.log('📋 Booking details:')
    console.log('   - ID:', approvedBooking.id)
    console.log('   - User:', user.nama)
    console.log('   - Facility:', fasilitas.nama)
    console.log('   - Status:', approvedBooking.status)
    console.log('   - Purpose:', approvedBooking.tujuan)

  } catch (error) {
    console.error('❌ Error creating approved booking:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createApprovedBooking()