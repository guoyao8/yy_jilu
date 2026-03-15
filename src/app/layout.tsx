import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "宝宝喂养记 - 记录宝宝成长的每一天",
  description: "一款专为家庭设计的宝宝喂养记录应用，支持双胞胎模式，家庭成员实时同步",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50 min-h-screen">
        <Navbar />
        <main className="min-h-screen pb-20">
          {children}
        </main>
      </body>
    </html>
  );
}
