# Pelancaran myKampung menggunakan domain dan cPanel

## Keputusan keserasian hosting semasa

Pengguna melaporkan versi tertinggi dalam **Setup Node.js App ialah 20.20.2**. Versi itu belum memenuhi keperluan projek ini: **Node.js 24 atau lebih baharu** dan modul terbina dalam `node:sqlite`. Jangan mencipta aplikasi menggunakan Node.js 20 untuk versi semasa myKampung. Menukar nombor `engines` dalam `package.json` tidak menyediakan API SQLite yang diperlukan.

**Application Manager ialah laluan alternatif yang perlu disahkan**, bukan jaminan versi Node.js yang lebih baharu. Ia mungkin menggunakan runtime berbeza daripada Node.js Selector. Penyedia hosting menentukan runtime dan konfigurasi Passenger. Langkah pemasangan di bawah hanya terpakai selepas keupayaan tersebut disahkan; ia belum diuji pada akaun cPanel sebenar pengguna.

| Keadaan | Laluan |
| --- | --- |
| Setup Node.js App menyediakan Node.js 24+ dan semua syarat storan/proses dipenuhi | Boleh membuat pemasangan percubaan melalui Node.js Selector. |
| Selector hanya menyediakan 20, tetapi penyedia boleh menyediakan Node.js 24+ melalui Application Manager | Gunakan Application Manager selepas mengesahkan binari Node, startup file dan had proses. |
| Kedua-duanya tidak boleh menjalankan Node.js 24+ | Minta naik taraf sokongan Node daripada penyedia. Jika tidak tersedia, tempatkan aplikasi pada pelayan Node.js 24 yang serasi; domain/DNS masih boleh diurus melalui cPanel. |

Syarat tambahan: storan SQLite setempat yang kekal, boleh ditulis, menyokong WAL/locking; **satu worker/instance aplikasi**, kerana sesi disimpan dalam memori; SSL; had muat naik sekurang-kurangnya 8 MiB untuk permintaan JSON berlampiran dan had lebih besar jika memulihkan sandaran JSON; akses menjalankan arahan Node serta tugas sandaran berjadual. Folder data dan sandaran tidak boleh menjadi fail awam.

## 1. Teks untuk dihantar kepada penyedia hosting

> Saya ingin menjalankan myKampung, aplikasi Node.js ES Modules yang memerlukan Node.js 24+ dan modul terbina dalam node:sqlite (DatabaseSync dan backup). Node.js Selector akaun saya hanya menawarkan sehingga 20.20.2. Adakah Node.js 24 boleh disediakan melalui Selector atau Application Manager? Saya juga perlukan Passenger dengan satu worker/instance, custom startup file passenger.cjs yang menggunakan dynamic import, environment variables, SQLite WAL pada storan setempat yang kekal di luar public_html, akses Terminal/SSH untuk persediaan dan Cron Jobs untuk sandaran. Sila sahkan laluan binari Node, cara restart, sokongan SSL dan had saiz permintaan sekurang-kurangnya 8 MiB. Adakah kitar semula proses atau had sumber hosting akan menamatkan sesi pengguna?

Jangan sertakan kata laluan cPanel, pangkalan data atau kunci rahsia dalam pertanyaan ini. Jika penyedia tidak membenarkan nama startup `.cjs`, minta mereka menetapkan startup CommonJS yang serasi; jangan menukar keseluruhan projek menjadi CommonJS atau menamakan semula fail secara cuba-cuba.

## 2. Semak versi dan keupayaan sebenar

Dalam **Setup Node.js App**, lihat pilihan **Node.js version**. Dalam **Application Manager**, semak runtime dengan penyedia kerana pilihan versi mungkin tidak dipaparkan. Node dalam Terminal lalai mungkin berbeza daripada Node yang digunakan oleh aplikasi.

Aktifkan persekitaran aplikasi menggunakan arahan yang diberikan hosting, atau gunakan laluan mutlak binari Node yang disahkan penyedia. Dalam folder projek:

```bash
node --version
node scripts/check-hosting.js
```

Kemudian uji lokasi data yang akan digunakan. Gantikan `CPANEL_USER` dengan nama pengguna sendiri:

```bash
DATA_DIR=/home/CPANEL_USER/private/mykampung-data node scripts/check-hosting.js
```

Skrip hanya mencipta dan membuang fail ujian sementara, bukan membuka atau mengubah `kampung.sqlite` sebenar. Ia menyemak versi, API SQLite, penulisan, JSON SQL dan WAL. Ia menolak DATA_DIR relatif atau dalam folder awam biasa. Keputusan lulus **tidak** mengesahkan DNS, SSL, konfigurasi Passenger, ketahanan storan atau bilangan worker; perkara tersebut masih memerlukan pengesahan hosting dan ujian sebenar. Jangan teruskan ke data sebenar jika skrip gagal.

## 3. Pilih subdomain dan sediakan folder

Gunakan subdomain khusus, contohnya **komuniti.domainanda.com**, supaya laman web dan e-mel sedia ada tidak terganggu. Gunakan akar URL `/` pada subdomain itu; pemasangan pada `/mykampung` di bawah laman sedia ada belum disokong kerana laluan aplikasi bermula dari akar.

Contoh susunan fail peribadi:

```text
/home/CPANEL_USER/apps/mykampung/             kod aplikasi
/home/CPANEL_USER/private/mykampung-data/     pangkalan data aktif
/home/CPANEL_USER/private/mykampung-backups/  sandaran penuh
```

Muat naik kod versi yang hendak diuji ke folder aplikasi, termasuk `public`, `scripts`, `package.json`, semua fail JavaScript dan `passenger.cjs`. Jangan muat naik data pengguna sebenar ke repositori GitHub atau folder awam. Jangan gantikan DATA_DIR setiap kali menaik taraf kod.

Cipta subdomain melalui antaramuka Domains cPanel dan tetapkan pemetaan aplikasi mengikut arahan penyedia. Hadkan kebenaran folder data/sandaran kepada akaun perkhidmatan yang menjalankan aplikasi (contoh 700 jika pemilikan membenarkan); fail sandaran sepatutnya 600. Jangan gunakan chmod 777. Pemilikan dan akses proses web perlu disahkan hosting.

## 4. Tetapan aplikasi selepas hosting disahkan serasi

Nama medan berbeza mengikut panel; sesuaikan dengan antaramuka yang tersedia:

| Tetapan | Nilai contoh |
| --- | --- |
| Node.js version/runtime | 24 atau lebih baharu, disahkan dengan binari aplikasi |
| Application mode | Production |
| Application root/path | `apps/mykampung`, relatif kepada direktori akaun jika panel memintanya |
| Application URL/deployment domain | `komuniti.domainanda.com` dengan akar `/` |
| Startup file | `passenger.cjs`, jika panel/penyedia menyokong konfigurasi ini |
| Bilangan worker/instance | 1 |

`passenger.cjs` ialah pembungkus CommonJS untuk memuatkan `server.js` ES Module. Ia diuji menggunakan Node biasa, **bukan jaminan keserasian setiap pemasangan Passenger**. Jika panel menolak fail tersebut, dapatkan bantuan penyedia. Jangan jalankan `npm start` secara manual sebagai proses kedua ketika Passenger sudah mengurus aplikasi. Tiada pakej npm tambahan diperlukan oleh versi semasa.

Tetapkan environment variables melalui antaramuka aplikasi, bukan menganggap `.env` dibaca secara automatik:

```dotenv
NODE_ENV=production
PUBLIC_ORIGIN=https://komuniti.domainanda.com
COOKIE_SECURE=1
DATA_DIR=/home/CPANEL_USER/private/mykampung-data
BACKUP_DIR=/home/CPANEL_USER/private/mykampung-backups
BACKUP_INTERVAL_HOURS=24
TRUST_PROXY=0
```

`TRUST_PROXY=0` ialah permulaan konservatif. Hanya tukar kepada `1` jika penyedia mengesahkan proxy yang dipercayai menggantikan header `X-Real-IP` dengan IP sebenar dan akses terus tidak boleh memintas proxy. Tanpanya, had IP mungkin dikongsi melalui IP proxy; had akaun masih berfungsi. Jangan mempercayai header IP yang boleh ditetapkan pengguna luar.

Jangan tetapkan PORT atau membuka port 3000 kepada umum untuk pemasangan Passenger tanpa arahan penyedia. Passenger mengurus pemetaan proses aplikasi. `PUBLIC_ORIGIN` mesti padan tepat dengan domain HTTPS yang dipilih, tanpa sublaluan. **2FA boleh kekal tidak aktif**; `MFA_ENCRYPTION_KEY` tidak diperlukan sehingga pengaktifan dirancang.

## 5. Akaun pertama atau pemindahan data laptop

Pilih satu laluan sahaja.

**Pemasangan baharu tanpa data:** dalam persekitaran Node aplikasi dan DATA_DIR yang sama, cipta akaun awal menggunakan skrip sedia ada. Contoh Bash Terminal; kata laluan tidak dimasukkan terus ke sejarah arahan:

```bash
read -rs -p 'Kata laluan pentadbir (minimum 12 aksara): ' ADMIN_PASSWORD
export ADMIN_PASSWORD
export DATA_DIR=/home/CPANEL_USER/private/mykampung-data
node scripts/bootstrap-admin.js
unset ADMIN_PASSWORD
```

Tetapkan DATA_DIR yang sama dalam panel, kemudian mulakan/restart aplikasi. Tiada kata laluan lalai dibekalkan.

**Memindahkan data sedia ada:** ambil **Sandaran penuh sistem (SQLite)** dari laptop. Muat naik melalui sambungan selamat ke folder peribadi. Hentikan aplikasi hosting semasa pemindahan. Jalankan pemulihan ke folder baharu yang **belum wujud**:

```bash
node scripts/restore-full.js --source /home/CPANEL_USER/private/migrasi.sqlite --destination /home/CPANEL_USER/private/mykampung-data-baharu
```

Skrip menyemak integriti dan menolak folder destinasi sedia ada. Selepas berjaya, tetapkan DATA_DIR aplikasi kepada folder baharu itu dan restart. Log masuk menggunakan akaun daripada sandaran; jangan cipta pentadbir baharu atau menukar ADMIN_PASSWORD untuk cuba menukar kata laluan sedia ada. Sandaran JSON bukan pemindahan lengkap akaun, sijil, resit dan sejarah.

Sahkan jumlah ahli, keluarga, bantuan, kematian, tuntutan, lampiran dan akaun. Jika 2FA diaktifkan pada masa hadapan, simpan serta pindahkan kunci pelayan secara berasingan mengikut PANDUAN-KESELAMATAN.md.

## 6. DNS dan SSL

Jika domain menggunakan DNS cPanel, tambah/kemas kini rekod A subdomain kepada IP yang diberikan hosting. Jika DNS diurus di tempat lain, ubah di penyedia DNS yang berkuasa. Sahkan rekod AAAA, jika ada, juga menuju pelayan yang betul. Kekalkan rekod e-mel MX/TXT dan rekod laman sedia ada.

Aktifkan SSL melalui kemudahan hosting/AutoSSL apabila domain menghala ke pelayan yang betul. Tunggu sijil sah sebelum menguji log masuk produksi. Pastikan HTTP dialihkan kepada HTTPS mengikut konfigurasi hosting. Gunakan domain HTTPS secara konsisten; kuki produksi tidak dihantar melalui HTTP.

Uji `https://komuniti.domainanda.com/healthz` dan halaman log masuk dari rangkaian luar. Laluan `/.env`, `/data/kampung.sqlite` dan `/backups/` tidak boleh memulangkan kandungan peribadi (401/403/404 boleh diterima, bukan fail data 200). Uji semua peranan dan muat naik sijil/resit. Jika ada 403 semasa menyimpan, semak padanan PUBLIC_ORIGIN dan log; jangan mematikan kawalan asal permintaan secara menyeluruh.

## 7. Sandaran dan operasi harian

Gunakan binari Node **yang sama** dengan aplikasi. Contoh arahan Cron Jobs harian, selepas menggantikan semua placeholder:

```text
0 2 * * * DATA_DIR=/home/CPANEL_USER/private/mykampung-data BACKUP_DIR=/home/CPANEL_USER/private/mykampung-backups BACKUP_KEEP=7 /LALUAN/NODE24 /home/CPANEL_USER/apps/mykampung/scripts/backup-full.js
```

Waktu 02:00 mengikut zon masa pelayan cron, bukan semestinya Malaysia. Minta penyedia menetapkan atau menerangkan zon masa dan laraskan jika perlu. Semak keputusan tugas, tarikh fail terakhir dan ruang cakera; simpan salinan berasingan daripada hosting. Jangan hanya bergantung pada sandaran dalam akaun yang sama. Uji pemulihan ke lokasi ujian secara berkala. Simpan log di lokasi peribadi tanpa kata laluan/rahsia.

Naik taraf: ambil sandaran penuh, hentikan aplikasi, kemas kini kod tanpa menggantikan data, restart dan jalankan semakan pengguna. Mula semula Passenger atau kitar semula proses menamatkan sesi dalam memori; pengguna perlu log masuk semula. Ini bukan bukti kehilangan data SQLite.

## Jika Node.js 24 tidak boleh disediakan

Gunakan pelayan lain yang menyokong Node.js 24 dan storan kekal, dengan satu instance. Repositori sudah mempunyai Docker Compose, Caddy/HTTPS dan servis sandaran; rujuk PANDUAN-DALAM-TALIAN.md. Domain boleh kekal diurus melalui cPanel dan subdomain A/AAAA diarahkan kepada pelayan baharu; tidak perlu memindahkan laman utama atau e-mel. Pastikan servis web pelayan baharu menerima trafik 80/443 dan DATA_DIR berada pada volume kekal. Jangan gunakan hosting statik atau storan sementara untuk SQLite.

Laluan ini memerlukan akses dan konfigurasi pelayan berasingan; dokumen ini tidak membeli hosting, mencipta domain, mengubah DNS atau menerbitkan data pengguna. Pemilihan pakej hanya perlu dibuat selepas penyedia semasa menjawab permintaan Node.js 24.

## Sumber teknikal rasmi

- [Application Manager cPanel: keperluan dan environment variables](https://docs.cpanel.net/cpanel/software/application-manager/)
- [Pemasangan dan custom startup Node.js dalam cPanel](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/)
- [CloudLinux Node.js Selector](https://docs.cloudlinux.com/cloudlinuxos/cloudlinux_os_components/#node-js-selector)
- [Node.js SQLite API](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)

Panduan ini menggabungkan syarat aplikasi yang disemak daripada kod dengan konfigurasi panel yang bergantung kepada penyedia. Tiada pengesahan langsung terhadap akaun hosting pengguna dilakukan.

Untuk memantau keputusan Cron Jobs, pastikan `BACKUP_DIR` aplikasi sepadan dengan folder sandaran cron. `BACKUP_INTERVAL_HOURS` ialah sela dijangka pada paparan; ia mesti sepadan dengan jadual sebenar dan tidak mencipta tugas cron. Rujuk [PANDUAN-STATUS-SANDARAN.md](PANDUAN-STATUS-SANDARAN.md).
