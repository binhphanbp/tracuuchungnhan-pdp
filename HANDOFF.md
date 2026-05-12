# Tài liệu bàn giao — PDP Certificate Lookup & Bulk Generator

> Tài liệu này dành cho lập trình viên tiếp nhận dự án. Đọc xong, bạn sẽ
> hiểu đủ để (a) chạy dự án trên máy local, (b) đọc/hiểu mọi tệp quan
> trọng, (c) sửa lỗi và (d) làm tiếp các milestone còn lại (M9 + M10).
>
> Các phần được đánh số. Nếu bạn chỉ có 30 phút, đọc các phần
> **§1, §2, §4, §5, §11**. Nếu bạn cần hiểu sâu để code, đọc toàn bộ.

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Trạng thái hiện tại — đã làm và còn lại](#2-trạng-thái-hiện-tại)
3. [Stack công nghệ](#3-stack-công-nghệ)
4. [Kiến trúc tổng thể](#4-kiến-trúc-tổng-thể)
5. [Hướng dẫn chạy local từng bước](#5-hướng-dẫn-chạy-local-từng-bước)
6. [Cấu hình Supabase chi tiết](#6-cấu-hình-supabase-chi-tiết)
7. [Cấu trúc thư mục — từng tệp một](#7-cấu-trúc-thư-mục)
8. [Database schema và RLS](#8-database-schema-và-rls)
9. [Quy trình end-to-end của một chiến dịch](#9-quy-trình-end-to-end)
10. [Quy ước code và nguyên tắc thiết kế](#10-quy-ước-code)
11. [Các milestone đã hoàn thành (M1–M8)](#11-các-milestone-đã-hoàn-thành)
12. [Các milestone còn lại (M9, M10) — kế hoạch chi tiết](#12-các-milestone-còn-lại)
13. [Known limitations & backlog](#13-known-limitations--backlog)
14. [Debugging & troubleshooting](#14-debugging--troubleshooting)
15. [Triển khai (Vercel + domain)](#15-triển-khai)
16. [Tài liệu tham khảo](#16-tài-liệu-tham-khảo)

---

## 1. Tổng quan dự án

### 1.1 Mục tiêu

PDP (Phòng Phát triển Sinh viên) của FPT Polytechnic TP.HCM thường
xuyên cấp chứng nhận hoàn thành / tham gia hoạt động cho sinh viên. Quy
trình hiện tại:

1. Thiết kế template trên Adobe Illustrator hoặc Canva.
2. Mỗi chứng nhận chỉnh tay tên + MSSV trong Canva.
3. Xuất PNG, đặt tên file thủ công.
4. Tải lên Google Drive.
5. Gửi link cho sinh viên qua email/Zalo.

Cách làm này **không khả thi cho 1000+ chứng nhận**, dễ sai sót, không
cho phép sinh viên tự tra cứu, và không có khả năng xác minh bằng QR.

Dự án này tự động hoá toàn bộ quy trình:

- **Sinh chứng nhận hàng loạt** từ template PNG + danh sách Excel.
- **Tự động vừa tên dài** (Nguyễn Trần Thị Hoàng Phương Thảo) bằng thuật
  toán shrink-and-wrap.
- **Đặt tên file chuẩn** (`PS43995_NGUYEN_VAN_A_POLYPASS_20260506.png`).
- **Trang tra cứu công khai** cho sinh viên nhập MSSV.
- **Mã QR + mã xác minh** trên mỗi chứng nhận, dẫn về trang verify.
- **Lưu metadata vào Supabase**, ảnh PNG vào Google Drive (free-tier).
- **Quản trị toàn bộ** qua admin dashboard.

### 1.2 Triết lý thiết kế

- **Free-tier-first**: Vercel hobby + Supabase free + Google Drive free.
  Toàn bộ chi phí hàng năm = giá tên miền.
- **Sinh ảnh trên trình duyệt**: Tránh hoàn toàn server-side rendering
  để không tốn server time / function timeout của Vercel.
- **Lưu ảnh ngoài DB**: Supabase free chỉ có 1 GB Postgres + 1 GB
  Storage. Đẩy ảnh sang Drive miễn phí (15 GB/account, có thể chia ra
  nhiều account).
- **Bảo mật mặc định bằng RLS**: Anon role tuyệt đối không đọc được bảng
  `certificates` trực tiếp — phải đi qua RPC `SECURITY DEFINER` trả về
  field tối thiểu.
- **Vận hành bởi nhân sự không-kỹ-thuật**: UI tiếng Việt, có wizard từng
  bước, copy rõ ràng, có toast feedback.
- **Lâu dài, dễ bảo trì**: Next.js + TypeScript strict + Zod validation
  - ESLint + Prettier. Migrations versioned theo file.

### 1.3 Repository

- GitHub: `ffjksjfskfsfksfssf2/tracuuchungnhan-pdp.edu.vn`
- Tên miền sản phẩm: `tracuuchungnhan-pdp.edu.vn`
- Branch chính: `main`. Mọi PR đều rebase từ `main`.

---

## 2. Trạng thái hiện tại

| Milestone | Mô tả                                               | Trạng thái   | PR  |
| --------- | --------------------------------------------------- | ------------ | --- |
| M1        | Scaffold Next.js 16 + Tailwind v4 + shadcn/ui       | Đã merge     | #1  |
| M2        | Database schema + RLS + RPC public lookup           | Đã merge     | #1  |
| M3        | Trang công khai (lookup + verify)                   | Đã merge     | #1  |
| M4        | Auth admin (login + signout + admin shell)          | Đã merge     | #3  |
| M5        | Quản lý chiến dịch (CRUD)                           | Đã merge     | #4  |
| M6        | Nhập danh sách Excel (parse + validate + map)       | Đã merge     | #5  |
| M7        | Sinh chứng nhận hàng loạt (template + canvas + ZIP) | Đã merge     | #6  |
| M8        | Lưu metadata + publish + bảng admin chứng nhận      | Đã merge     | #7  |
| **M9**    | **Google Drive MVP — manual upload + manifest map** | **Chưa làm** | —   |
| **M10**   | **Google Drive nâng cao — OAuth + direct upload**   | **Chưa làm** | —   |

**Tóm gọn**: Phần lõi đã chạy được end-to-end trên trình duyệt + Supabase.
Còn thiếu bước nối Drive: hiện tại admin tự tải ZIP, tự upload vào Drive,
nhưng hệ thống chưa biết file nào trên Drive ứng với chứng nhận nào →
trang công khai chưa hiển thị được ảnh sau khi tra cứu.

### Điều kiện để dùng được trong production

- ☑ Provision Supabase project (đã có hướng dẫn ở §6).
- ☑ Apply 3 migrations.
- ☑ Set env trên Vercel.
- ☐ **M9**: Cần làm để sinh viên thấy ảnh chứng nhận sau khi tra cứu.
- ☐ Tài khoản admin đầu tiên (chạy SQL promote một lần).

---

## 3. Stack công nghệ

| Lớp               | Công nghệ                          | Lý do                                                 |
| ----------------- | ---------------------------------- | ----------------------------------------------------- |
| Framework         | Next.js 16 (App Router)            | Server Actions, Server Components, file-based routing |
| Runtime           | Node.js 20+                        | Bắt buộc cho Next.js 16                               |
| Ngôn ngữ          | TypeScript strict                  | Bắt lỗi sớm, an toàn refactor                         |
| UI                | React 19 + Tailwind CSS v4         | Hệ sinh thái lớn, ổn định                             |
| Component library | shadcn/ui (Radix primitives)       | Copy-paste, không lock-in                             |
| Form              | `useActionState` + native `<form>` | Đơn giản, server actions native                       |
| Validation        | Zod 4                              | TypeScript-first, dùng đồng nhất client + server      |
| Toast             | sonner                             | Đẹp, nhẹ                                              |
| Icon              | lucide-react                       | Pure SVG, tree-shake tốt                              |
| Database          | Supabase Postgres                  | Free-tier có RLS, Auth, RPC                           |
| Auth              | Supabase Auth (email/password)     | Đơn giản, nội bộ                                      |
| SSR auth          | `@supabase/ssr` (cookies)          | Cookie-based session, an toàn                         |
| ID generator      | nanoid                             | Tạo verification_code 12 ký tự                        |
| QR code           | qrcode                             | Render Canvas, không phụ thuộc DOM                    |
| Excel parser      | xlsx (SheetJS)                     | Đọc xlsx/xls/csv ở client                             |
| ZIP               | jszip                              | Đóng gói PNG ở client                                 |
| Storage ảnh       | Google Drive (sẽ làm ở M9/M10)     | Free 15 GB                                            |
| Hosting           | Vercel                             | Free hobby, gắn domain dễ                             |
| Quản lý package   | pnpm                               | Nhanh, tiết kiệm dung lượng                           |

---

## 4. Kiến trúc tổng thể

### 4.1 Mô hình triển khai

```
┌────────────────────┐                ┌─────────────────────┐
│  Sinh viên (web)   │  ──HTTPS─────► │  Vercel (Next.js)   │
└────────────────────┘                │  - Server Components│
                                      │  - Server Actions   │
┌────────────────────┐                │  - proxy.ts (auth)  │
│  Admin (web)       │  ──HTTPS─────► │                     │
└────────────────────┘                └─────────┬───────────┘
                                                │
                              cookie-bound      │
                              JWT (HttpOnly)    │
                                                ▼
                                      ┌─────────────────────┐
                                      │ Supabase Postgres   │
                                      │ - Auth users        │
                                      │ - profiles          │
                                      │ - campaigns         │
                                      │ - certificates      │
                                      │ - lookup_logs       │
                                      │ - import_batches    │
                                      │ - RLS + RPC         │
                                      └─────────────────────┘

                                      ┌─────────────────────┐
                                      │ Google Drive        │
                                      │ (M9: manual upload) │
                                      │ (M10: OAuth direct) │
                                      └─────────────────────┘
```

### 4.2 Hai luồng chính

**Luồng admin** (sau khi đăng nhập):

```
/login
  └─► /admin                              (dashboard)
        ├─► /admin/campaigns              (danh sách chiến dịch)
        │     ├─► /admin/campaigns/new    (tạo)
        │     └─► /admin/campaigns/[id]   (chi tiết, có 4 nút action)
        │           ├─► /import           (wizard nhập Excel)
        │           ├─► /generator        (wizard sinh chứng nhận)
        │           └─► /certificates     (danh sách chứng nhận trong chiến dịch)
        └─► /admin/certificates           (danh sách toàn cục, có filter)
```

**Luồng công khai**:

```
/                       (trang chủ với form tra cứu)
/lookup?mssv=PS43995    (kết quả tra cứu)
/verify/[code]          (xác minh qua QR code)
```

### 4.3 Vòng đời dữ liệu của một chứng nhận

1. Admin tạo `campaigns` record (M5).
2. Admin upload Excel → wizard parse + validate (M6).
3. Admin sinh PNG hàng loạt từ template + Excel → ZIP (M7).
4. Wizard tự gọi `saveCertificateBatch()` → upsert vào `certificates`
   bảng (M8). Trạng thái mặc định: `draft`.
5. Admin upload ZIP vào Drive thủ công, dán manifest CSV vào hệ thống
   (M9 — chưa làm) → mỗi `certificate.drive_file_id` được set.
6. Admin nhấn "Phát hành chiến dịch" → tất cả `certificates.status` =
   `published` (M8).
7. Sinh viên nhập MSSV ở `/lookup` → API gọi RPC
   `lookup_by_student_code()` → trả về cert có `status='published'` →
   trang công khai hiển thị ảnh từ `drive_view_url`.

---

## 5. Hướng dẫn chạy local từng bước

### 5.1 Yêu cầu máy

- Node.js **20.x** trở lên (`node -v`)
- pnpm **9.x** trở lên (`pnpm -v`). Cài: `npm install -g pnpm`
- Git
- Tài khoản Supabase (free): <https://supabase.com>

### 5.2 Clone và cài đặt

```bash
git clone https://github.com/ffjksjfskfsfksfssf2/tracuuchungnhan-pdp.edu.vn.git
cd tracuuchungnhan-pdp.edu.vn
pnpm install
```

### 5.3 Tạo Supabase project

1. Vào <https://supabase.com> → New project.
2. Region: chọn **Singapore (ap-southeast-1)** để giảm latency từ HCM.
3. Đặt password DB và lưu lại an toàn.
4. Đợi project provision xong (~ 2 phút).

### 5.4 Apply migrations

Trong Supabase Dashboard → **SQL Editor** → New query, dán và chạy lần
lượt **đúng thứ tự**:

1. `supabase/migrations/0001_init.sql` — schema, indexes, triggers,
   `handle_new_user` (tự tạo profile khi user đăng ký).
2. `supabase/migrations/0002_rls.sql` — bật RLS, tạo policies, tạo helper
   `is_admin()`.
3. `supabase/migrations/0003_rpc_public_lookup.sql` — 2 RPC
   `SECURITY DEFINER`: `lookup_by_student_code(p_code text)` và
   `verify_by_code(p_verification_code text)`. Anon role chỉ được phép
   gọi 2 hàm này, không đọc bảng trực tiếp.
4. _(Tùy chọn)_ `supabase/seed.sql` — tạo 1 chiến dịch demo + 2 chứng
   nhận để test form tra cứu khi chưa có dữ liệu thật.

Sau khi chạy xong, vào **Database → Advisors → Security**. Kết quả
mong đợi: **0 warning** (tất cả bảng `public.*` đã bật RLS).

### 5.5 Cấu hình env

```bash
cp .env.example .env.local
```

Mở `.env.local`, điền:

| Biến                                   | Lấy ở đâu                                               |
| -------------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Settings → API → Project URL                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Settings → API → Publishable key (hoặc anon key cũ)     |
| `SUPABASE_SERVICE_ROLE_KEY`            | Settings → API → Service role secret. **Không commit**. |
| `NEXT_PUBLIC_SITE_URL`                 | `http://localhost:3000` cho dev, domain thật cho prod   |
| `NEXT_PUBLIC_VERIFY_BASE_URL`          | `http://localhost:3000/verify` cho dev                  |

`GOOGLE_*` để trống — chỉ cần khi làm M10.

### 5.6 Tạo admin đầu tiên

Hệ thống không có form đăng ký (cố ý — tránh ai cũng tạo được tài khoản
admin). Hai bước tay:

1. Supabase Dashboard → **Authentication → Users → Add user → Create
   new user**. Email + password tạm.
2. SQL Editor:

   ```sql
   update public.profiles
   set role = 'super_admin'
   where id = '<paste auth.users.id từ bước 1>';
   ```

Trigger `handle_new_user` (trong `0001_init.sql`) tự tạo profile với
role `viewer` khi user đăng ký. SQL trên chỉ nâng quyền lên
`super_admin`.

### 5.7 Chạy dev server

```bash
pnpm dev
```

- Trang chủ: <http://localhost:3000>
- Admin: <http://localhost:3000/admin> (bị redirect sang `/login` nếu
  chưa đăng nhập)

### 5.8 Kiểm tra trước khi push

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm format:check # prettier --check
pnpm build       # next build
```

**Tất cả phải pass** trước khi tạo PR. Pre-commit hook chưa được cài —
nếu muốn, thêm vào `package.json` script `prepare` để cài Husky.

---

## 6. Cấu hình Supabase chi tiết

### 6.1 Vì sao 3 file migration

- **`0001_init.sql`**: schema gốc. Chạy đầu tiên. Tạo:
  - 5 bảng: `profiles`, `campaigns`, `certificates`, `import_batches`,
    `lookup_logs`.
  - Các index trên `student_code`, `verification_code`, `campaign_id`,
    `status`, `full_name_normalized`.
  - Trigger `set_updated_at` cho `campaigns`, `certificates`.
  - Trigger `handle_new_user` trên `auth.users` → tự insert profile.
  - 3 enum: `campaign_status`, `certificate_status`, `profile_role`.
- **`0002_rls.sql`**: bật RLS cho mọi bảng + tạo policies. Quan trọng:
  - `is_admin()`: helper SQL trả về `true` nếu user hiện tại có role
    `admin` hoặc `super_admin`. Dùng trong policies để gọn.
  - Anon role: **không** có policy đọc/ghi nào trên `certificates`,
    `campaigns`, `profiles`, `import_batches`. Bị deny mặc định.
  - Admin role: có policy đọc/ghi đầy đủ thông qua `is_admin()`.
- **`0003_rpc_public_lookup.sql`**: 2 RPC `SECURITY DEFINER`:
  - `lookup_by_student_code(p_code text)` — anon được gọi. Trả về cert
    đầu tiên `status='published'` matching `student_code`. Cũng insert
    vào `lookup_logs` để audit.
  - `verify_by_code(p_verification_code text)` — tương tự nhưng matching
    `verification_code`.

`SECURITY DEFINER` cho phép function chạy với quyền của owner (postgres)
thay vì caller (anon), tức là bypass RLS một cách có kiểm soát. Đây là
pattern an toàn để expose query vừa đủ ra public mà không mở toàn bảng.

### 6.2 Khi cần thêm migration

- Đặt tên file `000X_<mô_tả>.sql` (tăng dần).
- Mỗi migration là idempotent nếu có thể (`create table if not exists`,
  `create policy if not exists` → tiếc là Postgres không hỗ trợ
  `if not exists` cho policy, dùng `drop policy if exists` rồi
  `create policy`).
- Test trên Supabase local stack (`supabase start`) trước nếu có thay
  đổi lớn. Hoặc tạo Supabase project staging riêng.
- Cập nhật `types/database.ts` cho khớp.

### 6.3 Generate TypeScript types từ Supabase

Hiện `types/database.ts` đang viết tay. Khi schema lớn lên, generate:

```bash
# Cài Supabase CLI một lần
npm install -g supabase

# Login (mở browser xác thực)
supabase login

# Generate
supabase gen types typescript --project-id <project-ref> > types/database.ts
```

`<project-ref>` là phần `xyz` trong URL `https://xyz.supabase.co`.

### 6.4 Service role key — khi nào dùng

Service role key bypass toàn bộ RLS. **Chỉ dùng ở server**, không bao
giờ expose ra client. Trong code hiện tại:

- `lib/supabase/service.ts` cung cấp `createServiceClient()` — chưa được
  dùng ở milestone nào. Để dành cho:
  - Job admin nội bộ (cron, cleanup).
  - API route cần escalate quyền tạm thời (e.g. tạo user qua admin API).
- Thêm vào `.env.local` qua `SUPABASE_SERVICE_ROLE_KEY`. Vercel: gắn vào
  Production + Preview + Development env, đánh dấu **server-only**.

---

## 7. Cấu trúc thư mục

Liệt kê đủ mọi tệp `*.ts`/`*.tsx` quan trọng. Đọc theo thứ tự để tick
qua dần.

### 7.1 Root

- `proxy.ts` — Next.js 16 Proxy (tên cũ là `middleware.ts`). Bắt mọi
  request, refresh session Supabase, redirect `/admin/*` về `/login`
  nếu không có claims hợp lệ. **Quan trọng**: dùng `getClaims()` không
  phải `getSession()` — `getClaims` verify chữ ký JWT, an toàn hơn.
- `next.config.ts` — config tối thiểu, không có gì đặc biệt.
- `tsconfig.json` — strict mode, alias `@/` → root.
- `AGENTS.md` / `CLAUDE.md` — note cho AI coding agent. Đọc
  `node_modules/next/dist/docs/` trước khi viết code Next.js.

### 7.2 `app/` — App Router

#### `app/(public)/` — phần công khai

- `layout.tsx` — wrapper cho toàn bộ trang công khai (header + footer).
- `page.tsx` — trang chủ, có hero + form tra cứu + section "How it works".
- `lookup/page.tsx` — trang kết quả khi tìm theo MSSV. Hiện tại gọi API
  `/api/lookup` rồi hiển thị card.
- `verify/[code]/page.tsx` — trang xác minh QR. Gọi API
  `/api/verify/[code]`, hiển thị card xác nhận.

#### `app/(auth)/login/`

- `actions.ts` — server actions `signIn()` và `signOut()`. `signIn` parse
  Zod, gọi `supabase.auth.signInWithPassword`, redirect. `signOut` gọi
  `supabase.auth.signOut`, redirect.
- `login-form.tsx` — client component dùng `useActionState` +
  `useFormStatus` cho UX form Server Actions.
- `page.tsx` — wrap form, có link về `/`.

#### `app/admin/` — phần admin (đã gate bởi `proxy.ts` + `requireAdmin()`)

- `layout.tsx` — gọi `requireAdmin()` lấy email, render `<AdminShell>`.
- `page.tsx` — dashboard, hiện 4 ô feature placeholder.
- `campaigns/`
  - `page.tsx` — danh sách chiến dịch (server component, query Supabase).
  - `actions.ts` — `createCampaign()`, `updateCampaign()`. Cả 2 đều gọi
    `requireAdmin()` đầu tiên (dual gate).
  - `new/page.tsx` — form tạo mới (dùng `<CampaignForm>` shared).
  - `[campaignId]/page.tsx` — trang chi tiết, có:
    - Header với badge trạng thái.
    - 4 nút action: Nhập Excel · Sinh chứng nhận · Chứng nhận đã lưu ·
      Phát hành/Huỷ.
    - Form chỉnh sửa (dùng `<CampaignEditForm>`).
  - `[campaignId]/edit-form.tsx` — client wrapper bind `campaignId` vào
    `updateCampaign`.
  - `[campaignId]/actions.ts` — `publishCampaign()`,
    `unpublishCampaign()`. Cascade sang `certificates`.
  - `[campaignId]/import/page.tsx` — host wizard nhập Excel (M6).
  - `[campaignId]/generator/page.tsx` — host wizard sinh chứng nhận
    (M7), pre-load `template_config` đã lưu.
  - `[campaignId]/generator/actions.ts` — `saveTemplateConfig()` (M7),
    `saveCertificateBatch()` (M8).
  - `[campaignId]/certificates/page.tsx` — danh sách chứng nhận của
    chiến dịch (M8).
- `certificates/page.tsx` — danh sách toàn cục với filter +
  pagination (M8).

#### `app/api/`

- `health/route.ts` — `GET /api/health` → `{ ok: true }` để monitor.
- `lookup/route.ts` — `GET /api/lookup?mssv=PS43995`. Validate, gọi RPC
  `lookup_by_student_code`, trả JSON.
- `verify/[code]/route.ts` — `GET /api/verify/[code]`. Tương tự, gọi
  `verify_by_code`.

### 7.3 `components/`

#### `components/public/`

- `site-header.tsx`, `site-footer.tsx`, `lookup-form.tsx` — UI chung
  cho phần công khai.

#### `components/admin/`

- `admin-shell.tsx` — layout sticky header + sidebar + main content.
- `admin-nav.tsx` — sidebar nav, highlight link active qua
  `usePathname()`.
- `sign-out-button.tsx` — nút signout dùng `useTransition`.
- `campaign-form.tsx` — form shared cho create + edit, auto-slugify khi
  gõ title (dùng `lib/utils/slug.ts`).
- `campaign-status-badge.tsx` — badge trạng thái chiến dịch.
- `excel-import-wizard.tsx` — wizard 3 phase (upload, mapping,
  validation result) cho M6.
- `template-uploader.tsx` — drag-drop upload template PNG.
- `position-config-form.tsx` — form chỉnh toạ độ text box, font size,
  màu, alignment.
- `certificate-preview.tsx` — render canvas preview của dòng đầu, scale
  tự động vào container.
- `generator-wizard.tsx` — wizard chính của M7+M8. Quản lý state:
  template, parsed Excel, mapping, config, generating, progress. Logic
  batch render + ZIP + persist.
- `certificate-status-badge.tsx`, `certificates-table.tsx`,
  `certificate-filters.tsx`, `publish-button.tsx` — UI của M8.

#### `components/ui/`

shadcn/ui primitives (`button`, `card`, `dialog`, `input`, `label`,
`select`, `separator`, `sheet`, `sonner`, `table`, `tabs`, `textarea`,
`alert`, `badge`, `dropdown-menu`). Sửa cẩn thận — đây là source code
copy-paste từ shadcn, không phải dependency.

### 7.4 `lib/` — logic không UI

#### `lib/supabase/`

- `env.ts` — `getSupabasePublicEnv()` đọc `NEXT_PUBLIC_*`. Lazy throw
  khi thiếu để build vẫn pass nếu env chưa đặt.
- `client.ts` — `createClient()` cho Browser Client Components.
- `server.ts` — `createClient()` cho Server Components / Actions, bind
  vào cookies của request.
- `proxy.ts` — `updateSession()` dùng trong `proxy.ts` root.
- `service.ts` — `createServiceClient()` server-only, bypass RLS.

#### `lib/auth/`

- `require-admin.ts` — guard cho mọi `/admin/**` page và mọi server
  action admin. `getClaims()` rồi check `profiles.role`.

#### `lib/validation/`

- `auth.ts` — Zod schema cho form login.
- `campaign.ts` — schema chiến dịch.
- `student-code.ts` — `studentCodeSchema()` parse + uppercase + regex
  `/^PS\d+$/` (configurable).
- `student-row.ts` — schema cho mỗi dòng Excel + `validateRows()` trả
  về `{ validRows, errors, duplicates }`.
- `certificate-record.ts` — schema cho batch save (M8).

#### `lib/excel/`

- `columns.ts` — `CANONICAL_FIELDS` array + `autoDetectMapping()` dùng
  alias-table không dấu để match header tiếng Việt + tiếng Anh.
- `parse.ts` — `parseSheet(file: File)` dùng SheetJS parse xlsx/xls/csv.
  Trả `{ headers, detectedMapping, rows, sheetName }`.

#### `lib/generator/`

- `template-config.ts` — Zod schema + `DEFAULT_TEMPLATE_CONFIG` (toạ độ
  cho A4 landscape 300 DPI).
- `text-fitting.ts` — `fitText(ctx, text, options)`. Thuật toán:
  1. Thử 1 dòng, shrink từ `maxFontSize` xuống `minFontSize` (step 4 px).
  2. Nếu vẫn không vừa, chia 2 dòng cân bằng (theo character count).
  3. Shrink lại với 2 dòng.
  4. Best-effort, set flag `overflow=true` nếu vẫn quá dài.
- `verification-code.ts` — `nanoid` 32-char alphabet (loại bỏ 0/O/1/I/l)
  - 12 ký tự. Helper `verificationUrlFor(code)` build URL từ
    `NEXT_PUBLIC_SITE_URL`.
- `render.ts` — `renderCertificate({ template, config, data })` →
  `{ canvas, warnings }`. Pure function, không touch DOM/global.
- `zip.ts` — `buildFilename()`, `buildCertificateZip()`,
  `buildManifestCsv()`, `downloadBlob()`. Manifest CSV có UTF-8 BOM cho
  Excel mở đúng dấu.

#### `lib/utils/`

- `normalize.ts` — `stripDiacritics()`, `normalizeHeader()`. Dùng để tạo
  filename, search không dấu, normalize header Excel.
- `slug.ts` — `toSlug()` cho campaign URL.
- `filename.ts` — helpers liên quan filename.
- `utils.ts` (root của `lib/`) — `cn()` từ shadcn (clsx + tailwind-merge).

### 7.5 `types/`

- `database.ts` — TypeScript types cho mọi bảng Supabase. Generate lại
  bằng `supabase gen types typescript` khi schema đổi.
- `certificate.ts` — DTO cho UI (subset của row, dùng ở các page).

### 7.6 `supabase/`

- `migrations/000X_*.sql` — đã giải thích §6.
- `seed.sql` — 1 chiến dịch + 2 chứng nhận demo.

---

## 8. Database schema và RLS

### 8.1 Bảng

```sql
-- profiles: role-based access control
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  full_name text,
  role profile_role NOT NULL DEFAULT 'viewer',  -- viewer | admin | super_admin
  created_at timestamptz DEFAULT now()
)

-- campaigns: 1 chiến dịch = 1 đợt cấp chứng nhận
campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  issue_date date NOT NULL,
  signer_name text,
  signer_title text,
  drive_folder_id text,                  -- folder Drive chứa PNG (M9)
  status campaign_status NOT NULL DEFAULT 'draft',  -- draft | published | archived
  template_config jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- certificates: 1 cert = 1 sinh viên × 1 chiến dịch
certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  student_code text NOT NULL,           -- MSSV, đã uppercase
  full_name text NOT NULL,              -- giữ dấu tiếng Việt
  full_name_normalized text NOT NULL,   -- không dấu, uppercase, để search
  class_name text,
  email text,
  date_of_birth date,
  certificate_title text,
  issue_date date NOT NULL,
  file_name text NOT NULL,              -- PS43995_NGUYEN_VAN_A.png
  drive_file_id text,                   -- Google Drive file ID (M9)
  drive_view_url text,
  drive_download_url text,
  verification_code text NOT NULL UNIQUE,
  qr_payload text NOT NULL,
  status certificate_status NOT NULL DEFAULT 'draft', -- draft | published | revoked
  metadata jsonb NOT NULL DEFAULT '{}',  -- {warnings: ['...']}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (campaign_id, student_code)    -- 1 cert/sinh viên/chiến dịch
)

-- import_batches: log mỗi lần nhập Excel hoặc generate
import_batches (
  id uuid PRIMARY KEY,
  campaign_id uuid REFERENCES campaigns(id),
  original_file_name text,
  row_count int,
  success_count int,
  error_count int,
  created_by uuid,
  created_at timestamptz
)

-- lookup_logs: audit trail cho mỗi lần tra cứu công khai
lookup_logs (
  id uuid PRIMARY KEY,
  student_code text,
  certificate_id uuid REFERENCES certificates(id),
  success boolean,
  ip_hash text,
  user_agent text,
  created_at timestamptz
)
```

### 8.2 RLS chiến lược

| Bảng             | Anon                           | Authenticated viewer | Admin (admin/super_admin) |
| ---------------- | ------------------------------ | -------------------- | ------------------------- |
| `profiles`       | ✗                              | Đọc profile của mình | Đọc/ghi tất cả            |
| `campaigns`      | ✗                              | ✗                    | Đọc/ghi tất cả            |
| `certificates`   | ✗ (phải qua RPC)               | ✗                    | Đọc/ghi tất cả            |
| `import_batches` | ✗                              | ✗                    | Đọc/ghi tất cả            |
| `lookup_logs`    | INSERT (qua RPC), không SELECT | ✗                    | Đọc tất cả                |

**Anon được làm gì?**

- Gọi RPC `lookup_by_student_code(p_code)` — trả về 1 row nếu cert có
  `status='published'` matching MSSV.
- Gọi RPC `verify_by_code(p_verification_code)` — tương tự.

Cả 2 RPC đều `SECURITY DEFINER` → chạy với quyền owner, bypass RLS có
kiểm soát. Anon chỉ thấy được các field đã chọn trong RPC, **không**
thấy `id` hay `email`/`date_of_birth` (trừ khi explicitly include).

Cả 2 RPC đều `INSERT INTO lookup_logs(...)` — admin sau này xem được
audit ai tra cứu cái gì.

### 8.3 Helper `is_admin()`

```sql
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;
```

Dùng trong policies cho gọn:

```sql
create policy "admin can write campaigns"
  on public.campaigns for all
  using (is_admin())
  with check (is_admin());
```

### 8.4 Khi nào tạo migration mới

- Đổi schema (thêm cột, đổi kiểu) → migration mới + cập nhật
  `types/database.ts`.
- Thêm RLS policy / RPC → migration mới.
- Đổi seed → cập nhật `supabase/seed.sql`.

**Không** chạy SQL ad-hoc trên Supabase Dashboard mà không có migration
file tương ứng — sau này deploy sang Supabase project khác (staging,
production) sẽ thiếu.

---

## 9. Quy trình end-to-end

Đây là kịch bản đầy đủ để cấp chứng nhận cho 500 sinh viên (giả định
M9 đã làm).

### Bước 1 — Chuẩn bị

- File template PNG: xuất từ Canva/Illustrator, kích thước ≥ 3000px
  ngang. Đã xoá tên + MSSV placeholder (chỉ còn nền, logo, signature).
- File Excel `students.xlsx` với cột `MSSV`, `Họ và tên`, `Lớp`. Có
  thể có thêm cột email/ngày sinh (sẽ được bỏ qua nếu không map).
- Tài khoản Google Drive với folder mới tạo, ghi lại folder ID (chuỗi
  trong URL `https://drive.google.com/drive/folders/<ID>`).

### Bước 2 — Tạo chiến dịch (admin)

1. Đăng nhập `/admin`.
2. Sidebar → "Chiến dịch" → "Tạo chiến dịch".
3. Điền:
   - **Tiêu đề**: "Chứng nhận hoàn thành PolyPass 2026 đợt 1"
   - **Slug**: tự sinh từ title (sửa được)
   - **Ngày cấp**: 2026-05-06
   - **Người ký** + **Chức danh**: tuỳ chọn
   - **Drive folder ID**: dán ID từ Drive
   - **Trạng thái**: Nháp (mặc định)
4. Lưu → tự redirect về trang chi tiết.

### Bước 3 — Cấu hình & sinh chứng nhận

1. Trang chi tiết chiến dịch → nút **"Sinh chứng nhận hàng loạt"**.
2. Section 1 — kéo thả template PNG. Hệ thống hiển thị thumbnail +
   kích thước.
3. Section 2 — kéo thả `students.xlsx`. Hệ thống auto-detect cột
   tiếng Việt (MSSV → `student_code`, Họ và tên → `full_name`, …).
   Nếu sai, sửa qua dropdown.
4. Section 3 — chỉnh toạ độ text box. Mặc định cho A4 landscape 300
   DPI; thường phải tweak. Nhấn **"Lưu cấu hình"** để Supabase nhớ.
5. Section 4 — preview tự cập nhật khi đổi config.
6. Section 5 — nhấn **"Sinh tất cả"**:
   - Tiến độ chạy theo thanh progress.
   - ZIP download tự động: `<slug>-certificates.zip` chứa toàn bộ PNG
     - `manifest.csv`.
   - Toast "Đã lưu N chứng nhận vào cơ sở dữ liệu" sau khi upsert
     thành công.

### Bước 4 — Upload Drive (M9 chưa làm)

**Hiện tại**: admin tự giải nén ZIP, kéo PNG lên Drive, set "Anyone
with link can view". Hệ thống chưa biết file ID nào ứng với cert nào.

**Khi có M9**: admin mở `/admin/campaigns/[id]/drive-link`, dán manifest
CSV (đã copy file ID Drive vào cột mới), hệ thống map tự động.

### Bước 5 — Phát hành

1. Trang chi tiết chiến dịch → **"Phát hành chiến dịch"** → confirm.
2. Cascade: `campaigns.status='published'`, mọi
   `certificates.status='draft'` → `'published'`.

### Bước 6 — Sinh viên tra cứu

1. Vào `https://tracuuchungnhan-pdp.edu.vn/`.
2. Nhập MSSV `PS43995` → submit.
3. Trang `/lookup?mssv=PS43995` hiện card với:
   - Họ tên, MSSV, tên chứng nhận, ngày cấp.
   - **Ảnh chứng nhận** (chỉ hiện sau khi M9 đã link Drive).
   - Link tải PNG từ Drive.
   - QR code.
4. Hoặc scan QR trên giấy → `/verify/<code>` xác minh authenticity.

---

## 10. Quy ước code

### 10.1 TypeScript

- Strict mode, không dùng `any` hoặc `unknown` trừ khi bắt buộc.
- Interface đặt trong file dùng nó. Type chung đặt ở `types/`.
- Import order: thư viện ngoài → `@/` aliases. Có dòng trống giữa các
  block.

### 10.2 React

- **Server Component mặc định**. Chỉ thêm `"use client"` khi cần
  interactivity (form input, useState, hooks).
- Form admin: dùng `useActionState` + `<form action={action}>` để tận
  dụng Server Actions.
- Tránh `useEffect` cho data fetching — query Supabase trong server
  component.
- Tránh `useEffect + setState` — dùng `useMemo` hoặc derive thẳng.

### 10.3 Server Actions

- File `actions.ts` ngay cùng folder với page dùng.
- Mỗi action **bắt đầu bằng `await requireAdmin()`** (kể cả khi proxy
  - layout đã check) — server action có thể bị gọi trực tiếp qua RPC.
- Trả về `{ ok: true } | { ok: false, error: string }` để form hiển thị
  được error inline.
- Sau khi mutate, gọi `revalidatePath()` để Next.js refresh cache.
- Kết hợp `redirect()` khi cần điều hướng sau create.

### 10.4 Validation

- Zod đặt trong `lib/validation/`. Dùng cùng schema ở client + server.
- Server action **luôn re-parse** input client gửi lên, không tin
  client.

### 10.5 Style

- Tailwind only. Không CSS module.
- Variables `bg-pdp-orange` (custom) định nghĩa trong
  `app/globals.css`.
- shadcn/ui primitives → có thể sửa trong `components/ui/*`. Coi như
  source code.

### 10.6 Comment

- Comment tiếng Anh (giữ codebase quốc tế).
- UI text tiếng Việt 100%.
- Không comment "what" mà comment "why" / hành vi không hiển nhiên.

### 10.7 Git

- Branch: `devin/<timestamp>-<short-desc>`.
- Commit: tiêu đề ngắn, theo format `M<n>: <verb> <noun>`. Body
  liệt kê thay đổi quan trọng.
- Một PR = một milestone hoặc một concern. PR mô tả theo template repo.
- Không force-push lên branch chia sẻ. `--force-with-lease` chỉ trên
  branch của riêng mình.

---

## 11. Các milestone đã hoàn thành

### M1 — Scaffold (PR #1)

- Next.js 16 + React 19 + TS strict + Tailwind v4 + shadcn/ui.
- 4 file `lib/supabase/*.ts` (client, server, proxy, service).
- `proxy.ts` root refresh session + gate `/admin`.
- `.env.example`, `.gitignore`, `.prettierignore`, `.prettierrc.json`.
- `app/api/health/route.ts` — endpoint health check.

**Test**: `pnpm build` pass; `/api/health` trả `{ ok: true }`.

### M2 — Database (PR #1, gộp với M1)

- 3 migrations + seed.
- `types/database.ts` viết tay khớp schema.
- Trigger `handle_new_user` tự tạo profile khi user đăng ký.

**Test**: chạy 3 migrations, vào Advisors → 0 warning.

### M3 — Public lookup (PR #1, gộp với M1+M2)

- Trang chủ với hero + form.
- Trang `/lookup?mssv=...` hiển thị kết quả.
- Trang `/verify/[code]` xác minh.
- API `/api/lookup`, `/api/verify/[code]` gọi RPC tương ứng.
- Validation MSSV qua Zod (regex `/^PS\d+$/`).

**Test**: form refuse `abc`, accept `PS43995`. API trả 404 cho MSSV
không tồn tại (không enumerate).

### M4 — Admin auth (PR #3)

- `/login` page với form email + password.
- Server actions `signIn`, `signOut`.
- `lib/auth/require-admin.ts` → `getClaims()` + check `profiles.role`.
- `app/admin/layout.tsx` gọi `requireAdmin()`.
- Admin shell (`<AdminShell>`) với sidebar + header + signout.
- Open-redirect guard: `?redirect=` chỉ honor nếu starts với `/admin`.

**Test**: `/admin` redirect → `/login?redirect=/admin`. Login đúng →
land `/admin`. Signout → `/`.

### M5 — Campaign CRUD (PR #4)

- `app/admin/campaigns/page.tsx` — danh sách (server query, sort by
  `updated_at`).
- `app/admin/campaigns/new/page.tsx` — form create.
- `app/admin/campaigns/[id]/page.tsx` — form edit + status badge.
- Server actions `createCampaign`, `updateCampaign` với Zod parsing,
  unique-slug error → field error.
- `lib/utils/slug.ts` `toSlug()` Vietnamese-aware (strip diacritics).
- `<CampaignForm>` shared dùng cho cả create + edit.

**Test**: tạo chiến dịch tên có dấu → slug auto-generate đúng. Tạo
chiến dịch trùng slug → field error.

### M6 — Excel import (PR #5)

- `lib/excel/columns.ts` — `CANONICAL_FIELDS` + `autoDetectMapping()`
  với alias không dấu.
- `lib/excel/parse.ts` — SheetJS browser parser.
- `lib/validation/student-row.ts` — Zod per row + `validateRows()`.
- `<ExcelImportWizard>` — 3 phase: upload, mapping table, validation
  result với tabs valid/errors.
- `app/admin/campaigns/[id]/import/page.tsx` — host wizard.
- Nút "Nhập danh sách Excel" trên campaign detail.

**Test**: upload xlsx có cột "Họ và tên" → auto map đúng. Upload csv
trống → empty state. Trùng MSSV → flag duplicate trong tab errors.

### M7 — Bulk generator (PR #6)

- `lib/generator/template-config.ts` — Zod schema + defaults.
- `lib/generator/text-fitting.ts` — `fitText()` shrink + 2-line wrap.
- `lib/generator/verification-code.ts` — `nanoid` 12 chars.
- `lib/generator/render.ts` — `renderCertificate()` pure canvas function.
- `lib/generator/zip.ts` — `buildFilename()`, `buildCertificateZip()`,
  `buildManifestCsv()`, `downloadBlob()`.
- `<TemplateUploader>`, `<PositionConfigForm>`, `<CertificatePreview>`,
  `<GeneratorWizard>` — UI components.
- `app/admin/campaigns/[id]/generator/page.tsx` — host wizard.
- Server action `saveTemplateConfig()`.
- Nút "Sinh chứng nhận hàng loạt" trên campaign detail.

**Test**: upload template + Excel → preview render đúng. Tên 6 từ
hiện 2 dòng. Sinh tất cả → ZIP download có manifest UTF-8 + BOM.

### M8 — Persist + publish + table (PR #7)

- `lib/validation/certificate-record.ts` — Zod schema cho batch save.
- Server action `saveCertificateBatch()` upsert chunked 500.
- Server actions `publishCampaign()`, `unpublishCampaign()` cascade.
- `<PublishButton>` với confirm dialog.
- `<CertificateStatusBadge>`, `<CertificatesTable>`,
  `<CertificateFilters>`.
- `app/admin/certificates/page.tsx` — danh sách toàn cục với search
  - filter + pagination.
- `app/admin/campaigns/[id]/certificates/page.tsx` — danh sách
  per-campaign.
- Wire `<GeneratorWizard>` gọi `saveCertificateBatch` sau khi ZIP
  download.
- Campaign detail: thêm 2 nút "Chứng nhận đã lưu" (với count) và
  "Phát hành/Huỷ phát hành".

**Test**: sinh batch → reload `/admin/certificates` → thấy đủ. Search
"nguyen van a" (không dấu) → match. Phát hành chiến dịch → cascade.

---

## 12. Các milestone còn lại

### 12.1 M9 — Google Drive MVP (manual upload + manifest map)

**Mục tiêu**: Sau khi admin sinh ZIP, tự upload PNG lên Drive thủ công,
thì hệ thống nhận về thông tin Drive và link vào DB → trang công khai
hiển thị được ảnh.

#### Lý do làm MVP trước

- Không cần OAuth (M10) — dev nhanh hơn.
- Không cần đăng ký Google Cloud project + verify domain.
- Phù hợp cho test với folder Drive sẵn của PDP.

#### Files dự kiến tạo

```
app/admin/campaigns/[campaignId]/drive-link/page.tsx
app/admin/campaigns/[campaignId]/drive-link/actions.ts
components/admin/drive-link-wizard.tsx
lib/google-drive/manifest.ts        — parse manifest CSV admin paste vào
lib/google-drive/url.ts             — build view/download URL từ file ID
lib/validation/drive-mapping.ts     — Zod schema
```

#### Quy trình UX

1. Trang chi tiết chiến dịch → nút **"Liên kết Google Drive"**.
2. Wizard:
   - **Step 1**: hướng dẫn admin upload ZIP đã sinh (không kéo dropzone
     ở đây — chỉ instructions).
     - Mở Drive → folder của chiến dịch.
     - Kéo các PNG vào.
     - Set quyền "Anyone with link can view".
     - Vào "Tools / Manage files" → export CSV với cột: filename,
       file ID, view URL, download URL. (Nếu Drive không có sẵn export,
       hướng dẫn dùng Google Apps Script — đính kèm template script).
   - **Step 2**: textarea để admin paste manifest CSV (filename →
     drive_file_id). Hệ thống parse, hiển thị bảng "ghép được /
     không ghép được":
     - **Ghép được**: filename trong `certificates.file_name` match
       với manifest → cập nhật `drive_file_id`, `drive_view_url`,
       `drive_download_url`.
     - **Không ghép được**: liệt kê.
   - **Step 3**: confirm → server action `linkDriveFiles()` upsert.
3. Admin có thể chạy lại bao nhiêu lần cũng được (idempotent).

#### Server action

```ts
// app/admin/campaigns/[campaignId]/drive-link/actions.ts
export async function linkDriveFiles(
  campaignId: string,
  mappings: {
    file_name: string;
    drive_file_id: string;
    drive_view_url?: string;
    drive_download_url?: string;
  }[],
): Promise<
  { ok: true; linked: number; missing: string[] } | { ok: false; error: string }
>;
```

- Upsert per chunk vào `certificates` matching `(campaign_id, file_name)`.
- Trả về số đã link + filenames không có cert tương ứng.

#### Trang công khai cập nhật

- `/lookup?mssv=...` hiện có card → thêm `<img src={drive_view_url}>`
  nếu có.
- `/verify/[code]` tương tự.

#### RPC cập nhật

- `lookup_by_student_code()` đã trả `drive_view_url`. Kiểm tra lại
  trong `0003_rpc_public_lookup.sql` xem có cần thêm field không.

#### Test plan M9

- [ ] Sinh batch 5 cert.
- [ ] Tạo Drive folder mới, kéo 5 PNG vào, set anyone-with-link.
- [ ] Tạo manifest.csv với 5 dòng (filename, file_id, view_url, download_url).
- [ ] Paste vào wizard, confirm, kiểm tra "5 ghép được, 0 thiếu".
- [ ] Phát hành chiến dịch.
- [ ] Vào `/lookup?mssv=PS43995` → thấy ảnh chứng nhận.
- [ ] Quét QR → `/verify/[code]` → xác minh thấy ảnh.
- [ ] Re-run wizard với manifest sai (filename không match) → báo
      "không ghép được".

### 12.2 M10 — Google Drive nâng cao (OAuth direct upload)

**Mục tiêu**: Bỏ bước upload thủ công ở M9. Sau khi sinh PNG, hệ thống
tự upload trực tiếp lên Drive folder admin chọn.

#### Yêu cầu phụ trợ

- Google Cloud project (free tier).
- OAuth consent screen + scopes:
  - `https://www.googleapis.com/auth/drive.file` (chỉ truy cập file
    được tạo bởi app, an toàn nhất).
- API key cho Google Picker (optional).
- Domain verification cho `tracuuchungnhan-pdp.edu.vn` — Google verify
  qua DNS TXT.

#### Files dự kiến tạo

```
lib/google-drive/oauth.ts           — Google Identity Services flow
lib/google-drive/upload.ts          — multipart upload, retry, exp backoff
lib/google-drive/picker.ts          — Google Picker integration
components/admin/drive-folder-picker.tsx
components/admin/drive-upload-progress.tsx
app/api/drive/route.ts              — server endpoint trao đổi token (nếu cần refresh)
```

#### Flow UX

1. Trong `<GeneratorWizard>` thêm step 6 (sau khi sinh ZIP):
   "Upload trực tiếp lên Google Drive?"
2. Click → mở Google Identity popup, admin chọn account → grant
   `drive.file` scope.
3. Mở Google Picker, admin chọn folder.
4. Hệ thống upload từng PNG (multipart), update progress bar.
5. Mỗi upload thành công → set `drive_file_id` luôn (không cần manifest
   step).

#### Lưu ý về tokens

- Access token chỉ valid 1 giờ. Lưu vào sessionStorage là đủ cho 1
  phiên upload.
- Không lưu refresh token nếu không cần — request lại token mỗi lần
  admin vào upload.
- **Tuyệt đối không** lưu OAuth token vào Supabase / cookies HttpOnly
  trừ khi bắt buộc (rủi ro lộ key).

#### Backoff cho upload

- Drive API có quota 1000 requests/100s/user. Với 1000 cert, mỗi cert
  1 request → vừa đủ. Cần chunking và retry exponential backoff cho
  status 403 (rate limit) và 5xx.

#### Test plan M10

- [ ] OAuth grant lần đầu — popup hiện, admin chọn tài khoản.
- [ ] Picker chọn folder — folder ID lưu vào `<GeneratorWizard>` state.
- [ ] Upload 5 PNG — progress bar fill mượt.
- [ ] Verify Drive folder có 5 file.
- [ ] DB có 5 cert với `drive_file_id` set.
- [ ] Phát hành + lookup → thấy ảnh.

### 12.3 Backlog ưu tiên cao (sau M10)

- **Server-side reserve verification codes**: hiện wizard tạo codes
  client-side mỗi lần sinh → nếu admin sinh lại (sửa typo), QR mới ≠
  QR cũ đã in. Fix: trước khi render, gọi server action lấy hoặc
  generate code per `(campaign_id, student_code)`. Nếu cert đã tồn tại,
  reuse code cũ.
- **Quản lý hành động per-cert** (revoke đơn lẻ, gửi lại email link).
- **Audit trail xem lookup logs**.
- **Rate limit lookup** — IP-based với Upstash Redis hoặc Vercel KV
  free.

---

## 13. Known limitations & backlog

| #   | Vấn đề                                                             | Mức độ | Workaround                                    |
| --- | ------------------------------------------------------------------ | ------ | --------------------------------------------- |
| 1   | Verification codes regen mỗi lần sinh                              | Cao    | Đừng sinh lại sau khi đã in. Fix ở backlog.   |
| 2   | Public lookup chưa hiện ảnh                                        | Cao    | Cần M9 hoặc M10.                              |
| 3   | Generator chạy main thread — laptop cũ có thể giật với ≥ 2000 rows | TB     | Yield mỗi 5 rows. Worker migration ở backlog. |
| 4   | Không có errors.xlsx export                                        | Thấp   | Errors hiện trong wizard UI. Sau dễ thêm.     |
| 5   | Không có rate limit công khai                                      | TB     | Cloudflare ở Vercel pro hoặc Upstash KV.      |
| 6   | Không có 2FA cho admin                                             | TB     | Supabase Auth có hỗ trợ TOTP, chưa wire.      |
| 7   | Lookup chỉ MSSV, không có DOB/email backup                         | Thấp   | Theo decision §1 quyết định lookup MSSV-only. |
| 8   | Drive folder phải public-link để hiện ảnh                          | TB     | Cân nhắc proxy ảnh qua API server (M11).      |
| 9   | Edit cert lẻ trong admin chưa làm                                  | Thấp   | Sửa Excel + re-run generator → upsert.        |
| 10  | Test E2E (Playwright) chưa setup                                   | TB     | Manual test theo §9.                          |

---

## 14. Debugging & troubleshooting

### 14.1 Lỗi phổ biến

#### `pnpm dev` báo "Module not found: @/lib/..."

→ Kiểm tra `tsconfig.json` có `"@/*": ["./*"]` trong `paths`. Restart
TS server (`Cmd+Shift+P` → Restart TS).

#### `/admin` không redirect về `/login` mà trả 500

→ Thiếu env Supabase. Check `.env.local` có cả 3 biến NEXT*PUBLIC*\*.

#### Login đúng password nhưng vẫn ở `/login`

→ Cookie không set được. Kiểm tra `proxy.ts` có forward cookies đúng.
Hoặc `requireAdmin()` reject vì user chưa có role admin trong
`profiles`. Vào SQL editor check:

```sql
select id, role from public.profiles where id = (select id from auth.users where email = 'you@example.com');
```

#### Sinh batch 1000 cert rồi tab freeze

→ Yield interval đang là 5 (mỗi 5 row). Giảm xuống 2-3 trong
`generator-wizard.tsx:236`:

```ts
if (i % 3 === 2) {
  await new Promise((r) => setTimeout(r, 0));
}
```

Hoặc migrate sang Web Worker cho bài toán dài.

#### Manifest CSV mở Excel hiện chữ "ạtợ" thay vì "ạt ợ"

→ Excel cần BOM UTF-8. Đã thêm `\uFEFF` ở đầu CSV (xem
`buildManifestCsv()`). Nếu vẫn lỗi, kiểm tra Excel version (cần ≥ 2007).

#### Build Vercel fail "Module not found: 'qrcode'"

→ `qrcode` import là `import QRCode from "qrcode"`. Type pkg là
`@types/qrcode` (đã có trong devDependencies). Đảm bảo
`pnpm install --frozen-lockfile` chạy trên Vercel.

#### Search "nguyen van a" không tìm thấy dù có Nguyễn Văn A

→ `full_name_normalized` chưa được populate. Migration đã có
`generated always as`? Check `0001_init.sql`. Nếu schema cũ chưa có
generated column, manually:

```sql
update public.certificates
set full_name_normalized =
  upper(translate(unaccent(full_name), 'đĐ', 'dD'));
```

(Cần extension `unaccent`. Hoặc compute ở app code — đã làm trong
`saveCertificateBatch`.)

### 14.2 Khi cần xem RLS có hoạt động không

Vào Supabase → Settings → API → "Run as anon role" → query:

```sql
select * from public.certificates limit 1;
```

Phải trả 0 rows. Nếu trả ra data → RLS chưa bật, chạy lại
`0002_rls.sql`.

### 14.3 Cách reset DB sạch

**CHÚ Ý**: chỉ làm trên dev DB.

```sql
truncate table public.lookup_logs, public.import_batches,
  public.certificates, public.campaigns restart identity cascade;
```

Profiles và auth.users không truncate (cần để giữ admin login).

---

## 15. Triển khai

### 15.1 Vercel

1. <https://vercel.com> → New Project → import GitHub repo.
2. Framework preset: Next.js (auto-detected).
3. Build command: mặc định (`next build`).
4. Output: mặc định.
5. Environment Variables — copy từ `.env.local`, set cho cả
   Production + Preview + Development. **`SUPABASE_SERVICE_ROLE_KEY`
   đánh dấu Sensitive**.
6. Deploy.

### 15.2 Domain

- Mua/đăng ký `tracuuchungnhan-pdp.edu.vn` (hoặc tên đã chốt).
- Vercel → Settings → Domains → Add → nhập domain.
- Cấu hình DNS theo hướng dẫn Vercel:
  - `A 76.76.21.21` cho root, hoặc
  - `CNAME` cho subdomain.
- SSL tự động.

### 15.3 Supabase Auth — domain redirect

- Settings → Authentication → URL Configuration:
  - **Site URL**: `https://tracuuchungnhan-pdp.edu.vn`
  - **Redirect URLs**: thêm `https://tracuuchungnhan-pdp.edu.vn/**`
- Email templates → Vietnamese (tự dịch hoặc dùng template Supabase).

### 15.4 Sau khi deploy

- Sửa `NEXT_PUBLIC_SITE_URL` trong env Vercel cho khớp domain.
- Sửa `NEXT_PUBLIC_VERIFY_BASE_URL` cho khớp.
- Test lại `/lookup`, `/admin`, sinh thử 5 cert.

---

## 16. Tài liệu tham khảo

### 16.1 Trong repo

- `README.md` — quick start (setup local).
- `AGENTS.md` — note cho AI coding agent.
- `supabase/migrations/*.sql` — schema source of truth.
- `.env.example` — danh sách env cần thiết.

### 16.2 Bên ngoài

- Next.js 16 docs: <https://nextjs.org/docs>
  - **Quan trọng**: Next.js 16 có breaking changes vs 15. `middleware.ts`
    đổi tên thành `proxy.ts`. Đọc
    `node_modules/next/dist/docs/` trước khi viết code Next.js mới.
- Supabase RLS guide: <https://supabase.com/docs/guides/auth/row-level-security>
- Supabase SSR: <https://supabase.com/docs/guides/auth/server-side/nextjs>
- shadcn/ui: <https://ui.shadcn.com>
- Tailwind v4: <https://tailwindcss.com/docs/v4-beta>
- Zod: <https://zod.dev>
- Google Drive API (M10): <https://developers.google.com/drive/api/guides/about-files>
- Google Identity Services: <https://developers.google.com/identity/oauth2/web/guides/overview>

### 16.3 Liên hệ trong tổ chức

- Repo owner / business owner: PDP / FPT Polytechnic TP.HCM
- Trước khi đẩy thay đổi lớn (đổi schema, đổi domain, đổi auth),
  confirm với owner.

---

## Phụ lục A — Cheatsheet lệnh thường dùng

```bash
# Dev
pnpm dev                      # localhost:3000
pnpm typecheck                # tsc --noEmit
pnpm lint                     # eslint
pnpm format                   # prettier --write
pnpm format:check             # prettier --check
pnpm build                    # next build
pnpm start                    # serve build (sau khi pnpm build)

# Git
git checkout main
git pull origin main
git checkout -b devin/$(date +%s)-tinh-nang-moi
# ... edit ...
git add -A
git commit -m "M9: <thay đổi>"
git push -u origin HEAD
# Tạo PR qua GitHub UI hoặc gh cli

# Supabase types regen
supabase login
supabase gen types typescript --project-id <ref> > types/database.ts
```

## Phụ lục B — Test data mẫu

File Excel test:

```
| MSSV    | Họ và tên                   | Lớp     |
|---------|-----------------------------|---------|
| PS43995 | Nguyễn Văn A                | DH22    |
| PS43996 | Trần Thị Bình               | DH22    |
| PS43997 | Lê Hoàng Phương Thảo        | DH23    |
| PS43998 | Nguyễn Trần Lê Hoàng Linh   | DH23    | ← test fit 6 từ
| PS43999 | Phạm Đăng Đạt               | DH24    |
```

---

**Ngày bàn giao**: tài liệu này được viết ngay sau khi merge M8.

**Tác giả**: Devin (AI software engineer) phối hợp với arturogayedu264308.

Khi có thắc mắc, đọc lại §14 (debugging), kiểm tra issues trên repo,
hoặc liên hệ owner. Chúc bạn code vui.
