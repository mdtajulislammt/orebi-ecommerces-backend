import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users count:', users.length);
  users.forEach(u => console.log(`- ${u.email} (${u.type})`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
