# 🚀 Kreatiflabs One Store

Platform distribusi aplikasi mobile (APK Android & iOS) internal dan publik untuk ekosistem **Kreatiflabs**.

Didesain untuk beroperasi **100% GRATIS** tanpa biaya server maupun bandwidth:
* **Hosting Frontend & API**: [Vercel](https://vercel.com) (Free Tier)
* **Storage Binari (APK/IPA) & Screenshots**: [Cloudflare R2](https://developers.cloudflare.com/r2/) (10 GB Free Storage + **0 Bandwidth/Egress Fee**)
* **Database Metadata**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (5 GB Free Storage, 5 Juta Reads/Hari) atau SQLite lokal saat development.
* **CI/CD Build**: GitHub Actions (otomatis upload APK ke R2 & trigger webhook).

---

## 🏗️ Alur Kerja (Architecture)

1. **GitHub Actions**: Menjalankan build Android APK / iOS IPA.
2. **Cloudflare R2**: File APK/IPA di-upload via S3 API ke R2 (`s3://bucket/releases/app-name/v1.0.0/app-release.apk`).
3. **Webhook Trigger**: GitHub Actions mengirim HTTP POST ke `/api/webhook/release`.
4. **Halaman Admin (`/admin`)**:
   * Melihat build baru yang masuk (status *Draft*).
   * Upload screenshot langsung dari browser ke Cloudflare R2 via *Presigned URL*.
   * Mengatur ikon aplikasi, deskripsi, changelog, dan kategori.
   * Mengubah status menjadi **Published**.
5. **Halaman Publik (`/`)**: Pengguna mengunduh APK atau menginstal iOS langsung dengan kecepatan CDN Cloudflare.

---

## 🛠️ Setup & Menjalankan Lokal

### 1. Install Dependensi
```bash
pnpm install
```

### 2. Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi variabel Cloudflare kamu:
```env
# Cloudflare D1
CLOUDFLARE_ACCOUNT_ID="your_account_id"
CLOUDFLARE_D1_DATABASE_ID="your_d1_database_uuid"
CLOUDFLARE_API_TOKEN="your_token"

# Cloudflare R2
R2_ACCESS_KEY_ID="your_r2_access_key"
R2_SECRET_ACCESS_KEY="your_r2_secret_key"
R2_BUCKET_NAME="kreatiflabs-one-store"
R2_PUBLIC_URL="https://cdn.kreatiflabs.com"

# Webhook Secret
RELEASE_WEBHOOK_SECRET="rahasia-webhook-kamu"
```

> **Catatan saat Development Lokal:** Jika `CLOUDFLARE_D1_DATABASE_ID` belum diisi, aplikasi otomatis menggunakan SQLite lokal (`file:kreatiflabs.db`) tanpa error!

### 3. Jalankan Server Dev
```bash
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000) untuk melihat storefront, atau [http://localhost:3000/admin](http://localhost:3000/admin) untuk dashboard admin.

---

## ☁️ Menyiapkan Cloudflare D1 & R2

### 1. Buat Bucket R2 (Storage File & Screenshots)
1. Buka **Cloudflare Dashboard** $\rightarrow$ **R2 Object Storage** $\rightarrow$ **Create bucket**.
2. Beri nama bucket, misal: `kreatiflabs-one-store`.
3. Klik **Settings** $\rightarrow$ **Public Access** $\rightarrow$ Hubungkan ke Custom Domain (misal `cdn.kreatiflabs.com`) atau aktifkan `r2.dev subdomain`.
4. Buat **R2 API Token** (Permissions: *Object Read & Write*). Simpan Access Key ID dan Secret Access Key.

### 2. Buat Database D1
1. Buka **Cloudflare Dashboard** $\rightarrow$ **Storage & Databases** $\rightarrow$ **D1 SQL Database** $\rightarrow$ **Create database**.
2. Beri nama database, misal: `kreatiflabs-one-store-db`.
3. Salin **Database ID** ke env `CLOUDFLARE_D1_DATABASE_ID`.
4. Buat **API Token** Cloudflare dengan izin: `D1:Edit`.

---

## 🤖 GitHub Actions Workflow

Template workflow siap pakai tersedia di:
[`.github/workflows/build-and-upload-example.yml`](.github/workflows/build-and-upload-example.yml)

Cukup salin file tersebut ke repository aplikasi mobile kamu dan tambahkan secrets di GitHub Repository (`Settings` $\rightarrow$ `Secrets and variables` $\rightarrow$ `Actions`):
* `CLOUDFLARE_ACCOUNT_ID`
* `R2_ACCESS_KEY_ID`
* `R2_SECRET_ACCESS_KEY`
* `R2_BUCKET_NAME`
* `R2_PUBLIC_URL`
* `ONE_STORE_URL` (URL deploy Vercel kamu, misal `https://store.kreatiflabs.com`)
* `RELEASE_WEBHOOK_SECRET`
