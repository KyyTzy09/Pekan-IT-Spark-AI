"use client";

import { CheckCircle2, Send } from "lucide-react";
import * as React from "react";

export function ContactForm() {
  const [status, setStatus] = React.useState<"idle" | "sending" | "success">(
    "idle",
  );
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    // Simulate network call
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-fade-in">
        <span className="grid size-12 place-items-center rounded-full bg-emerald-500 text-white shadow-md mb-4">
          <CheckCircle2 size={24} />
        </span>
        <h3 className="font-heading text-lg font-bold text-foreground">
          Pesan Terkirim!
        </h3>
        <p className="mt-2 text-xs text-muted-foreground max-w-sm">
          Terima kasih telah menghubungi kami. Tim Spark Ai akan membaca pesanmu
          dan membalas melalui email secepatnya.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 h-9 rounded-full px-5 text-xs font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors"
        >
          Kirim Pesan Lain
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="contact-name"
            className="text-xs font-semibold text-foreground/80"
          >
            Nama Lengkap
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nama kamu"
            className="h-10 w-full rounded-xl border border-border/40 bg-card/50 px-3.5 text-xs outline-none focus:border-[var(--coral)] focus:ring-2 focus:ring-[var(--coral)]/15 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="contact-email"
            className="text-xs font-semibold text-foreground/80"
          >
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="kamu@email.com"
            className="h-10 w-full rounded-xl border border-border/40 bg-card/50 px-3.5 text-xs outline-none focus:border-[var(--coral)] focus:ring-2 focus:ring-[var(--coral)]/15 transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="contact-subject"
          className="text-xs font-semibold text-foreground/80"
        >
          Subjek / Perihal
        </label>
        <input
          id="contact-subject"
          type="text"
          required
          value={formData.subject}
          onChange={(e) =>
            setFormData({ ...formData, subject: e.target.value })
          }
          placeholder="Tujuan pesanmu"
          className="h-10 w-full rounded-xl border border-border/40 bg-card/50 px-3.5 text-xs outline-none focus:border-[var(--coral)] focus:ring-2 focus:ring-[var(--coral)]/15 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="contact-message"
          className="text-xs font-semibold text-foreground/80"
        >
          Isi Pesan
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          placeholder="Tulis pesanmu di sini..."
          className="w-full rounded-xl border border-border/40 bg-card/50 p-3.5 text-xs outline-none focus:border-[var(--coral)] focus:ring-2 focus:ring-[var(--coral)]/15 transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--coral)] text-xs font-bold text-white shadow-md shadow-rose-500/10 hover:opacity-95 disabled:opacity-70 transition-all"
      >
        <Send size={13} />{" "}
        {status === "sending" ? "Mengirim..." : "Kirim Masukan"}
      </button>
    </form>
  );
}
