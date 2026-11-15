import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecoverX — Đối Tác Kỹ Thuật Số & Phát Triển Phần Mềm Doanh Nghiệp",
  description:
    "RecoverX là công ty công nghệ chuyên cung cấp dịch vụ kỹ thuật phần mềm cao cấp, kiến trúc Microservices, hiện đại hóa Cloud và đảm bảo chất lượng phần mềm.",
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
