# Auth Pages Design Spec — `/auth/login` & `/auth/register`

> **Status:** Draft for review
> **Last updated:** 2026-06-18
> **Target implementation:** Phase 9 (UI Polish)
> **Author:** opencode (with user approval)

---

## 1. Context

Halaman auth (`/auth/login` & `/auth/register`) saat ini **sudah lumayan modern** dengan design system yang konsisten (glassmorphism, gradient coral/teal, Spark branding, anim-slide-up). Spec ini adalah **polish spec** — bukan rewrite total.

**Tujuan polish:**
- Konsistensi 100% dengan design system (cek pattern yang dipakai di `(onboarding)/`)
- Micro-interactions yang lebih responsif
- Accessibility (a11y) lebih baik
- Loading & error state yang lebih jelas
- Empty state / no-JS fallback
- Security badges kecil (visual, bukan teknis) untuk trust

**Yang TIDAK berubah:**
- URL structure (`/auth/login`, `/auth/register`)
- Auth flow logic (NextAuth, bcrypt, Zod validation)
- Layout 2-column (branding left + form right)
- Theme color palette (coral, teal, orange, blue)
- Komponen shared (`AuthField`, `AuthError`, `AuthDivider`, `GoogleIcon`)

---

## 2. Design System Reference

### 2.1 Color Tokens (sudah ada di `globals.css`)
| Token | Value | Use case |
|-------|-------|----------|
| `--coral` | `#e11d48` | Primary CTA, focus ring, brand |
| `--orange` | `#f97316` | Gradient end, accent |
| `--teal` | `#0d9488` | Success, secondary accent |
| `--blue` | `#2563eb` | Parent role accent |
| `--purple` | `#7c3aed` | AI/Custom accent |

### 2.2 Typography
- `font-heading` — class utility, weight 700-800
- Body: 12.5px - 14px (auth context, dense)
- H1: 28px extrabold (login/register title)
- Caption: 10-11px uppercase tracking-widest (badges, dividers)

### 2.3 Spacing
- Card padding: 24px (`p-6`)
- Form field gap: 16px (`space-y-4`)
- Section gap: 24px (`space-y-6`)
- Border radius: 16px (`rounded-2xl`)

### 2.4 Animation Classes (sudah ada)
- `anim-slide-up` — entry animation from below
- `animate-fade-in` — opacity fade
- `animate-pulse` — loading state
- `active:scale-[0.97]` — button press feedback
- GPU helper: `gpu` class (already in use)

---

## 3. Component Architecture

### 3.1 File Structure (proposed)

```
src/
├── app/(public)/                    # ← already exists for landing
├── app/auth/
│   ├── layout.tsx                   # 2-column shell (JANGAN diubah)
│   ├── login/
│   │   └── page.tsx                 # ← rewrite target
│   ├── register/
│   │   └── page.tsx                 # ← rewrite target
│   ├── verify-email/[token]/
│   └── ...
├── components/
│   ├── auth/
│   │   ├── auth-branding.tsx        # LEFT panel (jangan diubah)
│   │   ├── auth-form.tsx            # shared (AuthField, AuthError, AuthDivider, GoogleIcon)
│   │   ├── auth-trust-badges.tsx    # NEW — security badges
│   │   ├── auth-streak-teaser.tsx   # NEW — streak teaser (login)
│   │   └── auth-role-selector.tsx   # NEW — role cards (register)
```

### 3.2 New Components (3)

#### 3.2.1 `auth-trust-badges.tsx` (Login only)
**Purpose:** Visual trust signals (SSL, no-spam, 10k+ siswa).

```tsx
// ASCII wireframe
┌─────────────────────────────────────┐
│ 🔒 Koneksi aman     ✉️ Tanpa spam   │
└─────────────────────────────────────┘
```

**Specs:**
- 2 badges side by side
- Icon (lucide: `Shield`, `Mail`)
- Text 11px font-medium muted
- Container: rounded-2xl, border-border/40, bg-card/30, backdrop-blur-sm
- Margin top 24px from form bottom
- Hidden di mobile < sm (save space)

#### 3.2.2 `auth-streak-teaser.tsx` (Login only)
**Purpose:** Streak callout untuk login page, menggantikan plain text "Streak dan progress kamu masih tersimpan".

```tsx
// ASCII wireframe
┌──────────────────────────────────────────────┐
│  🔥  Streak-mu masih nyala!  [Lanjut aja]  │
│  Login dulu biar nggak putus.               │
└──────────────────────────────────────────────┘
```

**Specs:**
- 1-line tagline + 1-line sub
- Coral accent (icon `Flame`)
- Border-l-4 border-coral, bg-coral/5
- Padding 12px 16px
- animate-fade-in on mount
- Dismissable (X button, hide for session via sessionStorage)

#### 3.2.3 `auth-role-selector.tsx` (Register only)
**Purpose:** Replace current inline `ROLES` constant dengan reusable card component.

```tsx
// ASCII wireframe (cards side by side)
┌─────────────┐  ┌─────────────┐
│ 🎓          │  │ 🤝          │
│ Siswa       │  │ Orang Tua   │
│ Belajar     │  │ Pantau      │
│ dengan AI   │  │ progress    │
│             │  │ anak        │
└─────────────┘  └─────────────┘
```

**Specs:**
- 2-column grid di desktop, stacked di mobile
- Icon 24px, label 14px font-bold, desc 12px muted
- Selected state: ring-2 ring-coral, bg-coral/5, border-coral
- Unselected: border-border/40, bg-card/40
- Click feedback: `active:scale-[0.98]`
- Transition: 200ms ease-out
- ARIA: `role="radiogroup"`, `aria-checked` on each card

---

## 4. Page-by-Page Spec

### 4.1 `/auth/login`

#### 4.1.1 Layout (mobile-first, max-w-[420px])

```
┌─────────────────────────────────┐
│ ← [Spark logo]                  │  ← mobile header (lg:hidden)
│                                 │
│ Masuk ke Spark ✨               │  ← H1, 28px extrabold
│ Streak dan progress kamu masih  │  ← 13.5px muted
│ tersimpan — yuk lanjut! 🔥      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [G] Lanjut dengan Google    │ │  ← existing Google button
│ └─────────────────────────────┘ │
│                                 │
│ ───── atau pakai email ─────    │
│                                 │
│ Email                           │
│ [kamu@email.com             ]   │
│                                 │
│ Password                [👁]     │
│ [••••••••                 ]    │
│                                 │
│ [Masuk →]                       │  ← coral gradient CTA
│                                 │
│ Belum punya akun? Daftar gratis │
│                                 │
│ 🔒 Aman  ✉️ Tanpa spam          │  ← trust badges (md+)
└─────────────────────────────────┘
```

#### 4.1.2 State Specs

| State | Trigger | Visual |
|-------|---------|--------|
| **Idle** | Initial | Form ready, no errors |
| **Submitting** | Click "Masuk" | Button shows `Loader2 animate-spin`, text "Sedang Masuk...", all fields disabled |
| **Error (validation)** | Empty email/password | Field shows red ring, error text below |
| **Error (server)** | Wrong credentials OR 5xx | `AuthError` component with `Email atau password salah` (or server message) |
| **Success** | `signIn` returns OK | Brief success flash (green border) → `router.push(callbackUrl)` |
| **OAuth error** | `?error=...` in URL | Error banner shows, focused for screen reader |

#### 4.1.3 Animation Sequence (entry)

```
t=0ms:     Header (H1) slides up (anim-slide-up)
t=80ms:    Subtitle slides up
t=140ms:   Google button slides up
t=180ms:   Divider fades in
t=220ms:   Form fields slide up
t=260ms:   Bottom link fades in
```

(Gunakan `animationDelay` seperti pattern existing di `login/page.tsx:99-103`.)

#### 4.1.4 A11y Checklist
- [x] `aria-invalid` on field when error (already in `AuthField`)
- [x] `aria-describedby` for error message (already)
- [ ] **Add:** `aria-live="polite"` on error banner region
- [ ] **Add:** Skip-to-content link at top (untuk screen reader)
- [ ] **Add:** `autoFocus` on email field (existing `defaultValue` is empty, focus first interactive)
- [x] `noValidate` on form (custom validation, but Zod handles — keep)

---

### 4.2 `/auth/register`

#### 4.2.1 Layout

```
┌─────────────────────────────────┐
│ ← [Spark logo]                  │
│                                 │
│ Daftar ke Spark ✨              │  ← H1
│ Mulai perjalanan belajar kamu   │  ← subtitle
│                                 │
│ ┌─────────┐  ┌─────────┐        │  ← role selector
│ │ 🎓      │  │ 🤝      │        │
│ │ Siswa   │  │ Ortu    │        │  ← (Siswa selected by default)
│ └─────────┘  └─────────┘        │
│                                 │
│ Nama                            │
│ [Nama lengkap              ]    │
│                                 │
│ Email                           │
│ [kamu@email.com             ]   │
│                                 │
│ Password                [👁]     │
│ [Min. 8 karakter            ]   │  ← hint
│ [••••••••                 ]    │
│                                 │
│ ┌─────── if role=PARENT ──────┐│
│ │ Kode Undangan               ││
│ │ [Minta kode ke anak    ]    ││
│ └─────────────────────────────┘│
│                                 │
│ [Daftar →]                      │  ← coral CTA
│                                 │
│ Sudah punya akun? Masuk         │
│                                 │
│ 🔒 Aman  ✉️ Tanpa spam          │
└─────────────────────────────────┘
```

#### 4.2.2 State Specs

| State | Trigger | Visual |
|-------|---------|--------|
| **Idle (STUDENT)** | Initial, default role | 3 fields visible (nama, email, password) |
| **Idle (PARENT)** | Click "Orang Tua" | + 1 field appears (Kode Undangan) with slide animation |
| **Submitting** | Click "Daftar" | Loader, all fields disabled |
| **Error (duplicate email)** | 409 from API | `Email sudah terdaftar. Coba masuk aja, yuk.` |
| **Error (invalid invite)** | 404/410 from API | `Kode undangan nggak ketemu` |
| **Success** | 201 from API | Brief success → `router.push("/auth/login?registered=1")` |

#### 4.2.3 Role Switcher Animation
- Cards have `transition-all duration-200`
- Click PARENT → form re-renders, new field slides in from top
- Animate: `animate-fade-in` on invite field
- Use `key={role}` on form to force re-mount (existing pattern in onboarding)

#### 4.2.4 Password Strength Indicator (NEW)
Add a 4-segment strength bar under password field:
- 0 segments: empty/too short
- 1 segment (red): 8 chars only
- 2 segments (orange): 8+ chars + letters
- 3 segments (yellow): 8+ chars + letters + numbers
- 4 segments (teal/green): 8+ chars + letters + numbers + special

```tsx
// Sub-spec: PasswordStrength.tsx
<div className="mt-1.5 flex gap-1">
  {[0,1,2,3].map(i => (
    <div className={cn("h-1 flex-1 rounded-full transition-colors",
      i < score ? "bg-teal" : "bg-muted/40"
    )} />
  ))}
</div>
```

---

## 5. Microinteractions & Polish

### 5.1 Focus Ring
- All inputs: `focus-within:border-coral focus-within:ring-4 focus-within:ring-coral/10`
- Buttons: `focus-visible:ring-4 focus-visible:ring-coral/20`
- Existing in `auth-form.tsx:61` — keep as-is

### 5.2 Button Press
- All primary CTAs: `active:scale-[0.97]`
- All secondary buttons: `active:scale-[0.98]`
- Transition: `transition-all duration-200`

### 5.3 Field Validation Timing
- Validation on `onBlur` (not onChange) — less noisy
- Show password strength on `onChange` (after first character)
- Submit button disabled while `isSubmitting`

### 5.4 Loading State
- Full button text change: "Masuk" → "Sedang Masuk..."
- `Loader2` icon (size 16) with `animate-spin`
- Replace arrow icon during loading
- Field inputs: `disabled` + `opacity-60`

### 5.5 Success Transition
- Brief green border on form (300ms)
- `router.push(callbackUrl)` after 100ms delay
- Optional: confetti micro-animation (sparingly)

---

## 6. Accessibility (a11y)

### 6.1 Keyboard Navigation
- [ ] Tab order: Logo → Email → Password → Submit → Google → Register link
- [ ] Enter on field submits form
- [ ] Escape on error banner dismisses focus

### 6.2 Screen Reader
- [ ] All form fields have associated `<label>`
- [ ] Error messages have `role="alert"` + `aria-live="polite"`
- [ ] Submit button: `aria-busy={isSubmitting}` during submission
- [ ] Role selector cards: `role="radio"`, `aria-checked`

### 6.3 Color Contrast
- [x] Body text on bg: ratio ≥ 4.5:1 (currently OK)
- [x] Error text on bg-destructive/5: ratio ≥ 4.5:1
- [ ] **Verify:** placeholder text `text-muted-foreground/60` — may be too light

### 6.4 Reduced Motion
- [ ] Wrap all `anim-slide-up` in `@media (prefers-reduced-motion: no-preference)`
- [ ] Test with `prefers-reduced-motion: reduce` set in OS

---

## 7. Implementation Plan

### 7.1 Order of Changes

1. **Create 3 new shared components** (parallel, no dependencies):
   - `src/components/auth/auth-trust-badges.tsx`
   - `src/components/auth/auth-streak-teaser.tsx`
   - `src/components/auth/auth-role-selector.tsx`
   - `src/components/auth/password-strength.tsx` (bonus)

2. **Rewrite `src/app/auth/login/page.tsx`**:
   - Use new `auth-streak-teaser` instead of plain subtitle
   - Add `auth-trust-badges` at bottom
   - Add `aria-live` to error region
   - Add `autoFocus` to email field
   - Keep Google button + form + bottom link as-is

3. **Rewrite `src/app/auth/register/page.tsx`**:
   - Use new `auth-role-selector` instead of inline `ROLES` array
   - Add `password-strength` under password field
   - Add `auth-trust-badges` at bottom
   - Add `aria-live` to error region
   - Keep form structure, Zod schemas, submit logic

4. **Verify**:
   - `bun run typecheck` → exit 0
   - `bun run build` → exit 0
   - Screenshot login + register (mobile + desktop)
   - Manual: tab through form, submit, check errors

### 7.2 Files Changed
- **A** `src/components/auth/auth-trust-badges.tsx` (new)
- **A** `src/components/auth/auth-streak-teaser.tsx` (new)
- **A** `src/components/auth/auth-role-selector.tsx` (new)
- **A** `src/components/auth/password-strength.tsx` (new)
- **M** `src/app/auth/login/page.tsx` (rewrite, same logic)
- **M** `src/app/auth/register/page.tsx` (rewrite, same logic)

**No** changes to:
- `src/lib/auth.ts`
- `src/lib/auth.config.ts`
- `src/proxy.ts`
- `src/app/auth/layout.tsx` (2-column shell stays)
- `src/app/api/auth/**`
- `src/components/auth/auth-form.tsx` (shared field/divider/error)
- `src/components/auth/auth-branding.tsx` (left panel)

### 7.3 Estimated Effort
- New components: 30 min
- Login rewrite: 20 min
- Register rewrite: 30 min
- Verify (typecheck + build + screenshot): 15 min
- **Total: ~1.5 hours**

---

## 8. Open Questions for User

1. **Q: Trust badges content** — "10k+ siswa" belum tentu valid (cek di database dulu). Mau pakai apa?
   - Opsi A: "🔒 Koneksi aman · ✉️ Tanpa spam" (generic, always true)
   - Opsi B: "🔒 Koneksi aman · ✨ 100% gratis" (highlight free)
   - Opsi C: Skip trust badges, focus pada Spark branding

2. **Q: Password strength indicator** — apakah perlu? (Bisa bikin form terasa lebih panjang di mobile.)
   - Opsi A: Ya, tambahkan strength bar 4-segment
   - Opsi B: Tidak, cukup hint "Min. 8 karakter"
   - Opsi C: Inline checkmarks (✓ 8+ char, ✓ angka, ✓ huruf besar) — less visual

3. **Q: Streak teaser dismissable** — kalau dismiss, simpan di mana?
   - Opsi A: `sessionStorage` (hilang saat tab close)
   - Opsi B: `localStorage` (permanen sampai manual reset)
   - Opsi C: Tidak dismissable (always show)

---

## 9. Approval Checklist

Sebelum implement, confirm:

- [ ] Design system reference sudah benar
- [ ] Component architecture sudah pas
- [ ] 3 open questions di section 8 sudah dijawab
- [ ] Implementation plan di section 7.1 disetujui
- [ ] Verifikasi standard (typecheck + build + screenshot) cukup

**Setelah approval, saya mulai dari bikin 4 new components dulu, lalu rewrite login & register.**
