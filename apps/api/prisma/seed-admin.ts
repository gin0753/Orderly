import 'dotenv/config';

import { AdminRole, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set before seeding an admin user.',
    );
  }

  if (password.length < 12) {
    throw new Error('ADMIN_SEED_PASSWORD must be at least 12 characters long.');
  }

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.info(
      `Admin user already exists for ${email}. No changes were made.`,
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      role: AdminRole.ADMIN,
    },
  });

  console.info(`Admin user created for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
