# Aturan Kerja & Pedoman Interaksi (User Preferences & Directives)

## 1. Penanganan Looping & Tugas Macet (Anti-Looping / Stagnant Tasks)
- **Batalkan Jika Terjebak**: Jika suatu pekerjaan, proses, eksekusi perintah, atau subagent mengalami perulangan (looping) tanpa henti, tidak kunjung selesai, atau tidak menunjukkan perkembangan konkret, **segera batalkan (abort/cancel)**.
- **Laporkan & Evaluasi**: Jangan mengulang-ulang langkah yang sama jika sudah terbukti macet/gagal. Laporkan segera letak kendalanya kepada user beserta temuan yang ada, lalu tanyakan arah tindak lanjutnya.

## 2. Diskusi & Konfirmasi Prompt / Tugas (Prompt Review & Suggestions)
- **Diskusikan Sebelum Eksekusi**: Ketika user memberikan prompt atau instruksi pengerjaan sesuatu, luangkan waktu untuk menelaah dan mendiskusikannya terlebih dahulu sebelum melakukan eksekusi besar/perubahan kode.
- **Beri Saran & Masukan**: Jika ada kalimat atau instruksi pada prompt yang berpotensi membingungkan, ambigu, atau jika ada pendekatan/arsitektur yang lebih efektif, sampaikan saran, opsi, atau pertanyaan klarifikasi kepada user.
- **Konfirmasi Kesepahaman**: Pastikan tujuan, batasan, dan ekspektasi hasil sudah selaras antara agent dan user.
