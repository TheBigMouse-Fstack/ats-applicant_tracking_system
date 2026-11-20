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

  // Dự phòng số điện thoại định dạng quốc tế (VD: 123-456-7890 trong các mẫu CV quốc tế/Canva)
  if (uniquePhones.length === 0) {
    const intlPhoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    const intlMatches = raw.match(intlPhoneRegex) || [];
    for (const match of intlMatches) {
      const cleanMatch = match.trim();
      if (cleanMatch && !uniquePhones.includes(cleanMatch)) {
        uniquePhones.push(cleanMatch);
      }
    }
  }

  // 3. Trích xuất Họ tên thông minh đa bố cục (Hỗ trợ CV 1 cột truyền thống & CV 2 cột Canva/Figma/LaTeX)
  const rawLines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const sectionKeywords = new Set([
    "work", "workexperience", "experience", "workhistory", "employmenthistory", "professionalexperience", "careerhistory",
    "aboutme", "profile", "personalprofile", "summary", "executivesummary", "professionalsummary", "objective", "careerobjective",
    "education", "academichistory", "academicbackground", "qualifications",
    "skills", "coreskills", "keyskills", "technicalskills", "softskills", "competencies", "corecompetencies",
    "references", "referees", "reference",
    "contact", "contactme", "contactus", "contactinfo", "contactinformation", "contactdetails",
    "language", "languages", "certifications", "certificates", "licenses",
    "awards", "honors", "achievements", "projects", "interests", "hobbies", "activities",
    "curriculumvitae", "resume", "cv",
    "kinhnghiem", "kinhnghiemlamviec", "quatrinhcongtac", "hocvan", "trinhdohocvan", "bangcap",
    "kynang", "kynangchuyenmon", "nguoithamchieu", "nguoigioithieu", "thongtinlienhe", "lienhe",
    "thongtincanhan", "muctieunghenghiep", "muctieu", "gioithieubanthan", "gioithieu", "chungchi",
    "giaithuong", "thanhtich", "duan", "sothich", "hoatdong", "soyeulylich"
  ]);

  const roleWordPattern =
    /\b(engineer|developer|manager|analyst|specialist|intern|fresher|senior|junior|lead|director|ceo|cto|cfo|coo|consultant|designer|executive|representative|chuyên viên|nhân viên|kỹ sư|quản lý|trưởng phòng|thực tập|giám đốc)\b/i;
  const companyPattern =
    /\b(ltd|inc|corp|co\.|corporation|company|university|school|college|institute|academy|industries|international)\b/i;
  const addressPattern =
    /\b(street|st\.|avenue|ave\.|road|rd\.|city|state|vietnam|district|ward|hồ chí minh|hà nội|đà nẵng|anywhere)\b/i;
  const degreePattern =
    /\b(bachelor|master|phd|diploma|degree|cử nhân|thạc sĩ|tiến sĩ|kỹ sư|bachelor of)\b/i;
  const commonSkillOrNoise =
    /\b(critical thinking|digital marketing|management skills|negotiation|leadership|english|spanish|french|vietnamese|communication|teamwork|problem solving|time management|lorem|ipsum)\b/i;
  const contactLabelPattern =
    /^(phone|email|tel|mobile|telephone|fax|contact|address|sđt|địa chỉ|skype|website|portfolio|linkedin|github)\b/i;

  function isSectionHeader(str: string): boolean {
    const norm = str.toLowerCase().replace(/[^a-z0-9]/g, "");
    return sectionKeywords.has(norm);
  }

  function isNoiseLine(str: string): boolean {
    if (isSectionHeader(str)) return true;
    if (contactLabelPattern.test(str)) return true;
    if (roleWordPattern.test(str)) return true;
    if (companyPattern.test(str)) return true;
    if (addressPattern.test(str)) return true;
    if (degreePattern.test(str)) return true;
    if (commonSkillOrNoise.test(str)) return true;
    if (/@/.test(str) || /\d{2,}/.test(str) || /https?:\/\/|linkedin|github/i.test(str)) return true;
    if (/[:;,?!.]$/.test(str) || /[:;]/.test(str)) return true;
    return false;
  }

  function isValidNameWord(w: string): boolean {
    if (!w || w.length < 2) return false;
    if (contactLabelPattern.test(w)) return false;
    // Từ trong Họ tên bắt buộc viết hoa chữ cái đầu hoặc viết hoa toàn bộ (Hỗ trợ tiếng Việt & Quốc tế)
    return /^[A-ZÀ-Ỹ][a-zA-Zà-ỹ'.-]*$/.test(w);
  }

  interface NameCandidate {
    name: string;
    score: number;
    lineIdx: number;
  }

  const nameCandidates: NameCandidate[] = [];

  // Cách 1: Quét Họ tên trên 1 dòng duy nhất (Chuẩn 1 cột thông thường)
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (isNoiseLine(line)) continue;

    const clean = line.replace(/^[-•*:\s]+|[-•*:\s]+$/g, "").trim();
    const words = clean.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && words.every(isValidNameWord)) {
      let score = 50;
      // Nằm liền kề chức danh nghề nghiệp (Candidate Title)
      if (
        (i > 0 && roleWordPattern.test(rawLines[i - 1])) ||
        (i < rawLines.length - 1 && roleWordPattern.test(rawLines[i + 1]))
      ) {
        score += 40;
      }
      // Nằm ở đầu CV (top 5 / top 10 dòng)
      if (i < 5) score += 30;
      else if (i < 10) score += 15;
      else if (i > rawLines.length - 10) score += 20;

      // Nhận diện khối Người tham chiếu (References) để hạ điểm
      if (
        i < rawLines.length - 2 &&
        (/^(phone|email)[:\s]/i.test(rawLines[i + 1]) ||
          companyPattern.test(rawLines[i + 2]) ||
          /ceo|director|manager/i.test(rawLines[i + 2]))
      ) {
        score -= 60;
      }

      nameCandidates.push({ name: clean, score, lineIdx: i });
    }
  }

  // Cách 2: Nhận diện Họ tên bị ngắt 2 dòng (Thường gặp trong mẫu thiết kế Canva, Figma, chữ lớn)
  for (let i = 0; i < rawLines.length - 1; i++) {
    const l1 = rawLines[i].replace(/^[-•*:\s]+|[-•*:\s]+$/g, "").trim();
    const l2 = rawLines[i + 1].replace(/^[-•*:\s]+|[-•*:\s]+$/g, "").trim();

    if (isNoiseLine(l1) || isNoiseLine(l2)) continue;

    const w1 = l1.split(/\s+/);
    const w2 = l2.split(/\s+/);

    if (w1.length <= 2 && w2.length <= 2 && w1.length + w2.length <= 4) {
      if (w1.every(isValidNameWord) && w2.every(isValidNameWord)) {
        const combined = `${l1} ${l2}`;
        let score = 40;

        // Liền kề chức danh nghề nghiệp
        if (
          (i > 0 && roleWordPattern.test(rawLines[i - 1])) ||
          (i + 2 < rawLines.length && roleWordPattern.test(rawLines[i + 2]))
        ) {
          score += 50;
        }
        if (i < 5) score += 30;
        else if (i < 10) score += 15;
        else if (i > rawLines.length - 10) score += 25;

        if (
          (i > 0 && /contact/i.test(rawLines[i - 1])) ||
          (i + 2 < rawLines.length && /contact/i.test(rawLines[i + 2]))
        ) {
          score += 20;
        }

        nameCandidates.push({ name: combined, score, lineIdx: i });
      }
    }
  }

  let extractedName: string | null = null;
  if (nameCandidates.length > 0) {
    nameCandidates.sort((a, b) => b.score - a.score);
    extractedName = nameCandidates[0].name;
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
