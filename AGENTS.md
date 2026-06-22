<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## RTK (Rust Token Killer)

> **🔴 ATURAN WAJIB: SEMUA command line WAJIB diawali `rtk`. Tidak ada pengecualian. Setiap command yang gue tulis atau execute di terminal HARUS pake `rtk` di depannya.**

RTK menghemat tokens dengan mengkompresi output sebelum sampai ke LLM context.

| Standar | RTK |
|---------|-----|
| `ls -la` | `rtk ls -la` |
| `grep -r "pattern" src/` | `rtk grep "pattern" src/` |
| `find . -name "*.ts"` | `rtk find -name "*.ts"` |
| `git status` | `rtk git status` |
| `git diff` | `rtk git diff` |
| `git log --oneline -10` | `rtk git log --oneline -10` |
| `npm test` | `rtk npm test` |
| `npx prisma generate` | `rtk npx prisma generate` |
| `cat package.json` | `rtk read package.json` |
| `read` | `rtk read` |

**Perintah yang TIDAK perlu RTK (rtk gak mempan):**
- `cd`, `mkdir`, `rm`, `cp`, `mv` (file operations, bukan output-heavy)
- `rtk` sendiri (meta commands)

### ⚡ Aturan Khusus Bun

> **Proyek ini pakai Bun. SEMUA perintah `bun` WAJIB pakai `rtk`. Tidak ada alasan untuk lupa.**

| Standar | RTK |
|---------|-----|
| `bun run build` | `rtk bun run build` |
| `bun run dev` | `rtk bun run dev` |
| `bun run <script>` | `rtk bun run <script>` |
| `bun test` | `rtk bun test` |
| `bun install` | `rtk bun install` |
| `bun add <pkg>` | `rtk bun add <pkg>` |
| `bun remove <pkg>` | `rtk bun remove <pkg>` |
| `bun update` | `rtk bun update` |
| `bun x <pkg>` | `rtk bun x <pkg>` |
| `bun create <template>` | `rtk bun create <template>` |
| `bun pm <cmd>` | `rtk bun pm <cmd>` |
| `bun prisma <cmd>` | `rtk bun prisma <cmd>` |
| `bun <script.ts>` | `rtk bun <script.ts>` |
| `bun --bun <cmd>` | `rtk bun --bun <cmd>` |

## ⚠️ Panduan RTK Grep (beda dengan grep biasa!)

RTK grep **TIDAK** support flag GNU grep kayak `--type`, `--include`, `-r`. Ini yang bener:

| ❌ Gagal (GNU syntax) | ✅ Berhasil (RTK syntax) |
|------------------------|--------------------------|
| `rtk grep -r "pattern" src/ --type ts` | `rtk grep "pattern" src/` |
| `rtk grep --include="*.ts" -r "pattern"` | `rtk grep "pattern" src/` |
| `rtk grep -r "pattern" .` | `rtk grep "pattern" .` |

**Aturan:**
1. **Gak usah pake** `-r`, `--type`, `--include`, `-l` — RTK udah otomatis recursive
2. **Directory** cukup taruh di akhir sebagai argument biasa: `rtk grep "kata" src/components/`
3. File extension filtering: cukup kasih directory aja, RTK udah tau file mana yang relevan

**Cek help:** `rtk --help` atau `rtk <command> --help`


