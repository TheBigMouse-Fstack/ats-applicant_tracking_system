"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, X, ChevronRight, UserPlus, BellRing } from "lucide-react";
import { clientCache } from "@/lib/client-cache";

interface NewApplicationAlert {
  id: number;
  candidateName: string;
  jobTitle: string;
  department: string;
  aiScore: number | null;
  time: string;
}

/**
 * Phát âm thanh thông báo êm dịu phong cách macOS/Slack (Không cần file mp3 ngoài)
 */
function playChimeSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Hợp âm D5 -> A5 thanh thoát
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Trình duyệt có thể chặn nếu chưa có tương tác
  }
}

export default function RealtimeNotifications() {
  const [alerts, setAlerts] = useState<NewApplicationAlert[]>([]);
  const lastCheckedRef = useRef<string>(new Date().toISOString());
  const seenIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Chỉ kích hoạt thăm dò thời gian thực trên môi trường Client
    if (typeof window === "undefined") return;

    const pollInterval = setInterval(async () => {
      // Tiết kiệm tài nguyên: Chỉ thăm dò khi người dùng đang mở tab (visible)
      if (document.hidden) return;

      try {
        const since = lastCheckedRef.current;
        const res = await fetch(`/api/realtime/notifications?since=${encodeURIComponent(since)}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.success && Array.isArray(data.applications) && data.applications.length > 0) {
          lastCheckedRef.current = data.timestamp || new Date().toISOString();

          const incomingAlerts: NewApplicationAlert[] = [];

          for (const app of data.applications) {
            if (!seenIdsRef.current.has(app.id)) {
              seenIdsRef.current.add(app.id);

              incomingAlerts.push({
                id: app.id,
                candidateName: app.candidate?.fullName || "Ứng viên ẩn danh",
                jobTitle: app.job?.title || "Vị trí tuyển dụng",
                department: app.job?.department || "",
                aiScore: app.aiMatchScore ?? null,
                time: new Date().toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              });

              // Phát sự kiện toàn cục cho Pipeline Board & Table cập nhật Live
              window.dispatchEvent(
                new CustomEvent("ats:new-application", {
                  detail: app,
                })
              );
            }
          }

          if (incomingAlerts.length > 0) {
            // Xóa cache cũ để các component khác lấy dữ liệu mới
            clientCache.invalidate("pipeline_");
            clientCache.invalidate("candidates_");
            clientCache.invalidate("dashboard_");

            // Phát chuông báo và đẩy Toast hiển thị
            playChimeSound();
            setAlerts((prev) => [...incomingAlerts, ...prev].slice(0, 3));
          }
        }
      } catch (err) {
        // Lỗi mạng tạm thời, bỏ qua chờ chu kỳ tiếp theo
      }
    }, 6000); // Thăm dò chu kỳ 6 giây

    return () => clearInterval(pollInterval);
  }, []);

  const handleDismiss = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      {alerts.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto bg-white/95 backdrop-blur-md border-2 border-brand-500 shadow-xl rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden ring-4 ring-brand-100"
        >
          {/* Thanh highlight trên cùng */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600 animate-bounce">
                <BellRing className="w-4 h-4" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                  Hồ Sơ Ứng Tuyển Mới!
                </p>
                <p className="text-xs text-slate-400">{item.time}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDismiss(item.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col gap-1">
            <p className="text-sm font-bold text-slate-900 leading-snug">{item.candidateName}</p>
            <p className="text-xs text-slate-600 line-clamp-1">{item.jobTitle}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            {item.aiScore !== null ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                Khớp {Math.round(item.aiScore)}%
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Đã tiếp nhận vào cột Mới</span>
            )}

            <button
              type="button"
              onClick={() => {
                handleDismiss(item.id);
                // Điều hướng tới Pipeline xem ngay
                window.location.href = `/admin/pipeline`;
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
            >
              Xem trên Pipeline <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
