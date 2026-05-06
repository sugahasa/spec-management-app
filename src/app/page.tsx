"use client";

import { useEffect, useState } from "react";
import {
  Feature,
  Specification,
  SpecPriority,
  SpecStatus,
  Screen,
  FeatureScreen,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  STATUS_LABEL,
  STATUS_COLOR,
} from "@/lib/types";

const PRIORITIES: SpecPriority[] = ["HIGH", "MEDIUM", "LOW"];
const STATUSES: SpecStatus[] = ["DRAFT", "REVIEW", "APPROVED", "DEPRECATED"];

type EditingSpec = {
  title: string;
  given: string;
  when: string;
  then: string;
  priority: SpecPriority;
  status: SpecStatus;
};

export default function HomePage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Feature form
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [featureName, setFeatureName] = useState("");
  const [featureDesc, setFeatureDesc] = useState("");

  // Inline feature editing
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editFeatureName, setEditFeatureName] = useState("");
  const [editFeatureDesc, setEditFeatureDesc] = useState("");

  // Screen link panel per feature
  const [linkingFeatureId, setLinkingFeatureId] = useState<string | null>(null);

  // Spec form per feature
  const [showSpecFormFor, setShowSpecFormFor] = useState<string | null>(null);
  const [newSpec, setNewSpec] = useState<EditingSpec>({ title: "", given: "", when: "", then: "", priority: "MEDIUM", status: "DRAFT" });

  // Inline spec editing
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [editSpec, setEditSpec] = useState<EditingSpec>({ title: "", given: "", when: "", then: "", priority: "MEDIUM", status: "DRAFT" });

  useEffect(() => {
    Promise.all([
      fetch("/api/features").then((r) => r.json()),
      fetch("/api/screens").then((r) => r.json()),
    ]).then(([f, s]) => {
      setFeatures(f);
      setScreens(s);
      setLoading(false);
      setExpandedIds(new Set(f.map((feat: Feature) => feat.id)));
    });
  }, []);

  // --- Feature ---
  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureName.trim()) return;
    const res = await fetch("/api/features", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: featureName, description: featureDesc }),
    });
    const feature = await res.json();
    setFeatures((prev) => [...prev, { ...feature, specs: [], screens: [] }]);
    setExpandedIds((prev) => new Set([...prev, feature.id]));
    setFeatureName(""); setFeatureDesc(""); setShowFeatureForm(false);
  };

  const handleUpdateFeature = async (featureId: string) => {
    const res = await fetch(`/api/features/${featureId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editFeatureName, description: editFeatureDesc }),
    });
    const updated = await res.json();
    setFeatures((prev) => prev.map((f) => f.id === featureId ? { ...f, ...updated } : f));
    setEditingFeatureId(null);
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm("この機能を削除しますか？（シナリオも全て削除されます）")) return;
    await fetch(`/api/features/${featureId}`, { method: "DELETE" });
    setFeatures((prev) => prev.filter((f) => f.id !== featureId));
  };

  // --- Spec ---
  const handleAddSpec = async (e: React.FormEvent, featureId: string) => {
    e.preventDefault();
    if (!newSpec.title.trim()) return;
    const res = await fetch(`/api/features/${featureId}/specs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSpec),
    });
    const spec = await res.json();
    setFeatures((prev) => prev.map((f) =>
      f.id === featureId ? { ...f, specs: [...f.specs, spec] } : f
    ));
    setNewSpec({ title: "", given: "", when: "", then: "", priority: "MEDIUM", status: "DRAFT" });
    setShowSpecFormFor(null);
  };

  const handleUpdateSpec = async (featureId: string, specId: string) => {
    const res = await fetch(`/api/features/${featureId}/specs/${specId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editSpec),
    });
    const updated = await res.json();
    setFeatures((prev) => prev.map((f) =>
      f.id === featureId
        ? { ...f, specs: f.specs.map((s) => s.id === specId ? updated : s) }
        : f
    ));
    setEditingSpecId(null);
  };

  const handleDeleteSpec = async (featureId: string, specId: string) => {
    if (!confirm("このシナリオを削除しますか？")) return;
    await fetch(`/api/features/${featureId}/specs/${specId}`, { method: "DELETE" });
    setFeatures((prev) => prev.map((f) =>
      f.id === featureId ? { ...f, specs: f.specs.filter((s) => s.id !== specId) } : f
    ));
  };

  // --- Screen link (Feature level) ---
  const linkedScreenIds = (feature: Feature) => new Set(feature.screens.map((l) => l.screenId));

  const handleToggleScreen = async (feature: Feature, screenId: string) => {
    const isLinked = linkedScreenIds(feature).has(screenId);
    if (isLinked) {
      await fetch(`/api/features/${feature.id}/screens`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenId }),
      });
      setFeatures((prev) => prev.map((f) =>
        f.id === feature.id
          ? { ...f, screens: f.screens.filter((l) => l.screenId !== screenId) }
          : f
      ));
    } else {
      const res = await fetch(`/api/features/${feature.id}/screens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenId }),
      });
      const link: FeatureScreen = await res.json();
      const screen = screens.find((sc) => sc.id === screenId)!;
      setFeatures((prev) => prev.map((f) =>
        f.id === feature.id
          ? { ...f, screens: [...f.screens, { ...link, screen }] }
          : f
      ));
    }
  };

  const toggleFeature = (id: string) =>
    setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (loading) return <p className="text-gray-400 text-sm">読み込み中...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">機能・シナリオ一覧</h1>
        <button onClick={() => setShowFeatureForm((v) => !v)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm">
          + Feature を追加
        </button>
      </div>

      {showFeatureForm && (
        <form onSubmit={handleAddFeature} className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Feature</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">機能名 *</label>
              <input value={featureName} onChange={(e) => setFeatureName(e.target.value)}
                placeholder="例：ユーザー認証"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">説明</label>
              <input value={featureDesc} onChange={(e) => setFeatureDesc(e.target.value)}
                placeholder="この機能の目的・概要（任意）"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowFeatureForm(false)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
              <button type="submit" className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">追加</button>
            </div>
          </div>
        </form>
      )}

      {features.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm">Feature がありません。「Feature を追加」から作成してください。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {features.map((feature) => {
            const isExpanded = expandedIds.has(feature.id);
            return (
              <div key={feature.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Feature header */}
                <div className="px-5 py-4 flex items-start gap-3 bg-indigo-50 border-b border-indigo-100">
                  <button onClick={() => toggleFeature(feature.id)} className="text-indigo-400 hover:text-indigo-600 text-xs mt-0.5 w-4 shrink-0">
                    {isExpanded ? "▼" : "▶"}
                  </button>
                  {editingFeatureId === feature.id ? (
                    <div className="flex-1 flex gap-2 flex-wrap">
                      <input value={editFeatureName} onChange={(e) => setEditFeatureName(e.target.value)}
                        className="flex-1 min-w-40 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <input value={editFeatureDesc} onChange={(e) => setEditFeatureDesc(e.target.value)}
                        placeholder="説明"
                        className="flex-1 min-w-40 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button onClick={() => handleUpdateFeature(feature.id)} className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">保存</button>
                      <button onClick={() => setEditingFeatureId(null)} className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">×</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Feature</span>
                        </div>
                        <p className="font-semibold text-base mt-0.5">{feature.name}</p>
                        {feature.description && <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-400">{feature.specs.length} Scenario</p>
                          {feature.screens.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {feature.screens.map((l) => (
                                <span key={l.id} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                                  {l.screen.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditingFeatureId(feature.id); setEditFeatureName(feature.name); setEditFeatureDesc(feature.description); }}
                          className="text-xs px-2 py-1 border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-100">編集</button>
                        <button onClick={() => setLinkingFeatureId(linkingFeatureId === feature.id ? null : feature.id)}
                          className={`text-xs px-2 py-1 border rounded transition-colors ${linkingFeatureId === feature.id ? "bg-purple-600 text-white border-purple-600" : "border-purple-200 text-purple-600 hover:bg-purple-50"}`}>
                          画面
                        </button>
                        <button onClick={() => { setShowSpecFormFor(feature.id); setExpandedIds((p) => new Set([...p, feature.id])); }}
                          className="text-xs px-2 py-1 border border-indigo-300 bg-indigo-600 text-white rounded hover:bg-indigo-700">+ Scenario</button>
                        <button onClick={() => handleDeleteFeature(feature.id)}
                          className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50">削除</button>
                      </div>
                    </>
                  )}
                </div>

                {/* Screen link panel (Feature level) */}
                {linkingFeatureId === feature.id && (
                  <div className="px-5 py-3 bg-purple-50 border-b border-purple-100">
                    <p className="text-xs font-medium text-purple-700 mb-2">紐づける画面を選択</p>
                    {screens.length === 0 ? (
                      <p className="text-xs text-gray-400">画面が登録されていません。先に「画面」メニューから登録してください。</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {screens.map((sc) => {
                          const linked = linkedScreenIds(feature).has(sc.id);
                          return (
                            <button key={sc.id} onClick={() => handleToggleScreen(feature, sc.id)}
                              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${linked ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-300 hover:border-purple-400"}`}>
                              {linked ? "✓ " : ""}{sc.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Scenario form */}
                {isExpanded && showSpecFormFor === feature.id && (
                  <form onSubmit={(e) => handleAddSpec(e, feature.id)} className="border-b border-gray-100 bg-indigo-50/50 px-5 py-4">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">New Scenario</p>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Scenario タイトル *</label>
                        <input value={newSpec.title} onChange={(e) => setNewSpec((p) => ({ ...p, title: e.target.value }))}
                          placeholder="例：ログインに成功する"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                      </div>
                      <GherkinField label="Given" placeholder="シナリオ開始時のシステム・データ状態"
                        value={newSpec.given} onChange={(v) => setNewSpec((p) => ({ ...p, given: v }))} color="blue" />
                      <GherkinField label="When" placeholder="ユーザーまたは外部要因のアクション"
                        value={newSpec.when} onChange={(v) => setNewSpec((p) => ({ ...p, when: v }))} color="amber" />
                      <GherkinField label="Then" placeholder="システムの観測可能な振る舞い"
                        value={newSpec.then} onChange={(v) => setNewSpec((p) => ({ ...p, then: v }))} color="green" />
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-gray-600 block mb-1">優先度</label>
                          <select value={newSpec.priority} onChange={(e) => setNewSpec((p) => ({ ...p, priority: e.target.value as SpecPriority }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-gray-600 block mb-1">ステータス</label>
                          <select value={newSpec.status} onChange={(e) => setNewSpec((p) => ({ ...p, status: e.target.value as SpecStatus }))}
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

                {/* Scenarios */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {feature.specs.length === 0 ? (
                      <p className="text-sm text-gray-400 px-6 py-5">Scenario がありません。</p>
                    ) : (
                      feature.specs.map((spec) => (
                        <div key={spec.id} className="px-5 py-4">
                          {editingSpecId === spec.id ? (
                            <div className="flex flex-col gap-3">
                              <div>
                                <label className="text-xs font-medium text-gray-600 block mb-1">Scenario タイトル</label>
                                <input value={editSpec.title} onChange={(e) => setEditSpec((p) => ({ ...p, title: e.target.value }))}
                                  placeholder="例：ログインに成功する"
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                              </div>
                              <GherkinField label="Given" placeholder="前提条件"
                                value={editSpec.given} onChange={(v) => setEditSpec((p) => ({ ...p, given: v }))} color="blue" />
                              <GherkinField label="When" placeholder="操作・イベント"
                                value={editSpec.when} onChange={(v) => setEditSpec((p) => ({ ...p, when: v }))} color="amber" />
                              <GherkinField label="Then" placeholder="期待される結果"
                                value={editSpec.then} onChange={(v) => setEditSpec((p) => ({ ...p, then: v }))} color="green" />
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <label className="text-xs font-medium text-gray-600 block mb-1">優先度</label>
                                  <select value={editSpec.priority} onChange={(e) => setEditSpec((p) => ({ ...p, priority: e.target.value as SpecPriority }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                    {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs font-medium text-gray-600 block mb-1">ステータス</label>
                                  <select value={editSpec.status} onChange={(e) => setEditSpec((p) => ({ ...p, status: e.target.value as SpecStatus }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingSpecId(null)} className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
                                <button onClick={() => handleUpdateSpec(feature.id, spec.id)} className="text-sm px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {/* Scenario header */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scenario</span>
                                    <p className="font-semibold text-sm">{spec.title}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[spec.priority]}`}>{PRIORITY_LABEL[spec.priority]}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[spec.status]}`}>{STATUS_LABEL[spec.status]}</span>
                                  </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => { setEditingSpecId(spec.id); setEditSpec({ title: spec.title, given: spec.given, when: spec.when, then: spec.then, priority: spec.priority, status: spec.status }); }}
                                    className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">編集</button>
                                  <button onClick={() => handleDeleteSpec(feature.id, spec.id)}
                                    className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50">削除</button>
                                </div>
                              </div>

                              {/* Gherkin fields */}
                              <div className="flex flex-col gap-1.5 text-sm">
                                {spec.given && <GherkinRow label="Given" value={spec.given} color="blue" />}
                                {spec.when && <GherkinRow label="When" value={spec.when} color="amber" />}
                                {spec.then && <GherkinRow label="Then" value={spec.then} color="green" />}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
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

function GherkinField({ label, placeholder, value, onChange, color }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  color: "blue" | "amber" | "green";
}) {
  const border = { blue: "border-blue-300 focus:ring-blue-400", amber: "border-amber-300 focus:ring-amber-400", green: "border-green-300 focus:ring-green-400" }[color];
  const tag = { blue: "bg-blue-100 text-blue-700", amber: "bg-amber-100 text-amber-700", green: "bg-green-100 text-green-700" }[color];
  return (
    <div className="flex gap-2 items-start">
      <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 mt-0.5 ${tag}`}>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2}
        className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${border}`} />
    </div>
  );
}

function GherkinRow({ label, value, color }: { label: string; value: string; color: "blue" | "amber" | "green" }) {
  const tag = { blue: "bg-blue-100 text-blue-700", amber: "bg-amber-100 text-amber-700", green: "bg-green-100 text-green-700" }[color];
  return (
    <div className="flex gap-2 items-start">
      <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${tag}`}>{label}</span>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
