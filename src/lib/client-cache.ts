/**
 * RECOVERX ATS — ENTERPRISE CLIENT-SIDE CACHE & SWR (STALE-WHILE-REVALIDATE)
 * Lưu trữ dữ liệu tạm thời (In-Memory + SessionStorage) để:
 * - Không bao giờ giật/nhấp nháy Skeleton khi chuyển qua lại giữa các tab (Pipeline, Ứng viên, Tổng quan).
 * - Mở chi tiết ứng viên (CandidateDrawer) ngay lập tức (0ms delay) nếu đã từng mở trước đó.
 * - Đóng Drawer không bị load lại cả trang.
 * - Tự động cập nhật ngầm trong nền (Silent Background Revalidation).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const clientCache = {
  /**
   * Lấy dữ liệu từ Cache (Ưu tiên Memory Cache, sau đó tới SessionStorage).
   * Trả về dữ liệu nếu còn trong thời hạn maxAgeMs (mặc định 5 phút).
   */
  get<T>(key: string, maxAgeMs = 5 * 60 * 1000): T | null {
    if (typeof window === "undefined") return null;

    // 1. Kiểm tra Memory Cache
    const entry = memoryCache.get(key);
    if (entry && Date.now() - entry.timestamp <= maxAgeMs) {
      return entry.data as T;
    }

    // 2. Kiểm tra SessionStorage dự phòng
    try {
      const stored = sessionStorage.getItem(`ats_cache_${key}`);
      if (stored) {
        const parsed: CacheEntry<T> = JSON.parse(stored);
        if (Date.now() - parsed.timestamp <= maxAgeMs) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {
      // Bỏ qua lỗi quota/parse
    }

    return null;
  },

  /**
   * Lấy dữ liệu dù đã quá hạn để hiển thị ngay lập tức (Stale), sau đó fetch ngầm đè lên.
   */
  getStale<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    const entry = memoryCache.get(key);
    if (entry) return entry.data as T;

    try {
      const stored = sessionStorage.getItem(`ats_cache_${key}`);
      if (stored) {
        const parsed: CacheEntry<T> = JSON.parse(stored);
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    } catch {
      // Bỏ qua lỗi
    }

    return null;
  },

  /**
   * Lưu dữ liệu vào Cache
   */
  set<T>(key: string, data: T): void {
    if (typeof window === "undefined") return;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };

    memoryCache.set(key, entry);

    try {
      sessionStorage.setItem(`ats_cache_${key}`, JSON.stringify(entry));
    } catch {
      // SessionStorage có thể đầy nếu lưu file lớn, memory cache vẫn đảm bảo hoạt động
    }
  },

  /**
   * Xóa cache theo tiền tố hoặc xóa toàn bộ (dùng khi có thao tác thêm/xóa/đổi trạng thái)
   */
  invalidate(keyPrefix?: string): void {
    if (typeof window === "undefined") return;

    if (!keyPrefix) {
      memoryCache.clear();
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith("ats_cache_")) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {}
      return;
    }

    Array.from(memoryCache.keys()).forEach((key) => {
      if (key.startsWith(keyPrefix)) {
        memoryCache.delete(key);
      }
    });

    try {
      const prefix = `ats_cache_${keyPrefix}`;
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  },
};
