const accounts = [
  { email: "admin@ats.vn", password: "Admin@123456", expectedRole: "ADMIN" },
  { email: "hr@ats.vn", password: "Hr@123456", expectedRole: "HR" },
  { email: "manager@ats.vn", password: "Manager@123456", expectedRole: "HIRING_MANAGER" },
  { email: "admin@recoverx.career", password: "Admin@123456", expectedRole: "ADMIN" },
  { email: "hr@recoverx.career", password: "Hr@123456", expectedRole: "HR" },
  { email: "techlead@recoverx.career", password: "Manager@123456", expectedRole: "HIRING_MANAGER" },
];

async function testLogins() {
  console.log("Testing logins against http://localhost:3000/api/auth/login...\n");
  for (const acc of accounts) {
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        console.log(`✅ [${acc.email}] PASS - User: ${data.user.fullName} | Role: ${data.user.role}`);
      } else {
        console.error(`❌ [${acc.email}] FAIL:`, data);
      }
    } catch (e) {
      console.error(`❌ [${acc.email}] ERROR:`, e.message);
    }
  }
}

testLogins();
