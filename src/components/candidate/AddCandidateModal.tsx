"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { X, Loader2 } from "lucide-react";

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
  const { locale } = useLanguage();
  const isEn = locale === "en";

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

  useEffect(() => {
    if (isOpen) {
      if (defaultJobId) {
        setSelectedJobId(String(defaultJobId));
      }
      fetch("/api/jobs")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const active = data.data.filter((j: any) => j.status === "ACTIVE");
            setJobs(active);
            if (!defaultJobId && !selectedJobId && active.length > 0) {
              setSelectedJobId(String(active[0].id));
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
        cvFile: isEn
          ? "Only .pdf or .docx files are accepted."
          : "Chỉ chấp nhận tệp định dạng .pdf hoặc .docx.",
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        cvFile: isEn ? "CV file size cannot exceed 10MB." : "Dung lượng tệp CV tối đa 10MB.",
      }));
      return;
    }

    const next = { ...fieldErrors };
    delete next.cvFile;
    setFieldErrors(next);
    setCvFile(file);

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
      errors.jobId = isEn ? "Please select a position." : "Vui lòng chọn vị trí tuyển dụng.";
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = isEn
        ? "Full name must be at least 2 characters."
        : "Họ và tên phải có ít nhất 2 ký tự.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = isEn ? "Please enter a valid email address." : "Email không hợp lệ.";
    }
    const cleanPhone = phone.replace(/\s+/g, "");
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      errors.phone = isEn
        ? "Phone number must be 10–11 digits."
        : "Số điện thoại phải gồm 10 chữ số.";
    }
    if (!cvFile) {
      errors.cvFile = isEn ? "Please upload a CV file." : "Vui lòng tải lên tệp CV.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(
        isEn
          ? "Please complete all required fields."
          : "Vui lòng hoàn thiện các trường bắt buộc."
      );
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
        setError(data.error || (isEn ? "Could not submit candidate." : "Không thể tiếp nhận hồ sơ."));
      } else {
        onSuccess();
        onClose();
        setFullName("");
        setEmail("");
        setPhone("");
        setCvFile(null);
        setCertificateFiles([]);
      }
    } catch (err: any) {
      console.error("Intake submit error:", err);
      setError(isEn ? "Connection error while submitting." : "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-zinc-200 max-w-2xl w-full shadow-xl max-h-[92vh] overflow-y-auto">
        {/* Header — Clean Swiss Minimalist (No Avatar Circle, No Excess Icons) */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
              {isEn ? "New Candidate Intake" : "Tiếp nhận hồ sơ ứng viên"}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isEn
                ? "Add a candidate from LinkedIn, referrals, or direct channels."
                : "Nhập hồ sơ từ LinkedIn, giới thiệu nội bộ hoặc các kênh tuyển dụng."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 cursor-pointer"
            aria-label={isEn ? "Close" : "Đóng"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="px-3.5 py-2.5 rounded-md bg-rose-50/70 border border-rose-200 border-l-2 border-l-brand-600 text-rose-800">
              {error}
            </div>
          )}

          {/* Row 1: Position & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                {isEn ? "Job Position" : "Vị trí tuyển dụng"}{" "}
                <span className="text-brand-600">*</span>
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
                className={`w-full text-xs rounded-md border bg-white py-2 px-3 text-zinc-900 focus:outline-none focus:border-zinc-900 ${
                  fieldErrors.jobId ? "border-brand-600" : "border-zinc-300"
                }`}
              >
                <option value="">
                  {isEn ? "Select a position..." : "Chọn vị trí tuyển dụng..."}
                </option>
                {jobs.map((job) => (
                  <option key={job.id} value={String(job.id)}>
                    {job.title} ({job.department})
                  </option>
                ))}
              </select>
              {fieldErrors.jobId && (
                <p className="text-[11px] text-brand-600 mt-1">{fieldErrors.jobId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                {isEn ? "Candidate Source" : "Nguồn ứng viên"}
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-xs rounded-md border border-zinc-300 bg-white py-2 px-3 text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                <option value="LINKEDIN">LinkedIn</option>
                <option value="REFERRAL">
                  {isEn ? "Internal Referral" : "Giới thiệu nội bộ"}
                </option>
                <option value="HEADHUNTER">
                  {isEn ? "Agency / Headhunter" : "Agency / Headhunter"}
                </option>
                <option value="DIRECT_EMAIL">
                  {isEn ? "Direct Email" : "Email trực tiếp"}
                </option>
                <option value="CAREER_SITE">
                  {isEn ? "Careers Portal" : "Cổng tuyển dụng"}
                </option>
                <option value="OTHER">{isEn ? "Other" : "Nguồn khác"}</option>
              </select>
            </div>
          </div>

          {/* Row 2: CV Upload */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                {isEn ? "Resume / CV (.pdf, .docx)" : "Tệp CV (.pdf, .docx)"}{" "}
                <span className="text-brand-600">*</span>
              </label>
              {cvFile && (
                <span className="text-[11px] font-medium text-emerald-700">
                  {isEn ? "Selected" : "Đã chọn"}
                </span>
              )}
            </div>

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
              className={`border border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
                fieldErrors.cvFile
                  ? "border-brand-600 bg-rose-50/20"
                  : cvFile
                  ? "border-emerald-500 bg-emerald-50/20"
                  : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-500 hover:bg-zinc-50"
              }`}
            >
              {cvFile ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{cvFile.name}</p>
                    <p className="text-[11px] text-zinc-500 tabular-nums">
                      {(cvFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCvFile(null);
                    }}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer shrink-0"
                  >
                    {isEn ? "Remove" : "Xóa"}
                  </button>
                </div>
              ) : (
                <div className="py-2 space-y-1">
                  <p className="font-medium text-zinc-800">
                    {isEn
                      ? "Click to upload or drag & drop CV file"
                      : "Bấm để chọn hoặc kéo thả tệp CV vào đây"}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {isEn ? "PDF or DOCX · Max 10MB" : "Hỗ trợ PDF, DOCX · Tối đa 10MB"}
                  </p>
                </div>
              )}
            </div>
            {fieldErrors.cvFile && (
              <p className="text-[11px] text-brand-600 mt-1">{fieldErrors.cvFile}</p>
            )}
          </div>

          {/* Row 3: Candidate Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                {isEn ? "Full Name" : "Họ và tên"} <span className="text-brand-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isEn ? "Jane Doe" : "Nguyễn Văn A"}
                className={`w-full text-xs rounded-md border bg-white py-2 px-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 ${
                  fieldErrors.fullName ? "border-brand-600" : "border-zinc-300"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-[11px] text-brand-600 mt-1">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                {isEn ? "Email" : "Email liên hệ"} <span className="text-brand-600">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className={`w-full text-xs rounded-md border bg-white py-2 px-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 ${
                  fieldErrors.email ? "border-brand-600" : "border-zinc-300"
                }`}
              />
              {fieldErrors.email && (
                <p className="text-[11px] text-brand-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                {isEn ? "Phone Number" : "Số điện thoại"}{" "}
                <span className="text-brand-600">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className={`w-full text-xs rounded-md border bg-white py-2 px-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 ${
                  fieldErrors.phone ? "border-brand-600" : "border-zinc-300"
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-[11px] text-brand-600 mt-1">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Row 4: Optional Certificates */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <div className="flex items-baseline justify-between">
              <label className="block text-xs font-medium text-zinc-700">
                {isEn ? "Certificates & Diplomas" : "Bằng cấp & chứng chỉ"}
              </label>
              <span className="text-[11px] text-zinc-400">
                {isEn ? "Optional · Up to 5 files" : "Tùy chọn · Tối đa 5 tệp"}
              </span>
            </div>

            <input
              type="file"
              ref={certInputRef}
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleAddCertificates(e.target.files)}
              className="hidden"
            />

            {certificateFiles.length > 0 && (
              <div className="space-y-1.5">
                {certificateFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md border border-zinc-200 bg-zinc-50 text-xs"
                  >
                    <span className="text-zinc-800 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertificate(idx)}
                      className="text-brand-600 hover:text-brand-700 font-medium cursor-pointer shrink-0"
                    >
                      {isEn ? "Remove" : "Xóa"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {certificateFiles.length < 5 && (
              <button
                type="button"
                onClick={() => certInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-md border border-dashed border-zinc-300 hover:border-zinc-500 text-zinc-600 hover:text-zinc-900 text-xs font-medium transition-colors cursor-pointer"
              >
                {isEn
                  ? "Attach certificate or diploma files (PNG, JPG, PDF)"
                  : "Đính kèm tệp bằng cấp hoặc chứng chỉ (PNG, JPG, PDF)"}
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer whitespace-nowrap"
            >
              {isEn ? "Cancel" : "Hủy"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-md inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {loading
                  ? isEn
                    ? "Submitting..."
                    : "Đang xử lý..."
                  : isEn
                  ? "Submit Intake"
                  : "Tiếp nhận hồ sơ"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
