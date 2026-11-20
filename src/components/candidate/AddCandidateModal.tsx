"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Award,
  Image as ImageIcon,
  Plus,
  Briefcase,
  User,
  Mail,
  Phone,
  Clock,
  FileUp,
} from "lucide-react";

interface JobOption {
  id: number;
  title: string;
  department: string;
}

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultJobId?: number | null;
}

export default function AddCandidateModal({
  isOpen,
  onClose,
  onSuccess,
  defaultJobId = null,
}: AddCandidateModalProps) {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(
    defaultJobId ? String(defaultJobId) : ""
  );
  const [source, setSource] = useState<string>("LINKEDIN");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const certInputRef = useRef<HTMLInputElement | null>(null);

  // Lấy danh sách Jobs đang mở & đồng bộ defaultJobId
  useEffect(() => {
    if (isOpen) {
      if (defaultJobId) {
        setSelectedJobId(String(defaultJobId));
      }
      fetch("/api/jobs")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setJobs(data.data.filter((j: any) => j.status === "ACTIVE"));
            if (!defaultJobId && !selectedJobId && data.data.length > 0) {
              setSelectedJobId(String(data.data[0].id));
            }
          }
        })
        .catch((e) => console.error("Fetch jobs error:", e));
    }
  }, [isOpen, defaultJobId]);

  if (!isOpen) return null;

  const handleCvSelect = (file: File | null) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".pdf", ".docx"].includes(ext)) {
      setFieldErrors((prev) => ({
        ...prev,
        cvFile: "Chỉ chấp nhận tệp định dạng .pdf hoặc .docx",
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        cvFile: "Dung lượng tệp CV không được vượt quá 10MB",
      }));
      return;
    }

    const next = { ...fieldErrors };
    delete next.cvFile;
    setFieldErrors(next);
    setCvFile(file);

    // Gợi ý tên ứng viên từ tên file nếu chưa nhập tên
    if (!fullName.trim()) {
      const cleanName = file.name
        .replace(/\.(pdf|docx)$/i, "")
        .replace(/^(cv|resume|profile)[_\s-]*/i, "")
        .replace(/[_-]/g, " ")
        .trim();
      if (cleanName.length > 2) {
        setFullName(cleanName);
      }
    }
  };

  const handleAddCertificates = (files: FileList | null) => {
    if (!files) return;
    const validExts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    const added: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (validExts.includes(ext) && file.size <= 10 * 1024 * 1024) {
        added.push(file);
      }
    }
    setCertificateFiles((prev) => [...prev, ...added].slice(0, 5));
  };

  const handleRemoveCertificate = (index: number) => {
    setCertificateFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!selectedJobId) {
      errors.jobId = "Vui lòng chọn vị trí tuyển dụng";
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = "Họ và tên ứng viên bắt buộc và phải từ 2 ký tự trở lên";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = "Email ứng viên không hợp lệ (VD: ungvien@gmail.com)";
    }
    const cleanPhone = phone.replace(/\s+/g, "");
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      errors.phone = "Số điện thoại không hợp lệ (Phải từ 10 chữ số)";
    }
    if (!cvFile) {
      errors.cvFile = "Vui lòng tải lên tệp CV của ứng viên";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Vui lòng hoàn thiện các trường thông tin bắt buộc.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("jobId", selectedJobId);
      formData.append("fullName", fullName.trim());
      formData.append("email", email.trim().toLowerCase());
      formData.append("phone", cleanPhone);
      formData.append("source", source);
      formData.append("cvFile", cvFile!);

      certificateFiles.forEach((f) => {
        formData.append("certificates", f);
      });

      const res = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setError(data.error || "Không thể tiếp nhận hồ sơ.");
      } else {
        onSuccess();
        onClose();
        // Reset form
        setFullName("");
        setEmail("");
        setPhone("");
        setCvFile(null);
        setCertificateFiles([]);
      }
    } catch (err: any) {
      console.error("Intake submit error:", err);
      setError("Lỗi kết nối máy chủ khi tiếp nhận hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {t("intake.modalTitle")}
              </h3>
              <p className="text-xs text-slate-500">
                {t("intake.modalSubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-900 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cặp trường 1: Vị trí Tuyển dụng & Nguồn Ứng viên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                {t("intake.jobLabel")}
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  setSelectedJobId(e.target.value);
                  if (fieldErrors.jobId) {
                    const next = { ...fieldErrors };
                    delete next.jobId;
                    setFieldErrors(next);
                  }
                }}
                className={`w-full text-xs rounded-xl border bg-white py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  fieldErrors.jobId ? "border-red-400 bg-red-50/20" : "border-slate-200"
                }`}
              >
                <option value="">-- {t("kanban.allJobs")} --</option>
                {jobs.map((job) => (
                  <option key={job.id} value={String(job.id)}>
                    {job.title} ({job.department})
                  </option>
                ))}
              </select>
              {fieldErrors.jobId && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.jobId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                {t("intake.sourceLabel")}
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="LINKEDIN">LinkedIn Sourcing</option>
                <option value="REFERRAL">Giới thiệu nội bộ (Referral)</option>
                <option value="HEADHUNTER">Agency / Headhunter</option>
                <option value="DIRECT_EMAIL">Email trực tiếp (Direct Email)</option>
                <option value="CAREER_SITE">Cổng tuyển dụng (Careers Portal)</option>
                <option value="OTHER">Nguồn khác (Other)</option>
              </select>
            </div>
          </div>

          {/* Tải CV gốc */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{t("intake.cvLabel")}</span>
              {cvFile && <span className="text-[11px] text-emerald-600 font-bold">✓ Selected</span>}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleCvSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                fieldErrors.cvFile
                  ? "border-red-400 bg-red-50/20"
                  : cvFile
                  ? "border-emerald-400 bg-emerald-50/20"
                  : "border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-brand-400"
              }`}
            >
              {cvFile ? (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">{cvFile.name}</span>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      ({(cvFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCvFile(null);
                    }}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <UploadCloud className="w-6 h-6 text-brand-600" />
                  <p className="text-xs font-bold text-slate-800">
                    {t("intake.uploadPrompt")}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {t("intake.uploadSub")}
                  </p>
                </div>
              )}
            </div>
            {fieldErrors.cvFile && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.cvFile}</p>
            )}
          </div>

          {/* Thông tin ứng viên: Họ tên, Email, SĐT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {t("intake.nameLabel")}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className={`w-full text-xs rounded-xl border bg-white py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  fieldErrors.fullName ? "border-red-400 bg-red-50/20" : "border-slate-200"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-[10px] text-red-600 mt-1">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {t("intake.emailLabel")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="a.nguyen@email.com"
                className={`w-full text-xs rounded-xl border bg-white py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  fieldErrors.email ? "border-red-400 bg-red-50/20" : "border-slate-200"
                }`}
              />
              {fieldErrors.email && (
                <p className="text-[10px] text-red-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {t("intake.phoneLabel")}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className={`w-full text-xs rounded-xl border bg-white py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  fieldErrors.phone ? "border-red-400 bg-red-50/20" : "border-slate-200"
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-[10px] text-red-600 mt-1">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Đính kèm Bằng cấp / Chứng chỉ dạng Ảnh hoặc PDF */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-600" />
                <span>{t("intake.certLabel")}</span>
              </label>
              <span className="text-[11px] text-slate-400">{t("intake.certOptional")}</span>
            </div>

            <input
              type="file"
              ref={certInputRef}
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleAddCertificates(e.target.files)}
              className="hidden"
            />

            {certificateFiles.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {certificateFiles.map((file, idx) => {
                    const isImg =
                      file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            {isImg ? (
                              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-red-600" />
                            )}
                          </div>
                          <span className="truncate font-medium text-slate-800 text-[11px]">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCertificate(idx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {certificateFiles.length < 5 && (
                  <button
                    type="button"
                    onClick={() => certInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50/40 text-slate-600 hover:text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ {t("intake.certUpload")}</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => certInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-200 hover:border-purple-400 hover:bg-slate-50 text-slate-500 hover:text-purple-700 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span>{t("intake.certUpload")}</span>
              </button>
            )}
          </div>

          {/* Footer nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t("intake.cancelBtn")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 rounded-xl shadow-md shadow-brand-500/20 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("intake.submitting")}</span>
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4" />
                  <span>{t("intake.submitBtn")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
