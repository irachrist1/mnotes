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
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Users, Plus, Clock, Star, CheckCircle2, Circle, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

type SessionType = "giving" | "receiving";
type Priority = "low" | "medium" | "high";

const priorityVariant = (p: string) => { switch (p) { case "high": return "danger" as const; case "medium": return "warning" as const; default: return "default" as const; } };

type SessionForm = {
  mentorName: string; date: string; duration: string; sessionType: SessionType;
  topics: string; keyInsights: string;
  actionItems: { task: string; priority: Priority; completed: boolean; dueDate: string }[];
  rating: string; notes: string;
};

const emptyForm: SessionForm = {
  mentorName: "", date: new Date().toISOString().split("T")[0], duration: "60",
  sessionType: "receiving", topics: "", keyInsights: "", actionItems: [], rating: "8", notes: "",
};

export default function MentorshipPage() {
  const sessions = useQuery(api.mentorshipSessions.list);
  const createSession = useMutation(api.mentorshipSessions.create);
  const updateSession = useMutation(api.mentorshipSessions.update);
  const deleteSession = useMutation(api.mentorshipSessions.remove);
  const toggleAction = useMutation(api.mentorshipSessions.toggleActionItem);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"mentorshipSessions"> | null>(null);
  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | SessionType>("all");

  const isLoading = sessions === undefined;
  const totalSessions = sessions?.length ?? 0;
  const totalHours = sessions ? Math.round(sessions.reduce((s, m) => s + m.duration, 0) / 60) : 0;
  const avgRating = sessions && sessions.length > 0 ? (sessions.reduce((s, m) => s + m.rating, 0) / sessions.length).toFixed(1) : "—";
  const pendingActions = sessions ? sessions.reduce((s, m) => s + m.actionItems.filter((a) => !a.completed).length, 0) : 0;
  const filtered = filter === "all" ? sessions : sessions?.filter((s) => s.sessionType === filter);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (session: NonNullable<typeof sessions>[number]) => {
    setEditingId(session._id);
    setForm({
      mentorName: session.mentorName, date: session.date, duration: String(session.duration),
      sessionType: session.sessionType, topics: session.topics.join(", "),
      keyInsights: session.keyInsights.join("\n"),
      actionItems: session.actionItems.map((a) => ({ task: a.task, priority: a.priority, completed: a.completed, dueDate: a.dueDate ?? "" })),
      rating: String(session.rating), notes: session.notes,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.mentorName.trim()) { toast.error("Mentor name is required"); return; }
    setSaving(true);
    try {
      const data = {
        mentorName: form.mentorName.trim(), date: form.date,
        duration: parseInt(form.duration) || 60, sessionType: form.sessionType,
        topics: form.topics.split(",").map((s) => s.trim()).filter(Boolean),
        keyInsights: form.keyInsights.split("\n").map((s) => s.trim()).filter(Boolean),
        actionItems: form.actionItems.map((a) => ({ task: a.task, priority: a.priority, completed: a.completed, dueDate: a.dueDate || undefined })),
        rating: Math.min(10, Math.max(1, parseInt(form.rating) || 8)),
        notes: form.notes.trim(),
      };
      if (editingId) { await updateSession({ id: editingId, ...data }); toast.success("Session updated"); }
      else { await createSession(data); toast.success("Session created"); }
      setShowForm(false);
    } catch { toast.error("Failed to save"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: Id<"mentorshipSessions">) => {
    if (!confirm("Delete this session?")) return;
    try { await deleteSession({ id }); toast.success("Session deleted"); } catch { toast.error("Failed to delete"); }
  };

  const addActionItem = () => setForm({ ...form, actionItems: [...form.actionItems, { task: "", priority: "medium", completed: false, dueDate: "" }] });
  const removeActionItem = (i: number) => setForm({ ...form, actionItems: form.actionItems.filter((_, idx) => idx !== i) });
  const updateActionItem = (i: number, field: string, value: string | boolean) => {
    const items = [...form.actionItems]; items[i] = { ...items[i], [field]: value }; setForm({ ...form, actionItems: items });
  };

  return (
    <>
      <PageHeader title="Mentorship" description="Track sessions, insights, and action items"
        action={<button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"><Plus className="w-3.5 h-3.5" />Add Session</button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Sessions" value={totalSessions} icon={Users} />
          <StatCard label="Total Hours" value={`${totalHours}h`} icon={Clock} />
          <StatCard label="Avg Rating" value={avgRating} icon={Star} />
          <StatCard label="Pending Actions" value={pendingActions} icon={CheckCircle2} />
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-4">
        {(["all", "giving", "receiving"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />))}</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((session) => {
            const isExpanded = expandedId === session._id;
            return (
              <div key={session._id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : session._id)}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.mentorName}</span>
                      <Badge variant={session.sessionType === "giving" ? "purple" : "info"}>{session.sessionType}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{session.date}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{session.duration}min</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400">★ {session.rating}/10</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(session); }} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(session._id); }} className="p-1 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                    {session.topics.length > 0 && (<div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Topics</p><div className="flex flex-wrap gap-1">{session.topics.map((t, i) => (<Badge key={i} variant="default">{t}</Badge>))}</div></div>)}
                    {session.keyInsights.length > 0 && (<div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Key Insights</p><ul className="space-y-1">{session.keyInsights.map((insight, i) => (<li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5"><span className="text-gray-400 mt-1">•</span>{insight}</li>))}</ul></div>)}
                    {session.actionItems.length > 0 && (<div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Action Items</p><ul className="space-y-1.5">{session.actionItems.map((item, i) => (<li key={i} className="flex items-center gap-2"><button onClick={() => toggleAction({ id: session._id, actionItemIndex: i, completed: !item.completed })} className="flex-shrink-0">{item.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />}</button><span className={`text-sm ${item.completed ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"}`}>{item.task}</span><Badge variant={priorityVariant(item.priority)} className="ml-auto">{item.priority}</Badge></li>))}</ul></div>)}
                    {session.notes && (<div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</p><p className="text-sm text-gray-700 dark:text-gray-300">{session.notes}</p></div>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Users} title="No mentorship sessions" description="Log your first mentorship session to start tracking insights."
          action={<button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium"><Plus className="w-3.5 h-3.5" />Add Session</button>}
        />
      )}

      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit Session" : "New Session"} wide>
        <div className="space-y-4">
          <Field label="Mentor Name"><input type="text" value={form.mentorName} onChange={(e) => setForm({ ...form, mentorName: e.target.value })} className="input-field" placeholder="Name" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" /></Field>
            <Field label="Duration (min)"><input type="number" min="0" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="input-field" /></Field>
            <Field label="Type"><select value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value as SessionType })} className="input-field"><option value="receiving">Receiving</option><option value="giving">Giving</option></select></Field>
          </div>
          <Field label="Rating (1-10)"><input type="number" min={1} max={10} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="input-field" /></Field>
          <Field label="Topics (comma-separated)"><input type="text" value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} className="input-field" placeholder="Leadership, AI strategy" /></Field>
          <Field label="Key Insights (one per line)"><textarea value={form.keyInsights} onChange={(e) => setForm({ ...form, keyInsights: e.target.value })} className="input-field resize-none" rows={3} /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field resize-none" rows={3} /></Field>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Action Items</label>
              <button onClick={addActionItem} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">+ Add item</button>
            </div>
            <div className="space-y-2">
              {form.actionItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={item.task} onChange={(e) => updateActionItem(i, "task", e.target.value)} className="input-field flex-1" placeholder="Task" />
                  <select value={item.priority} onChange={(e) => updateActionItem(i, "priority", e.target.value)} className="input-field w-24"><option value="low">Low</option><option value="medium">Med</option><option value="high">High</option></select>
                  <button onClick={() => removeActionItem(i)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50">{saving ? "Saving…" : editingId ? "Update" : "Create"}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          </div>
        </div>
      </SlideOver>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>{children}</div>);
}
