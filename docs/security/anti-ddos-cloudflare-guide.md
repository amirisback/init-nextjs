# 🛡️ Panduan Konfigurasi Cloudflare Edge Anti-DDoS & WAF

Dokumentasi ini menjelaskan langkah-langkah mengaktifkan proteksi DDoS di level DNS/CDN (Edge Layer 3/4 dan Layer 7 Volumetric) menggunakan Cloudflare untuk melengkapi *In-App Rate Limiting* yang sudah aktif di aplikasi Next.js.

---

## 1. Arsitektur Pertahanan Berlapis (Defense in Depth)

```
                              [ INTERNET / TRAFFIC ]
                                         │
                                         ▼
                ┌──────────────────────────────────────────────────┐
                │             CLOUDFLARE EDGE NETWORK              │
                │  - Layer 3/4 DDoS Mitigation (SYN/UDP Flood)     │
                │  - Volumetric HTTP Flood Protection              │
                │  - Bot Fight Mode & Managed Challenge / Turnstile │
                │  - Edge WAF & Custom Rate Limiting Rules         │
                └────────────────────────┬─────────────────────────┘
                                         │ (Clean Traffic)
                                         ▼
                ┌──────────────────────────────────────────────────┐
                │          AMIR APP (NEXT.JS 16 SERVER)            │
                │  - src/proxy.ts: In-App Sliding Window Limiter   │
                │  - src/proxy.ts: Bad Scanner & Probe 403 Blocker │
                │  - next.config.ts: Hardened HTTP Security Headers │
                │  - Server Components & Business Logic            │
                └──────────────────────────────────────────────────┘
```

---

## 2. Langkah Setup Cloudflare (Free / Pro)

### Langkah 1: Aktifkan DNS Proxy (Orange Cloud ☁️)
1. Masuk ke Dashboard [Cloudflare](https://dash.cloudflare.com/).
2. Buka menu **DNS** -> **Records**.
3. Pastikan record domain (`@`) dan subdomain (`www`, `api`) memiliki status **Proxied** (ikon awan oranye ☁️).
4. *Keuntungan*: IP asli server (Origin Server) tersembunyi sepenuhnya dari publik.

---

### Langkah 2: Aktifkan Bot Fight Mode
1. Masuk ke menu **Security** -> **Bots**.
2. Aktifkan toggle **Bot Fight Mode**.
3. Cloudflare akan secara otomatis menantang (challenge) atau memblokir bot scraper berbahaya dan automated crawling tool yang tidak terverifikasi.

---

### Langkah 3: Konfigurasi Security Level
1. Masuk ke menu **Security** -> **Settings**.
2. **Security Level**: Set ke **Medium** (default) untuk trafik harian, atau **High** jika sedang mengalami anomali trafik.
3. **Challenge Passage**: Set ke **30 minutes** atau **1 hour** agar pengguna yang berhasil menyelesaikan challenge tidak terganggu berulang kali.

---

### Langkah 4: Aktifkan "Under Attack Mode" saat Serangan Terjadi
Jika server Anda mengalami serangan DDoS besar-besaran:
1. Buka dashboard Cloudflare untuk domain Anda.
2. Di halaman **Overview** atau **Quick Actions**, ubah status ke **"I'm Under Attack!"**.
3. Cloudflare akan menampilkan JavaScript challenge otomatis (5-second screen) kepada semua pengunjung baru sebelum trafik diteruskan ke server Anda, menghentikan 99.9% botnet flood.

---

### Langkah 5: Lindungi Origin Server (Direct IP Bypass Protection)
Agar penyerang tidak bisa langsung menyerang IP server Anda secara langsung (bypassing Cloudflare):
1. **Gunakan Firewall Server (UFW / AWS Security Group / Hetzner Firewall)**:
   - Hanya izinkan port 80/443 menerima request dari [Daftar IP Cloudflare](https://www.cloudflare.com/ips/).
2. **Aktifkan Cloudflare Authenticated Origin Pulls (AOP)** atau **Strict SSL**:
   - Menu **SSL/TLS** -> Pilih mode **Full (strict)**.

---

## 3. Checklist Verifikasi Keamanan

- [x] In-App Rate Limiting aktif di `src/proxy.ts` (120 req/min UI, 30 req/min API, 10 req/min Auth).
- [x] Probe blocker aktif untuk `.env`, `.git`, `wp-login.php`, traversal paths.
- [x] Malicious bot scanner filter aktif untuk `sqlmap`, `nikto`, `masscan`, dll.
- [x] HTTP Security Headers aktif di `next.config.ts` (HSTS, nosniff, SAMEORIGIN, no-powered-by).
- [ ] Cloudflare DNS Proxied (☁️) aktif pada domain produksi.
- [ ] Bot Fight Mode diaktifkan pada Cloudflare.
