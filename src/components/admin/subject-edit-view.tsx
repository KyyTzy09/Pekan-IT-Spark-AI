"use client";

import { ArrowLeft, BookOpen, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SubjectForm } from "@/components/admin/subject-form";
import { cn } from "@/lib/utils";
import type { AdminSubjectDetail } from "@/server/actions/admin-content";
import { createTopic, updateTopic } from "@/server/actions/admin-content";

type Props = {
  subject: AdminSubjectDetail;
};

export function SubjectEditView({ subject }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState<"none" | "meta" | "newTopic">(
    "meta",
  );
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  return (
    <div className="space-y-5 pb-20">
      <Link
        href="/admin/subjects"
        className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={12} />
        Kembali ke daftar mapel
      </Link>

      <header
        className="rounded-2xl border border-border/40 bg-card/70 p-4 shadow-sm backdrop-blur-md"
        style={
          subject.color
            ? {
                background: `linear-gradient(135deg, ${subject.color}15, var(--card) 60%)`,
              }
            : undefined
        }
      >
        <div className="flex items-center gap-3">
          <div
            className="grid size-12 shrink-0 place-items-center rounded-xl text-[22px] shadow-sm"
            style={
              subject.color
                ? { background: `${subject.color}25`, color: subject.color }
                : undefined
            }
          >
            {subject.icon ?? <BookOpen size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-heading text-[20px] font-extrabold text-foreground">
                {subject.name}
              </h1>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {subject.slug}
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {subject.topicCount} topik • {subject.conceptCount} konsep •{" "}
              {subject.questionCount} soal
            </p>
          </div>
        </div>
      </header>

      <div className="flex gap-2 border-b border-border/40">
        <TabButton
          active={showForm === "meta"}
          onClick={() => setShowForm("meta")}
        >
          Metadata
        </TabButton>
        <TabButton
          active={showForm === "newTopic"}
          onClick={() => setShowForm("newTopic")}
        >
          Tambah Topik
        </TabButton>
      </div>

      {showForm === "meta" && <SubjectForm mode="edit" subject={subject} />}

      {showForm === "newTopic" && (
        <NewTopicForm
          subjectId={subject.id}
          onCreated={() => {
            setShowForm("meta");
            router.refresh();
          }}
        />
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[15px] font-bold text-foreground">
            Topik
          </h2>
          <span className="text-[11px] text-muted-foreground">
            {subject.topics.length} topik
          </span>
        </div>

        {subject.topics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 p-6 text-center">
            <p className="text-[12px] text-muted-foreground">
              Belum ada topik. Klik "Tambah Topik" untuk mulai.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {subject.topics.map((topic, i) => (
              <li
                key={topic.id}
                className="rounded-xl border border-border/40 bg-card/60 p-3"
              >
                {editingTopicId === topic.id ? (
                  <EditTopicForm
                    topic={topic}
                    onSaved={() => {
                      setEditingTopicId(null);
                      router.refresh();
                    }}
                    onCancel={() => setEditingTopicId(null)}
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[12.5px] font-bold text-foreground">
                        {topic.name}
                      </h3>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {topic.slug}
                      </p>
                      {topic.description && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {topic.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 text-[10.5px]">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {topic.conceptCount} konsep
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {topic.questionCount} soal
                        </span>
                        {topic.isCustom && (
                          <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-purple-700 dark:text-purple-300">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={`/admin/subjects/${subject.id}/topics/${topic.id}`}
                        className="rounded-lg border border-border/40 bg-card/60 px-2.5 py-1 text-[10.5px] font-bold text-muted-foreground transition-all hover:border-slate-300 hover:text-foreground"
                      >
                        Kelola Konsep
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditingTopicId(topic.id)}
                        className="rounded-lg border border-border/40 bg-card/60 px-2.5 py-1 text-[10.5px] font-bold text-muted-foreground transition-all hover:border-slate-300 hover:text-foreground"
                      >
                        Edit
                      </button>
                    </div>
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

function NewTopicForm({
  subjectId,
  onCreated,
}: {
  subjectId: string;
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
      const result = await createTopic({
        subjectId,
        ...form,
        description: form.description || null,
      });
      if (result.ok) {
        setForm({ slug: "", name: "", description: "", order: 0 });
        onCreated();
      } else {
        alert(result.error ?? "Gagal membuat topik");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-border/40 bg-card/60 p-4"
    >
      <h2 className="font-heading text-[14px] font-bold text-foreground">
        Topik Baru
      </h2>
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
          maxLength={100}
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
      <div className="flex justify-end gap-2">
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
          Tambah Topik
        </button>
      </div>
    </form>
  );
}

function EditTopicForm({
  topic,
  onSaved,
  onCancel,
}: {
  topic: {
    id: string;
    name: string;
    description: string | null;
    order: number;
  };
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: topic.name,
    description: topic.description ?? "",
    order: topic.order,
  });
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateTopic({
        topicId: topic.id,
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
          className="rounded-lg bg-slate-900 px-3 py-1 text-[10.5px] font-bold text-white hover:bg-slate-800"
        >
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b-2 px-4 py-2 text-[12px] font-bold transition-all",
        active
          ? "border-slate-900 text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
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
