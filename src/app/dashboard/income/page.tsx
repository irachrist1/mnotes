"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { SlideOver } from "@/components/ui/SlideOver";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { DollarSign, Plus, Clock, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";
import { WEEKS_PER_MONTH } from "@/lib/constants";

type StreamStatus = "active" | "developing" | "planned" | "paused";
type StreamCategory = "consulting" | "employment" | "content" | "product" | "project-based";

const statusVariant = (s: string) => {
  switch (s) {
    case "active": return "success" as const;
    case "developing": return "info" as const;
    case "planned": return "default" as const;
    case "paused": return "warning" as const;
    default: return "default" as const;
  }
};

const categoryLabel: Record<string, string> = {
  consulting: "Consulting",
  employment: "Employment",
  content: "Content",
  product: "Product",
  "project-based": "Project-Based",
};

type FormData = {
  name: string;
  category: StreamCategory;
  status: StreamStatus;
  monthlyRevenue: string;
  timeInvestment: string;
  growthRate: string;
  notes: string;
  clientInfo: string;
};

const emptyForm: FormData = {
  name: "",
  category: "consulting",
  status: "active",
  monthlyRevenue: "",
  timeInvestment: "",
  growthRate: "",
  notes: "",
  clientInfo: "",
};

export default function IncomePage() {
  const streams = useQuery(api.incomeStreams.list);
  const createStream = useMutation(api.incomeStreams.create);
  const updateStream = useMutation(api.incomeStreams.update);
  const deleteStream = useMutation(api.incomeStreams.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"incomeStreams"> | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [filter, setFilter] = useState<"all" | StreamStatus>("all");
  const [saving, setSaving] = useState(false);

  const isLoading = streams === undefined;
  const totalRevenue = streams?.reduce((s, i) => s + i.monthlyRevenue, 0) ?? 0;
  const totalWeeklyRevenue = totalRevenue / WEEKS_PER_MONTH;
  const activeStreams = streams?.filter((i) => i.status === "active").length ?? 0;
  const totalTime = streams?.reduce((s, i) => s + i.timeInvestment, 0) ?? 0;
  const avgGrowth = streams && streams.length > 0 ? (streams.reduce((s, i) => s + i.growthRate, 0) / streams.length).toFixed(1) : "0";
  const filtered = filter === "all" ? streams : streams?.filter((s) => s.status === filter);
  const monthlyInput = parseFloat(form.monthlyRevenue);
  const weeklyEstimate = Number.isFinite(monthlyInput) && monthlyInput > 0 ? monthlyInput / WEEKS_PER_MONTH : null;

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (stream: NonNullable<typeof streams>[number]) => {
    setEditingId(stream._id);
    setForm({
      name: stream.name, category: stream.category, status: stream.status,
      monthlyRevenue: String(stream.monthlyRevenue), timeInvestment: String(stream.timeInvestment),
      growthRate: String(stream.growthRate), notes: stream.notes ?? "", clientInfo: stream.clientInfo ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(), category: form.category, status: form.status,
        monthlyRevenue: parseFloat(form.monthlyRevenue) || 0,
        timeInvestment: parseFloat(form.timeInvestment) || 0,
        growthRate: parseFloat(form.growthRate) || 0,
        notes: form.notes || undefined, clientInfo: form.clientInfo || undefined,
      };
      if (editingId) { await updateStream({ id: editingId, ...data }); toast.success("Stream updated"); }
      else { await createStream(data); toast.success("Stream created"); }
      setShowForm(false);
    } catch { toast.error("Failed to save"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: Id<"incomeStreams">) => {
    if (!confirm("Delete this income stream?")) return;
    try { await deleteStream({ id }); toast.success("Stream deleted"); } catch { toast.error("Failed to delete"); }
  };

  return (
    <>
      <PageHeader title="Income Streams" description="Manage and track all your revenue sources"
        action={<button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-primary text-sm transition-colors"><Plus className="w-3.5 h-3.5" />Add Stream</button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Monthly Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            detail={`~$${totalWeeklyRevenue.toFixed(2)}/wk`}
            icon={DollarSign}
          />
          <StatCard label="Active Streams" value={activeStreams} detail={`${streams?.length ?? 0} total`} icon={TrendingUp} />
          <StatCard label="Time / Week" value={`${totalTime}h`} icon={Clock} />
          <StatCard label="Avg Growth" value={`${avgGrowth}%`} icon={TrendingUp} />
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-4">
        {(["all", "active", "developing", "planned", "paused"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === s ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900" : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"}`}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (<TableSkeleton />) : filtered && filtered.length > 0 ? (
        <div className="card divide-y divide-stone-100 dark:divide-stone-800">
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            <span className="col-span-4">Name</span><span className="col-span-2">Category</span><span className="col-span-1">Status</span>
            <span className="col-span-2 text-right">Revenue</span><span className="col-span-1 text-right">Hrs/wk</span><span className="col-span-1 text-right">Growth</span><span className="col-span-1" />
          </div>
          {filtered.map((stream) => (
            <div key={stream._id}>
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                <div className="col-span-4 min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{stream.name}</p>
                  {stream.clientInfo && <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{stream.clientInfo}</p>}
                </div>
                <div className="col-span-2"><span className="text-xs text-stone-600 dark:text-stone-300">{categoryLabel[stream.category] ?? stream.category}</span></div>
                <div className="col-span-1"><Badge variant={statusVariant(stream.status)}>{stream.status}</Badge></div>
                <div className="col-span-2 text-right">
                  <span className="text-sm font-medium text-stone-900 dark:text-stone-100 tabular-nums">
                    ${stream.monthlyRevenue.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                    ~${(stream.monthlyRevenue / WEEKS_PER_MONTH).toFixed(2)}/wk
                  </p>
                </div>
                <div className="col-span-1 text-right text-sm text-stone-600 dark:text-stone-300 tabular-nums">{stream.timeInvestment}</div>
                <div className="col-span-1 text-right text-sm tabular-nums">
                  <span className={stream.growthRate > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-stone-500"}>{stream.growthRate > 0 ? "+" : ""}{stream.growthRate}%</span>
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button onClick={() => openEdit(stream)} aria-label="Edit income stream" className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(stream._id)} aria-label="Delete income stream" className="p-1 rounded text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {/* Mobile card */}
              <div className="md:hidden px-4 py-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{stream.name}</p>
                    {stream.clientInfo && <p className="text-xs text-stone-500 dark:text-stone-400">{stream.clientInfo}</p>}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => openEdit(stream)} aria-label="Edit income stream" className="p-1.5 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(stream._id)} aria-label="Delete income stream" className="p-1.5 rounded text-stone-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={statusVariant(stream.status)}>{stream.status}</Badge>
                  <span className="text-xs text-stone-500">{categoryLabel[stream.category] ?? stream.category}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    ${stream.monthlyRevenue.toLocaleString()}/mo
                  </span>
                  <span className="text-stone-500">~${(stream.monthlyRevenue / WEEKS_PER_MONTH).toFixed(2)}/wk</span>
                  <span className="text-stone-500">{stream.timeInvestment}h/wk</span>
                  <span className={stream.growthRate > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-stone-500"}>{stream.growthRate > 0 ? "+" : ""}{stream.growthRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={DollarSign} title="No income streams" description="Add your first income stream to start tracking revenue."
          action={<button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-primary text-sm transition-colors"><Plus className="w-3.5 h-3.5" />Add Stream</button>}
        />
      )}

      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit Income Stream" : "New Income Stream"}>
        <div className="space-y-4">
          <Field label="Name"><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Stream name" /></Field>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(val) => setForm({ ...form, category: val as StreamCategory })}
              options={[
                { value: "consulting", label: "Consulting" },
                { value: "employment", label: "Employment" },
                { value: "content", label: "Content" },
                { value: "product", label: "Product" },
                { value: "project-based", label: "Project-Based" },
              ]}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(val) => setForm({ ...form, status: val as StreamStatus })}
              options={[
                { value: "active", label: "Active" },
                { value: "developing", label: "Developing" },
                { value: "planned", label: "Planned" },
                { value: "paused", label: "Paused" },
              ]}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Revenue ($/mo)">
              <input
                type="number"
                min="0"
                value={form.monthlyRevenue}
                onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })}
                className="input-field"
                placeholder="0"
              />
              {weeklyEstimate !== null && (
                <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                  Auto weekly estimate: ~${weeklyEstimate.toFixed(2)}/wk
                </p>
              )}
            </Field>
            <Field label="Hrs/week"><input type="number" min="0" value={form.timeInvestment} onChange={(e) => setForm({ ...form, timeInvestment: e.target.value })} className="input-field" placeholder="0" /></Field>
            <Field label="Growth %"><input type="number" value={form.growthRate} onChange={(e) => setForm({ ...form, growthRate: e.target.value })} className="input-field" placeholder="0" /></Field>
          </div>
          <Field label="Client Info"><input type="text" value={form.clientInfo} onChange={(e) => setForm({ ...form, clientInfo: e.target.value })} className="input-field" placeholder="Client name or info" /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field resize-none" rows={3} placeholder="Additional notes…" /></Field>
          <div className="flex items-center gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-md btn-primary text-sm transition-colors disabled:opacity-50">{saving ? "Saving…" : editingId ? "Update" : "Create"}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">Cancel</button>
          </div>
        </div>
      </SlideOver>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">{label}</span>
      {children}
    </div>
  );
}
