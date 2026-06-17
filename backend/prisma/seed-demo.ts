/**
 * Demo seed — run AFTER migrations:
 *   npx prisma migrate dev --name demo
 *   npm run seed:demo
 *
 * Creates: grade levels 9-12, 10 subjects, 25 teachers, 200 students.
 * Safe to re-run — skips everything if Grade 9 already exists.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Copy .env.example → .env and fill it in.');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// ── Data ───────────────────────────────────────────────────────────────────

const GRADE_LEVELS = [
  { grade_level: 'Grade 9',  curriculum_year: '2025-2026' },
  { grade_level: 'Grade 10', curriculum_year: '2025-2026' },
  { grade_level: 'Grade 11', curriculum_year: '2025-2026' },
  { grade_level: 'Grade 12', curriculum_year: '2025-2026' },
];

const SUBJECTS = [
  { name: 'Mathematics',      name_ar: 'الرياضيات' },
  { name: 'Physics',          name_ar: 'الفيزياء' },
  { name: 'Chemistry',        name_ar: 'الكيمياء' },
  { name: 'Biology',          name_ar: 'الأحياء' },
  { name: 'Arabic Language',  name_ar: 'اللغة العربية' },
  { name: 'English Language', name_ar: 'اللغة الإنجليزية' },
  { name: 'Islamic Studies',  name_ar: 'التربية الإسلامية' },
  { name: 'History',          name_ar: 'التاريخ' },
  { name: 'Geography',        name_ar: 'الجغرافيا' },
  { name: 'Computer Science', name_ar: 'علوم الحاسب' },
];

const TEACHERS: [string, string][] = [
  ['Ahmed',   'Al-Rashidi'],  ['Mohamed', 'Al-Shamrani'], ['Ali',     'Al-Qahtani'],
  ['Omar',    'Al-Harbi'],    ['Hassan',  'Al-Otaibi'],   ['Ibrahim', 'Al-Zahrani'],
  ['Khalid',  'Al-Ghamdi'],   ['Abdullah','Al-Shehri'],   ['Youssef', 'Al-Dosari'],
  ['Tariq',   'Al-Mutairi'],  ['Faisal',  'Al-Anazi'],    ['Nasser',  'Al-Hajri'],
  ['Samir',   'Al-Subaie'],   ['Walid',   'Al-Morished'], ['Bilal',   'Al-Bishi'],
  ['Mazen',   'Al-Rashid'],   ['Rami',    'Al-Khalidi'],  ['Ziad',    'Al-Mansouri'],
  ['Kareem',  'Al-Amin'],     ['Mostafa', 'Al-Sayed'],    ['Hany',    'Al-Turki'],
  ['Emad',    'Al-Nasser'],   ['Samy',    'Al-Jaber'],    ['Yasser',  'Al-Faraj'],
  ['Hisham',  'Al-Mahdi'],
];

const S_MALE = [
  'Abdullah','Ahmed','Ali','Bilal','Fahad','Faisal','Hassan','Hussein',
  'Ibrahim','Jaber','Kareem','Khalid','Mazen','Mohamed','Mustafa',
  'Nasser','Omar','Osama','Rami','Saad','Salem','Sultan','Talal',
  'Tariq','Walid','Youssef','Zaid','Ziad','Hamad','Majed',
];

const S_FEMALE = [
  'Aisha','Amira','Arwa','Asma','Basma','Dana','Dina','Fatima',
  'Ghada','Hana','Haya','Lama','Lina','Maha','Mariam','Mona',
  'Nada','Noor','Reem','Rina','Ruba','Saba','Sara','Shahad',
  'Shouq','Taghreed','Wafa','Widad','Yara','Zainab',
];

const LAST = [
  'Al-Rashidi','Al-Shamrani','Al-Qahtani','Al-Harbi','Al-Otaibi',
  'Al-Zahrani','Al-Ghamdi','Al-Shehri','Al-Dosari','Al-Mutairi',
  'Al-Anazi','Al-Hajri','Al-Subaie','Al-Morished','Al-Bishi',
  'Al-Rashid','Al-Khalidi','Al-Mansouri','Al-Amin','Al-Sayed',
  'Al-Turki','Al-Nasser','Al-Jaber','Al-Faraj','Al-Mahdi',
  'Al-Habsi','Al-Balushi','Al-Farsi','Al-Ruwaili','Al-Enezi',
];

const FATHER_F = [
  'Abdullah','Ahmed','Ali','Fahad','Faisal','Hassan','Ibrahim',
  'Khalid','Mohamed','Nasser','Omar','Saad','Sultan','Walid',
];

// ── Helpers ────────────────────────────────────────────────────────────────

const lcg = (n: number) => (Math.imul(n, 1664525) + 1013904223) >>> 0;

function pick(n: number, max: number, seed: number): number[] {
  const out = new Set<number>();
  let k = seed;
  while (out.size < Math.min(n, max)) { out.add(lcg(k++) % max); }
  return [...out];
}

const at = <T>(arr: T[], r: number): T => arr[r % arr.length];

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔌 Connecting…');
  await prisma.$connect();

  const exists = await prisma.level.findFirst({ where: { grade_level: 'Grade 9' } });
  if (exists) {
    console.log('⚠️  Grade 9 already exists — already seeded. Skipping.');
    return;
  }

  const teacherPw = await bcrypt.hash('teacher123', 10);
  const studentPw = await bcrypt.hash('student123', 10);

  // 1. Grade levels ──────────────────────────────────────────────────────
  process.stdout.write('Grade levels… ');
  const levels = await Promise.all(GRADE_LEVELS.map((g) => prisma.level.create({ data: g })));
  console.log(`✓ (${levels.length})`);

  // 2. Subjects ──────────────────────────────────────────────────────────
  process.stdout.write('Subjects… ');
  const subjects = await Promise.all(SUBJECTS.map((s) => prisma.subject.create({ data: s })));
  console.log(`✓ (${subjects.length})`);

  // 3. SubjectLevel ──────────────────────────────────────────────────────
  process.stdout.write('SubjectLevel links… ');
  for (const s of subjects)
    for (const l of levels)
      await prisma.subjectLevel.create({ data: { subject_id: s.id, level_id: l.id } });
  console.log(`✓ (${subjects.length * levels.length})`);

  // 4. Teachers ──────────────────────────────────────────────────────────
  process.stdout.write(`Teachers (${TEACHERS.length})… `);
  const teacherIds: number[] = [];
  for (let i = 0; i < TEACHERS.length; i++) {
    const [first, last] = TEACHERS[i];
    const u = await prisma.user.create({
      data: {
        first_name: first, last_name: last,
        password_hash: teacherPw,
        phone:  `050${String(2000000 + i).slice(-7)}`,
        gender: 'male',
      },
    });
    await prisma.teacher.create({ data: { user_id: u.id } });
    teacherIds.push(u.id);
  }
  console.log('✓');

  // 5. Teacher assignments ───────────────────────────────────────────────
  process.stdout.write('Teacher subject+grade assignments… ');
  let aCount = 0;
  for (let i = 0; i < teacherIds.length; i++) {
    for (const si of pick(1 + (i % 3), subjects.length, i * 7)) {
      for (const li of pick(1 + (i % 4), levels.length, i * 13 + 5)) {
        await prisma.teacherSubject.create({
          data: { teacher_id: teacherIds[i], subject_id: subjects[si].id, level_id: levels[li].id },
        });
        aCount++;
      }
    }
  }
  console.log(`✓ (${aCount})`);

  // 6. Students ──────────────────────────────────────────────────────────
  process.stdout.write('Students (200) ');
  const studentIds: number[] = [];
  for (let i = 0; i < 200; i++) {
    let r = lcg(i * 31 + 7);
    const isMale    = i % 2 === 0;
    const firstName = at(isMale ? S_MALE : S_FEMALE, r); r = lcg(r);
    const lastName  = at(LAST, r);                        r = lcg(r);
    const fatherN   = `${at(FATHER_F, r)} ${lastName}`;   r = lcg(r);
    const motherN   = `${at(S_FEMALE, r)} ${at(LAST, lcg(r))}`; r = lcg(r);
    const birthYear = 2025 - 14 - (r % 5);               r = lcg(r);
    const birthMon  = 1 + (r % 12);                       r = lcg(r);
    const birthDay  = 1 + (r % 28);

    const u = await prisma.user.create({
      data: {
        first_name: firstName, last_name: lastName,
        password_hash: studentPw,
        phone:       `055${String(3000000 + i).slice(-7)}`,
        gender:      isMale ? 'male' : 'female',
        nationality: 'SA',
        brith_date:  new Date(birthYear, birthMon - 1, birthDay),
      },
    });
    await prisma.student.create({
      data: {
        user_id:      u.id,
        father_name:  fatherN,
        mother_name:  motherN,
        parent_phone: `056${String(4000000 + i).slice(-7)}`,
      },
    });
    studentIds.push(u.id);
    if ((i + 1) % 50 === 0) process.stdout.write(`${i + 1}…`);
  }
  console.log(' ✓');

  // 7. StudentLevel ──────────────────────────────────────────────────────
  process.stdout.write('StudentLevel assignments… ');
  for (let i = 0; i < studentIds.length; i++) {
    await prisma.studentLevel.create({
      data: {
        student_id:     studentIds[i],
        level_id:       levels[i % levels.length].id,
        success_status: 'active',
      },
    });
  }
  console.log('✓');

  // 8. Reset sequences ───────────────────────────────────────────────────
  const seqTables = ['users','subjects','levels','topics','schedule_items',
    'syllabus_items','part_grades','notifications','conversations',
    'messages','post_attachments','posts'];
  for (const t of seqTables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM "${t}"), 0) + 1, false)`,
    );
  }

  console.log(`
✅  Done!
   Grades   : ${levels.map((l) => l.grade_level).join(', ')}
   Subjects : ${subjects.length}
   Teachers : ${teacherIds.length}   password: teacher123
   Students : ${studentIds.length}  password: student123
  `);
}

main()
  .catch((e: Error & { code?: string }) => {
    console.error('\n❌  Seed failed:', e.message ?? e);
    if (e.code === 'P2022') {
      console.error(
        '\n   A required column is missing — run migrations first:\n' +
        '   npx prisma migrate dev --name demo\n',
      );
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
