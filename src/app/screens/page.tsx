"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Screen, ScreenImage, FeatureScreen } from "@/lib/types";

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

  // uploading state per screen
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // lightbox
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

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
    setScreens((prev) => [...prev, { ...created, images: [], features: [] }]);
    setName(""); setDescription(""); setPath("");
    setShowForm(false);
    setSubmitting(false);
  };

  const handleUpdate = async (id: string) => {
    const res = await fetch(`/api/screens/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDesc, path: editPath }),
    });
    const updated = await res.json();
    setScreens((prev) => prev.map((s) => s.id === id ? { ...s, ...updated } : s));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この画面を削除しますか？")) return;
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
    const imgRes = await fetch(`/api/screens/${screenId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: imagePath }),
    });
    const newImage: ScreenImage = await imgRes.json();
    setScreens((prev) => prev.map((s) =>
      s.id === screenId ? { ...s, images: [...s.images, newImage] } : s
    ));
    setUploading((prev) => ({ ...prev, [screenId]: false }));
  };

  const handleDeleteImage = async (screenId: string, imageId: string) => {
    if (!confirm("この画像を削除しますか？")) return;
    await fetch(`/api/screens/${screenId}/images/${imageId}`, { method: "DELETE" });
    setScreens((prev) => prev.map((s) =>
      s.id === screenId ? { ...s, images: s.images.filter((img) => img.id !== imageId) } : s
    ));
  };

  return (
    <div>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-8 right-0 text-white text-sm hover:text-gray-300"
            >
              × 閉じる
            </button>
            <img src={lightbox.src} alt={lightbox.alt} className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg" />
          </div>
        </div>
      )}

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

              {/* 画像ギャラリーエリア */}
              <div className="border-b border-gray-200">
                {screen.images.length > 0 ? (
                  <div className="flex flex-col gap-0">
                    {/* サムネイル横スクロール */}
                    <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
                      {screen.images.map((img, idx) => (
                        <div key={img.id} className="relative shrink-0 group">
                          <button
                            onClick={() => setLightbox({ src: img.path, alt: `${screen.name} - ${idx + 1}` })}
                            className="block w-28 h-20 relative rounded overflow-hidden border border-gray-200 hover:border-purple-400 transition-colors"
                          >
                            <Image
                              src={img.path}
                              alt={`${screen.name} ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteImage(screen.id, img.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {/* 追加ボタン */}
                      <button
                        onClick={() => fileInputRefs.current[screen.id]?.click()}
                        disabled={uploading[screen.id]}
                        className="shrink-0 w-28 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors text-xs"
                      >
                        {uploading[screen.id] ? (
                          <span>追加中...</span>
                        ) : (
                          <>
                            <span className="text-lg leading-none">+</span>
                            <span>画像を追加</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 px-3 py-1">{screen.images.length}枚 · クリックで拡大</p>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRefs.current[screen.id]?.click()}
                    disabled={uploading[screen.id]}
                    className="w-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-colors py-8"
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
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">画面名</label>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">パス / URL</label>
                    <input value={editPath} onChange={(e) => setEditPath(e.target.value)}
                      placeholder="パス / URL"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">説明</label>
                    <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="説明" rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                  </div>
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
