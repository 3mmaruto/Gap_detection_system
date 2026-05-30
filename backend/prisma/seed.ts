import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ── Admin ─────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      first_name: 'Ahmed',
      last_name: 'Admin',
      password_hash: await hash('admin123'),
      phone: '0501000001',
      gender: 'male',
      nationality: 'SA',
    },
  });
  await prisma.admin.upsert({
    where: { user_id: adminUser.id },
    update: {},
    create: { user_id: adminUser.id },
  });

  // ── Teacher ───────────────────────────────────────────────────────────────
  const teacherUser = await prisma.user.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      first_name: 'Sara',
      last_name: 'Teacher',
      password_hash: await hash('teacher123'),
      phone: '0501000002',
      gender: 'female',
      nationality: 'SA',
    },
  });
  await prisma.teacher.upsert({
    where: { user_id: teacherUser.id },
    update: {},
    create: { user_id: teacherUser.id },
  });

  // ── Student ───────────────────────────────────────────────────────────────
  const studentUser = await prisma.user.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      first_name: 'Ali',
      last_name: 'Student',
      password_hash: await hash('student123'),
      phone: '0501000003',
      gender: 'male',
      nationality: 'SA',
    },
  });
  await prisma.student.upsert({
    where: { user_id: studentUser.id },
    update: {},
    create: {
      user_id: studentUser.id,
      father_name: 'Khaled',
      mother_name: 'Fatima',
      parent_phone: '0501000004',
    },
  });

  // ── Sample subject ────────────────────────────────────────────────────────
  const subject = await prisma.subject.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Mathematics',
      name_ar: 'رياضيات',
      learning_path: 'core',
    },
  });

  // ── Sample announcement post ──────────────────────────────────────────────
  await prisma.post.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'Welcome to the new semester!',
      type: 'ANNOUNCEMENT',
      content: 'Classes begin on Sunday. Please check your schedule.',
      user_id: adminUser.id,
    },
  });

  // ── Sample homework post ──────────────────────────────────────────────────
  await prisma.post.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      title: 'Homework: Chapter 3 exercises',
      type: 'HOMEWORK',
      content: 'Complete exercises 1–10 on page 45. Due next Sunday.',
      user_id: teacherUser.id,
      subject_id: subject.id,
    },
  });

  // Reset all auto-increment sequences so new inserts don't collide with seeded IDs.
  const tables = ['users', 'subjects', 'posts', 'notifications', 'conversations', 'messages', 'levels', 'schedule_items', 'syllabus_items', 'part_grades', 'topics', 'post_attachments'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`,
    );
  }

  console.log(`
✅  Seed complete!

  Role      ID   Password
  ──────────────────────────
  admin      1   admin123
  teacher    2   teacher123
  student    3   student123
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
