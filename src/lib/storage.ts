import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";
import path from "path";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";

/**
 * Kiểm tra xem các biến môi trường S3 của Neon Object Storage có sẵn sàng không
 */
export function isNeonStorageConfigured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_ENDPOINT_URL_S3
  );
}

let _filesClient: Files | null = null;

function getFilesClient(): Files | null {
  if (!isNeonStorageConfigured()) return null;
  if (!_filesClient) {
    try {
      _filesClient = new Files({ adapter: neon({ bucket: "uploads" }) });
    } catch (err) {
      console.warn("Không thể khởi tạo Files SDK Neon Object Storage:", err);
      _filesClient = null;
    }
  }
  return _filesClient;
}

export interface UploadResult {
  url: string;
  storageKey: string;
  storageType: "NEON_OBJECT_STORAGE" | "LOCAL_DISK";
}

/**
 * Tải tệp lên Neon Object Storage (với fallback an toàn sang ổ cứng cục bộ nếu offline)
 */
export async function uploadCvFile(
  safeFileName: string,
  buffer: Buffer,
  contentType: string = "application/pdf",
  folder: string = "cvs"
): Promise<UploadResult> {
  const client = getFilesClient();

  if (client) {
    try {
      const storageKey = `${folder}/${safeFileName}`;
      await client.upload(storageKey, buffer, {
        contentType,
      });

      // Trả về endpoint proxy an toàn được phân quyền (Bảo vệ PII của ứng viên)
      return {
        url: `/api/applications/storage/${encodeURIComponent(storageKey)}`,
        storageKey,
        storageType: "NEON_OBJECT_STORAGE",
      };
    } catch (neonErr) {
      console.warn("Neon Object Storage upload thất bại, chuyển sang lưu trữ cục bộ:", neonErr);
    }
  }

  // Fallback sang lưu trữ cục bộ (dành cho local development hoặc khi mất kết nối đám mây)
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder === "cvs" ? "" : folder);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, safeFileName);
    await writeFile(filePath, buffer);

    return {
      url: folder === "cvs" ? `/uploads/${safeFileName}` : `/uploads/${folder}/${safeFileName}`,
      storageKey: safeFileName,
      storageType: "LOCAL_DISK",
    };
  } catch (fsErr) {
    console.warn("Lưu trữ cục bộ không khả dụng (serverless read-only filesystem):", fsErr);
    return {
      url: `/uploads/${safeFileName}`,
      storageKey: safeFileName,
      storageType: "LOCAL_DISK",
    };
  }
}

/**
 * Đọc tệp từ Neon Object Storage hoặc Ổ cứng cục bộ
 */
export async function getCvFile(
  storageKey: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const client = getFilesClient();

  if (client && (storageKey.startsWith("cvs/") || storageKey.startsWith("certificates/"))) {
    try {
      const downloaded = await client.download(storageKey);
      const arrayBuf = await downloaded.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const contentType = storageKey.endsWith(".pdf")
        ? "application/pdf"
        : storageKey.endsWith(".docx")
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : storageKey.endsWith(".png")
        ? "image/png"
        : storageKey.endsWith(".jpg") || storageKey.endsWith(".jpeg")
        ? "image/jpeg"
        : "application/octet-stream";

      return { buffer, contentType };
    } catch (err) {
      console.warn("Không thể đọc từ Neon Object Storage, kiểm tra ổ cứng cục bộ:", err);
    }
  }

  // Đọc từ ổ cứng cục bộ
  const baseName = path.basename(storageKey);
  const localPath = path.join(process.cwd(), "public", "uploads", baseName);
  if (existsSync(localPath)) {
    const buffer = await readFile(localPath);
    const contentType = baseName.endsWith(".pdf")
      ? "application/pdf"
      : baseName.endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/octet-stream";

    return { buffer, contentType };
  }

  return null;
}
