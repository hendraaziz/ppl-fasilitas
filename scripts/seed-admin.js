const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedAdmin() {
  try {
    // Hash password untuk admin
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Buat atau update admin
    const admin = await prisma.pengguna.upsert({
      where: { email: 'admin@ugm.ac.id' },
      update: {
        password: hashedPassword
      },
      create: {
        email: 'admin@ugm.ac.id',
        nama: 'Administrator',
        role: 'PETUGAS',
        tipePengguna: 'PETUGAS',
        password: hashedPassword
      }
    })
    
    console.log('Admin berhasil dibuat/diupdate:', admin)
    
    // Buat petugas tambahan
    const hashedPassword2 = await bcrypt.hash('petugas123', 12)
    
    const petugas = await prisma.pengguna.upsert({
      where: { email: 'petugas@ugm.ac.id' },
      update: {
        password: hashedPassword2
      },
      create: {
        email: 'petugas@ugm.ac.id',
        nama: 'Petugas Fasilitas',
        role: 'PETUGAS',
        tipePengguna: 'PETUGAS',
        password: hashedPassword2
      }
    })
    
    console.log('Petugas berhasil dibuat/diupdate:', petugas)
    
  } catch (error) {
    console.error('Error seeding admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmin()