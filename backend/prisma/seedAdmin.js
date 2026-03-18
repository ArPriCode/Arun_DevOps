const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user...');

  const email = 'admin@cinemora.local';
  const password = 'Admin@123';

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'admin',
      password: hashedPassword,
    },
    create: {
      name: 'Cinemora Admin',
      email,
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('✅ Admin user ready:');
  console.log(`   Email: ${admin.email}`);
  console.log('   Password: Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed admin failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
