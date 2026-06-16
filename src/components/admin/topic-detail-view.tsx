"use client";

import { ArrowLeft, BookOpen, Loader2, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, BookOpen, Loader2, Plus, Save } from "lucide-react";
import { createConcept, updateConcept } from "@/server/actions/admin-content";

type ConceptLite = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  isCustom: boolean;
  _count: { questions: number };
};

type Props = {
  topic: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    order: number;
    subject: {
      id: string;
      name: string;
      slug: string;
      color: string | null;
      icon: string | null;
    };
    concepts: ConceptLite[];
  };
};

export function TopicDetailView({ topic }: Props) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5 pb-20">
      <Link
        href={`/admin/subjects/${topic.subject.id}`}
        className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={12} />
        Kembali ke {topic.subject.name}
      </Link>

      <header
        className="rounded-2xl border border-border/40 bg-card/70 p-4 shadow-sm"
        style={
          topic.subject.color
            ? {
                background: `linear-gradient(135deg, ${topic.subject.color}12, var(--card) 60%)`,
              }
            : undefined
        }
      >
        <div className="flex items-center gap-3">
          <div
            className="grid size-11 shrink-0 place-items-center rounded-xl text-[20px] shadow-sm"
            style={
              topic.subject.color
                ? {
                    background: `${topic.subject.color}25`,
                    color: topic.subject.color,
                  }
                : undefined
            }
          >
            {topic.subject.icon ?? <BookOpen size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {topic.subject.name}
            </p>
            <h1 className="font-heading text-[20px] font-extrabold text-foreground">
              {topic.name}
            </h1>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {topic.slug}
            </p>
          </div>
        </div>
        {topic.description && (
          <p className="mt-2 text-[11.5px] text-muted-foreground">
            {topic.description}
          </p>
        )}
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[15px] font-bold text-foreground">
            Konsep
          </h2>
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-[11.5px] font-bold text-white shadow-sm hover:bg-slate-800"
          >
            <Plus size={12} />
            {showNew ? "Tutup" : "Konsep Baru"}
          </button>
        </div>

        {showNew && (
          <NewConceptForm
            topicId={topic.id}
            onCreated={() => {
              setShowNew(false);
              router.refresh();
            }}
          />
        )}

        {topic.concepts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 p-6 text-center">
            <p className="text-[12px] text-muted-foreground">
              Belum ada konsep. Tambah konsep untuk mulai.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {topic.concepts.map((c, i) => (
              <li
                key={c.id}
                className="rounded-xl border border-border/40 bg-card/60 p-3"
              >
                {editingId === c.id ? (
                  <EditConceptForm
                    concept={c}
                    onSaved={() => {
                      setEditingId(null);
                      router.refresh();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[12.5px] font-bold text-foreground">
                        {c.name}
                      </h3>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {c.slug}
                      </p>
                      {c.description && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {c.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 text-[10.5px]">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {c._count.questions} soal
                        </span>
                        {c.isCustom && (
                          <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-purple-700 dark:text-purple-300">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingId(c.id)}
                      className="shrink-0 rounded-lg border border-border/40 bg-card/60 px-2.5 py-1 text-[10.5px] font-bold text-muted-foreground transition-all hover:border-slate-300 hover:text-foreground"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function NewConceptForm({
  topicId,
  onCreated,
}: {
  topicId: string;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    order: 0,
  });
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createConcept({
        topicId,
        ...form,
        description: form.description || null,
      });
      if (result.ok) {
        setForm({ slug: "", name: "", description: "", order: 0 });
        onCreated();
      } else {
        alert(result.error ?? "Gagal membuat konsep");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-border/40 bg-card/60 p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Slug" required>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
            pattern="^[a-z0-9_-]+$"
            className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 font-mono text-[12.5px] outline-none focus:border-slate-400"
          />
        </Field>
        <Field label="Order">
          <input
            type="number"
            min={0}
            max={999}
            value={form.order}
            onChange={(e) =>
              setForm({ ...form, order: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 font-mono text-[12.5px] outline-none focus:border-slate-400"
          />
        </Field>
      </div>
      <Field label="Nama" required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          maxLength={150}
          className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-[13px] font-bold outline-none focus:border-slate-400"
        />
      </Field>
      <Field label="Deskripsi">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={500}
          rows={2}
          className="w-full resize-none rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-[12.5px] outline-none focus:border-slate-400"
        />
      </Field>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Tambah Konsep
        </button>
      </div>
    </form>
  );
}

function EditConceptForm({
  concept,
  onSaved,
  onCancel,
}: {
  concept: ConceptLite;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: concept.name,
    description: concept.description ?? "",
    order: concept.order,
  });
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateConcept({
        conceptId: concept.id,
        name: form.name,
        description: form.description || null,
        order: form.order,
      });
      if (result.ok) onSaved();
      else alert(result.error ?? "Gagal update");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-1.5 text-[12.5px] font-bold outline-none focus:border-slate-400"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
        maxLength={500}
        placeholder="Deskripsi (opsional)"
        className="w-full resize-none rounded-lg border border-border/50 bg-background/60 px-3 py-1.5 text-[11px] outline-none focus:border-slate-400"
      />
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={999}
          value={form.order}
          onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          className="w-20 rounded-lg border border-border/50 bg-background/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-slate-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1 text-[10.5px] font-bold text-white hover:bg-slate-800"
        >
          {pending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Save size={12} />
          )}
          Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border/40 bg-card/60 px-3 py-1 text-[10.5px] font-bold text-muted-foreground"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: input is a child via children
    <label className="block space-y-1">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
