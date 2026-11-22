# Had pendapatan dan label Acc Asnaf

Pentadbir membuka **Pentadbiran → Tetapan sistem → Had pendapatan per kapita Asnaf**. Nilai awal ialah **RM350.00 seorang sebulan**. Masukkan had baharu dan kata laluan pentadbir semasa, kemudian pilih **Simpan had Asnaf**. Had boleh diubah tanpa mengubah kod atau memulakan semula pelayan. Nilai yang diterima ialah RM0.00 hingga RM99,999,999.99 dengan maksimum dua perpuluhan.

## Formula

**Purata per kapita = jumlah pendapatan bulanan penghuni yang dikira ÷ bilangan penghuni tersebut.**

- Ahli utama dikira sebagai seorang penghuni.
- Ahli keluarga dikira jika **Tinggal bersama ahli utama = Ya**.
- Keluarga yang tinggal berasingan tidak menyumbang pendapatan atau bilangan penghuni.
- Individu yang telah disahkan meninggal dunia melalui kelulusan rekod kematian dikecualikan. Jika ahli utama meninggal dunia, pengiraan menggunakan keluarga hidup yang tinggal bersama sehingga pertukaran ketua diuruskan.
- Gunakan medan **Pendapatan bulanan (RM)** setiap individu. Isi jumlah bulanan yang hendak diambil kira dalam medan tersebut. Amaun bantuan OKU yang disimpan berasingan tidak ditambah secara automatik, untuk mengelakkan kiraan berganda.

**Acc Asnaf** dipaparkan apabila purata **kurang daripada** had. Purata yang tepat sama dengan had tidak memenuhi formula ini. Perbandingan menggunakan jumlah pendapatan dalam sen dan bilangan penghuni sebelum pembundaran paparan.

| Jumlah pendapatan | Penghuni | Purata | Had | Label |
| --- | --- | --- | --- | --- |
| RM900.00 | 3 | RM300.00 | RM350.00 | Acc Asnaf |
| RM1,050.00 | 3 | RM350.00 | RM350.00 | Tidak memenuhi had Asnaf |
| RM1,050.00 | 3 | RM350.00 | RM400.00 | Acc Asnaf |

## Data belum lengkap

Pendapatan kosong atau tidak sah **tidak dianggap RM0**. Isi `0` jika individu memang tiada pendapatan, termasuk anak atau tanggungan yang tidak berpendapatan. Status tinggal bersama yang belum dinyatakan juga memerlukan semakan. Rekod keluarga tidak sah/berulang atau isi rumah tanpa penghuni hidup yang boleh dikira tidak dilabel sebagai Asnaf secara automatik.

Senarai **Ahli & isi rumah** memaparkan **Asnaf: Perlu semakan** bersama bilangan medan yang belum lengkap. Buka rekod ahli untuk melengkapkan maklumat. Perubahan profil Ahli yang masih menunggu kelulusan belum digunakan; pengiraan menggunakan maklumat rasmi yang telah disimpan/diluluskan.

## Kesan perubahan had

Selepas pentadbir menyimpan had, label dalam senarai yang dimuatkan pada pelayarnya dikemas kini. Pengguna lain membuka semula menu Ahli & isi rumah atau memuat semula aplikasi untuk mendapatkan pengiraan terkini. Pentadbir dan Petugas yang mempunyai akses Ahli boleh melihat label; **hanya Pentadbir** boleh membaca/mengubah tetapan had. Portal peribadi Ahli belum memaparkan label ini. Pentadbir boleh mendapatkan laporan dan eksport melalui menu Laporan seperti diterangkan di bawah.

Had ini terpakai kepada seluruh sistem. Ia ialah penanda formula komuniti; ia tidak meluluskan permohonan bantuan, bayaran khairat atau memindahkan wang. Menukar had tidak mengubah maklumat pendapatan, sejarah profil, rekod bantuan atau keputusan lama. Rekod tidak aktif masih boleh diperiksa dengan formula semasa apabila dipaparkan dalam senarai.

## Audit, pemasangan dan sandaran

Perubahan had direkodkan dalam sejarah tindakan bersama had sebelum/selepas. Kata laluan tidak dimasukkan ke dalam audit. Jika pentadbir lain sudah mengubah tetapan, sistem menolak simpanan menggunakan versi lama; pilih **Muat semula** dan semak nilai terkini dahulu.

Ambil **sandaran penuh SQLite** sebelum naik taraf. Kekalkan folder/volume data dan mulakan semula aplikasi. Jadual tetapan dicipta automatik dengan RM350.00 hanya jika belum wujud. Tetapan yang telah disimpan dikekalkan selepas mula semula dan disertakan dalam sandaran/pemulihan penuh. Eksport JSON ahli tidak membawa tetapan ini. 2FA boleh kekal tidak aktif.

## Penapis senarai ahli

Dalam **Ahli & isi rumah**, gunakan **Status Asnaf** untuk memilih Semua, Acc Asnaf, Tidak memenuhi had atau Perlu semakan. Penapis ini digabungkan dengan status aktif/tidak aktif dan carian nama, telefon atau alamat. Petugas yang mempunyai akses Ahli boleh menggunakan penapis ini. Buka semula menu untuk memuatkan pengiraan mengikut had serta profil terkini.

## Laporan, cetakan dan CSV

Pentadbir membuka **Pentadbiran → Laporan → Jenis laporan: Semakan Asnaf**. Pilih status Asnaf, status ahli/isi rumah, negeri, daerah, kod zon atau carian, kemudian jana laporan. Had semasa dipaparkan bersama masa laporan dijana; ringkasan memaparkan bilangan setiap status selepas penapis digunakan.

Setiap baris laporan menunjukkan ahli utama, telefon/alamat/zon, status Asnaf, bilangan penghuni yang dikira, jumlah pendapatan bulanan, purata per kapita, had serta maklumat yang memerlukan semakan. Rekod tidak lengkap mempunyai nilai pendapatan/purata kosong; ia tidak dieksport sebagai sifar. Formula dan pengecualian individu meninggal dunia sama seperti senarai ahli.

Gunakan **Cetak / PDF** untuk mencetak paparan atau memilih Simpan sebagai PDF dalam pelayar. Paparan/cetakan terhad kepada 500 rekod pertama; **Muat turun CSV** membawa semua rekod sepadan. CSV menyertakan had dan masa pengiraan UTC pada setiap baris. Cetakan memaparkan masa Malaysia. Laporan/CSV terhad kepada Pentadbir dan tindakan melihat/mengeksport diaudit.

Laporan ialah pengiraan pada masa dijana, bukan keputusan bantuan atau sejarah kelayakan yang dibekukan. CSV mengira semula menggunakan rekod rasmi semasa eksport. Jika had telah berubah sejak pratonton, eksport ditolak dengan arahan **Jana laporan semula** supaya had baharu tidak digunakan tanpa pengetahuan pengguna. Perubahan profil sejak pratonton juga boleh mengubah hasil eksport. Fail laporan mengandungi maklumat kewangan; simpan mengikut kawalan akses komuniti.
