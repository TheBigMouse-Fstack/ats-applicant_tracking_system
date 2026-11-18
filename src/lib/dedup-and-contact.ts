import crypto from "crypto";

export type ContactMismatchLevel = "NONE" | "MINOR" | "CRITICAL" | "UNREADABLE";

export interface ExtractedCvContacts {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  allEmails: string[];
  allPhones: string[];
  isUnreadable: boolean;
}

export interface ContactMismatchResult {
  level: ContactMismatchLevel;
  note: string | null;
  nameDiffers: boolean;
  emailDiffers: boolean;
  phoneDiffers: boolean;
  requiresApplicantConfirm: boolean;
}

/**
 * Chuẩn hóa Email: loại bỏ khoảng trắng và chuyển chữ thường
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

/**
 * Chuẩn hóa Số điện thoại Việt Nam về một định dạng duy nhất (0xxxxxxxxx)
 * - Loại bỏ khoảng trắng, dấu chấm, dấu gạch ngang, ngoặc đơn
 * - Quy đổi đầu +84 hoặc 84 (11 chữ số) về đầu 0
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[\s.\-()]/g, "").trim();
  if (cleaned.startsWith("+84")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("84") && cleaned.length >= 11 && cleaned.length <= 12) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Chuẩn hóa Họ và Tên để so khớp không phân biệt hoa/thường và dấu tiếng Việt
 */
export function normalizeVietnameseName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Kiểm tra xem 2 Họ tên có nhiều khả năng là cùng 1 người không
 * (Chấp nhận viết ngược tên kiểu Tây/Việt hoặc thiếu tên đệm)
 */
export function areNamesLikelySamePerson(
  nameA: string | null | undefined,
  nameB: string | null | undefined
): boolean {
  const normA = normalizeVietnameseName(nameA);
  const normB = normalizeVietnameseName(nameB);
  if (!normA || !normB) return true; // Thiếu 1 vế thì không kết luận khác người
  if (normA === normB) return true;

  const tokensA = normA.split(" ").filter((t) => t.length >= 2);
  const tokensB = normB.split(" ").filter((t) => t.length >= 2);
  if (tokensA.length === 0 || tokensB.length === 0) return true;

  const setB = new Set(tokensB);
  const overlap = tokensA.filter((t) => setB.has(t)).length;
  const minLen = Math.min(tokensA.length, tokensB.length);

  // Trùng ít nhất 2 từ (hoặc >= 60% số từ) được coi là cùng người
  return overlap >= Math.min(2, minLen) && overlap / minLen >= 0.5;
}

/**
 * Tính mã băm SHA-256 của tệp CV gốc để nhận diện trùng lặp tệp ở Lớp 2
 */
export function computeCvFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Trích xuất Họ tên, Email, Số điện thoại từ nội dung văn bản CV
 * Dùng cho: (1) Tự động điền trước (Auto-fill) khi ứng viên tải CV lên,
 * (2) Đối chiếu phát hiện lệch thông tin (Source of Truth) & Chống trùng Lớp 2.
 */
export function extractContactsFromCvText(cvText: string): ExtractedCvContacts {
  const raw = (cvText || "").trim();
  const isUnreadable = raw.length < 30;

  if (isUnreadable) {
    return {
      fullName: null,
      email: null,
      phone: null,
      allEmails: [],
      allPhones: [],
      isUnreadable: true,
    };
  }

  // 1. Trích xuất Email
  const emailMatches = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const uniqueEmails = Array.from(
    new Set(emailMatches.map((e) => normalizeEmail(e)).filter(Boolean))
  );

  // 2. Trích xuất Số điện thoại (ưu tiên SĐT đầu tiên xuất hiện ở đầu CV — tránh SĐT người tham chiếu ở cuối)
  const phoneRegex = /(?:\+84|0)(?:[\s.\-()]?\d){9,10}\b/g;
  const phoneMatches = raw.match(phoneRegex) || [];
  const uniquePhones = Array.from(
    new Set(
      phoneMatches
        .map((p) => normalizePhone(p))
        .filter((p) => /^0\d{9,10}$/.test(p))
    )
  );

  // 3. Trích xuất Họ tên từ các dòng đầu tiên của CV (bỏ qua tiêu đề CV, email, SĐT, chức danh chung)
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 4 && l.length <= 45);

  const ignoreLinePattern =
    /^(curriculum vitae|resume|cv|profile|summary|about me|contact|thông tin|hồ sơ|sơ yếu|kinh nghiệm|học vấn|kỹ năng|mục tiêu|người tham chiếu|references|skills|education|experience|objective|address|địa chỉ|email|phone|sđt)/i;
  const roleWordPattern =
    /\b(engineer|developer|manager|analyst|specialist|intern|fresher|senior|junior|lead|director|ceo|cto|consultant|designer|executive|representative|chuyên viên|nhân viên|kỹ sư|quản lý|trưởng phòng|thực tập)\b/i;

  let extractedName: string | null = null;
  for (const line of lines.slice(0, 8)) {
    if (ignoreLinePattern.test(line)) continue;
    if (/@/.test(line) || /\d{3,}/.test(line) || /https?:\/\/|linkedin|github/i.test(line)) {
      continue;
    }
    if (roleWordPattern.test(line)) continue;

    // Dòng tên hợp lệ thường có từ 2 đến 5 từ chữ cái
    const cleanLine = line.replace(/^[-•*:\s]+|[-•*:\s]+$/g, "").trim();
    const words = cleanLine.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 5 &&
      /^[a-zA-ZÀ-ỹ\s'.-]+$/.test(cleanLine)
    ) {
      extractedName = cleanLine;
      break;
    }
  }

  return {
    fullName: extractedName,
    email: uniqueEmails[0] || null,
    phone: uniquePhones[0] || null,
    allEmails: uniqueEmails,
    allPhones: uniquePhones,
    isUnreadable: false,
  };
}

/**
 * Đối chiếu thông tin Form đăng ký (Nguồn chính) vs Thông tin đọc từ CV (Nguồn phụ)
 * Phân loại 4 mức:
 * - UNREADABLE: Tệp CV không đọc được chữ (ảnh chụp / tệp trống)
 * - NONE: Khớp hoàn toàn (sau khi chuẩn hóa dấu, +84, hoa/thường)
 * - MINOR: Cùng người nhưng khác Email hoặc SĐT (đổi số / CV cũ) -> Lưu CV làm thông tin phụ
 * - CRITICAL: Khác cả Họ tên lẫn liên hệ -> Cảnh báo nộp nhầm CV người khác + yêu cầu xác nhận 1 bước
 */
export function detectContactMismatch(params: {
  formName: string;
  formEmail: string;
  formPhone: string;
  cvName?: string | null;
  cvEmail?: string | null;
  cvPhone?: string | null;
  isUnreadable?: boolean;
}): ContactMismatchResult {
  const { formName, formEmail, formPhone, cvName, cvEmail, cvPhone, isUnreadable } = params;

  if (isUnreadable) {
    return {
      level: "UNREADABLE",
      note: "Tệp CV không đọc được nội dung chữ (có thể là ảnh chụp hoặc tệp trống). Hệ thống ưu tiên dùng thông tin ứng viên đăng ký; vui lòng mở tab CV Gốc để kiểm tra trực tiếp.",
      nameDiffers: false,
      emailDiffers: false,
      phoneDiffers: false,
      requiresApplicantConfirm: false,
    };
  }

  const normFormEmail = normalizeEmail(formEmail);
  const normFormPhone = normalizePhone(formPhone);
  const normCvEmail = normalizeEmail(cvEmail);
  const normCvPhone = normalizePhone(cvPhone);

  const nameDiffers = Boolean(cvName && !areNamesLikelySamePerson(formName, cvName));
  const emailDiffers = Boolean(normCvEmail && normFormEmail && normCvEmail !== normFormEmail);
  const phoneDiffers = Boolean(normCvPhone && normFormPhone && normCvPhone !== normFormPhone);

  // Mức CRITICAL: Lệch Họ tên KÈM lệch Email hoặc SĐT (nghi tải nhầm CV người khác)
  if (nameDiffers && (emailDiffers || phoneDiffers)) {
    const parts: string[] = [];
    if (cvName) parts.push(`tên "${cvName}"`);
    if (emailDiffers && cvEmail) parts.push(`email "${cvEmail}"`);
    if (phoneDiffers && cvPhone) parts.push(`SĐT "${cvPhone}"`);
    return {
      level: "CRITICAL",
      note: `Thông tin trên tệp CV (${parts.join(", ")}) không trùng khớp với người đăng ký (${formName}). Vui lòng kiểm tra khả năng ứng viên tải nhầm tệp CV.`,
      nameDiffers,
      emailDiffers,
      phoneDiffers,
      requiresApplicantConfirm: true,
    };
  }

  // Mức MINOR: Chỉ khác Email hoặc SĐT (thường do CV cũ hoặc đổi số mới), hoặc chỉ khác tên nhẹ
  if (emailDiffers || phoneDiffers || nameDiffers) {
    const diffs: string[] = [];
    if (nameDiffers && cvName) diffs.push(`Họ tên trên CV: ${cvName}`);
    if (emailDiffers && cvEmail) diffs.push(`Email trên CV: ${cvEmail}`);
    if (phoneDiffers && cvPhone) diffs.push(`SĐT trên CV: ${cvPhone}`);

    return {
      level: "MINOR",
      note: `Có sai khác với tệp CV (${diffs.join(" • ")}). Hệ thống đang ưu tiên dùng thông tin ứng viên đăng ký làm liên hệ chính.`,
      nameDiffers,
      emailDiffers,
      phoneDiffers,
      requiresApplicantConfirm: false,
    };
  }

  return {
    level: "NONE",
    note: null,
    nameDiffers: false,
    emailDiffers: false,
    phoneDiffers: false,
    requiresApplicantConfirm: false,
  };
}
