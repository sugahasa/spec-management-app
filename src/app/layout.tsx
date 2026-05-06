import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "仕様管理",
  description: "アプリケーション仕様をGherkin形式で管理するツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-8">
            <Link href="/" className="font-bold text-indigo-600 text-lg">
              SpecManager
            </Link>
            <nav className="flex gap-6 text-sm font-medium">
              <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors">
                機能・シナリオ
              </Link>
              <Link href="/screens" className="text-gray-600 hover:text-indigo-600 transition-colors">
                画面
              </Link>
            </nav>
            <div className="ml-auto">
              <a
                href="/api/knowledge-base"
                download="knowledge-base.md"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                MD エクスポート
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
