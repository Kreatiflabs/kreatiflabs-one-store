import { createClient } from "@libsql/client";

async function seed() {
  console.log("Seeding initial demo data for Kreatiflabs One Store...");
  
  const db = createClient({
    url: process.env.DATABASE_URL || "file:kreatiflabs.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  // Init tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon_url TEXT DEFAULT '',
      category TEXT DEFAULT 'Tools',
      short_desc TEXT DEFAULT '',
      description TEXT DEFAULT '',
      author TEXT DEFAULT 'Kreatiflabs',
      is_published INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      app_slug TEXT NOT NULL,
      platform TEXT NOT NULL,
      version TEXT NOT NULL,
      build_number INTEGER DEFAULT 1,
      download_url TEXT NOT NULL,
      manifest_url TEXT DEFAULT '',
      changelog TEXT DEFAULT '',
      file_size_bytes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      app_slug TEXT NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT DEFAULT '',
      order_index INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();

  // 1. Insert Sample App: Kreatif POS
  await db.execute({
    sql: `INSERT OR REPLACE INTO apps (id, slug, name, icon_url, category, short_desc, description, author, is_published, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "app_demo_1",
      "kreatif-pos",
      "Kreatif POS",
      "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=256&h=256&fit=crop&crop=faces",
      "Business",
      "Aplikasi kasir pintar dan manajemen inventaris modern untuk bisnis ritel & UMKM.",
      "Kreatif POS adalah solusi kasir (Point of Sale) modern yang dirancang untuk mempercepat transaksi, mengelola stok barang secara real-time, dan memantau laporan penjualan langsung dari smartphone atau tablet.\n\nFitur Utama:\n• Transaksi kasir kilat dengan dukungan scanner barcode\n• Manajemen stok dan multi-outlet terintegrasi\n• Cetak struk via printer thermal Bluetooth\n• Laporan laba/rugi harian dan bulanan\n• Mode offline otomatis saat jaringan internet terputus",
      "Kreatiflabs Studio",
      1,
      now,
      now,
    ],
  });

  // 2. Insert Sample App: Kreatif Workspace
  await db.execute({
    sql: `INSERT OR REPLACE INTO apps (id, slug, name, icon_url, category, short_desc, description, author, is_published, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "app_demo_2",
      "kreatif-workspace",
      "Kreatif Workspace",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&h=256&fit=crop",
      "Productivity",
      "Kolaborasi tim internal, task tracker, dan dokumentasi proyek dalam satu aplikasi cepat.",
      "Kreatif Workspace memudahkan tim internal berkoordinasi, melacak tugas harian, serta berbagi dokumen kerja dengan enkripsi end-to-end.",
      "Kreatiflabs Core",
      1,
      now,
      now,
    ],
  });

  // 3. Insert Releases
  await db.execute({
    sql: `INSERT OR REPLACE INTO releases (id, app_slug, platform, version, build_number, download_url, manifest_url, changelog, file_size_bytes, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "rel_demo_1",
      "kreatif-pos",
      "android",
      "1.2.0",
      12,
      "https://github.com/hpurnama/kreatiflabs-One-Store/releases/download/v1.2.0/app-release.apk",
      "",
      "• Peningkatan kecepatan cetak struk Bluetooth thermal\n• Perbaikan sinkronisasi offline data inventaris\n• Desain antarmuka kasir baru yang lebih responsif",
      28450123,
      "published",
      now,
    ],
  });

  await db.execute({
    sql: `INSERT OR REPLACE INTO releases (id, app_slug, platform, version, build_number, download_url, manifest_url, changelog, file_size_bytes, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "rel_demo_2",
      "kreatif-pos",
      "ios",
      "1.2.0",
      12,
      "https://github.com/hpurnama/kreatiflabs-One-Store/releases/download/v1.2.0/app-release.ipa",
      "",
      "• Rilis perdana iOS build internal\n• Dukungan Apple Pay & barcode scanner kamera",
      34567890,
      "published",
      now,
    ],
  });

  // 4. Insert Screenshots for Kreatif POS
  const sampleScreenshots = [
    {
      id: "ss_1",
      url: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&fit=crop",
      caption: "Dashboard Penjualan & Kasir",
      order: 0,
    },
    {
      id: "ss_2",
      url: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&fit=crop",
      caption: "Katalog Produk & Barcode Scanner",
      order: 1,
    },
    {
      id: "ss_3",
      url: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&fit=crop",
      caption: "Laporan Real-time Omset Harian",
      order: 2,
    },
  ];

  for (const ss of sampleScreenshots) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO screenshots (id, app_slug, image_url, caption, order_index, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [ss.id, "kreatif-pos", ss.url, ss.caption, ss.order, now],
    });
  }

  console.log("Seed data created successfully!");
}

seed().catch(console.error);
