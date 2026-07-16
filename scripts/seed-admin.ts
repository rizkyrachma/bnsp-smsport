import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  const email = "admin@smsport.com";
  const passwordText = "admin123";

  console.log("🌱 Membuat atau mengupdate akun Admin...");

  const hashedPassword = await hash(passwordText, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: "admin",
      password: hashedPassword,
    },
    create: {
      name: "Super Admin SM Sport",
      email,
      phone: "081234567890",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("✅ Akun Admin berhasil disiapkan!");
  console.log("═════════════════════════════════════");
  console.log(`Email    : ${admin.email}`);
  console.log(`Password : ${passwordText}`);
  console.log(`Role     : ${admin.role}`);
  console.log("═════════════════════════════════════");
  console.log("👉 Silakan coba login di http://localhost:3000/login");
}

main()
  .catch((e) => {
    console.error("❌ Gagal membuat akun admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
