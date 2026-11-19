"use client";

import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastNotificationProps {
  id?: string | number;
  type: ToastType;
  title: string;
  message: string;
  duration?: number; // Milliseconds (mặc định: 5000ms cho error/warning, 4000ms cho success/info)
  onClose: () => void;
  pauseOnHover?: boolean;
}

export function ToastNotification({
  id,
  type,
  title,
  message,
  duration = type === "error" || type === "warning" ? 5000 : 4000,
  onClose,
  pauseOnHover = true,
}: ToastNotificationProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  // Kích hoạt đóng thông báo kèm hiệu ứng trượt mượt mà
  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // Khởi tạo và reset lại thời gian khi nội dung thông báo hoặc thời lượng thay đổi
  useEffect(() => {
    remainingTimeRef.current = duration;
    startTimeRef.current = Date.now();
    setIsClosing(false);
  }, [id, message, duration]);

  // Bộ đếm thời gian tự động đóng, hỗ trợ tạm dừng khi rê chuột (pause on hover)
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Tính toán lượng thời gian còn lại chính xác
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    } else {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, remainingTimeRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPaused, id, message, duration]);

  // Cấu hình giao diện màu sắc chuẩn phẳng, dịu mắt (Visual Calm 60-30-10)
  const typeConfig = {
    error: {
      border: "border-rose-200/90",
      bg: "bg-white",
      shadow: "shadow-xl shadow-rose-500/10",
      iconBg: "bg-rose-50 text-rose-600 border border-rose-200/60",
      icon: AlertCircle,
      titleColor: "text-rose-900 font-bold",
      trackBg: "bg-rose-100/60",
      barBg: "bg-rose-500",
    },
    success: {
      border: "border-emerald-200/90",
      bg: "bg-white",
      shadow: "shadow-xl shadow-emerald-500/10",
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
      icon: CheckCircle,
      titleColor: "text-emerald-900 font-bold",
      trackBg: "bg-emerald-100/60",
      barBg: "bg-emerald-500",
    },
    warning: {
      border: "border-amber-200/90",
      bg: "bg-white",
      shadow: "shadow-xl shadow-amber-500/10",
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200/60",
      icon: AlertTriangle,
      titleColor: "text-amber-900 font-bold",
      trackBg: "bg-amber-100/60",
      barBg: "bg-amber-500",
    },
    info: {
      border: "border-brand-200/90",
      bg: "bg-white",
      shadow: "shadow-xl shadow-brand-500/10",
      iconBg: "bg-brand-50 text-brand-600 border border-brand-200/60",
      icon: Info,
      titleColor: "text-brand-900 font-bold",
      trackBg: "bg-brand-100/60",
      barBg: "bg-brand-500",
    },
  }[type];

  const IconComponent = typeConfig.icon;

  return (
    <div
      role="alert"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${typeConfig.border} ${typeConfig.bg} ${typeConfig.shadow} p-4 text-slate-800 transition-all duration-200 ${
        isClosing
          ? "opacity-0 translate-y-2 scale-95"
          : "opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-3"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Biểu tượng phân loại */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${typeConfig.iconBg}`}
        >
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Nội dung tiêu đề và thông điệp */}
        <div className="flex-1 min-w-0 pr-1">
          <h4 className={`text-xs ${typeConfig.titleColor}`}>{title}</h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{message}</p>
        </div>

        {/* Nút đóng chủ động */}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer shrink-0"
          title="Đóng thông báo"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Đường chạy ngang đếm ngược thời gian tự biến mất (Countdown Progress Bar) */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${typeConfig.trackBg} overflow-hidden`}>
        <div
          key={`${id || message}-${duration}`}
          className={`h-full ${typeConfig.barBg} animate-toast-progress`}
          style={{
            animationDuration: `${duration}ms`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      </div>
    </div>
  );
}

export default ToastNotification;
