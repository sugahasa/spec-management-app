"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Application } from "@/lib/types";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => { setApps(data); setLoading(false); });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const created = await res.json();
    setApps((prev) => [created, ...prev]);
    setName("");
    setDescription("");
    setShowForm(false);
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このアプリケーションを削除しますか？（機能・仕様も全て削除されます）")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const totalSpecs = (app: Application) =>
    app.features.reduce((sum, f) => sum + f.specs.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">アプリケーション一覧</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
        >
          + 新規作成
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">新しいアプリケーション</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">名前 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="アプリケーション名"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">概要</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="アプリケーションの目的・概要"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                キャンセル
              </button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                作成
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>アプリケーションがありません。「新規作成」から追加してください。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map((app) => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <Link href={`/applications/${app.id}`} className="font-medium hover:text-indigo-600 transition-colors">
                  {app.name}
                </Link>
                {app.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{app.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {app.features.length} 機能 / {totalSpecs(app)} 仕様項目
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/applications/${app.id}`} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  詳細
                </Link>
                <button onClick={() => handleDelete(app.id)} className="text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
