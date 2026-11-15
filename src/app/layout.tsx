import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecoverX — Công ty Công nghệ & Phát triển Phần mềm",
  description:
    "RecoverX cung cấp các giải pháp công nghệ thông tin, kỹ thuật phần mềm chất lượng cao và cơ hội nghề nghiệp hàng đầu cho nhân tài công nghệ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
