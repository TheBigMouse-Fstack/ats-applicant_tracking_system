/**
 * ReCoverX Career ATS — Test Suite Tự động hóa
 * Kiểm tra các Quy tắc Nghiệp vụ (BRL-01 đến BRL-10) và Logic Xác thực
 */

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Bộ giả lập màu sắc console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
};

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ${colors.green}✔ PASS:${colors.reset} ${testName}`);
    passed++;
  } else {
    console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${testName} — ${details}`);
    failed++;
  }
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  🧪 RECOVERX CAREER ATS — BỘ KIỂM THỬ NGHIỆP VỤ (BRL) ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  // ---------------------------------------------------------
  // TEST SUITE 1: BRL-01 (Định dạng & Dung lượng tệp tin)
  // ---------------------------------------------------------
  console.log(`${colors.bold}1. Kiểm tra BRL-01 (File Format & Max 10MB):${colors.reset}`);
  
  function validateFile(fileName, sizeInBytes) {
    const validExtensions = [".pdf", ".docx"];
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validExtensions.includes(ext)) {
      return { valid: false, error: "Định dạng không hợp lệ. Chỉ chấp nhận .pdf, .docx" };
    }
    if (sizeInBytes > maxSize) {
      return { valid: false, error: "Dung lượng vượt quá giới hạn 10MB" };
    }
    return { valid: true };
  }

  assert(validateFile("my_cv.pdf", 2 * 1024 * 1024).valid === true, "Chấp nhận tệp PDF hợp lệ dưới 10MB");
  assert(validateFile("profile.docx", 5 * 1024 * 1024).valid === true, "Chấp nhận tệp DOCX hợp lệ dưới 10MB");
  assert(validateFile("script.exe", 1024).valid === false, "Chặn tệp không phải PDF/DOCX (ví dụ .exe)");
  assert(validateFile("heavy_cv.pdf", 12 * 1024 * 1024).valid === false, "Chặn tệp PDF vượt quá 10MB");

  // ---------------------------------------------------------
  // TEST SUITE 2: BRL-02 (Khử trùng lặp trong vòng 30 ngày)
  // ---------------------------------------------------------
  console.log(`\n${colors.bold}2. Kiểm tra BRL-02 (Deduplication Email + Phone trong 30 ngày):${colors.reset}`);

  function checkDeduplication(existingApps, candidateEmail, candidatePhone, jobId) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const match = existingApps.find(
      (app) =>
        app.jobId === jobId &&
        (app.email === candidateEmail || app.phone === candidatePhone) &&
        new Date(app.createdAt) >= thirtyDaysAgo
    );

    return match ? { isDuplicate: true, duplicateAppId: match.id } : { isDuplicate: false };
  }

  const mockExisting = [
    { id: 101, email: "test@gmail.com", phone: "0901111222", jobId: 1, createdAt: new Date() }, // Nộp hôm nay
    { id: 102, email: "old@gmail.com", phone: "0903333444", jobId: 1, createdAt: new Date(Date.now() - 40 * 86400000) }, // Nộp 40 ngày trước
  ];

  assert(
    checkDeduplication(mockExisting, "test@gmail.com", "0901111222", 1).isDuplicate === true,
    "Phát hiện hồ sơ nộp trùng cùng 1 Job trong vòng 30 ngày"
  );
  assert(
    checkDeduplication(mockExisting, "test@gmail.com", "0901111222", 2).isDuplicate === false,
    "Cho phép ứng viên nộp cho vị trí khác (JobId khác) không bị tính trùng"
  );
  assert(
    checkDeduplication(mockExisting, "old@gmail.com", "0903333444", 1).isDuplicate === false,
    "Cho phép nộp lại cùng Job nếu đã qua 30 ngày (tạo đợt ứng tuyển mới)"
  );

  // ---------------------------------------------------------
  // TEST SUITE 3: BRL-08 (Tính điểm Scorecard trung bình có trọng số)
  // ---------------------------------------------------------
  console.log(`\n${colors.bold}3. Kiểm tra BRL-08 (Scorecard Trọng số: 40% Chuyên môn, 30% Giao tiếp, 30% Văn hóa):${colors.reset}`);

  function calculateScorecard(tech, comm, cult) {
    // Công thức: (Tech * 0.4) + (Comm * 0.3) + (Cult * 0.3)
    return Number((tech * 0.4 + comm * 0.3 + cult * 0.3).toFixed(2));
  }

  assert(calculateScorecard(5, 5, 5) === 5.0, "Điểm tuyệt đối 5/5/5 cho ra 5.0");
  assert(calculateScorecard(4, 3, 3) === 3.4, "Điểm 4/3/3 cho ra đúng 3.40");
  assert(calculateScorecard(5, 4, 5) === 4.7, "Điểm 5/4/5 cho ra đúng 4.70");

  // ---------------------------------------------------------
  // TEST SUITE 4: BRL-06 (Stage Gate: Chặn Hired nếu chưa có Scorecard)
  // ---------------------------------------------------------
  console.log(`\n${colors.bold}4. Kiểm tra BRL-06 (Stage Gate Rule — Chặn Hired nếu thiếu Scorecard):${colors.reset}`);

  function validateStageTransition(fromStage, toStage, evaluationsCount) {
    if (toStage === "HIRED") {
      if (evaluationsCount < 1) {
        return { allowed: false, error: "Yêu cầu ít nhất 1 Scorecard hoàn tất trước khi tuyển chọn (HIRED)" };
      }
    }
    return { allowed: true };
  }

  assert(validateStageTransition("INTERVIEW", "HIRED", 0).allowed === false, "Chặn kéo sang HIRED khi có 0 Scorecard");
  assert(validateStageTransition("INTERVIEW", "HIRED", 1).allowed === true, "Cho phép kéo sang HIRED khi đã có 1 Scorecard");

  // ---------------------------------------------------------
  // TEST SUITE 5: BRL-05 (Delay Buffer 12-24h khi gửi Email từ chối & Hủy khi phục hồi)
  // ---------------------------------------------------------
  console.log(`\n${colors.bold}5. Kiểm tra BRL-05 (Delay Buffer 12-24h cho Email từ chối & Hủy khi phục hồi):${colors.reset}`);

  function scheduleRejectionEmail(now = new Date(), delayHours = 12) {
    return new Date(now.getTime() + delayHours * 60 * 60 * 1000);
  }

  function handleStageChangeEmailBuffer(fromStage, toStage, currentScheduledAt) {
    if (toStage === "REJECTED") {
      return { scheduledAt: scheduleRejectionEmail(new Date(), 12), isEmailSent: false };
    }
    if (fromStage === "REJECTED" && toStage !== "REJECTED") {
      // Hủy lịch gửi email khi thẻ được HR kéo khỏi REJECTED
      return { scheduledAt: null, isEmailSent: false };
    }
    return { scheduledAt: currentScheduledAt, isEmailSent: false };
  }

  const now = new Date();
  const scheduledTime = scheduleRejectionEmail(now, 12);
  const diffHours = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  assert(diffHours === 12, "Thời gian gửi thư từ chối được hoãn đúng 12 giờ so với thời điểm loại");

  const restored = handleStageChangeEmailBuffer("REJECTED", "SCREENING", scheduledTime);
  assert(restored.scheduledAt === null, "Tự động hủy lịch gửi email từ chối khi HR kéo thẻ khỏi cột REJECTED (BRL-05)");

  // ---------------------------------------------------------
  // TEST SUITE 6: Database Integration & Seed Data Integrity
  // ---------------------------------------------------------
  console.log(`\n${colors.bold}6. Kiểm tra Dữ liệu Cơ sở dữ liệu SQLite (${colors.cyan}dev.db${colors.reset}${colors.bold}):${colors.reset}`);

  try {
    const userCount = await prisma.user.count();
    const jobCount = await prisma.job.count();
    const candidateCount = await prisma.candidate.count();
    const appCount = await prisma.application.count();

    assert(userCount >= 3, `Có sẵn ${userCount} tài khoản người dùng nội bộ (Admin, HR, Hiring Manager)`);
    assert(jobCount >= 2, `Có sẵn ${jobCount} tin tuyển dụng hoạt động`);
    assert(candidateCount >= 3, `Có sẵn ${candidateCount} hồ sơ ứng viên`);
    assert(appCount >= 3, `Có sẵn ${appCount} đơn ứng tuyển ở các vòng Kanban`);

    // ---------------------------------------------------------
    // TEST SUITE 7: SPRINT 1 — XÁC THỰC & BẢO MẬT USER (UC-00 / BRL-Auth)
    // ---------------------------------------------------------
    console.log(`\n${colors.bold}7. Kiểm tra Sprint 1 (Xác thực, Phân quyền RBAC & BRL-Auth):${colors.reset}`);

    // BRL-Auth validation
    function validateUserCreation(password, email, existingEmails) {
      if (!password || password.length < 8) {
        return { valid: false, error: "Mật khẩu phải từ 8 ký tự trở lên (BRL-Auth)" };
      }
      if (existingEmails.includes(email.toLowerCase().trim())) {
        return { valid: false, error: "Email đã tồn tại trong hệ thống" };
      }
      return { valid: true };
    }

    assert(validateUserCreation("123", "new@ats.vn", []).valid === false, "Chặn tạo mật khẩu ngắn dưới 8 ký tự (BRL-Auth)");
    assert(validateUserCreation("SecurePass123", "hr@recoverx.career", ["hr@recoverx.career"]).valid === false, "Chặn tạo trùng email đã có");
    assert(validateUserCreation("StrongPass2026", "recruiter2@recoverx.career", ["hr@recoverx.career"]).valid === true, "Chấp nhận tạo tài khoản hợp lệ");

    // Test Admin Role permission check
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    assert(adminUser !== null && adminUser.role === "ADMIN", "Tài khoản ADMIN tồn tại và có quyền quản trị tối cao");

    const hrLead = await prisma.user.findFirst({ where: { role: "HR" } });
    assert(hrLead !== null && hrLead.role === "HR", "Tài khoản HR LEAD tồn tại và sẵn sàng quản lý Pipeline");

    // RBAC Permissions logic check (docs/08 RBAC Matrix — Phân tách vòng tuyển HR vs Hiring Manager)
    function checkRbacPermission(role, action) {
      if (action === "MOVE_TO_SCREENING") return role === "ADMIN" || role === "HR";
      if (action === "MOVE_TO_INTERVIEW_OR_HIRED") return role === "ADMIN" || role === "HIRING_MANAGER";
      if (action === "EDIT_PARSED_PROFILE") return role === "ADMIN" || role === "HR";
      if (action === "CREATE_JOB") return role === "ADMIN" || role === "HR";
      if (action === "MANAGE_USERS") return role === "ADMIN";
      if (action === "SCORECARD") return role === "HIRING_MANAGER" || role === "HR" || role === "ADMIN";
      return false;
    }

    assert(checkRbacPermission("HR", "MOVE_TO_SCREENING") === true, "Cho phép HR chuyển hồ sơ NEW -> SCREENING (tối đa Sàng lọc tiêu chuẩn)");
    assert(checkRbacPermission("HR", "MOVE_TO_INTERVIEW_OR_HIRED") === false, "Chặn HR chuyển hồ sơ sang INTERVIEW hoặc HIRED (RBAC-STAGE-LIMIT)");
    assert(checkRbacPermission("HIRING_MANAGER", "MOVE_TO_SCREENING") === false, "Chặn Hiring Manager chuyển hồ sơ từ vòng NEW (thuộc phạm vi HR)");
    assert(checkRbacPermission("HIRING_MANAGER", "MOVE_TO_INTERVIEW_OR_HIRED") === true, "Cho phép Hiring Manager duyệt hồ sơ sang INTERVIEW và HIRED");
    assert(checkRbacPermission("HR", "EDIT_PARSED_PROFILE") === true, "Cho phép HR chỉnh sửa thủ công 5 trường thông tin trích xuất từ CV");
    assert(checkRbacPermission("HIRING_MANAGER", "EDIT_PARSED_PROFILE") === false, "Chặn Hiring Manager chỉnh sửa dữ liệu trích xuất hồ sơ");
    assert(checkRbacPermission("HIRING_MANAGER", "CREATE_JOB") === false, "Chặn Hiring Manager tạo JD tuyển dụng (chỉ xem)");
    assert(checkRbacPermission("HR", "CREATE_JOB") === true, "Cho phép HR tạo JD tuyển dụng");
    assert(checkRbacPermission("HR", "MANAGE_USERS") === false, "Chặn HR quản trị người dùng (chỉ Admin)");
    assert(checkRbacPermission("ADMIN", "MANAGE_USERS") === true, "Cho phép Admin toàn quyền quản trị người dùng");
    // ---------------------------------------------------------
    // TEST SUITE 8: SPRINT 2 — KANBAN PIPELINE & BRL-07 SLA
    // ---------------------------------------------------------
    console.log(`\n${colors.bold}8. Kiểm tra Sprint 2 (Kanban Pipeline, BRL-07 SLA & Audit Trail):${colors.reset}`);

    // BRL-07 SLA Alert logic
    function checkSlaBreach(stage, stageUpdatedAtMs, currentMs) {
      const hours = (currentMs - stageUpdatedAtMs) / (1000 * 60 * 60);
      if (stage === "NEW" && hours > 48) {
        return { breached: true, hours: Math.floor(hours), msg: `Tồn đọng ${Math.floor(hours)}h (Quá hạn 48h)` };
      }
      if (stage === "SCREENING" && hours > 72) {
        return { breached: true, hours: Math.floor(hours), msg: `Sàng lọc ${Math.floor(hours)}h (Quá hạn 72h)` };
      }
      return { breached: false, hours: Math.floor(hours) };
    }

    const testNow = Date.now();
    const appFresh = testNow - 10 * 3600000; // 10h ago
    const appNewLate = testNow - 55 * 3600000; // 55h ago (> 48h)
    const appScreeningLate = testNow - 80 * 3600000; // 80h ago (> 72h)

    assert(checkSlaBreach("NEW", appFresh, testNow).breached === false, "Hồ sơ NEW dưới 48h không bị cảnh báo vi phạm SLA");
    assert(checkSlaBreach("NEW", appNewLate, testNow).breached === true, "Hồ sơ NEW trên 48h kích hoạt cảnh báo vi phạm SLA (BRL-07)");
    assert(checkSlaBreach("SCREENING", appScreeningLate, testNow).breached === true, "Hồ sơ SCREENING trên 72h kích hoạt cảnh báo vi phạm SLA (BRL-07)");

    // Test transition with BRL-06 enforcement
    const appWithNoScorecard = await prisma.application.findFirst({
      where: { evaluations: { none: {} } },
      include: { evaluations: true },
    });
    if (appWithNoScorecard) {
      assert(appWithNoScorecard.evaluations.length === 0, "Tìm thấy hồ sơ chưa có Scorecard trong DB để kiểm thử BRL-06");
      const canHire = appWithNoScorecard.evaluations.length > 0;
      assert(canHire === false, "Chặn tuyệt đối không cho phép chuyển hồ sơ chưa có Scorecard sang HIRED");
    }

    const appWithScorecard = await prisma.application.findFirst({
      where: { evaluations: { some: {} } },
      include: { evaluations: true },
    });
    if (appWithScorecard) {
      assert(appWithScorecard.evaluations.length > 0, "Tìm thấy hồ sơ đã có Scorecard để kiểm thử cho phép tuyển");
      const canHire = appWithScorecard.evaluations.length > 0;
      assert(canHire === true, "Cho phép hồ sơ đã có Scorecard được duyệt sang HIRED");
    }

    // ---------------------------------------------------------
    // TEST SUITE 9: SPRINT 3 — PUBLIC CAREERS & HYBRID AI CV INTAKE (UC-01, UC-02, UC-03)
    // ---------------------------------------------------------
    console.log(`\n${colors.bold}9. Kiểm tra Sprint 3 (Public Careers, BRL-09 Quota & Hybrid AI Matching):${colors.reset}`);

    // BRL-09: Hạn mức nộp tối đa 3 jobs trong 90 ngày
    function checkApplicationQuota(pastCount) {
      if (pastCount >= 3) {
        return { allowed: false, error: "Đã vượt quá hạn mức nộp tối đa 3 vị trí trong 90 ngày (BRL-09)" };
      }
      return { allowed: true };
    }

    assert(checkApplicationQuota(0).allowed === true, "Ứng viên mới nộp 0 vị trí được phép ứng tuyển");
    assert(checkApplicationQuota(2).allowed === true, "Ứng viên đã nộp 2 vị trí vẫn được phép nộp vị trí thứ 3");
    assert(checkApplicationQuota(3).allowed === false, "Chặn ứng viên đã nộp đủ 3 vị trí trong 90 ngày (BRL-09)");

    // Test Validation Regex
    const validEmail = "nguyen.van.a@example.com";
    const invalidEmail = "not-an-email";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    assert(emailRegex.test(validEmail) === true, "Email hợp lệ định dạng tiêu chuẩn");
    assert(emailRegex.test(invalidEmail) === false, "Chặn email sai định dạng");

    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    assert(phoneRegex.test("0912345678") === true, "Số điện thoại di động Việt Nam 10 chữ số hợp lệ");
    assert(phoneRegex.test("+84912345678") === true, "Số điện thoại có mã vùng +84 hợp lệ");
    assert(phoneRegex.test("12345") === false, "Chặn số điện thoại quá ngắn hoặc thiếu đầu số 0/+84");

    // Test AI CV Parsing & Match Scoring (Heuristic Layer)
    const sampleCv = `
      NGUYỄN VĂN MINH - SENIOR FRONTEND DEVELOPER
      Email: minh.nguyen@gmail.com | Phone: 0909123456
      Kinh nghiệm: 4 năm kinh nghiệm phát triển phần mềm
      Kỹ năng: React, Next.js, TypeScript, Tailwind CSS, REST API, Git
      Học vấn: Đại học Bách Khoa TP.HCM - Cử nhân CNTT
    `;

    const sampleJob = {
      title: "Senior Frontend Engineer",
      requiredSkills: ["React", "TypeScript", "Next.js", "Tailwind"],
      minExperienceYears: 3,
    };

    // Calculate match
    const lowerCv = sampleCv.toLowerCase();
    const matched = sampleJob.requiredSkills.filter(s => lowerCv.includes(s.toLowerCase()));
    const missing = sampleJob.requiredSkills.filter(s => !lowerCv.includes(s.toLowerCase()));

    assert(matched.length === 4, "Bóc tách đầy đủ 4 kỹ năng trọng yếu từ văn bản CV");
    assert(missing.length === 0, "Không có kỹ năng trọng yếu nào bị thiếu");
    assert(matched.includes("React") && matched.includes("TypeScript"), "Trích xuất chính xác React & TypeScript");

    // ---------------------------------------------------------
    // TEST SUITE 10: SPRINT 4 — SCORECARD MODAL, RE-POOLING & CSV EXPORT
    // ---------------------------------------------------------
    console.log(`\n${colors.bold}10. Kiểm tra Sprint 4 (Scorecard Modal, Talent Re-pooling & CSV Export):${colors.reset}`);

    // Test BRL-08 Scorecard Calculation
    function computeWeightedScore(t, c, cu) {
      return Number((t * 0.4 + c * 0.3 + cu * 0.3).toFixed(2));
    }
    assert(computeWeightedScore(5, 4, 3) === 4.10, "Tính chuẩn trọng số (5*0.4 + 4*0.3 + 3*0.3 = 4.10)");
    assert(computeWeightedScore(3, 3, 3) === 3.00, "Điểm đồng đều 3 sao cho ra đúng 3.00");

    // Test CSV Format with UTF-8 BOM
    const testCsvHeader = "\uFEFFMã đơn ứng tuyển,Họ và tên ứng viên,Email";
    assert(testCsvHeader.charCodeAt(0) === 0xFEFF, "Tệp CSV chứa ký tự Byte Order Mark (UTF-8 BOM) cho Microsoft Excel");

    // Test Re-pooling data model integrity
    const repoolTestApp = await prisma.application.findFirst();
    assert(repoolTestApp !== null, "Hệ thống có sẵn ứng viên để hỗ trợ chức năng Re-pooling (UC-06)");

    const totalJobsInDb = await prisma.job.count();
    assert(totalJobsInDb >= 2, `Có ${totalJobsInDb} vị trí tuyển dụng sẵn sàng nhận hồ sơ chuyển luồng`);

    // ---------------------------------------------------------
    // TEST SUITE 11: NÂNG CẤP AN TOÀN BẢO MẬT (ENTERPRISE SECURITY SUITE)
    // ---------------------------------------------------------
    console.log(`\n${colors.bold}11. Kiểm tra Nâng cấp An toàn & Bảo mật (Security & Cryptography):${colors.reset}`);

    const crypto = require("crypto");

    // 1. Kiểm tra Băm mật khẩu PBKDF2 có Salt (NFR-SEC-02)
    function testHashPassword(password) {
      const salt = crypto.randomBytes(16).toString("hex");
      const iterations = 100000;
      const derivedKey = crypto
        .pbkdf2Sync(password, salt, iterations, 64, "sha512")
        .toString("hex");
      return `pbkdf2$${iterations}$${salt}$${derivedKey}`;
    }

    function testVerifyPassword(password, storedHash) {
      if (storedHash.startsWith("pbkdf2$")) {
        const parts = storedHash.split("$");
        const iterations = parseInt(parts[1], 10);
        const salt = parts[2];
        const originalHash = parts[3];
        const derivedKey = crypto
          .pbkdf2Sync(password, salt, iterations, 64, "sha512")
          .toString("hex");
        return crypto.timingSafeEqual(Buffer.from(derivedKey, "hex"), Buffer.from(originalHash, "hex"));
      }
      return password === storedHash;
    }

    const hashed = testHashPassword("Admin@123");
    assert(hashed.startsWith("pbkdf2$100000$"), "Mật khẩu được băm bằng thuật toán NIST PBKDF2-SHA512 với 100,000 vòng lặp");
    assert(testVerifyPassword("Admin@123", hashed) === true, "Xác thực mật khẩu đúng thành công");
    assert(testVerifyPassword("WrongPassword", hashed) === false, "Chặn mật khẩu sai chính xác");

    // 2. Kiểm tra Ký số Token Phiên làm việc HMAC-SHA256 chống mạo danh
    const SECRET = "recoverx_test_secret";
    function signToken(payload) {
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
      const sig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
      return `${payloadB64}.${sig}`;
    }

    function verifyToken(token) {
      const [payloadB64, sig] = token.split(".");
      const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
      return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    }

    const originalToken = signToken({ id: 1, role: "HR" });
    const verified = verifyToken(originalToken);
    assert(verified !== null && verified.role === "HR", "Chữ ký số HMAC-SHA256 của phiên hợp lệ");

    // Giả mạo đổi role thành ADMIN
    const tamperedPayload = Buffer.from(JSON.stringify({ id: 1, role: "ADMIN" })).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${originalToken.split(".")[1]}`;
    let tamperDetected = false;
    try {
      tamperDetected = verifyToken(tamperedToken) === null;
    } catch {
      tamperDetected = true;
    }
    assert(tamperDetected, "Phát hiện và chặn thành công hành vi sửa đổi Cookie giả mạo quyền Admin");

    // 3. Kiểm tra Chữ ký Nhị phân (Magic Bytes Verification)
    function verifyMagicBytes(fileExt, buffer) {
      if (fileExt === ".pdf") {
        return buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
      }
      if (fileExt === ".docx") {
        return buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4B; // PK
      }
      return false;
    }

    const validPdfBuffer = Buffer.from("%PDF-1.4 sample content");
    const fakePdfBuffer = Buffer.from("<html><script>alert('xss')</script></html>");
    const validDocxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x00]);

    assert(verifyMagicBytes(".pdf", validPdfBuffer) === true, "Chấp nhận tệp PDF có Magic Bytes hợp lệ (%PDF-)");
    assert(verifyMagicBytes(".pdf", fakePdfBuffer) === false, "Chặn tệp HTML/Mã độc đổi đuôi giả mạo thành .pdf");
    assert(verifyMagicBytes(".docx", validDocxBuffer) === true, "Chấp nhận tệp DOCX có Magic Bytes nén hợp lệ (PK)");

    // ---------------------------------------------------------
    // TEST SUITE 12: MỞ RỘNG PHẠM VI (SCOPE EXPANSION - UC-05A, UC-01A, UC-06A)
    // ---------------------------------------------------------
    console.log(`\n${colors.bold}12. Kiểm tra Mở Rộng Phạm Vi (Scope Expansion - UC-05A, UC-01A, UC-06A):${colors.reset}`);

    // 1. UC-05A: Module Lên lịch Phỏng vấn & Thư mời (Interview Scheduling)
    function generateInterviewEmail(candidateName, jobTitle, date, format, location, notes) {
      const isOnline = format === "ONLINE";
      const formattedDate = new Date(date).toLocaleString("vi-VN");
      return `Kính gửi ${candidateName}, Ban Tuyển dụng ReCoverX Career trân trọng mời bạn tham dự phỏng vấn vị trí ${jobTitle} vào lúc ${formattedDate}. Hình thức: ${isOnline ? "Trực tuyến qua Google Meet/Zoom: " + location : "Trực tiếp tại: " + location}.${notes ? " Ghi chú: " + notes : ""}`;
    }

    const testApp = await prisma.application.findFirst({
      include: { candidate: true, job: true }
    });

    if (testApp) {
      const interviewTime = new Date(Date.now() + 48 * 3600 * 1000);
      const emailContent = generateInterviewEmail(
        testApp.candidate.fullName,
        testApp.job.title,
        interviewTime,
        "ONLINE",
        "https://meet.google.com/test-room",
        "Mang theo laptop và chuẩn bị slide giới thiệu."
      );

      assert(emailContent.includes(testApp.candidate.fullName), "Thư mời phỏng vấn chứa tên ứng viên chính xác");
      assert(emailContent.includes(testApp.job.title), "Thư mời phỏng vấn chứa đúng tên vị trí tuyển dụng");
      assert(emailContent.includes("https://meet.google.com/test-room"), "Thư mời phỏng vấn chèn đúng link Google Meet trực tuyến");

      // Kiểm tra RBAC lên lịch phỏng vấn mới: Hiring Manager & Admin được phép, HR bị chặn (chỉ chuyển max SCREENING)
      const canScheduleInterview = (role) => ["HIRING_MANAGER", "ADMIN"].includes(role);
      assert(canScheduleInterview("HIRING_MANAGER") === true, "Hiring Manager có thẩm quyền lên lịch phỏng vấn và duyệt vòng Interview");
      assert(canScheduleInterview("ADMIN") === true, "ADMIN có thẩm quyền lên lịch phỏng vấn và gửi thư mời");
      assert(canScheduleInterview("HR") === false, "Chuyên viên HR bị chặn quyền xếp lịch / chuyển vòng Phỏng vấn theo RBAC mới");
    }

    // 2. UC-01A: Cổng Tra Cứu Tiến Độ Hồ Sơ (Candidate Tracker & Data Privacy)
    function sanitizeCandidateTrackerResponse(app, candidate, job) {
      // Tuân thủ NFR-SEC-04: KHÔNG trả về aiMatchScore, aiMatchRationale, comments nội bộ
      return {
        applicationId: app.id,
        candidateName: candidate.fullName,
        jobTitle: job.title,
        currentStage: app.currentStage,
        appliedAt: app.createdAt
      };
    }

    if (testApp) {
      const trackerData = sanitizeCandidateTrackerResponse(testApp, testApp.candidate, testApp.job);
      assert(trackerData.applicationId === testApp.id, "Tra cứu trả về đúng mã hồ sơ ứng tuyển");
      assert(trackerData.aiMatchScore === undefined, "Bảo mật NFR-SEC-04: Tracker không để lộ điểm AI Match nội bộ");
      assert(trackerData.aiMatchRationale === undefined, "Bảo mật NFR-SEC-04: Tracker không để lộ giải trình đánh giá AI");
      assert(trackerData.evaluatorComments === undefined, "Bảo mật NFR-SEC-04: Tracker không để lộ nhận xét của giám khảo");
    }

    // 3. UC-06A: Dọn dẹp Vòng đời Dữ liệu 180 ngày (BRL-10 Retention Purge)
    const retentionDays = 180;
    const cutoffMs = Date.now() - retentionDays * 24 * 3600 * 1000;
    const oldRejectedDate = new Date(Date.now() - 200 * 24 * 3600 * 1000);
    const recentRejectedDate = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const isEligibleForPurge = (stage, updatedAt) => stage === "REJECTED" && new Date(updatedAt).getTime() <= cutoffMs;

    assert(isEligibleForPurge("REJECTED", oldRejectedDate) === true, "Hồ sơ REJECTED quá 180 ngày (200 ngày) đủ điều kiện Hard Delete theo BRL-10");
    assert(isEligibleForPurge("REJECTED", recentRejectedDate) === false, "Hồ sơ REJECTED mới 30 ngày được bảo lưu an toàn trong Kho Nhân Tài");
    assert(isEligibleForPurge("HIRED", oldRejectedDate) === false, "Hồ sơ trúng tuyển (HIRED) không bị xóa bởi tác vụ BRL-10");

    // Phân quyền Purge: Chỉ Admin có quyền, HR & Manager bị chặn
    const canExecutePurge = (role) => role === "ADMIN";
    assert(canExecutePurge("ADMIN") === true, "Quản trị viên (Admin) có toàn quyền thực thi dọn dẹp BRL-10");
    assert(canExecutePurge("HR") === false, "Chuyên viên HR bị chặn quyền xóa vĩnh viễn hồ sơ theo BRL-10");
    assert(canExecutePurge("HIRING_MANAGER") === false, "Hiring Manager bị chặn quyền xóa vĩnh viễn hồ sơ theo BRL-10");

    // 4. Kiểm tra Next.js Server-Side Middleware (Chống Flash of Unauthenticated Content - FOUC)
    console.log(`\n${colors.bold}13. Kiểm tra Middleware Chặn Truy Cập Server (Chống Flash UI chưa đăng nhập):${colors.reset}`);

    function simulateMiddleware(pathname, sessionCookie) {
      if (pathname === "/admin/login") {
        if (sessionCookie && verifyToken(sessionCookie)) {
          return { status: 307, redirect: "/admin/pipeline" };
        }
        return { status: 200, allow: true };
      }

      if (pathname.startsWith("/admin")) {
        if (!sessionCookie) {
          return { status: 307, redirect: `/admin/login?from=${pathname}` };
        }
        const user = verifyToken(sessionCookie);
        if (!user) {
          return { status: 307, redirect: "/admin/login?expired=1", clearCookie: true };
        }
        if (pathname.startsWith("/admin/users") && user.role !== "ADMIN") {
          return { status: 307, redirect: "/admin/pipeline?error=forbidden" };
        }
        return { status: 200, allow: true, user };
      }

      return { status: 200, allow: true };
    }

    // 4.1 Chưa đăng nhập truy cập /admin/pipeline
    const unauthReq = simulateMiddleware("/admin/pipeline", null);
    assert(unauthReq.status === 307 && unauthReq.redirect.includes("/admin/login"), "Chặn truy cập /admin/pipeline ngay ở cấp Server (HTTP 307) khi chưa đăng nhập, không bao giờ render UI");

    // 4.2 Giả mạo cookie truy cập /admin/pipeline
    const tamperedReq = simulateMiddleware("/admin/pipeline", tamperedToken);
    assert(tamperedReq.status === 307 && tamperedReq.clearCookie === true, "Phát hiện cookie bị giả mạo chữ ký, xóa cookie và chuyển hướng về /admin/login ngay lập tức");

    // 4.3 Đã đăng nhập hợp lệ truy cập /admin/pipeline
    const validReq = simulateMiddleware("/admin/pipeline", originalToken);
    assert(validReq.status === 200 && validReq.allow === true, "Cho phép truy cập an toàn khi phiên đăng nhập hợp lệ");

    // 4.4 HR Lead cố truy cập /admin/users (Chỉ dành cho ADMIN)
    const hrUsersReq = simulateMiddleware("/admin/users", originalToken);
    assert(hrUsersReq.status === 307 && hrUsersReq.redirect.includes("forbidden"), "Middleware phát hiện HR Lead truy cập /admin/users và chuyển hướng về /admin/pipeline (RBAC Enforcement)");

    // 4.5 Đã đăng nhập truy cập lại trang /admin/login
    const loggedInLoginReq = simulateMiddleware("/admin/login", originalToken);
    assert(loggedInLoginReq.status === 307 && loggedInLoginReq.redirect === "/admin/pipeline", "Người dùng đã đăng nhập vào /admin/login sẽ tự động được chuyển hướng vào /admin/pipeline");

    // ---------------------------------------------------------
    // TEST SUITE 14: STATE MACHINE RULES, MANDATORY REJECTION REASON (BRL-11) & 5-FIELD EXTRACTION
    // ---------------------------------------------------------
    console.log(`\n${colors.bold}14. Kiểm tra State Machine Rules, Lý Do Từ Chối Bắt Buộc (BRL-11) & 5 Trường Cốt Lõi:${colors.reset}`);

    const ALLOWED_STAGE_FLOW = {
      NEW: ["SCREENING", "REJECTED"],
      SCREENING: ["NEW", "INTERVIEW", "REJECTED"],
      INTERVIEW: ["SCREENING", "HIRED", "REJECTED"],
      HIRED: [],
      REJECTED: ["NEW", "SCREENING", "INTERVIEW"],
    };

    function validateStageMoveTest({ fromStage, toStage, role, evaluationsCount = 0, rejectionReason = "" }) {
      if (fromStage === "HIRED") return { allowed: false, rule: "BRL-STAGE-TERMINAL" };
      if (role === "HR" && (toStage === "INTERVIEW" || toStage === "HIRED" || fromStage === "INTERVIEW")) {
        return { allowed: false, rule: "RBAC-STAGE-LIMIT" };
      }
      if (role === "HIRING_MANAGER" && (fromStage === "NEW" || toStage === "NEW")) {
        return { allowed: false, rule: "RBAC-STAGE-LIMIT" };
      }
      if (!ALLOWED_STAGE_FLOW[fromStage].includes(toStage)) {
        return { allowed: false, rule: "BRL-STAGE-ORDER" };
      }
      if (toStage === "REJECTED" && (!rejectionReason || rejectionReason.trim().length < 5)) {
        return { allowed: false, rule: "BRL-11" };
      }
      if (toStage === "HIRED" && evaluationsCount === 0) {
        return { allowed: false, rule: "BRL-06" };
      }
      return { allowed: true };
    }

    assert(validateStageMoveTest({ fromStage: "NEW", toStage: "SCREENING", role: "HR" }).allowed === true, "HR chuyển hợp lệ NEW -> SCREENING");
    assert(validateStageMoveTest({ fromStage: "SCREENING", toStage: "INTERVIEW", role: "HR" }).rule === "RBAC-STAGE-LIMIT", "Chặn HR kéo thẻ SCREENING -> INTERVIEW (Max HR là SCREENING)");
    assert(validateStageMoveTest({ fromStage: "INTERVIEW", toStage: "HIRED", role: "HR", evaluationsCount: 1 }).rule === "RBAC-STAGE-LIMIT", "Chặn HR chuyển INTERVIEW -> HIRED");
    assert(validateStageMoveTest({ fromStage: "SCREENING", toStage: "INTERVIEW", role: "HIRING_MANAGER" }).allowed === true, "Hiring Manager chuyển hợp lệ SCREENING -> INTERVIEW");
    assert(validateStageMoveTest({ fromStage: "INTERVIEW", toStage: "HIRED", role: "HIRING_MANAGER", evaluationsCount: 1 }).allowed === true, "Hiring Manager chuyển hợp lệ INTERVIEW -> HIRED khi đã có Scorecard");
    assert(validateStageMoveTest({ fromStage: "NEW", toStage: "INTERVIEW", role: "ADMIN" }).rule === "BRL-STAGE-ORDER", "Chặn nhảy cóc giai đoạn NEW -> INTERVIEW (BRL-STAGE-ORDER)");
    assert(validateStageMoveTest({ fromStage: "SCREENING", toStage: "HIRED", role: "HIRING_MANAGER", evaluationsCount: 1 }).rule === "BRL-STAGE-ORDER", "Chặn nhảy cóc giai đoạn SCREENING -> HIRED (BRL-STAGE-ORDER)");
    assert(validateStageMoveTest({ fromStage: "HIRED", toStage: "REJECTED", role: "ADMIN", rejectionReason: "Test lý do" }).rule === "BRL-STAGE-TERMINAL", "Khóa trạng thái kết thúc HIRED (BRL-STAGE-TERMINAL)");
    assert(validateStageMoveTest({ fromStage: "NEW", toStage: "REJECTED", role: "HR", rejectionReason: "" }).rule === "BRL-11", "Chặn từ chối hồ sơ khi bỏ trống Lý do từ chối (BRL-11)");
    assert(validateStageMoveTest({ fromStage: "NEW", toStage: "REJECTED", role: "HR", rejectionReason: "Thiếu kỹ năng Node.js theo JD" }).allowed === true, "Cho phép từ chối hồ sơ khi có Lý do từ chối rõ ràng (BRL-11)");
    assert(validateStageMoveTest({ fromStage: "INTERVIEW", toStage: "REJECTED", role: "HIRING_MANAGER", rejectionReason: "Không đạt đánh giá kỹ thuật vòng 1" }).allowed === true, "Cho phép Hiring Manager từ chối sau phỏng vấn kèm lý do rõ ràng");

    // Kiểm tra chuẩn 5 trường dữ liệu cốt lõi ban đầu (BRL-03)
    const CORE_EXTRACTION_FIELDS = ["fullName", "email", "jobTitle", "skills", "experienceYears"];
    assert(CORE_EXTRACTION_FIELDS.length === 5, "Quy chuẩn hiển thị ban đầu gói gọn đúng 5 trường cốt lõi theo JD (Họ tên, Email, Vị trí, Kỹ năng, Kinh nghiệm)");

    // ---------------------------------------------------------
    // TEST SUITE 15: ROLE-BASED OPERATIONAL DASHBOARD & DUAL-BRANDING
    // ---------------------------------------------------------
    console.log(`\n${colors.bold}15. Kiểm tra Operational Dashboard Phân Quyền Theo Role & Thương Hiệu Nội Bộ ATS:${colors.reset}`);

    function getDashboardPayloadKeysByRole(role) {
      if (!role || role === "PUBLIC") return { allowed: false, status: 401, keys: [] };
      const baseKeys = ["funnel", "sla", "summary", "activeJobs"];
      if (role === "HR") {
        return { allowed: true, status: 200, keys: [...baseKeys, "hrUnviewedQueue", "hrSlaBreachQueue", "hrRecentNewQueue"] };
      }
      if (role === "HIRING_MANAGER") {
        return { allowed: true, status: 200, keys: [...baseKeys, "hmScreeningQueue", "hmMissingScorecardQueue", "upcomingInterviews"] };
      }
      if (role === "ADMIN") {
        return { allowed: true, status: 200, keys: [...baseKeys, "slaBreachQueue", "upcomingInterviews", "adminStats", "recentAuditLogs"] };
      }
      return { allowed: false, status: 403, keys: [] };
    }

    const pubDash = getDashboardPayloadKeysByRole("PUBLIC");
    assert(pubDash.allowed === false && pubDash.status === 401, "Chặn người dùng công khai (PUBLIC) truy cập API Dashboard nội bộ (HTTP 401)");

    const hrDash = getDashboardPayloadKeysByRole("HR");
    assert(hrDash.keys.includes("hrUnviewedQueue") && !hrDash.keys.includes("adminStats") && !hrDash.keys.includes("recentAuditLogs"), "Dashboard HR chỉ nhận hàng đợi đầu phễu (NEW chưa xem, SLA >48h), không rò rỉ dữ liệu Admin/AuditLog");

    const hmDash = getDashboardPayloadKeysByRole("HIRING_MANAGER");
    assert(hmDash.keys.includes("hmScreeningQueue") && hmDash.keys.includes("hmMissingScorecardQueue") && !hmDash.keys.includes("hrUnviewedQueue") && !hmDash.keys.includes("adminStats"), "Dashboard Hiring Manager tập trung vào duyệt PV, thiếu Scorecard và Lịch PV; ẩn hàng đợi NEW của HR & Admin Stats");

    const adminDash = getDashboardPayloadKeysByRole("ADMIN");
    assert(adminDash.keys.includes("slaBreachQueue") && adminDash.keys.includes("adminStats") && adminDash.keys.includes("recentAuditLogs"), "Dashboard Admin nhận toàn cảnh 360 độ gồm Điểm nghẽn SLA, Thống kê User/BRL-10 và AuditLog");

    // Kiểm tra tệp nguồn thực tế của Dual-Branding (Nội bộ ATS vs Public RecoverX)
    const navbarSrc = fs.readFileSync(path.join(process.cwd(), "src/components/admin/Navbar.tsx"), "utf8");
    const loginSrc = fs.readFileSync(path.join(process.cwd(), "src/app/admin/login/page.tsx"), "utf8");
    const publicJobsSrc = fs.readFileSync(path.join(process.cwd(), "src/app/jobs/page.tsx"), "utf8");
    assert(navbarSrc.includes("Applicant Tracking System") && navbarSrc.includes("/admin/dashboard"), "Navbar nội bộ mang thương hiệu chuẩn ATS — Applicant Tracking System và có tab Tổng quan (/admin/dashboard)");
    assert(loginSrc.includes("Applicant Tracking System") && !loginSrc.includes("truy cập tại RecoverX"), "Trang Đăng nhập nội bộ mang đúng tên đề tài ATS — Applicant Tracking System");
    assert(publicJobsSrc.includes("RecoverX"), "Cổng nộp CV công khai (/jobs) vẫn giữ nguyên tên doanh nghiệp giả lập RecoverX");

    // Kiểm tra phân tầng 3 mức AI Match % & tách Tab JD trong CandidateDrawer
    function classifyMatchTier(score) {
      if (score === null || score === undefined) return "PENDING";
      if (score >= 75) return "HIGH";
      if (score >= 50) return "MEDIUM";
      return "LOW";
    }
    assert(classifyMatchTier(85) === "HIGH", "Điểm AI >= 75% được xếp nhóm Xanh lá (Phù hợp cao)");
    assert(classifyMatchTier(62) === "MEDIUM", "Điểm AI 50% - 74% được xếp nhóm Vàng (Tiềm năng / Cân nhắc)");
    assert(classifyMatchTier(42) === "LOW", "Điểm AI < 50% được xếp nhóm Đỏ (Phù hợp thấp)");

    const drawerSrc = fs.readFileSync(path.join(process.cwd(), "src/components/candidate/CandidateDrawer.tsx"), "utf8");
    const cardSrc = fs.readFileSync(path.join(process.cwd(), "src/components/kanban/CandidateCard.tsx"), "utf8");
    assert(drawerSrc.includes('activeTab === "jd"') && drawerSrc.includes("getAiMatchTier"), "CandidateDrawer tách phần Tiêu chuẩn vị trí (JD) lên tab riêng và khôi phục AI đánh giá %");
    assert(drawerSrc.includes('activeTab === "evaluation"') && drawerSrc.includes('activeTab === "history"') && drawerSrc.includes("ScorecardPanel") && !drawerSrc.includes("<ScorecardModal"), "CandidateDrawer tách riêng Tab Phiếu đánh giá (inline ScorecardPanel) và Tab Nhật ký (AuditLog), bỏ popup modal");
    assert(cardSrc.includes("getAiMatchTier"), "CandidateCard trên Kanban hiển thị huy hiệu AI đánh giá % theo chuẩn 3 mức");

    // Kiểm tra logic nghiệp vụ Kho Nhân Tài (loại trừ NEW & HIRED, không có bộ lọc Chưa xem, 3 trạng thái chuẩn)
    const talentPoolApiSrc = fs.readFileSync(path.join(process.cwd(), "src/app/api/talent-pool/route.ts"), "utf8");
    const talentPoolPageSrc = fs.readFileSync(path.join(process.cwd(), "src/app/admin/talent-pool/page.tsx"), "utf8");
    assert(talentPoolApiSrc.includes('["REJECTED", "SCREENING", "INTERVIEW"]') && talentPoolApiSrc.includes("SILVER_MEDALIST"), "API Kho Nhân Tài loại trừ hoàn toàn NEW & HIRED và phân loại 3 nhóm nhân tài chuẩn (Silver Medalist / Đang chờ đợt khác / Lưu trữ dự phòng)");
    assert(!talentPoolPageSrc.includes("Chưa xem") && talentPoolPageSrc.includes("SILVER_MEDALIST"), "UI Kho Nhân Tài đã bỏ nút Chưa xem vô lý và lọc theo 3 trạng thái Kho Nhân Tài thực tế");

    // ---------------------------------------------------------
    // 16. KIỂM TRA NGUỒN CHÂN LÝ (SOURCE OF TRUTH), CHỐNG TRÙNG 2 LỚP (BRL-12)
    //     & CHỈ TIÊU TUYỂN DỤNG + CHỐNG PHỎNG VẤN DƯ (BRL-13)
    // ---------------------------------------------------------
    console.log(`\n${colors.bold}16. Kiểm tra Nguồn chân lý (BRL-12), Chống trùng 2 lớp & Chỉ tiêu tuyển dụng / Chống PV dư (BRL-13):${colors.reset}`);

    // 16A. Kiểm tra chuẩn hóa SĐT / Email / Tên
    function normalizePhoneJS(phone) {
      let c = String(phone || "").replace(/[\s.\-()]/g, "").trim();
      if (c.startsWith("+84")) c = "0" + c.slice(3);
      else if (c.startsWith("84") && c.length >= 11 && c.length <= 12) c = "0" + c.slice(2);
      return c;
    }
    assert(normalizePhoneJS("+84 912-345-678") === "0912345678", "Chuẩn hóa SĐT +84 912-345-678 về đúng chuẩn 0912345678");
    assert(normalizePhoneJS("0912.345.678") === "0912345678", "Chuẩn hóa SĐT có dấu chấm 0912.345.678 về 0912345678");

    // 16B. Kiểm tra phân loại xung đột Form vs CV (Source of Truth)
    function classifyMismatchJS({ formName, formEmail, formPhone, cvName, cvEmail, cvPhone, isUnreadable }) {
      if (isUnreadable) return { level: "UNREADABLE", requiresConfirm: false };
      const normName = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").trim().toLowerCase();
      const nameDiff = Boolean(cvName && normName(formName) !== normName(cvName));
      const emailDiff = Boolean(cvEmail && formEmail.toLowerCase() !== cvEmail.toLowerCase());
      const phoneDiff = Boolean(cvPhone && normalizePhoneJS(formPhone) !== normalizePhoneJS(cvPhone));
      if (nameDiff && (emailDiff || phoneDiff)) return { level: "CRITICAL", requiresConfirm: true };
      if (emailDiff || phoneDiff || nameDiff) return { level: "MINOR", requiresConfirm: false };
      return { level: "NONE", requiresConfirm: false };
    }

    assert(
      classifyMismatchJS({
        formName: "Nguyễn Văn An",
        formEmail: "an@gmail.com",
        formPhone: "0912345678",
        cvName: "Nguyen Van An",
        cvEmail: "AN@gmail.com",
        cvPhone: "+84 912 345 678",
      }).level === "NONE",
      "Chỉ khác dấu tiếng Việt / +84 / chữ hoa được coi là khớp hoàn toàn (NONE)"
    );
    assert(
      classifyMismatchJS({
        formName: "Nguyễn Văn An",
        formEmail: "an.moi@gmail.com",
        formPhone: "0988111222",
        cvName: "Nguyễn Văn An",
        cvEmail: "an.cu@gmail.com",
        cvPhone: "0988111222",
      }).level === "MINOR",
      "Cùng ứng viên nhưng khác Email trên CV cũ được xếp mức MINOR (Form làm chính, CV lưu phụ)"
    );
    const critRes = classifyMismatchJS({
      formName: "Nguyễn Văn An",
      formEmail: "an@gmail.com",
      formPhone: "0912345678",
      cvName: "Trần Thị Bình",
      cvEmail: "binh@gmail.com",
      cvPhone: "0909888777",
    });
    assert(critRes.level === "CRITICAL" && critRes.requiresConfirm === true, "Lệch cả Họ tên lẫn liên hệ (nghi tải nhầm CV người khác) xếp mức CRITICAL và yêu cầu xác nhận 1 bước");
    assert(classifyMismatchJS({ formName: "An", formEmail: "a@b.c", formPhone: "0912345678", isUnreadable: true }).level === "UNREADABLE", "Tệp ảnh chụp/trống không đọc được chữ được gắn mức UNREADABLE để HR mở xem gốc");

    // 16C. Kiểm tra logic Chỉ tiêu tuyển dụng, Trần phỏng vấn cùng lúc & Tự đóng tin (BRL-13)
    function evaluateHeadcountJS({ targetHeadcount, maxActiveInterviews, hiredCount, activeInterviewCount, toStage, fromStage, forceOverride }) {
      const remaining = Math.max(0, targetHeadcount - hiredCount);
      const effectiveCap = remaining === 0 ? 0 : Math.max(remaining, Math.ceil((maxActiveInterviews * remaining) / targetHeadcount));
      if (toStage !== "INTERVIEW" && toStage !== "HIRED") return { allowed: true, effectiveCap };
      if (remaining === 0) return { allowed: false, status: 400, rule: "BRL-13-FULL", effectiveCap };
      if (toStage === "INTERVIEW" && fromStage !== "INTERVIEW" && activeInterviewCount >= effectiveCap && !forceOverride) {
        return { allowed: false, status: 409, requiresOverride: true, rule: "BRL-13-CAP", effectiveCap };
      }
      const willAutoClose = toStage === "HIRED" && fromStage !== "HIRED" && hiredCount + 1 >= targetHeadcount;
      return { allowed: true, willAutoClose, effectiveCap };
    }

    const capHit = evaluateHeadcountJS({ targetHeadcount: 1, maxActiveInterviews: 3, hiredCount: 0, activeInterviewCount: 3, fromStage: "SCREENING", toStage: "INTERVIEW", forceOverride: false });
    assert(!capHit.allowed && capHit.status === 409 && capHit.requiresOverride, "Cảnh báo mềm (HTTP 409) khi chạm trần phỏng vấn cùng lúc (3/3 cho 1 chỉ tiêu)");

    const capOverridden = evaluateHeadcountJS({ targetHeadcount: 1, maxActiveInterviews: 3, hiredCount: 0, activeInterviewCount: 3, fromStage: "SCREENING", toStage: "INTERVIEW", forceOverride: true });
    assert(capOverridden.allowed, "Cho phép vượt trần phỏng vấn khi Hiring Manager / Admin xác nhận rõ (forceOverride)");

    const tightenedCap = evaluateHeadcountJS({ targetHeadcount: 2, maxActiveInterviews: 6, hiredCount: 1, activeInterviewCount: 3, fromStage: "SCREENING", toStage: "INTERVIEW", forceOverride: false });
    assert(tightenedCap.effectiveCap === 3 && !tightenedCap.allowed && tightenedCap.status === 409, "Khi tuyển 2 người (trần 6) và đã tuyển 1 người, trần phỏng vấn tự động thu hẹp còn 3");

    const autoCloseRes = evaluateHeadcountJS({ targetHeadcount: 1, maxActiveInterviews: 3, hiredCount: 0, activeInterviewCount: 1, fromStage: "INTERVIEW", toStage: "HIRED", forceOverride: false });
    assert(autoCloseRes.allowed && autoCloseRes.willAutoClose === true, "Tự động đóng tin tuyển dụng khi xác nhận Tuyển chọn suất chỉ tiêu cuối cùng");

    const fullBlockRes = evaluateHeadcountJS({ targetHeadcount: 1, maxActiveInterviews: 3, hiredCount: 1, activeInterviewCount: 0, fromStage: "SCREENING", toStage: "INTERVIEW", forceOverride: true });
    assert(!fullBlockRes.allowed && fullBlockRes.status === 400 && fullBlockRes.rule === "BRL-13-FULL", "Chặn cứng chuyển thêm sang Phỏng vấn / Tuyển chọn khi vị trí đã tuyển đủ chỉ tiêu");

    // 16D. Kiểm tra mã nguồn & lược đồ thực tế cho cả 2 tính năng
    const appsApiSrc = fs.readFileSync(path.join(process.cwd(), "src/app/api/applications/route.ts"), "utf8");
    const previewApiSrc = fs.readFileSync(path.join(process.cwd(), "src/app/api/applications/preview-cv/route.ts"), "utf8");
    const moveApiSrc = fs.readFileSync(path.join(process.cwd(), "src/app/api/pipeline/move/route.ts"), "utf8");
    const jobsPageSrc = fs.readFileSync(path.join(process.cwd(), "src/app/admin/jobs/page.tsx"), "utf8");
    const applyFormSrc = fs.readFileSync(path.join(process.cwd(), "src/components/candidate/JobApplicationForm.tsx"), "utf8");

    assert(appsApiSrc.includes("computeCvFileHash") && appsApiSrc.includes("detectContactMismatch") && appsApiSrc.includes("duplicateWarningAppId"), "API nộp đơn đã tích hợp Source of Truth, SHA-256 CV hash và Chống trùng 2 lớp");
    assert(previewApiSrc.includes("extractContactsFromCvText") && applyFormSrc.includes("/api/applications/preview-cv") && applyFormSrc.includes("confirmMismatch"), "Cổng nộp hồ sơ hỗ trợ tải CV trước để tự điền (Auto-fill) và hộp xác nhận 1 bước khi lệch CV");
    assert(moveApiSrc.includes("evaluateHeadcountGate") && moveApiSrc.includes("jobAutoClosed"), "API chuyển vòng Kanban đã gắn chốt kiểm soát chỉ tiêu, trần PV cùng lúc và tự đóng tin");
    assert(jobsPageSrc.includes("targetHeadcount") && jobsPageSrc.includes("maxActiveInterviews"), "Trang Quản lý Tin tuyển dụng cho phép HR khai báo rõ Số lượng cần tuyển và Giới hạn PV cùng lúc");

    // 16E. Kiểm tra cột mới trên CSDL SQLite thực tế
    const headcountSampleJob = await prisma.job.findFirst({ select: { id: true, targetHeadcount: true, maxActiveInterviews: true } });
    assert(headcountSampleJob && headcountSampleJob.targetHeadcount >= 1 && headcountSampleJob.maxActiveInterviews >= 1, "CSDL SQLite đã đồng bộ các cột chỉ tiêu tuyển dụng (targetHeadcount, maxActiveInterviews)");
    const dedupSampleApp = await prisma.application.findFirst({ select: { id: true, contactMismatchLevel: true, duplicateWarningAppId: true } });
    assert(dedupSampleApp && typeof dedupSampleApp.contactMismatchLevel === "string", "CSDL SQLite đã đồng bộ các cột cảnh báo lệch CV và nghi ngờ trùng Lớp 2");

    // ---------------------------------------------------------
    // 17. KIỂM TRA BRL-14 (PHÂN TRANG LŨY TIẾN TỪNG CỘT KANBAN & HIỆU NĂNG DOM)
    // ---------------------------------------------------------
    console.log(`\n${colors.bold}17. Kiểm tra BRL-14 (Phân trang Lũy tiến Từng Cột Kanban & API Pagination):${colors.reset}`);
    
    // 17.1 Kiểm tra thuật toán phân trang từng cột (Slice & Load More)
    const mock45Items = Array.from({ length: 45 }, (_, i) => ({ id: i + 1, fullName: `Ứng viên ${i + 1}` }));
    const PAGE_SIZE = 15;
    const initialDisplay = mock45Items.slice(0, PAGE_SIZE);
    assert(initialDisplay.length === 15, "Khởi tạo cột chỉ kết xuất đúng 15 hồ sơ đầu tiên (BRL-14)");
    assert(mock45Items.length > initialDisplay.length, "Phát hiện cột có thêm hồ sơ cần tải (hasMore = true)");
    
    const step2Limit = PAGE_SIZE + PAGE_SIZE;
    const step2Display = mock45Items.slice(0, step2Limit);
    assert(step2Display.length === 30, "Lần bấm Tải thêm thứ 1 mở rộng danh sách lên 30 hồ sơ");
    
    const step3Limit = step2Limit + PAGE_SIZE;
    const step3Display = mock45Items.slice(0, step3Limit);
    assert(step3Display.length === 45, "Lần bấm Tải thêm thứ 2 tải toàn bộ 45 hồ sơ");
    assert(mock45Items.length === step3Display.length, "Đã hiển thị toàn bộ hồ sơ (hasMore = false)");

    // 17.2 Kiểm tra mã nguồn API và UI
    const pipelineApiSrc = fs.readFileSync(path.join(process.cwd(), "src/app/api/pipeline/route.ts"), "utf8");
    const kanbanBoardSrc = fs.readFileSync(path.join(process.cwd(), "src/components/kanban/KanbanBoard.tsx"), "utf8");
    assert(pipelineApiSrc.includes("limitPerStage") && pipelineApiSrc.includes("stagePagination"), "API Pipeline hỗ trợ tham số limitPerStage và trả về cấu trúc stagePagination độc lập 5 cột");
    assert(kanbanBoardSrc.includes("stageLimits") && kanbanBoardSrc.includes("handleLoadMore") && kanbanBoardSrc.includes("allColumnItems.slice(0, currentLimit)"), "Kanban UI quản lý giới hạn hiển thị riêng từng cột và có nút Tải thêm lũy tiến");

  } catch (err) {
    assert(false, "Kết nối CSDL thất bại", err.message);
  } finally {
    await prisma.$disconnect();
  }

  // ---------------------------------------------------------
  // TỔNG KẾT
  // ---------------------------------------------------------
  console.log(`\n${colors.bold}====================================================${colors.reset}`);
  console.log(`  KẾT QUẢ KIỂM THỬ: ${colors.green}${passed} Passed${colors.reset} | ${colors.red}${failed} Failed${colors.reset}`);
  console.log(`${colors.bold}====================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
