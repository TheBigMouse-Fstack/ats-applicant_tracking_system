import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isValidPbkdf2Hash(hash: string | null | undefined): boolean {
  if (!hash || !hash.startsWith("pbkdf2$")) return false;
  const parts = hash.split("$");
  if (parts.length !== 4) return false;
  const iterations = parseInt(parts[1], 10);
  return (
    Number.isFinite(iterations) &&
    iterations >= 10000 &&
    parts[2].length >= 16 &&
    parts[3].length >= 64
  );
}

async function main() {
  console.log("🔄 Backfilling existing users into Better Auth auth_accounts...");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });

  let created = 0;
  let updated = 0;
  let skippedInvalid = 0;

  for (const user of users) {
    // P1-05: Chỉ đồng bộ mật khẩu đã băm PBKDF2-SHA512 hợp lệ, tuyệt đối bỏ qua plaintext
    if (!isValidPbkdf2Hash(user.passwordHash)) {
      console.warn(
        `⚠️  Skipping user id=${user.id} (${user.email}): passwordHash is not a valid pbkdf2$ hash.`
      );
      skippedInvalid++;
      continue;
    }

    const accountId = String(user.id);
    const existing = await prisma.authAccount.findUnique({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId,
        },
      },
    });

    if (existing) {
      if (existing.password !== user.passwordHash) {
        await prisma.authAccount.update({
          where: { id: existing.id },
          data: { password: user.passwordHash },
        });
        updated++;
      }
    } else {
      await prisma.authAccount.create({
        data: {
          userId: user.id,
          accountId,
          providerId: "credential",
          password: user.passwordHash,
        },
      });
      created++;
    }
  }

  console.log(
    `✅ Backfill complete: ${users.length} users scanned, ${created} auth_accounts created, ${updated} synced, ${skippedInvalid} invalid skipped.`
  );
}

main()
  .catch((err) => {
    console.error("❌ Backfill failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
