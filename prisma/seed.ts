import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // --------------------------------------------------
  // 1. Create ADMIN user
  // --------------------------------------------------

  const adminPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@example.com',
    },
    update: {
      role: 'ADMIN',
      password: adminPassword,
    },
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created/updated:');
  console.log({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });

  // --------------------------------------------------
  // 2. Create categories
  // --------------------------------------------------

  const electronics = await prisma.category.upsert({
    where: {
      slug: 'electronics',
    },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
    },
  });

  const clothing = await prisma.category.upsert({
    where: {
      slug: 'clothing',
    },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
    },
  });

  console.log('✅ Categories created');

  // --------------------------------------------------
  // 3. Create products
  // --------------------------------------------------

  const headphones = await prisma.product.upsert({
    where: {
      slug: 'wireless-headphones',
    },
    update: {},
    create: {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'Bluetooth wireless headphones',
      price: 49900,
      stock: 50,
      isActive: true,
      categoryId: electronics.id,
    },
  });

  const keyboard = await prisma.product.upsert({
    where: {
      slug: 'mechanical-keyboard',
    },
    update: {},
    create: {
      name: 'Mechanical Keyboard',
      slug: 'mechanical-keyboard',
      description: 'RGB mechanical keyboard',
      price: 79900,
      stock: 30,
      isActive: true,
      categoryId: electronics.id,
    },
  });

  const tshirt = await prisma.product.upsert({
    where: {
      slug: 'cotton-tshirt',
    },
    update: {},
    create: {
      name: 'Cotton T-Shirt',
      slug: 'cotton-tshirt',
      description: 'Comfortable cotton t-shirt',
      price: 29900,
      stock: 100,
      isActive: true,
      categoryId: clothing.id,
    },
  });

  console.log('✅ Products created');

  console.log('--------------------------------');
  console.log('🌱 Seed completed successfully!');
  console.log('--------------------------------');

  console.log('Admin login:');
  console.log('Email: admin@example.com');
  console.log('Password: Admin@123');

  console.log('--------------------------------');

  console.log('Products:');
  console.log({
    headphones: headphones.id,
    keyboard: keyboard.id,
    tshirt: tshirt.id,
  });
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });