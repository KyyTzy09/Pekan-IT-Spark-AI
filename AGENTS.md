<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## RTK (Rust Token Killer)

**Gunakan `rtk` untuk semua operasi sistem operasi.** RTK menghemat tokens dengan mengkompresi output sebelum sampai ke LLM context.

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

**Perintah yang TIDAK perlu RTK:**
- `cd`, `mkdir`, `rm`, `cp`, `mv` (file operations, bukan output-heavy)
- `rtk` sendiri (meta commands)

**Catatan:** RTK grep pakai syntax berbeda dari GNU grep:
- Directory sebagai positional argument: `rtk grep "pattern" src/`
- Bukan pakai `--include` flags

**Cek help:** `rtk --help` atau `rtk <command> --help`


