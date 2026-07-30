# 📘 Project Guidelines — Amir App

> **⚠️ MANDATORY: Semua AI Agent WAJIB membaca file ini sebelum menulis kode apapun.**

---

## 1. Project Overview

| Key            | Value                                    |
| -------------- | ---------------------------------------- |
| **App Name**   | Amir App                                 |
| **Framework**  | Next.js 16.2.6 (App Router)              |
| **Language**   | TypeScript 6 (Strict Mode)               |
| **Styling**    | Tailwind CSS v4.3                        |
| **PWA**        | Serwist v9.5                             |
| **Linting**    | ESLint v10 + eslint-config-next          |
| **Node**       | ≥ 18                                     |
| **Package Mgr**| Bun                                      |

---

## 2. ⚠️ Next.js 16 — Breaking Changes

```
‼️ JANGAN gunakan pengetahuan lama tentang Next.js.
   Versi ini memiliki breaking changes.
   SELALU baca docs di: node_modules/next/dist/docs/
   sebelum menulis kode apapun.
```

### Yang harus diperhatikan:
- **App Router ONLY** — Tidak ada `pages/` directory
- **React 19** — Gunakan fitur terbaru (Server Components default)
- **Metadata API** — Gunakan `export const metadata` atau `generateMetadata()`
- **Font Loading** — Gunakan `next/font/google` (sudah setup: Geist, Geist_Mono)
- **Image Component** — Gunakan `next/image` dengan prop terbaru
- **Cek deprecation notices** — Ikuti warning dari Next.js

---

## 3. Folder Structure

```
Init-nextjs-app/
├── src/                        # 📂 All source code disatukan di dalam src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (minimal wrapper)
│   │   ├── globals.css         # Global styles + Tailwind config
│   │   ├── manifest.ts         # PWA manifest
│   │   ├── sw.ts               # Service Worker (Serwist)
│   │   ├── favicon.ico
│   │   └── [lang]/             # 🌐 Dynamic locale segment
│   │       ├── layout.tsx      # Locale-aware layout (html lang, metadata)
│   │       ├── page.tsx        # Homepage (i18n)
│   │       └── dictionaries.ts# Dictionary loader (server-only)
│   ├── i18n/                   # i18n configuration
│   │   └── config.ts          # Locale list & types
│   ├── lib/                    # Shared utilities
│   │   └── seo.ts             # SEO helpers
│   ├── dictionaries/           # Translation files
│   │   ├── id.json            # 🇮🇩 Bahasa Indonesia (default)
│   │   └── en.json            # 🇬🇧 English
│   └── proxy.ts                # Locale detection & redirect (replaces middleware)
├── public/                     # Static assets
├── prompt_ai/                  # AI prompt templates (bukan source code)
├── .env                        # Common env (semua environment)
├── .env.development            # Dev-only env overrides
├── .env.production             # Prod-only env overrides
├── .env.example                # Template referensi (committed ke git)
├── AGENTS.md                   # AI Agent rules (Next.js specific)
├── GUIDELINE.md                # 📌 File ini — project guidelines
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript config
├── eslint.config.mjs           # ESLint config
├── postcss.config.mjs          # PostCSS config (Tailwind)
└── package.json
```

### Konvensi Penamaan Folder Baru:
- **Feature/Module** → `app/[lang]/(group)/feature-name/`
- **Components** → `app/[lang]/_components/` atau co-locate
- **Hooks** → `app/_hooks/` atau co-locate dengan feature
- **Utils/Lib** → `lib/` di root
- **Types** → `types/` di root atau co-locate

---

## 4. Environment Variables

### File Priority (urutan loading Next.js):
1. `.env` — Base/common (selalu di-load)
2. `.env.development` — Override untuk `NODE_ENV=development`
3. `.env.production` — Override untuk `NODE_ENV=production`
4. `.env.local` — Override tertinggi, TIDAK committed

### Aturan Naming:
| Prefix              | Accessible di          | Contoh                          |
| ------------------- | ---------------------- | ------------------------------- |
| `NEXT_PUBLIC_`      | Client + Server        | `NEXT_PUBLIC_APP_URL`           |
| Tanpa prefix        | **Server ONLY**        | `DATABASE_URL`, `AUTH_SECRET`   |

### ⚠️ JANGAN PERNAH:
- Menyimpan secret/key di file dengan prefix `NEXT_PUBLIC_`
- Hardcode URL atau API key langsung di source code
- Commit `.env.local` ke git

---

## 5. Coding Standards

### TypeScript
- **Strict mode ON** — Tidak boleh menggunakan `any` tanpa justifikasi
- Gunakan **interface** untuk object shapes, **type** untuk unions/intersections
- Semua function harus memiliki return type yang eksplisit (kecuali JSX components)
- Gunakan **path alias** `@/*` (sudah di-setup di tsconfig)

```typescript
// ✅ Benar
import { SomeComponent } from "@/app/_components/some-component";

// ❌ Salah
import { SomeComponent } from "../../../_components/some-component";
```

### React / Next.js
- **Server Components** adalah default — Hanya gunakan `"use client"` jika benar-benar butuh interaktivitas (state, effects, event handlers)
- Gunakan **`async` Server Components** untuk data fetching langsung
- **JANGAN** gunakan `useEffect` untuk data fetching — gunakan Server Components atau Server Actions
- Pisahkan komponen besar menjadi komponen kecil yang reusable

### Routing & State Management
- **Gunakan Flat Routing + SearchParams** untuk mengalirkan ID dari halaman/segmen sebelumnya ke segmen yang lebih dalam.
- **HINDARI Nested Dynamic Routes** (folder bertingkat terlalu dalam) untuk menjaga struktur folder tetap rata (*flat*) dan mudah dinavigasi.
- **HINDARI Shared Layout & React Context** untuk meneruskan parameter routing antar halaman; gunakan query parameters (`searchParams`) agar data fetching tetap optimal di Server Components.

### File Naming
| Tipe         | Format              | Contoh                    |
| ------------ | ------------------- | ------------------------- |
| Route Page   | `page.tsx`          | `app/about/page.tsx`      |
| Layout       | `layout.tsx`        | `app/dashboard/layout.tsx`|
| Component    | `kebab-case.tsx`    | `user-card.tsx`           |
| Hook         | `use-*.ts`          | `use-auth.ts`             |
| Utility      | `kebab-case.ts`     | `format-date.ts`          |
| Type         | `kebab-case.ts`     | `user-types.ts`           |
| Constant     | `UPPER_SNAKE_CASE`  | `API_ENDPOINTS`           |

---

## 6. Styling — Tailwind CSS v4

### Setup yang sudah ada:
- `globals.css` menggunakan `@import "tailwindcss"` (Tailwind v4 syntax)
- CSS variables untuk theming (`--background`, `--foreground`)
- `@theme inline` block untuk custom design tokens
- Dark mode via `prefers-color-scheme`

### Aturan:
- **Gunakan Tailwind classes** — Hindari inline style
- **Gunakan CSS variables** di `@theme inline` untuk custom values
- **Dark mode** harus selalu di-support
- **Responsive design** — Mobile-first approach (`sm:`, `md:`, `lg:`)
- **JANGAN** install Tailwind plugins tanpa konfirmasi user

```css
/* ✅ Tambah design token baru di globals.css */
@theme inline {
  --color-primary: #your-color;
  --color-background: var(--background);
}
```

---

## 7. PWA (Progressive Web App)

### Setup:
- **Serwist v9** untuk Service Worker
- `src/app/sw.ts` — Service Worker source
- `src/app/manifest.ts` — Web App Manifest
- PWA di-disable saat development (`next.config.ts`)

### Aturan:
- Update `manifest.ts` jika mengubah app name, icon, atau theme
- Jangan edit `sw.ts` kecuali butuh custom caching strategy
- Icon PWA harus tersedia di `/public/`
- Test PWA di production build (`bun run build && bun start`)

---

## 8. Internationalization (i18n)

### Arsitektur:
Project ini menggunakan **native Next.js 16 i18n** dengan pattern:
- **`[lang]` dynamic segment** — Semua route ada di `src/app/[lang]/`
- **`proxy.ts`** — Menggantikan `middleware.ts` (deprecated di Next.js 16) untuk deteksi locale dan redirect
- **Dictionary pattern** — JSON files untuk translations, loaded server-side

### Locales:
| Locale | Bahasa              | Default |
| ------ | ------------------- | ------- |
| `id`   | 🇮🇩 Bahasa Indonesia | ✅ Ya   |
| `en`   | 🇬🇧 English          | ❌ Tidak|

### File Structure:
```
src/i18n/config.ts            # Locale list & Locale type
src/dictionaries/id.json       # Translations (ID)
src/dictionaries/en.json       # Translations (EN)
src/app/[lang]/dictionaries.ts # Dictionary loader (server-only)
src/proxy.ts                   # Locale detection & redirect
```

### Cara Menggunakan di Server Component:
```typescript
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "./dictionaries";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return <h1>{dict.home.title}</h1>;
}
```

### Cara Menambahkan Translation Baru:
1. Tambahkan key baru di **kedua** file: `dictionaries/id.json` dan `dictionaries/en.json`
2. Gunakan nested object untuk grouping (misal: `nav.home`, `error.notFound`)
3. **JANGAN** hardcode string UI — selalu gunakan dictionary

### Cara Menambahkan Locale Baru:
1. Update `i18n/config.ts` — tambahkan locale ke array `locales`
2. Buat file `dictionaries/{locale}.json` dengan semua key yang sama
3. Update `app/[lang]/dictionaries.ts` — tambahkan import baru
4. Update `proxy.ts` matcher jika perlu

### ⚠️ Aturan i18n:
- **Semua route HARUS** ada di bawah `app/[lang]/`
- **Gunakan `PageProps<"/[lang]">`** dan `LayoutProps<"/[lang]">` untuk typing
- **Selalu validasi locale** dengan `hasLocale()` + `notFound()`
- **Dictionary hanya di server** — gunakan `import "server-only"` 
- **JANGAN** import dictionary di client component — pass translations sebagai props

---

## 9. Performance & SEO

### Wajib dilakukan:
- Gunakan **`next/image`** untuk semua gambar (JANGAN gunakan tag HTML `<img>` biasa)
- Gunakan **`next/font`** untuk fonts (sudah setup Geist)
- Set **`metadata`** di setiap `layout.tsx` / `page.tsx`
- Gunakan **semantic HTML** (`<main>`, `<section>`, `<article>`, dsb)
- Satu `<h1>` per halaman
- **Lazy load** komponen berat dengan `dynamic()` import

### Metadata Template:
```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title — Amir App",
  description: "Deskripsi halaman yang informatif",
};
```

---

## 10. Git Conventions

### Branch Naming:
```
feature/nama-fitur
fix/deskripsi-bug
chore/deskripsi-task
```

### Commit Message Format:
```
type(scope): description

feat(auth): add login page
fix(dashboard): resolve chart rendering
chore(deps): update next.js to 16.x
style(ui): adjust header spacing
```

### Yang TIDAK boleh di-commit:
- `node_modules/`
- `.next/`
- `.env.local`
- File temporary / scratch

### Yang BOLEH di-commit:
- `.env` (common, tanpa secrets)
- `.env.development` (tanpa secrets)
- `.env.production` (tanpa secrets — secrets via hosting platform)
- `.env.example` (template referensi)

---

## 11. Commands Reference

| Command              | Fungsi                                  |
| -------------------- | --------------------------------------- |
| `bun run dev`        | Jalankan dev server (dengan webpack)    |
| `bun run build`      | Build production bundle (dengan webpack)|
| `bun start`          | Jalankan production server              |
| `bun run lint`       | Jalankan ESLint                         |
| `bun install`        | Install semua dependencies              |
| `bun add <pkg>`      | Tambah dependency baru                  |
| `bun add -d <pkg>`   | Tambah dev dependency baru              |

> **Note:** Flag `--webpack` sudah di-set di `package.json` scripts.

---

## 12. Checklist Sebelum Push

- [ ] `bun run lint` — Tidak ada error
- [ ] `bun run build` — Build sukses tanpa error
- [ ] Tidak ada `console.log` yang tertinggal (gunakan `LOG_LEVEL`)
- [ ] Semua halaman punya metadata (title, description)
- [ ] Dark mode berfungsi dengan baik
- [ ] Responsive di mobile dan desktop
- [ ] Environment variables baru sudah ditambahkan ke `.env.example`
- [ ] Translation tersedia di semua locale (`id.json` & `en.json`)

---

## 13. Rules untuk AI Agent

### ✅ HARUS:
1. **Baca `AGENTS.md`** dan **`GUIDELINE.md`** sebelum menulis kode
2. **Baca Next.js 16 docs** di `node_modules/next/dist/docs/` untuk fitur yang akan digunakan
3. **Gunakan TypeScript strict** — no implicit any
4. **Gunakan path alias** `@/*`
5. **Support dark mode** di semua UI yang dibuat
6. **Gunakan Server Components** sebagai default
7. **Tambahkan metadata** di setiap halaman baru
8. **Update `.env.example`** jika menambah env variable baru
9. **Tambahkan translations** di kedua locale file (`id.json` & `en.json`)
10. **Buat semua route** di bawah `app/[lang]/`
11. **Gunakan `next/image`** (`Image` component dari `next/image`) untuk semua gambar di component React/Next.js
12. **Gunakan Flat Routing + SearchParams** saat membutuhkan ID atau state dari halaman/segmen sebelumnya.
13. **⚠️ WAJIB HAPUS rute demo (`app/[lang]/demo-encryption/`)** saat mulai pengerjaan web riil agar rute demo ini tidak masuk ke build produksi.

### ❌ JANGAN:
1. **JANGAN** menggunakan `pages/` directory
2. **JANGAN** menggunakan API/syntax Next.js versi lama tanpa verifikasi
3. **JANGAN** hardcode values yang seharusnya di environment variable
4. **JANGAN** menggunakan `"use client"` tanpa alasan yang jelas
5. **JANGAN** menginstall dependency baru tanpa konfirmasi user
6. **JANGAN** menghapus atau mengubah konfigurasi existing tanpa konfirmasi
7. **JANGAN** menggunakan `any` type
8. **JANGAN** menulis CSS inline — gunakan Tailwind classes
9. **JANGAN** hardcode string UI — gunakan dictionary i18n
10. **JANGAN** menggunakan `middleware.ts` — sudah deprecated, gunakan `proxy.ts`
11. **JANGAN** menggunakan tag HTML `<img>` biasa di component React/Next.js — selalu gunakan `next/image` untuk optimasi performa dan SEO
12. **JANGAN menggunakan Nested Dynamic Routes** yang terlalu dalam.
13. **JANGAN menggunakan Shared Layout & React Context** untuk sekadar membagikan parameter routing antar halaman.

---

> 📅 Last updated: 2026-05-27

