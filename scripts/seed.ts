#!/usr/bin/env tsx

import { SeedDataService } from '../src/lib/seed-data'

async function main() {
  const command = process.argv[2]

  try {
    switch (command) {
      case 'seed':
        console.log('🌱 Seeding database...')
        await SeedDataService.seedAll()
        break

      case 'clear':
        console.log('🧹 Clearing database...')
        await SeedDataService.clearAll()
        break

      case 'reset':
        console.log('🔄 Resetting database...')
        await SeedDataService.reset()
        break

      case 'admin':
        console.log('👤 Creating admin user...')
        await SeedDataService.createAdminUser()
        break

      case 'facilities':
        console.log('🏢 Creating sample facilities...')
        await SeedDataService.createSampleFacilities()
        break

      case 'users':
        console.log('👥 Creating sample users...')
        await SeedDataService.createSampleUsers()
        break

      case 'bookings':
        console.log('📅 Creating sample bookings...')
        await SeedDataService.createSampleBookings()
        break

      case 'notifications':
        console.log('🔔 Creating sample notifications...')
        await SeedDataService.createSampleNotifications()
        break

      default:
        console.log('Usage:')
        console.log('  npm run seed seed        - Seed all data')
        console.log('  npm run seed clear       - Clear all data')
        console.log('  npm run seed reset       - Clear and seed all data')
        console.log('  npm run seed admin       - Create admin user only')
        console.log('  npm run seed facilities  - Create sample facilities only')
        console.log('  npm run seed users       - Create sample users only')
        console.log('  npm run seed bookings    - Create sample bookings only')
        console.log('  npm run seed notifications - Create sample notifications only')
        process.exit(1)
    }

    console.log('✅ Operation completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()