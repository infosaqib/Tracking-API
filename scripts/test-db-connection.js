// Test database connection script
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Database version:', result[0]?.version || 'Unknown');
    
    // List existing tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\n📋 Existing tables in database:');
    if (tables.length === 0) {
      console.log('   (No tables found - ready for migration)');
    } else {
      tables.forEach((table) => {
        console.log(`   - ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('empty host')) {
      console.error('\n💡 Fix: Check your DATABASE_URL in .env file');
      console.error('   Format: postgresql://username:password@host:port/database');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Fix: Check your username and password in DATABASE_URL');
    } else if (error.message.includes('does not exist')) {
      console.error('\n💡 Fix: The database name in DATABASE_URL does not exist');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Fix: Check if the database host is correct and accessible');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

