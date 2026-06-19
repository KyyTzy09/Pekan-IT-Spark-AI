# Student Activity Heatmap + Daily Chart UX Design

**Date:** 2026-06-19
**Scope:** Student activity page (`/activity`) — heatmap detail on click and daily chart UX polish.

## Goals
1. Heatmap cell yang diklik muncul dialog detail aktivitas hari tersebut (ringkasan + daftar lengkap).
2. Perbaiki UI/UX grafik aktivitas harian supaya lebih bersih dan informatif.

## Non-Goals
- Mengubah struktur data heatmap secara besar-besaran di server.
- Menambah filter range baru (7/14/30 hari) untuk grafik harian.
- Menambah animasi kompleks.

## Heatmap Detail Dialog

### Trigger
- Klik pada cell SVG heatmap yang memiliki aktivitas (count > 0).
- Cell tanpa aktivitas tidak bisa diklik (tetap hover tooltip native).
- Focus + Enter/Space juga membuka dialog (accessibility).

### Dialog Content
- **Header**: tanggal lengkap, contoh "Senin, 19 Januari 2026".
- **Summary**: total aktivitas dan breakdown per jenis (`QUESTION`, `MATERIAL`, `REFLECTION`, `CHAT`, `BADGE`, `STREAK`, `CHALLENGE`) pakai chip/icon kecil.
- **Activity list**: daftar aktivitas hari itu, diurutkan dari jam terbaru.
  - Tiap item: icon jenis, judul, deskripsi (jika ada), subject (jika ada), waktu relatif, XP.
  - Default tampil 5 item.
  - Tombol "Lihat semua aktivitas" untuk expand ke semua entry yang tersedia dari `recent` (max 50).

### Data Source
- Gunakan `activity.recent` yang sudah dikembalikan server action.
- Filter client-side berdasarkan tanggal yang diklik.
- Limitasi: hanya 50 aktivitas terbaru. Untuk hari dengan aktivitas > 50 atau hari yang sangat lama, data mungkin tidak lengkap. Diterima sebagai trade-off Approach 1.

### Component Changes
- `ActivityHeatmap` tetap client component karena butuh state dialog.
- Buat sub-komponen `ActivityHeatmapDetail` untuk render dialog content.
- `ActivityView` pass `entries={activity.recent}` ke `ActivityHeatmap`.

## Daily Chart Polish

### Changes to `ActivityLineChart`
- **XAxis**: tick lebih jarang (`interval="preserveStartEnd"` + better spacing), label format "19 Jun".
- **YAxis**: label sumbu Y lebih jelas, tick lebih readable, margin kiri disesuaikan.
- **Tooltip**: background solid, border radius, shadow lembut, formatter unit yang jelas.
- **Grid**: opacity lebih rendah, biar nggak menutupi area chart.
- **Dots**: default dot lebih kecil (`r=2`), active dot tetap `r=5`.
- **Reference line**: tambah garis rata-rata (average) sebagai context.
- **Margin**: lebih lega sekitar chart, sumbu Y tidak terpotong.

## Accessibility
- Cell heatmap: `role="button"`, `tabIndex={cell.count > 0 ? 0 : -1}`, `aria-label` berisi tanggal dan jumlah aktivitas.
- Dialog: pakai `DialogTitle`, `DialogDescription`, dan `DialogContent` dari shadcn/ui.
- Trap focus di dalam dialog saat terbuka.

## Implementation Approach
- Approach 1: reuse existing `activity.recent` data, minimal server changes, fast execution.
- No new dependencies.
- Files changed: `src/components/student/activity/activity-view.tsx`, `src/components/student/activity/activity-heatmap.tsx`, `src/components/student/activity/activity-line-chart.tsx`.

## Verification
- Jalankan `bun run lint` dan `bun run typecheck`.
- Buka `/activity`, klik cell heatmap, verifikasi dialog muncul dengan data yang benar.
- Verifikasi grafik harian lebih rapi dan tooltip berfungsi.
