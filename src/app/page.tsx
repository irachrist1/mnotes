'use client'

import Link from "next/link";
import { Toaster } from "sonner";
import { Activity, ArrowRight, Brain, Shield, Sparkles, ListTodo } from "lucide-react";
import LandingHeader from "./components/LandingHeader";
import AgentTaskPreview from "./components/AgentTaskPreview";
import WaitlistCTA from "./components/WaitlistCTA";
import Footer from "./components/Footer";

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
        {title}
      </h2>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        {desc}
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dot-pattern" style={{ background: "rgb(var(--color-background))" }}>
      <Toaster position="top-center" richColors />
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-16">
          <div className="absolute inset-0 bg-gradient-mesh" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-600/15 bg-blue-600/[0.06] text-blue-700 dark:text-blue-400 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  Memory-first AI agent for your work
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight leading-[1.05]">
                  A real Jarvis
                  <br />
                  that remembers your world
                  <br />
                  <span className="text-gradient">and does the work.</span>
                </h1>

                <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                  MNotes turns chat + your business data into durable memory, then runs Agent Tasks you can
                  watch in real time. You get the plan, the progress, and the output.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/onboarding"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-150 inline-flex items-center justify-center gap-2"
                  >
                    Start with your memory <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#agent-tasks"
                    className="border border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/[0.04] font-medium px-6 py-3 rounded-lg transition-colors duration-150 inline-flex items-center justify-center gap-2"
                  >
                    See Agent Tasks
                  </a>
                </div>

                <div className="flex items-center gap-6 text-xs text-stone-500 dark:text-stone-400 pt-2">
                  <span className="inline-flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-600/80 dark:text-blue-400/80" />
                    Memory-first prompts
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600/80 dark:text-blue-400/80" />
                    Visible agent progress
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600/80 dark:text-blue-400/80" />
                    Safe-by-default execution
                  </span>
                </div>
              </div>

              <AgentTaskPreview />
            </div>
          </div>
        </section>

        {/* Memory */}
        <section id="memory" className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Memory"
              title="Memory is the runtime input, not a feature."
              desc="The agent reads your durable context first (identity, preferences, goals, constraints), then acts. This is how you get continuity instead of random one-off answers."
            />

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: "SOUL file",
                  body: "A living operating system: your identity, rules, goals, and non-negotiables.",
                },
                {
                  title: "Structured memory",
                  body: "Semantic facts, procedural playbooks, and dated continuity stay separated for precision.",
                },
                {
                  title: "Low-noise prompts",
                  body: "The agent pulls only what is relevant for each task, so responses stay sharp and consistent.",
                },
              ].map((c) => (
                <div key={c.title} className="card p-5 card-hover">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {c.title}
                  </p>
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Agent Tasks */}
        <section id="agent-tasks" className="py-20 bg-stone-50 dark:bg-stone-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Agent Tasks"
              title="Add a task. The agent starts immediately."
              desc="Every task has a visible run: plan, live activity, progress bar, and a reviewable output. This is the core primitive for a real Jarvis."
            />

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Instant feedback",
                  body: "As soon as you add a task, it is queued and you can open the activity panel.",
                  icon: ListTodo,
                },
                {
                  title: "Show the work",
                  body: "A Deep Research-style timeline so you always know what is happening.",
                  icon: Activity,
                },
                {
                  title: "Output you can use",
                  body: "Drafts, checklists, plans, summaries. Then you decide what happens next.",
                  icon: Sparkles,
                },
              ].map((c) => (
                <div key={c.title} className="card p-5 card-hover">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/[0.08] dark:bg-blue-400/[0.10] flex items-center justify-center">
                    <c.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {c.title}
                  </p>
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="How It Works"
              title="Chat, memory, tasks. One loop."
              desc="You talk. The system updates memory and data. The agent runs tasks and reports back with transparent progress."
            />

            <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { n: "01", t: "Capture", d: "Tell the assistant what happened or what you want." },
                { n: "02", t: "Remember", d: "Key context is persisted to your memory file." },
                { n: "03", t: "Execute", d: "Tasks run with visible steps and a progress bar." },
                { n: "04", t: "Review", d: "You approve outputs and decide the next action." },
              ].map((s) => (
                <div key={s.n} className="card p-5">
                  <p className="text-[11px] font-semibold text-stone-400 tracking-wider tabular-nums">
                    {s.n}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {s.t}
                  </p>
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Safety */}
        <section id="safety" className="py-20 bg-stone-50 dark:bg-stone-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Safety"
              title="Safe-by-default agent behavior."
              desc="The agent plans and drafts freely, but anything external is explicit and approval-based. Trust is built through visibility and boundaries."
            />

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  What the agent does automatically
                </p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-400">
                  <li>Draft outputs (emails, plans, checklists, summaries).</li>
                  <li>Organize and update your structured data.</li>
                  <li>Surface nudges and notifications as it works.</li>
                </ul>
              </div>
              <div className="card p-5">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  What requires your approval
                </p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-400">
                  <li>Sending messages, posting, or publishing anything.</li>
                  <li>Purchases, payments, or irreversible actions.</li>
                  <li>Anything that touches external accounts or people.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <WaitlistCTA />
      </main>

      <Footer />
    </div>
  );
}
