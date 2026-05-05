import * as dotenv from 'dotenv';
import { PrismaClient } from 'prisma/generated';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users count:', users.length);
  users.forEach((u) => console.log(`- ${u.email} (${u.type})`));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
