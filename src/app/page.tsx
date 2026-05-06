import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <h1 className="text-3xl font-bold">仕様管理</h1>
      <p className="text-gray-500">アプリケーションの仕様をアプリ → 機能 → 仕様項目の階層で管理します。</p>
      <Link
        href="/applications"
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        アプリケーション一覧へ
      </Link>
    </div>
  );
}
