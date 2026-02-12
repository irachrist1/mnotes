"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { SlideOver } from "@/components/ui/SlideOver";
import { EmptyState } from "@/components/ui/EmptyState";
import { Lightbulb, Plus, Pencil, Trash2, Cpu, Wrench } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";

type Stage = "raw-thought" | "researching" | "validating" | "developing" | "testing" | "launched";
type Revenue = "low" | "medium" | "high" | "very-high";
type Competition = "low" | "medium" | "high";
type ViewMode = "kanban" | "list";

const stages: { key: Stage; label: string }[] = [
  { key: "raw-thought", label: "Raw Thought" },
  { key: "researching", label: "Researching" },
  { key: "validating", label: "Validating" },
  { key: "developing", label: "Developing" },
  { key: "testing", label: "Testing" },
  { key: "launched", label: "Launched" },
];

const revenueVariant = (r: string) => {
  switch (r) {
    case "very-high": return "success" as const;
    case "high": return "info" as const;
    case "medium": return "warning" as const;
    default: return "default" as const;
  }
};

type IdeaForm = {
  title: string; description: string; category: string; stage: Stage;
  potentialRevenue: Revenue; implementationComplexity: string; timeToMarket: string;
  requiredSkills: string; marketSize: string; competitionLevel: Competition;
  aiRelevance: boolean; hardwareComponent: boolean; sourceOfInspiration: string;
  nextSteps: string; tags: string;
};

const emptyForm: IdeaForm = {
  title: "", description: "", category: "", stage: "raw-thought",
  potentialRevenue: "medium", implementationComplexity: "", timeToMarket: "",
  requiredSkills: "", marketSize: "", competitionLevel: "medium",
  aiRelevance: false, hardwareComponent: false, sourceOfInspiration: "",
  nextSteps: "", tags: "",
};

export default function IdeasPage() {
  const ideas = useQuery(api.ideas.list);
  const createIdea = useMutation(api.ideas.create);
  const updateIdea = useMutation(api.ideas.update);
  const deleteIdea = useMutation(api.ideas.remove);

  const [view, setView] = useState<ViewMode>("kanban");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"ideas"> | null>(null);
  const [form, setForm] = useState<IdeaForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const isLoading = ideas === undefined;

  const openCreate = (stage?: Stage) => { setEditingId(null); setForm({ ...emptyForm, stage: stage ?? "raw-thought" }); setShowForm(true); };
  const openEdit = (idea: NonNullable<typeof ideas>[number]) => {
    setEditingId(idea._id);
    setForm({
      title: idea.title, description: idea.description, category: idea.category,
      stage: idea.stage, potentialRevenue: idea.potentialRevenue,
      implementationComplexity: String(idea.implementationComplexity),
      timeToMarket: idea.timeToMarket, requiredSkills: idea.requiredSkills.join(", "),
      marketSize: idea.marketSize, competitionLevel: idea.competitionLevel,
      aiRelevance: idea.aiRelevance, hardwareComponent: idea.hardwareComponent,
      sourceOfInspiration: idea.sourceOfInspiration, nextSteps: idea.nextSteps.join("\n"),
      tags: idea.tags.join(", "),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data = {
        title: form.title.trim(), description: form.description.trim(),
        category: form.category.trim() || "General", stage: form.stage,
        potentialRevenue: form.potentialRevenue,
        implementationComplexity: parseInt(form.implementationComplexity) || 3,
        timeToMarket: form.timeToMarket,
        requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
        marketSize: form.marketSize, competitionLevel: form.competitionLevel,
        aiRelevance: form.aiRelevance, hardwareComponent: form.hardwareComponent,
        sourceOfInspiration: form.sourceOfInspiration,
        nextSteps: form.nextSteps.split("\n").map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        lastUpdated: now,
      };
      if (editingId) { await updateIdea({ id: editingId, ...data }); toast.success("Idea updated"); }
      else { await createIdea({ ...data }); toast.success("Idea created"); }
      setShowForm(false);
    } catch { toast.error("Failed to save"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: Id<"ideas">) => {
    if (!confirm("Delete this idea?")) return;
    try { await deleteIdea({ id }); toast.success("Idea deleted"); } catch { toast.error("Failed to delete"); }
  };

  return (
    <>
      <PageHeader title="Ideas Pipeline" description="Track ideas from conception to launch"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-md p-0.5">
              <button onClick={() => setView("kanban")} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${view === "kanban" ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-500 dark:text-stone-400"}`}>Board</button>
              <button onClick={() => setView("list")} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${view === "list" ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-500 dark:text-stone-400"}`}>List</button>
            </div>
            <button onClick={() => openCreate()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-primary text-sm transition-colors"><Plus className="w-3.5 h-3.5" />Add Idea</button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-6 gap-3">{stages.map((s) => (<div key={s.key} className="space-y-2"><div className="h-6 skeleton" /><div className="h-24 skeleton" /></div>))}</div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((stage) => {
            const stageIdeas = ideas?.filter((i) => i.stage === stage.key) ?? [];
            return (
              <div key={stage.key} className="min-w-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">{stage.label}</span>
                  <span className="text-xs text-stone-400 tabular-nums">{stageIdeas.length}</span>
                </div>
                <div className="space-y-2">
                  {stageIdeas.map((idea) => (
                    <div key={idea._id} className="card p-3 hover:border-stone-300 dark:hover:border-stone-700 transition-colors group">
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <h4 className="text-xs font-medium text-stone-900 dark:text-stone-100 line-clamp-2">{idea.title}</h4>
                        <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                          <button onClick={() => openEdit(idea)} className="p-0.5 rounded text-stone-400 hover:text-stone-600" aria-label="Edit idea"><Pencil className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(idea._id)} className="p-0.5 rounded text-stone-400 hover:text-red-500" aria-label="Delete idea"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant={revenueVariant(idea.potentialRevenue)}>{idea.potentialRevenue}</Badge>
                        {idea.aiRelevance && <Cpu className="w-3 h-3 text-violet-500" aria-label="AI Relevant" />}
                        {idea.hardwareComponent && <Wrench className="w-3 h-3 text-amber-500" aria-label="Hardware" />}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => openCreate(stage.key)} className="w-full py-2 rounded-md border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700 transition-colors">+ Add</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : ideas && ideas.length > 0 ? (
        <div className="card divide-y divide-stone-100 dark:divide-stone-800">
          {ideas.map((idea) => (
            <div key={idea._id} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{idea.title}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{idea.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {idea.aiRelevance && <Cpu className="w-3.5 h-3.5 text-violet-500" />}
                <Badge variant={revenueVariant(idea.potentialRevenue)}>{idea.potentialRevenue}</Badge>
                <Badge variant="default">{stages.find((s) => s.key === idea.stage)?.label ?? idea.stage}</Badge>
                <button onClick={() => openEdit(idea)} className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300" aria-label="Edit idea"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(idea._id)} className="p-1 rounded text-stone-400 hover:text-red-500" aria-label="Delete idea"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Lightbulb} title="No ideas yet" description="Start capturing your ideas to build your pipeline."
          action={<button onClick={() => openCreate()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-primary text-sm font-medium"><Plus className="w-3.5 h-3.5" />Add Idea</button>}
        />
      )}

      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit Idea" : "New Idea"} wide>
        <div className="space-y-4">
          <Field label="Title"><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Idea title" /></Field>
          <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={3} placeholder="Describe the idea…" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" placeholder="e.g. SaaS" /></Field>
            <Field label="Stage">
              <Select
                value={form.stage}
                onChange={(val) => setForm({ ...form, stage: val as Stage })}
                options={stages.map((s) => ({ value: s.key, label: s.label }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Revenue Potential">
              <Select
                value={form.potentialRevenue}
                onChange={(val) => setForm({ ...form, potentialRevenue: val as Revenue })}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "very-high", label: "Very High" },
                ]}
              />
            </Field>
            <Field label="Complexity (1-10)"><input type="number" min={1} max={10} value={form.implementationComplexity} onChange={(e) => setForm({ ...form, implementationComplexity: e.target.value })} className="input-field" placeholder="5" /></Field>
            <Field label="Competition">
              <Select
                value={form.competitionLevel}
                onChange={(val) => setForm({ ...form, competitionLevel: val as Competition })}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time to Market"><input type="text" value={form.timeToMarket} onChange={(e) => setForm({ ...form, timeToMarket: e.target.value })} className="input-field" placeholder="e.g. 3 months" /></Field>
            <Field label="Market Size"><input type="text" value={form.marketSize} onChange={(e) => setForm({ ...form, marketSize: e.target.value })} className="input-field" placeholder="e.g. $10B" /></Field>
          </div>
          <Field label="Required Skills (comma-separated)"><input type="text" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} className="input-field" placeholder="React, Python, AI" /></Field>
          <Field label="Source of Inspiration"><input type="text" value={form.sourceOfInspiration} onChange={(e) => setForm({ ...form, sourceOfInspiration: e.target.value })} className="input-field" /></Field>
          <Field label="Next Steps (one per line)"><textarea value={form.nextSteps} onChange={(e) => setForm({ ...form, nextSteps: e.target.value })} className="input-field resize-none" rows={3} /></Field>
          <Field label="Tags (comma-separated)"><input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="ai, saas" /></Field>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300"><input type="checkbox" checked={form.aiRelevance} onChange={(e) => setForm({ ...form, aiRelevance: e.target.checked })} className="rounded border-stone-300 dark:border-stone-600" />AI Relevant</label>
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300"><input type="checkbox" checked={form.hardwareComponent} onChange={(e) => setForm({ ...form, hardwareComponent: e.target.checked })} className="rounded border-stone-300 dark:border-stone-600" />Hardware Component</label>
          </div>
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
