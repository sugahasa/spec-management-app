"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Application,
  Feature,
  Specification,
  SpecPriority,
  SpecStatus,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  STATUS_LABEL,
  STATUS_COLOR,
} from "@/lib/types";

const PRIORITIES: SpecPriority[] = ["HIGH", "MEDIUM", "LOW"];
const STATUSES: SpecStatus[] = ["DRAFT", "REVIEW", "APPROVED", "DEPRECATED"];

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  // app edit
  const [editingApp, setEditingApp] = useState(false);
  const [appName, setAppName] = useState("");
  const [appDesc, setAppDesc] = useState("");

  // feature form
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [featureName, setFeatureName] = useState("");
  const [featureDesc, setFeatureDesc] = useState("");

  // editing feature inline
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editFeatureName, setEditFeatureName] = useState("");
  const [editFeatureDesc, setEditFeatureDesc] = useState("");

  // expanded features
  const [expandedFeatureIds, setExpandedFeatureIds] = useState<Set<string>>(new Set());

  // spec form per feature
  const [showSpecFormFor, setShowSpecFormFor] = useState<string | null>(null);
  const [specTitle, setSpecTitle] = useState("");
  const [specDesc, setSpecDesc] = useState("");
  const [specAC, setSpecAC] = useState("");
  const [specPriority, setSpecPriority] = useState<SpecPriority>("MEDIUM");
  const [specStatus, setSpecStatus] = useState<SpecStatus>("DRAFT");

  // editing spec inline
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [editSpec, setEditSpec] = useState<Partial<Specification>>({});

  useEffect(() => {
    fetch(`/api/applications/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setApp(data);
        setAppName(data.name);
        setAppDesc(data.description);
        setLoading(false);
        // expand all features by default
        setExpandedFeatureIds(new Set(data.features.map((f: Feature) => f.id)));
      });
  }, [id]);

  // --- App ---
  const handleUpdateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: appName, description: appDesc }),
    });
    const updated = await res.json();
    setApp(updated);
    setEditingApp(false);
  };

  // --- Feature ---
  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureName.trim()) return;
    const res = await fetch(`/api/applications/${id}/features`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: featureName, description: featureDesc }),
    });
    const feature = await res.json();
    setApp((prev) => prev ? { ...prev, features: [...prev.features, { ...feature, specs: [] }] } : prev);
    setExpandedFeatureIds((prev) => new Set([...prev, feature.id]));
    setFeatureName("");
    setFeatureDesc("");
    setShowFeatureForm(false);
  };

  const handleUpdateFeature = async (featureId: string) => {
    const res = await fetch(`/api/applications/${id}/features/${featureId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editFeatureName, description: editFeatureDesc }),
    });
    const updated = await res.json();
    setApp((prev) =>
      prev ? { ...prev, features: prev.features.map((f) => f.id === featureId ? { ...f, ...updated } : f) } : prev
    );
    setEditingFeatureId(null);
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm("この機能を削除しますか？（仕様項目も全て削除されます）")) return;
    await fetch(`/api/applications/${id}/features/${featureId}`, { method: "DELETE" });
    setApp((prev) => prev ? { ...prev, features: prev.features.filter((f) => f.id !== featureId) } : prev);
  };

  // --- Spec ---
  const handleAddSpec = async (e: React.FormEvent, featureId: string) => {
    e.preventDefault();
    if (!specTitle.trim()) return;
    const res = await fetch(`/api/applications/${id}/features/${featureId}/specs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: specTitle, description: specDesc, acceptanceCriteria: specAC, priority: specPriority, status: specStatus }),
    });
    const spec = await res.json();
    setApp((prev) =>
      prev ? {
        ...prev,
        features: prev.features.map((f) =>
          f.id === featureId ? { ...f, specs: [...f.specs, spec] } : f
        ),
      } : prev
    );
    setSpecTitle(""); setSpecDesc(""); setSpecAC(""); setSpecPriority("MEDIUM"); setSpecStatus("DRAFT");
    setShowSpecFormFor(null);
  };

  const handleUpdateSpec = async (featureId: string, specId: string) => {
    const res = await fetch(`/api/applications/${id}/features/${featureId}/specs/${specId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editSpec),
    });
    const updated = await res.json();
    setApp((prev) =>
      prev ? {
        ...prev,
        features: prev.features.map((f) =>
          f.id === featureId
            ? { ...f, specs: f.specs.map((s) => s.id === specId ? updated : s) }
            : f
        ),
      } : prev
    );
    setEditingSpecId(null);
  };

  const handleDeleteSpec = async (featureId: string, specId: string) => {
    if (!confirm("この仕様項目を削除しますか？")) return;
    await fetch(`/api/applications/${id}/features/${featureId}/specs/${specId}`, { method: "DELETE" });
    setApp((prev) =>
      prev ? {
        ...prev,
        features: prev.features.map((f) =>
          f.id === featureId ? { ...f, specs: f.specs.filter((s) => s.id !== specId) } : f
        ),
      } : prev
    );
  };

  const toggleFeature = (featureId: string) => {
    setExpandedFeatureIds((prev) => {
      const next = new Set(prev);
      if (next.has(featureId)) next.delete(featureId); else next.add(featureId);
      return next;
    });
  };

  if (loading) return <p className="text-gray-400 text-sm">読み込み中...</p>;
  if (!app) return <p className="text-red-500">アプリケーションが見つかりません</p>;

  return (
    <div>
      <div className="mb-6">
        <Link href="/applications" className="text-sm text-gray-500 hover:text-indigo-600">
          ← アプリケーション一覧
        </Link>
      </div>

      {/* App header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
        {editingApp ? (
          <form onSubmit={handleUpdateApp} className="flex flex-col gap-3">
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <textarea
              value={appDesc}
              onChange={(e) => setAppDesc(e.target.value)}
              rows={2}
              placeholder="概要"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditingApp(false)} className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
              <button type="submit" className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{app.name}</h1>
              {app.description && <p className="text-sm text-gray-500 mt-1">{app.description}</p>}
              <p className="text-xs text-gray-400 mt-2">{app.features.length} 機能 / {app.features.reduce((s, f) => s + f.specs.length, 0)} 仕様項目</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditingApp(true)} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">編集</button>
              <button
                onClick={async () => {
                  if (!confirm("このアプリケーションを削除しますか？")) return;
                  await fetch(`/api/applications/${id}`, { method: "DELETE" });
                  router.push("/applications");
                }}
                className="text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                削除
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">機能一覧</h2>
        <button onClick={() => setShowFeatureForm((v) => !v)} className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          + 機能を追加
        </button>
      </div>

      {showFeatureForm && (
        <form onSubmit={handleAddFeature} className="mb-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <input
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              placeholder="機能名 *"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              value={featureDesc}
              onChange={(e) => setFeatureDesc(e.target.value)}
              placeholder="説明（任意）"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowFeatureForm(false)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
              <button type="submit" className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">追加</button>
            </div>
          </div>
        </form>
      )}

      {app.features.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm">機能がありません。「機能を追加」から作成してください。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {app.features.map((feature) => {
            const isExpanded = expandedFeatureIds.has(feature.id);
            return (
              <div key={feature.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Feature header */}
                <div className="p-4 flex items-center gap-3">
                  <button onClick={() => toggleFeature(feature.id)} className="text-gray-400 hover:text-gray-600 text-xs w-5 shrink-0">
                    {isExpanded ? "▼" : "▶"}
                  </button>
                  {editingFeatureId === feature.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        value={editFeatureName}
                        onChange={(e) => setEditFeatureName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        value={editFeatureDesc}
                        onChange={(e) => setEditFeatureDesc(e.target.value)}
                        placeholder="説明"
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button onClick={() => handleUpdateFeature(feature.id)} className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">保存</button>
                      <button onClick={() => setEditingFeatureId(null)} className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">×</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{feature.name}</p>
                        {feature.description && <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{feature.specs.length} 仕様項目</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingFeatureId(feature.id);
                            setEditFeatureName(feature.name);
                            setEditFeatureDesc(feature.description);
                          }}
                          className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => { setShowSpecFormFor(feature.id); setExpandedFeatureIds((p) => new Set([...p, feature.id])); }}
                          className="text-xs px-2 py-1 border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50"
                        >
                          + 仕様
                        </button>
                        <button onClick={() => handleDeleteFeature(feature.id)} className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50">削除</button>
                      </div>
                    </>
                  )}
                </div>

                {/* Spec form */}
                {isExpanded && showSpecFormFor === feature.id && (
                  <form onSubmit={(e) => handleAddSpec(e, feature.id)} className="border-t border-gray-100 bg-indigo-50 px-5 py-4">
                    <p className="text-sm font-medium text-indigo-700 mb-3">新しい仕様項目</p>
                    <div className="flex flex-col gap-2">
                      <input
                        value={specTitle}
                        onChange={(e) => setSpecTitle(e.target.value)}
                        placeholder="タイトル *"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      <textarea
                        value={specDesc}
                        onChange={(e) => setSpecDesc(e.target.value)}
                        placeholder="説明"
                        rows={2}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <textarea
                        value={specAC}
                        onChange={(e) => setSpecAC(e.target.value)}
                        placeholder="受け入れ条件（Given/When/Then など）"
                        rows={2}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">優先度</label>
                          <select value={specPriority} onChange={(e) => setSpecPriority(e.target.value as SpecPriority)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">ステータス</label>
                          <select value={specStatus} onChange={(e) => setSpecStatus(e.target.value as SpecStatus)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setShowSpecFormFor(null)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
                        <button type="submit" className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">追加</button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Specs list */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {feature.specs.length === 0 ? (
                      <p className="text-sm text-gray-400 px-6 py-4">仕様項目がありません。</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {feature.specs.map((spec) => (
                          <div key={spec.id} className="px-5 py-4">
                            {editingSpecId === spec.id ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  value={editSpec.title ?? ""}
                                  onChange={(e) => setEditSpec((p) => ({ ...p, title: e.target.value }))}
                                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <textarea
                                  value={editSpec.description ?? ""}
                                  onChange={(e) => setEditSpec((p) => ({ ...p, description: e.target.value }))}
                                  placeholder="説明"
                                  rows={2}
                                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                                <textarea
                                  value={editSpec.acceptanceCriteria ?? ""}
                                  onChange={(e) => setEditSpec((p) => ({ ...p, acceptanceCriteria: e.target.value }))}
                                  placeholder="受け入れ条件"
                                  rows={2}
                                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                                <div className="flex gap-3">
                                  <select value={editSpec.priority ?? "MEDIUM"} onChange={(e) => setEditSpec((p) => ({ ...p, priority: e.target.value as SpecPriority }))}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                    {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                                  </select>
                                  <select value={editSpec.status ?? "DRAFT"} onChange={(e) => setEditSpec((p) => ({ ...p, status: e.target.value as SpecStatus }))}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                                  </select>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => setEditingSpecId(null)} className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
                                  <button onClick={() => handleUpdateSpec(feature.id, spec.id)} className="text-sm px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-sm">{spec.title}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[spec.priority]}`}>{PRIORITY_LABEL[spec.priority]}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[spec.status]}`}>{STATUS_LABEL[spec.status]}</span>
                                  </div>
                                  {spec.description && <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{spec.description}</p>}
                                  {spec.acceptanceCriteria && (
                                    <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 whitespace-pre-wrap border border-gray-200">
                                      <span className="font-medium text-gray-700 block mb-1">受け入れ条件</span>
                                      {spec.acceptanceCriteria}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingSpecId(spec.id);
                                      setEditSpec({ title: spec.title, description: spec.description, acceptanceCriteria: spec.acceptanceCriteria, priority: spec.priority, status: spec.status });
                                    }}
                                    className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                                  >
                                    編集
                                  </button>
                                  <button onClick={() => handleDeleteSpec(feature.id, spec.id)} className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50">削除</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
