"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Screen, FeatureScreen } from "@/lib/types";

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPath, setEditPath] = useState("");

  // upload state per screen (screenId -> uploading)
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/screens")
      .then((r) => r.json())
      .then((data) => { setScreens(data); setLoading(false); });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/screens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, path }),
    });
    const created = await res.json();
    setScreens((prev) => [...prev, { ...created, features: [] }]);
    setName(""); setDescription(""); setPath("");
    setShowForm(false);
    setSubmitting(false);
  };

  const handleUpdate = async (id: string) => {
    const current = screens.find((s) => s.id === id);
    const res = await fetch(`/api/screens/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDesc, path: editPath, imagePath: current?.imagePath ?? "" }),
    });
    const updated = await res.json();
    setScreens((prev) => prev.map((s) => s.id === id ? { ...s, ...updated } : s));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この画面を削除しますか？（紐づきも解除されます）")) return;
    await fetch(`/api/screens/${id}`, { method: "DELETE" });
    setScreens((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpload = async (screenId: string, file: File) => {
    setUploading((prev) => ({ ...prev, [screenId]: true }));
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "アップロードに失敗しました");
      setUploading((prev) => ({ ...prev, [screenId]: false }));
      return;
    }
    const { path: imagePath } = await res.json();
    const current = screens.find((s) => s.id === screenId)!;
    const putRes = await fetch(`/api/screens/${screenId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: current.name, description: current.description, path: current.path, imagePath }),
    });
    const updated = await putRes.json();
    setScreens((prev) => prev.map((s) => s.id === screenId ? { ...s, ...updated } : s));
    setUploading((prev) => ({ ...prev, [screenId]: false }));
  };

  const handleRemoveImage = async (screenId: string) => {
    if (!confirm("キャプチャ画像を削除しますか？")) return;
    const current = screens.find((s) => s.id === screenId)!;
    const res = await fetch(`/api/screens/${screenId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: current.name, description: current.description, path: current.path, imagePath: "" }),
    });
    const updated = await res.json();
    setScreens((prev) => prev.map((s) => s.id === screenId ? { ...s, ...updated } : s));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">画面一覧</h1>
        <button onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 text-sm">
          + 画面を追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">新しい画面</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">画面名 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="例：ログイン画面"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">パス / URL</label>
              <input value={path} onChange={(e) => setPath(e.target.value)}
                placeholder="例：/login"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">説明</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="この画面の目的・概要" rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">作成</button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : screens.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm">画面が登録されていません。「画面を追加」から登録してください。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {screens.map((screen) => (
            <div key={screen.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">

              {/* キャプチャ画像エリア */}
              <div className="relative bg-gray-100 border-b border-gray-200" style={{ minHeight: "180px" }}>
                {screen.imagePath ? (
                  <>
                    <Image
                      src={screen.imagePath}
                      alt={screen.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => fileInputRefs.current[screen.id]?.click()}
                        disabled={uploading[screen.id]}
                        className="text-xs px-2 py-1 bg-white/90 border border-gray-300 rounded shadow hover:bg-gray-50"
                      >
                        変更
                      </button>
                      <button
                        onClick={() => handleRemoveImage(screen.id)}
                        className="text-xs px-2 py-1 bg-white/90 border border-red-200 text-red-600 rounded shadow hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => fileInputRefs.current[screen.id]?.click()}
                    disabled={uploading[screen.id]}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    {uploading[screen.id] ? (
                      <span className="text-sm">アップロード中...</span>
                    ) : (
                      <>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">クリックしてキャプチャをアップロード</span>
                        <span className="text-xs text-gray-300">PNG / JPEG / GIF / WebP (最大10MB)</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  ref={(el) => { fileInputRefs.current[screen.id] = el; }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(screen.id, file);
                    e.target.value = "";
                  }}
                />
              </div>

              {/* 画面情報エリア */}
              {editingId === screen.id ? (
                <div className="p-4 flex flex-col gap-3">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <input value={editPath} onChange={(e) => setEditPath(e.target.value)}
                    placeholder="パス / URL"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="説明" rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
                    <button onClick={() => handleUpdate(screen.id)} className="text-sm px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">保存</button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-start gap-3 flex-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{screen.name}</p>
                      {screen.path && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">{screen.path}</span>
                      )}
                    </div>
                    {screen.description && <p className="text-sm text-gray-500 mt-0.5">{screen.description}</p>}
                    {screen.features.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-400 mb-1">紐づき機能 ({screen.features.length}件)</p>
                        <div className="flex flex-wrap gap-1">
                          {screen.features.map((link: FeatureScreen) => (
                            <span key={link.id} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                              {(link as any).feature?.name ?? ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setEditingId(screen.id); setEditName(screen.name); setEditDesc(screen.description); setEditPath(screen.path); }}
                      className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                      編集
                    </button>
                    <button onClick={() => handleDelete(screen.id)}
                      className="text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
