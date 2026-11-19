const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");
  return `pbkdf2$${iterations}$${salt}$${derivedKey}`;
}

async function main() {
  console.log("Upserting enterprise accounts for 1-week trial...");

  // 1. admin@ats.vn & admin@recoverx.career
  await prisma.user.upsert({
    where: { email: "admin@ats.vn" },
    update: { passwordHash: hashPassword("Admin@123456"), isActive: true, role: "ADMIN", fullName: "Nguyễn Văn An" },
    create: {
      fullName: "Nguyễn Văn An",
      email: "admin@ats.vn",
      passwordHash: hashPassword("Admin@123456"),
      role: "ADMIN",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@recoverx.career" },
    update: { passwordHash: hashPassword("Admin@123456"), isActive: true, role: "ADMIN", fullName: "Nguyễn Văn An" },
    create: {
      fullName: "Nguyễn Văn An",
      email: "admin@recoverx.career",
      passwordHash: hashPassword("Admin@123456"),
      role: "ADMIN",
      isActive: true,
    },
  });

  // 2. hr@ats.vn & hr@recoverx.career
  await prisma.user.upsert({
    where: { email: "hr@ats.vn" },
    update: { passwordHash: hashPassword("Hr@123456"), isActive: true, role: "HR", fullName: "Nguyễn Thu Hà" },
    create: {
      fullName: "Nguyễn Thu Hà",
      email: "hr@ats.vn",
      passwordHash: hashPassword("Hr@123456"),
      role: "HR",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "hr@recoverx.career" },
    update: { passwordHash: hashPassword("Hr@123456"), isActive: true, role: "HR", fullName: "Nguyễn Thu Hà" },
    create: {
      fullName: "Nguyễn Thu Hà",
      email: "hr@recoverx.career",
      passwordHash: hashPassword("Hr@123456"),
      role: "HR",
      isActive: true,
    },
  });

  // 3. manager@ats.vn & techlead@recoverx.career
  await prisma.user.upsert({
    where: { email: "manager@ats.vn" },
    update: { passwordHash: hashPassword("Manager@123456"), isActive: true, role: "HIRING_MANAGER", fullName: "Trần Minh Quân" },
    create: {
      fullName: "Trần Minh Quân",
      email: "manager@ats.vn",
      passwordHash: hashPassword("Manager@123456"),
      role: "HIRING_MANAGER",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "techlead@recoverx.career" },
    update: { passwordHash: hashPassword("Manager@123456"), isActive: true, role: "HIRING_MANAGER", fullName: "Trần Minh Quân" },
    create: {
      fullName: "Trần Minh Quân",
      email: "techlead@recoverx.career",
      passwordHash: hashPassword("Manager@123456"),
      role: "HIRING_MANAGER",
      isActive: true,
    },
  });

  console.log("✅ All trial enterprise accounts synchronized in Neon PostgreSQL.");
}

main().finally(() => prisma.$disconnect());
