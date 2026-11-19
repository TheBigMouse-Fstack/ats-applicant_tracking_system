const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Kiểm tra toàn bộ User và Candidate trong CSDL...");

  // 1. Quét bảng User
  const users = await prisma.user.findMany();
  console.log(`Tìm thấy ${users.length} tài khoản người dùng:`);
  for (const user of users) {
    if (user.fullName.includes("(") && user.fullName.includes(")")) {
      const cleanName = user.fullName.replace(/\s*\(.*?\)\s*/g, " ").trim();
      console.log(`  -> User #${user.id} [${user.email}]: "${user.fullName}" => "${cleanName}"`);
      await prisma.user.update({
        where: { id: user.id },
        data: { fullName: cleanName },
      });
    } else {
      console.log(`  - User #${user.id} [${user.email}]: "${user.fullName}" (Hợp lệ)`);
    }
  }

  // 2. Quét bảng Candidate
  const candidates = await prisma.candidate.findMany();
  console.log(`\nTìm thấy ${candidates.length} hồ sơ ứng viên:`);
  for (const c of candidates) {
    if (c.fullName.includes("(") && c.fullName.includes(")")) {
      const cleanName = c.fullName.replace(/\s*\(.*?\)\s*/g, " ").trim();
      console.log(`  -> Candidate #${c.id} [${c.email}]: "${c.fullName}" => "${cleanName}"`);
      await prisma.candidate.update({
        where: { id: c.id },
        data: { fullName: cleanName },
      });
    } else {
      console.log(`  - Candidate #${c.id} [${c.email}]: "${c.fullName}" (Hợp lệ)`);
    }
  }

  console.log("\n✅ Hoàn tất dọn dẹp và chuẩn hóa tên sạch sẽ!");
}

main()
  .catch((e) => {
    console.error("Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
