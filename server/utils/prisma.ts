import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: 'chat',
  password: 'chatpass',
  database: 'chatdb',
  connectionLimit: 10
});

const prisma = new PrismaClient({
  adapter,
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' }
  ]
});

prisma.$on('query', (e) => {
  // console.log('Prisma query:', e.query);
});

prisma.$on('error', (e) => {
  console.error('Prisma error:', e);
});

export default prisma;
