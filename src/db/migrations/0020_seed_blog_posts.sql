-- 15 artikel edukasi awal, bersumber WHO, UNICEF, IDAI, CDC, dan AAP.
--
-- Ditulis sebagai migrasi, bukan skrip seed: image production tidak memuat
-- scripts/ maupun tsx, sementara migrasi sudah dijalankan otomatis saat container
-- start. Dihasilkan oleh scripts/build-blog-migration.mts — jangan disunting tangan.
--
-- ON CONFLICT (slug) DO NOTHING: aman diulang, dan tidak pernah menimpa artikel
-- yang sudah ada maupun suntingan admin.
--
-- cover_key menunjuk objek di R2. Sampulnya tampil bila bucket R2-nya sama dengan
-- yang dipakai saat sampul diunggah; bila tidak, artikelnya tetap masuk dan
-- sampulnya jatuh ke petak kategori berwarna.
INSERT INTO "blog_posts" ("slug", "title", "excerpt", "content_html", "category", "cover_key", "is_published") VALUES
  ('asi-eksklusif-enam-bulan', 'ASI Eksklusif 6 Bulan: Panduan WHO untuk Awal Hidup Terbaik Bayi', 'WHO menyarankan bayi disusui dalam 1 jam pertama setelah lahir, ASI eksklusif sampai 6 bulan, lalu lanjut menyusui hingga 2 tahun atau lebih sambil diberi MPASI.', '<p>Enam bulan pertama kehidupan menentukan banyak hal: daya tahan tubuh, pola pertumbuhan, bahkan risiko penyakit di usia dewasa. World Health Organization (WHO) merangkum praktik pemberian makan bayi terbaik dalam tiga langkah sederhana yang berlaku di seluruh dunia.</p>

<h2>Tiga Patokan Utama dari WHO</h2>
<p>WHO menganjurkan agar <strong>semua bayi mulai disusui dalam 1 jam pertama setelah lahir</strong>. Setelah itu, bayi sebaiknya mendapat <strong>ASI eksklusif selama 6 bulan pertama</strong> &amp;mdash; artinya hanya ASI, tanpa air, tanpa madu, tanpa pisang, tanpa susu formula, kecuali atas indikasi medis. Menyusui kemudian <strong>dilanjutkan sampai usia 2 tahun atau lebih</strong>, berdampingan dengan makanan pendamping.</p>
<p>Menyusui dini penting karena mendekatkan bayi pada kolostrum, cairan pertama yang keluar dari payudara dan kaya zat kekebalan. Kontak kulit ke kulit segera setelah lahir juga membantu refleks mengisap bayi muncul secara alami.</p>

<h2>Kapan MPASI Dimulai dan Seberapa Sering</h2>
<p>Sekitar usia 6 bulan, kebutuhan energi dan zat gizi bayi mulai melampaui apa yang bisa disediakan ASI sendirian. Di titik itulah makanan pendamping diperlukan. WHO memberi patokan frekuensi makan:</p>
<ul>
<li><strong>Usia 6&amp;ndash;8 bulan:</strong> 2&amp;ndash;3 kali makan per hari</li>
<li><strong>Usia 9&amp;ndash;23 bulan:</strong> 3&amp;ndash;4 kali makan per hari, ditambah 1&amp;ndash;2 kali selingan</li>
</ul>
<p>Perlu ditegaskan: MPASI bukan pengganti ASI, melainkan pelengkap. ASI tetap jadi sumber gizi dan zat kekebalan penting sepanjang tahun kedua.</p>

<h2>Mengapa Angka-Angka Ini Penting</h2>
<p>WHO mencatat bahwa secara global <strong>hanya sekitar 47% bayi usia 0&amp;ndash;6 bulan</strong> mendapat ASI eksklusif. Untuk kelompok usia 6&amp;ndash;23 bulan, <strong>kurang dari sepertiga (30,8%)</strong> memenuhi standar keragaman makanan minimum. Dampaknya besar: menurut WHO, praktik menyusui yang optimal berpotensi mencegah <strong>hampir 400.000 kematian anak di bawah 5 tahun setiap tahun</strong>.</p>
<p>Angka terakhir itu layak dibaca ulang. Menyusui bukan sekadar urusan selera atau kenyamanan keluarga &amp;mdash; ini intervensi kesehatan dengan dampak terukur pada kelangsungan hidup anak.</p>

<h2>Yang Bisa Dilakukan Keluarga</h2>
<p>Keberhasilan menyusui jarang ditentukan oleh ibu sendirian. Beberapa hal yang membantu:</p>
<ol>
<li>Minta petugas kesehatan memfasilitasi kontak kulit ke kulit dan menyusu segera setelah persalinan.</li>
<li>Rawat gabung ibu dan bayi di satu ruangan agar bisa menyusu kapan pun bayi mau.</li>
<li>Pastikan pelekatan mulut bayi benar sejak hari pertama &amp;mdash; pelekatan buruk adalah penyebab paling umum nyeri dan produksi ASI terasa kurang.</li>
<li>Hindari pemberian cairan atau makanan lain sebelum 6 bulan tanpa indikasi medis.</li>
<li>Dukung ibu dengan istirahat, makanan, dan bantuan pekerjaan rumah; ibu yang kelelahan lebih rentan berhenti menyusui lebih cepat.</li>
</ol>
<p>Untuk ibu dengan HIV, WHO memberi panduan terpisah: menyusui dianjurkan <strong>setidaknya 12 bulan dan dapat dilanjutkan hingga 24 bulan atau lebih</strong>, dengan pengobatan antiretroviral yang dijalani patuh. Keputusan ini selalu diambil bersama dokter.</p>

<blockquote><p>Jika ada keraguan tentang kecukupan ASI, periksakan ke tenaga kesehatan sebelum menambahkan susu formula. Banyak kasus &amp;quot;ASI kurang&amp;quot; sebenarnya masalah pelekatan atau frekuensi menyusu, bukan produksi.</p></blockquote>

<p>Rujukan lengkap dapat dibaca di <a href="https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding" target="_blank" rel="noopener noreferrer nofollow">lembar fakta WHO tentang pemberian makan bayi dan anak</a>.</p>', 'NUTRISI'::"public"."blog_category", 'blog/1e7a59be-6d5c-4917-8e9e-4908e6f057e9/1793329688275.jpg', true),
  ('porsi-dan-frekuensi-mpasi', 'Berapa Banyak MPASI untuk Bayi 6-11 Bulan? Patokan Porsi dari UNICEF', 'UNICEF memberi patokan praktis: setengah cangkir makanan lunak 2-3 kali sehari pada usia 6-8 bulan, naik menjadi 3-4 kali sehari pada usia 9-11 bulan, plus selingan sehat.', '<p>Pertanyaan yang paling sering muncul di awal MPASI bukan &amp;quot;apa&amp;quot;, tapi &amp;quot;seberapa banyak&amp;quot;. UNICEF menjawabnya dengan satuan yang mudah dipakai di dapur mana pun: cangkir.</p>

<h2>Patokan Porsi Menurut Usia</h2>
<p>Untuk bayi yang <strong>masih mendapat ASI</strong>, UNICEF memberi panduan berikut:</p>
<ul>
<li><strong>Usia 6&amp;ndash;8 bulan:</strong> setengah cangkir makanan lunak, <strong>2&amp;ndash;3 kali sehari</strong>, ditambah satu selingan sehat di antara waktu makan.</li>
<li><strong>Usia 9&amp;ndash;11 bulan:</strong> setengah cangkir makanan, <strong>3&amp;ndash;4 kali sehari</strong>, ditambah selingan sehat.</li>
</ul>
<p>Untuk bayi yang <strong>tidak mendapat ASI</strong>, porsinya berbeda karena tidak ada asupan dari menyusu:</p>
<ul>
<li><strong>Mulai usia 6 bulan:</strong> dua sampai tiga sendok makanan lunak dan lumat, <strong>empat kali sehari</strong>.</li>
<li><strong>Usia 6&amp;ndash;8 bulan:</strong> setengah cangkir, <strong>empat kali sehari</strong>, ditambah satu selingan.</li>
<li><strong>Usia 9&amp;ndash;11 bulan:</strong> setengah cangkir, <strong>empat sampai lima kali sehari</strong>, ditambah dua selingan.</li>
</ul>

<h2>Mengapa Porsi Kecil Tapi Sering</h2>
<p>Lambung bayi masih kecil, sementara kebutuhan energinya per kilogram berat badan jauh lebih tinggi daripada orang dewasa. Memberi porsi besar sekaligus biasanya berakhir dengan makanan tersisa dan bayi kelelahan. Sebaliknya, porsi kecil yang diulang beberapa kali sehari lebih mungkin habis dan lebih mudah dicerna.</p>
<p>Perhatikan juga bahwa satuan &amp;quot;setengah cangkir&amp;quot; mengacu pada makanan yang sudah padat gizi &amp;mdash; bukan bubur yang sangat cair. Makanan yang terlalu encer membuat volume terasa banyak tapi kandungan energinya rendah.</p>

<h2>Membangun Kebiasaan Makan, Bukan Hanya Mengisi Perut</h2>
<p>Angka porsi adalah titik awal, bukan target kaku. Beberapa prinsip praktis:</p>
<ol>
<li><strong>Ikuti isyarat bayi.</strong> Mulut terbuka dan tangan meraih makanan adalah tanda siap; memalingkan kepala dan mengatupkan mulut adalah tanda cukup.</li>
<li><strong>Jangan memaksa.</strong> Memaksa menyuapi sering memperburuk penolakan makan dalam jangka panjang.</li>
<li><strong>Tetap susui.</strong> ASI masih menyumbang porsi besar gizi bayi di tahun pertama.</li>
<li><strong>Tingkatkan tekstur bertahap.</strong> Dari lumat halus, ke lumat kasar, lalu makanan yang bisa dipegang sendiri.</li>
<li><strong>Beri waktu dan perhatian.</strong> Waktu makan tanpa gangguan layar membantu bayi mengenali rasa lapar dan kenyangnya sendiri.</li>
</ol>

<h2>Tanda Perlu Konsultasi</h2>
<p>Porsi yang konsisten jauh di bawah patokan selama berhari-hari, berat badan yang tidak naik, atau bayi yang tampak lemas perlu dibicarakan dengan tenaga kesehatan. Begitu pula penolakan makan yang disertai muntah berulang atau ruam setelah makanan tertentu.</p>

<blockquote><p>Catat apa yang dimakan bayi selama tiga hari sebelum berkonsultasi. Catatan sederhana ini jauh lebih berguna bagi dokter daripada ingatan samar tentang &amp;quot;makan sedikit&amp;quot;.</p></blockquote>

<p>Panduan lengkap tersedia di <a href="https://www.unicef.org/parenting/food-nutrition/feeding-your-baby-6-12-months" target="_blank" rel="noopener noreferrer nofollow">halaman UNICEF tentang memberi makan bayi 6&amp;ndash;12 bulan</a>.</p>', 'NUTRISI'::"public"."blog_category", 'blog/3353603e-8be1-405f-a867-1bb6ded501da/1793329680125.jpg', true),
  ('protein-hewani-dalam-mpasi', 'Protein Hewani dalam MPASI: Kunci Cegah Stunting Menurut IDAI', 'IDAI menegaskan bayi 6-24 bulan butuh sekitar 10-12 gram protein per hari, dan protein hewani seperti telur, ikan, dan daging lebih mudah diserap serta membawa zat besi heme, zink, dan vitamin B12.', '<p>Anak bisa makan banyak dan tetap berisiko stunting. Ikatan Dokter Anak Indonesia (IDAI) menyoroti satu penyebab yang sering terlewat: MPASI yang mengenyangkan tapi kurang protein hewani.</p>

<h2>Kebutuhan Protein Bayi 6&amp;ndash;24 Bulan</h2>
<p>IDAI menyebut bayi usia 6&amp;ndash;24 bulan membutuhkan <strong>sekitar 10&amp;ndash;12 gram protein per hari</strong>. Dalam ukuran dapur, jumlah itu kira-kira setara <strong>dua butir telur kecil</strong> atau <strong>empat sendok makan daging, ayam, atau ikan yang dihaluskan</strong>.</p>
<p>Jumlah ini tidak besar. Justru karena tidak besar, kegagalan memenuhinya sering tidak disadari &amp;mdash; terutama kalau isi mangkuk MPASI didominasi karbohidrat dan sayur.</p>

<h2>Mengapa Hewani, Bukan Sekadar Nabati</h2>
<p>Menurut IDAI, sumber protein hewani &amp;mdash; ikan, telur, ayam, daging, hati &amp;mdash; mengandung asam amino lengkap dan diserap tubuh lebih baik dibandingkan protein nabati. Selain protein, sumber hewani membawa tiga zat gizi yang sulit dipenuhi dari tumbuhan:</p>
<ul>
<li><strong>Zat besi heme</strong> &amp;mdash; bentuk zat besi yang mudah diserap, penting mencegah anemia dan mendukung pertumbuhan.</li>
<li><strong>Zink (seng)</strong> &amp;mdash; berperan pada daya tahan tubuh dan pertumbuhan.</li>
<li><strong>Vitamin B12</strong> &amp;mdash; dibutuhkan untuk pembentukan sel darah merah dan perkembangan otak, dan <em>hanya</em> terdapat pada sumber hewani.</li>
</ul>

<h2>Variasi Lebih Baik daripada Satu Jenis Saja</h2>
<p>IDAI mencatat bahwa anak yang mengonsumsi lebih dari satu jenis sumber protein hewani memiliki risiko stunting lebih rendah. Alasannya, tiap sumber punya kelebihan berbeda:</p>
<ul>
<li><strong>Ikan:</strong> omega-3 dan yodium, mendukung perkembangan otak.</li>
<li><strong>Daging:</strong> zat besi dan seng.</li>
<li><strong>Telur:</strong> kolin dan vitamin A, untuk otak dan mata.</li>
<li><strong>Susu:</strong> kalsium untuk tulang.</li>
</ul>
<p>IDAI juga mengutip bukti spesifik soal telur: pemberian <strong>satu butir telur setiap hari pada bayi usia 6&amp;ndash;9 bulan selama enam bulan</strong> dikaitkan dengan pertumbuhan yang lebih baik dan angka stunting yang lebih rendah.</p>

<h2>Jendela Kritis 6&amp;ndash;23 Bulan</h2>
<p>Rentang usia 6&amp;ndash;23 bulan adalah masa pertumbuhan paling cepat setelah masa bayi baru lahir. Jika kebutuhan protein dan zat gizi mikro tidak terpenuhi pada periode ini, risiko stunting meningkat &amp;mdash; meskipun anak tampak makan banyak. Mulai usia 6 bulan, ASI saja memang sudah tidak cukup; di situlah mutu MPASI menentukan.</p>

<h2>Langkah Praktis</h2>
<ol>
<li>Pastikan ada sumber protein hewani di <strong>setiap</strong> kali makan utama, bukan hanya sesekali.</li>
<li>Gilir jenisnya sepanjang minggu: telur, ikan, ayam, daging, hati.</li>
<li>Jangan sisihkan hati ayam atau ikan murah &amp;mdash; keduanya padat zat besi dan terjangkau.</li>
<li>Haluskan sesuai kemampuan bayi, tapi hindari mengencerkan sampai kandungan gizinya ikut turun.</li>
<li>Pantau berat dan panjang badan di posyandu atau fasilitas kesehatan secara rutin.</li>
</ol>

<blockquote><p>Protein hewani bukan kemewahan dalam MPASI. IDAI menempatkannya sebagai kebutuhan untuk pertumbuhan fisik maupun perkembangan otak.</p></blockquote>

<p>Artikel asli dapat dibaca di <a href="https://www.idai.or.id/artikel/seputar-kesehatan-anak/bukan-sekadar-kenyang-pentingnya-protein-hewani-dalam-mp-asi-untuk-cegah-stunting" target="_blank" rel="noopener noreferrer nofollow">situs IDAI</a>.</p>', 'NUTRISI'::"public"."blog_category", 'blog/70e7ff08-f74d-4c43-920b-0695e169e0a5/1793329681564.jpg', true),
  ('milestone-bayi-dua-bulan', 'Milestone Bayi 2 Bulan: Daftar Periksa Perkembangan dari CDC', 'CDC menyusun daftar milestone usia 2 bulan berdasarkan kemampuan yang sudah dikuasai 75% anak atau lebih, meliputi aspek sosial, bahasa, kognitif, dan gerak.', '<p>Membandingkan bayi dengan anak tetangga jarang membantu. Yang lebih berguna adalah daftar periksa yang disusun dari data: milestone yang sudah dikuasai mayoritas anak pada usia tertentu. Centers for Disease Control and Prevention (CDC) menyusun daftar seperti itu, dan dasarnya jelas &amp;mdash; <strong>kemampuan yang sudah bisa dilakukan 75% anak atau lebih</strong> pada usia tersebut.</p>

<h2>Yang Diperiksa pada Usia 2 Bulan</h2>
<p>CDC membagi milestone ke dalam empat ranah. Pada usia 2 bulan, daftarnya sebagai berikut.</p>

<h3>Sosial dan Emosional</h3>
<ul>
<li>Menjadi tenang ketika diajak bicara atau digendong</li>
<li>Menatap wajah Anda</li>
<li>Tampak senang saat Anda mendekat</li>
<li>Tersenyum ketika Anda mengajaknya bicara atau tersenyum padanya</li>
</ul>

<h3>Bahasa dan Komunikasi</h3>
<ul>
<li>Mengeluarkan suara selain tangisan</li>
<li>Bereaksi terhadap suara keras</li>
</ul>

<h3>Kognitif &amp;mdash; Belajar, Berpikir, Memecahkan Masalah</h3>
<ul>
<li>Memperhatikan Anda ketika Anda bergerak</li>
<li>Menatap sebuah benda atau mainan selama beberapa detik</li>
</ul>

<h3>Gerak dan Perkembangan Fisik</h3>
<ul>
<li>Mengangkat kepala saat ditengkurapkan</li>
<li>Menggerakkan kedua tangan dan kedua kaki</li>
<li>Membuka tangan sebentar</li>
</ul>

<h2>Cara Memakai Daftar Ini dengan Benar</h2>
<p>Daftar ini bukan ujian. Tujuannya membantu orang tua memperhatikan hal yang tepat dan punya bahan konkret saat berbicara dengan dokter. Ambang 75% berarti sebagian kecil anak yang sehat memang belum menguasai satu-dua butir pada usia pas &amp;mdash; tapi butir yang belum tercapai tetap layak dibicarakan, bukan diabaikan.</p>
<p>Beberapa cara memakainya:</p>
<ol>
<li>Amati bayi dalam kondisi terjaga dan tenang, bukan saat lapar atau mengantuk.</li>
<li>Catat apa yang <em>sudah</em> dan <em>belum</em> terlihat, lalu bawa catatan itu ke kunjungan kesehatan berikutnya.</li>
<li>Jika bayi lahir prematur, bicarakan dengan dokter soal penyesuaian usia dalam menilai milestone.</li>
<li>Perhatikan juga kemampuan yang <em>hilang</em> &amp;mdash; keterampilan yang sebelumnya ada lalu menghilang perlu segera dikonsultasikan.</li>
</ol>

<h2>Stimulasi Sederhana yang Mendukung</h2>
<p>Milestone usia 2 bulan hampir semuanya berkaitan dengan interaksi dan gerak dasar. Yang membantu bukan mainan mahal, tapi kehadiran:</p>
<ul>
<li><strong>Bicaralah dan tersenyumlah</strong> dari jarak dekat, agar bayi punya wajah untuk ditatap dan suara untuk ditanggapi.</li>
<li><strong>Tengkurapkan bayi saat terjaga dan diawasi</strong>, untuk melatih otot leher dan punggung.</li>
<li><strong>Gerakkan benda kontras perlahan</strong> di depan matanya agar ia melatih mengikuti gerak.</li>
<li><strong>Tanggapi suaranya.</strong> Ketika bayi bersuara dan Anda menjawab, ia belajar bahwa komunikasi itu bergantian.</li>
</ul>

<blockquote><p>Kalau ada satu pesan dari pendekatan CDC: bertindak lebih awal lebih baik daripada menunggu dan berharap. Bicarakan kekhawatiran apa pun dengan tenaga kesehatan, jangan tunda sampai kunjungan berikutnya.</p></blockquote>

<p>Daftar periksa lengkap untuk berbagai usia tersedia di <a href="https://www.cdc.gov/ncbddd/actearly/milestones/milestones-2mo.html" target="_blank" rel="noopener noreferrer nofollow">program Learn the Signs. Act Early. dari CDC</a>.</p>', 'TUMBUH_KEMBANG'::"public"."blog_category", 'blog/761c9987-626b-40f7-a150-5a9424c13fee/1793329682718.jpg', true),
  ('grafik-pertumbuhan-who', 'Memahami Grafik Pertumbuhan WHO: Indikator yang Dipantau dan Artinya', 'Standar pertumbuhan anak WHO mencakup panjang/tinggi-untuk-usia, berat-untuk-usia, berat-untuk-panjang, IMT-untuk-usia, dan lingkar kepala, serta disusun dari WHO Multicentre Growth Reference Study.', '<p>Setiap kali anak ditimbang di posyandu, angkanya diplot ke sebuah grafik. Grafik itu bukan sembarang kurva &amp;mdash; ia berasal dari <strong>WHO Child Growth Standards</strong>, yang dibangun dari data <em>WHO Multicentre Growth Reference Study</em>. Memahami isinya membuat orang tua bisa membaca pemantauan tumbuh anak, bukan hanya mendengar kesimpulannya.</p>

<h2>Indikator yang Dipantau</h2>
<p>WHO menyediakan standar untuk sejumlah indikator, di antaranya:</p>
<ul>
<li><strong>Panjang/tinggi badan untuk usia</strong> (length/height-for-age)</li>
<li><strong>Berat badan untuk usia</strong> (weight-for-age)</li>
<li><strong>Berat badan untuk panjang/tinggi badan</strong> (weight-for-length/height)</li>
<li><strong>Indeks massa tubuh untuk usia</strong> (BMI-for-age)</li>
<li><strong>Lingkar kepala untuk usia</strong> (head circumference-for-age)</li>
<li><strong>Lingkar lengan atas untuk usia</strong> (arm circumference-for-age)</li>
<li><strong>Tebal lipatan kulit</strong> subskapular dan trisep untuk usia</li>
<li><strong>Milestone perkembangan motorik</strong></li>
<li><strong>Kecepatan pertambahan</strong> berat badan, panjang badan, dan lingkar kepala (<em>velocity</em>)</li>
</ul>

<h2>Mengapa Lebih dari Satu Indikator</h2>
<p>Satu indikator saja mudah menyesatkan. Berat badan untuk usia, misalnya, tidak bisa membedakan anak yang pendek tapi proporsional dari anak yang tingginya normal tapi kurus. Karena itu beberapa indikator dibaca bersama-sama:</p>
<ul>
<li>Panjang/tinggi untuk usia menggambarkan pertumbuhan jangka panjang.</li>
<li>Berat untuk panjang/tinggi menggambarkan kondisi gizi saat ini.</li>
<li>Lingkar kepala memberi petunjuk tentang pertumbuhan otak.</li>
</ul>
<p>Indikator <em>velocity</em> &amp;mdash; kecepatan pertambahan &amp;mdash; penting karena menilai arah, bukan hanya posisi. Anak yang masih berada di rentang normal tapi kurvanya mendatar perlu perhatian lebih cepat daripada anak yang posisinya rendah namun naik stabil.</p>

<h2>Cara Membaca Kurva Anak Sendiri</h2>
<ol>
<li><strong>Perhatikan arah, bukan satu titik.</strong> Satu pengukuran hanya potret sesaat; rangkaian pengukuran menunjukkan pola.</li>
<li><strong>Ukur dengan cara yang konsisten.</strong> Bayi di bawah 2 tahun diukur panjang badan dalam posisi berbaring; setelah itu tinggi badan berdiri. Mencampur keduanya menciptakan lompatan palsu pada grafik.</li>
<li><strong>Ukur di jadwal teratur.</strong> Interval yang tidak beraturan membuat tren sulit dinilai.</li>
<li><strong>Bawa buku pemantauan setiap kunjungan</strong> agar riwayatnya utuh di satu tempat.</li>
</ol>

<h2>Dari Mana Standar Ini Datang</h2>
<p>WHO menyebut bahwa standar ini dikembangkan menggunakan data dari WHO Multicentre Growth Reference Study, dengan laporan teknis yang diterbitkan pada rentang 2006&amp;ndash;2009 yang mendokumentasikan pemilihan sampel dan metode penyusunannya. Sebelumnya, pada 1993, WHO melakukan tinjauan menyeluruh atas penggunaan dan interpretasi rujukan antropometri, yang kemudian menjadi dasar penyusunan standar baru.</p>
<p>Perbedaan penting: ini adalah <em>standar</em>, bukan sekadar <em>referensi</em>. Artinya kurva ini menggambarkan bagaimana anak <strong>seharusnya</strong> tumbuh pada kondisi gizi dan kesehatan yang baik &amp;mdash; bukan rata-rata populasi apa adanya.</p>

<blockquote><p>Grafik pertumbuhan adalah alat deteksi dini, bukan rapor. Nilai utamanya terletak pada pengukuran yang dilakukan berulang dan tepat waktu.</p></blockquote>

<p>Tabel dan perangkat lengkapnya tersedia di <a href="https://www.who.int/tools/child-growth-standards/standards" target="_blank" rel="noopener noreferrer nofollow">halaman WHO Child Growth Standards</a>.</p>', 'TUMBUH_KEMBANG'::"public"."blog_category", 'blog/5a266041-0328-47e1-8ec4-61b84a095a11/1793329683373.jpg', true),
  ('jadwal-imunisasi-anak-cdc', 'Jadwal Imunisasi Anak Usia 0-6 Tahun Menurut CDC', 'CDC merinci jadwal vaksin dari lahir sampai usia 6 tahun: hepatitis B, rotavirus, DTaP, Hib, pneumokokus, polio, influenza, MMR, varisela, dan hepatitis A, lengkap dengan usia tiap dosis.', '<p>Jadwal imunisasi terlihat rumit karena beberapa vaksin diberikan bersamaan dan beberapa butuh beberapa dosis. CDC menyusunnya dalam format yang mudah dibaca untuk rentang lahir sampai usia 6 tahun. Berikut rinciannya.</p>

<h2>Vaksin dan Usia Pemberian</h2>
<ul>
<li><strong>Hepatitis B:</strong> dosis 1 saat lahir, dosis 2 pada usia 1&amp;ndash;2 bulan, dosis 3 pada usia 6 bulan.</li>
<li><strong>Rotavirus:</strong> dosis 1 pada usia 2 bulan, dosis 2 pada 4 bulan, dosis 3 pada 6 bulan.</li>
<li><strong>DTaP (difteri, tetanus, pertusis):</strong> dosis 1&amp;ndash;3 pada usia 2, 4, dan 6 bulan; dosis 4 pada usia 15&amp;ndash;18 bulan; dosis 5 pada usia 4&amp;ndash;6 tahun.</li>
<li><strong>Hib (<em>Haemophilus influenzae</em> tipe b):</strong> dosis 1&amp;ndash;3 pada usia 2, 4, dan 6 bulan; dosis 4 pada usia 12&amp;ndash;15 bulan.</li>
<li><strong>Pneumokokus:</strong> dosis 1&amp;ndash;3 pada usia 2, 4, dan 6 bulan; dosis 4 pada usia 12&amp;ndash;15 bulan.</li>
<li><strong>Polio:</strong> dosis 1 pada 2 bulan, dosis 2 pada 4 bulan, dosis 3 pada usia 6&amp;ndash;18 bulan, dosis 4 pada usia 4&amp;ndash;6 tahun.</li>
<li><strong>Influenza:</strong> mulai usia 6 bulan; dua dosis pada tahun pertama pemberian, lalu setiap tahun.</li>
<li><strong>MMR (campak, gondongan, rubela):</strong> dosis 1 pada usia 12&amp;ndash;15 bulan, dosis 2 pada usia 4&amp;ndash;6 tahun.</li>
<li><strong>Varisela (cacar air):</strong> dosis 1 pada usia 12&amp;ndash;15 bulan, dosis 2 pada usia 4&amp;ndash;6 tahun.</li>
<li><strong>Hepatitis A:</strong> mulai usia 12 bulan, dua dosis berjarak 6 bulan.</li>
<li><strong>Antibodi RSV:</strong> saat lahir (bergantung status ibu) atau pada usia 1&amp;ndash;2 bulan (bergantung kondisi anak).</li>
<li><strong>COVID-19:</strong> jadwal bergantung produk yang dipakai &amp;mdash; tanyakan ke tenaga kesehatan.</li>
</ul>

<h2>Pola yang Perlu Dikenali</h2>
<p>Dari daftar di atas terlihat tiga pola:</p>
<ol>
<li><strong>Kelompok 2-4-6 bulan.</strong> Banyak vaksin diberikan serentak pada tiga kunjungan ini. Inilah alasan satu kunjungan bisa berisi beberapa suntikan.</li>
<li><strong>Penguat di 12&amp;ndash;18 bulan.</strong> Hib, pneumokokus, DTaP, MMR, dan varisela punya dosis di rentang ini.</li>
<li><strong>Penguat sebelum sekolah di 4&amp;ndash;6 tahun.</strong> DTaP, polio, MMR, dan varisela dilengkapi sebelum anak masuk sekolah.</li>
</ol>
<p>Jadwal ini adalah acuan CDC untuk Amerika Serikat. Di Indonesia, program imunisasi nasional dijalankan Kemenkes dan rekomendasi profesional dikeluarkan IDAI; jenis dan usianya mirip tapi tidak identik. Gunakan jadwal yang berlaku di tempat anak Anda tinggal dan pastikan dicatat di buku imunisasi.</p>

<h2>Kalau Ada Dosis yang Terlewat</h2>
<p>Dosis yang terlambat tidak berarti harus dimulai dari awal. Tenaga kesehatan dapat menyusun jadwal menyusul (<em>catch-up</em>) sesuai usia anak saat ini. Yang penting: segera jadwalkan, jangan menunggu.</p>

<blockquote><p>Bawa buku imunisasi setiap kunjungan kesehatan. Catatan yang lengkap mencegah dosis ganda maupun dosis yang terlupakan.</p></blockquote>

<p>Jadwal versi mudah dibaca dapat dilihat di <a href="https://www.cdc.gov/vaccines/imz-schedules/child-easyread.html" target="_blank" rel="noopener noreferrer nofollow">halaman jadwal imunisasi anak CDC</a>.</p>', 'IMUNISASI'::"public"."blog_category", 'blog/61764e38-735e-461d-9cdf-1908233675aa/1793329895212.jpg', true),
  ('kipi-efek-samping-vaksin', 'KIPI: Efek Samping Vaksin yang Umum dan yang Perlu Diwaspadai', 'Menurut CDC, efek samping vaksin umumnya ringan seperti nyeri di lokasi suntikan, demam, dan lelah, yang hilang dalam beberapa hari; reaksi berat sangat jarang.', '<p>Kejadian Ikutan Pasca Imunisasi (KIPI) adalah hal yang wajar ditanyakan sebelum anak divaksin. CDC merangkum apa yang biasa terjadi, berapa lama berlangsung, dan kapan perlu mencari bantuan.</p>

<h2>Efek Samping yang Umum</h2>
<p>Untuk sebagian besar vaksin, CDC menyebut efek samping berikut sebagai yang paling sering:</p>
<ul>
<li>Nyeri, kemerahan, atau bengkak di lokasi suntikan</li>
<li>Demam</li>
<li>Sakit kepala</li>
<li>Rasa lelah</li>
<li>Nyeri otot</li>
<li>Mual</li>
</ul>
<p>Soal durasi, CDC menyatakan reaksi ini <strong>biasanya hilang dalam beberapa hari</strong> &amp;mdash; untuk sebagian besar kasus sekitar <strong>2&amp;ndash;3 hari</strong>. Reaksi semacam ini tidak memerlukan pengobatan khusus dan umumnya mereda sendiri.</p>
<p>Secara biologis, reaksi ringan seperti ini menunjukkan sistem kekebalan sedang bekerja menanggapi vaksin. Tidak munculnya reaksi juga bukan tanda vaksin gagal.</p>

<h2>Reaksi Berat: Jarang, Tapi Perlu Dikenali</h2>
<p>CDC menyebut kemungkinan reaksi alergi berat setelah vaksinasi sebagai <em>kemungkinan yang sangat kecil</em>. Beberapa reaksi serius yang dikaitkan dengan vaksin tertentu:</p>
<ul>
<li><strong>Kejang</strong> &amp;mdash; dikaitkan dengan DTaP, MMR, MMRV, varisela, dan PCV.</li>
<li><strong>Sindrom Guillain-Barr&amp;eacute;</strong> &amp;mdash; dikaitkan dengan vaksin influenza, demam kuning, dan herpes zoster.</li>
<li><strong>Intususepsi setelah vaksin rotavirus</strong> &amp;mdash; CDC menyebut angka <strong>1 dari 20.000 sampai 1 dari 100.000 bayi di Amerika Serikat</strong>.</li>
</ul>
<p>Angka terakhir berguna sebagai pembanding. Risiko intususepsi berada pada kisaran satu per puluhan ribu, sementara diare rotavirus yang dicegahnya adalah penyebab rawat inap yang jauh lebih sering pada bayi.</p>

<h2>Yang Perlu Dilakukan Setelah Imunisasi</h2>
<ol>
<li><strong>Tunggu di fasilitas kesehatan</strong> beberapa saat setelah suntikan sesuai arahan petugas, agar reaksi cepat dapat ditangani di tempat.</li>
<li><strong>Amati reaksi biasa</strong> &amp;mdash; nyeri di lokasi suntikan, demam ringan, anak lebih rewel atau lebih banyak tidur. Semua ini umumnya mereda sendiri.</li>
<li><strong>Segera cari bantuan medis</strong> jika setelah suntikan muncul pusing, perubahan penglihatan, atau telinga berdenging.</li>
<li><strong>Laporkan reaksi berat.</strong> Di Amerika Serikat pelaporan dilakukan melalui VAERS; di Indonesia, laporkan ke fasilitas kesehatan tempat imunisasi diberikan agar tercatat dalam sistem surveilans KIPI.</li>
</ol>

<h2>Menimbang Risiko dengan Benar</h2>
<p>CDC menekankan bahwa vaksin dipantau keamanannya secara berkelanjutan setelah beredar, bukan hanya sebelum disetujui. Pemantauan inilah yang memungkinkan angka kejadian langka seperti intususepsi diketahui dan dikomunikasikan.</p>

<blockquote><p>Jika anak pernah mengalami reaksi alergi berat setelah vaksin tertentu, informasikan kepada tenaga kesehatan sebelum imunisasi berikutnya. Riwayat ini mengubah pertimbangan pemberian dosis selanjutnya.</p></blockquote>

<p>Keterangan resmi tersedia di <a href="https://www.cdc.gov/vaccines/basics/possible-side-effects.html" target="_blank" rel="noopener noreferrer nofollow">halaman CDC tentang kemungkinan efek samping vaksin</a>.</p>', 'IMUNISASI'::"public"."blog_category", 'blog/91720eec-b0b8-4f21-a899-253fa45fdf31/1793329895952.jpg', true),
  ('imunisasi-terlambat-dan-perlunya-ulangan', 'Imunisasi Terlambat: Masih Boleh Dilanjutkan, dan Mengapa Ulangan Diperlukan', 'IDAI menegaskan imunisasi yang terlambat boleh dilanjutkan dan tidak berbahaya, serta menjelaskan mengapa imunisasi ulangan diperlukan karena kekebalan dari masa bayi bisa menurun.', '<p>Dua kekhawatiran paling sering muncul soal jadwal imunisasi: &amp;quot;sudah terlambat, apa masih boleh?&amp;quot; dan &amp;quot;sudah divaksin saat bayi, kenapa harus diulang?&amp;quot; IDAI menjawab keduanya dalam tanya jawab resminya.</p>

<h2>Terlambat Bukan Alasan untuk Berhenti</h2>
<p>IDAI menyatakan imunisasi yang tidak sesuai jadwal <strong>boleh diberikan dan tidak berbahaya</strong>. Alasannya lugas: anak yang belum mendapat imunisasi sesuai jadwal berarti <em>belum memiliki kekebalan</em> terhadap penyakit tersebut. Kekhawatiran justru pada periode tanpa perlindungan, bukan pada pemberian yang menyusul.</p>
<p>Kesimpulan praktisnya: jika ada dosis yang terlewat, segera konsultasikan ke tenaga kesehatan untuk melengkapi. Jangan menunggu usia &amp;quot;pas&amp;quot; berikutnya.</p>

<h2>Mengapa Perlu Imunisasi Ulangan</h2>
<p>Kekebalan dari imunisasi masa bayi tidak selalu bertahan seumur hidup. IDAI memberi dua contoh konkret:</p>
<ul>
<li><strong>Campak.</strong> IDAI menyebut pada umur 5&amp;ndash;7 tahun masih dijumpai <strong>28,3%</strong> anak terkena campak meskipun sudah mendapat vaksinasi saat bayi. Inilah dasar pemberian imunisasi campak ulangan.</li>
<li><strong>Difteri.</strong> Pada usia di atas 10 tahun masih banyak dijumpai kasus difteri, sehingga penguat pada kelompok usia ini tetap relevan.</li>
</ul>
<p>Untuk tetanus, IDAI menyebut rangkaian <strong>5 kali suntikan tetanus toksoid sejak bayi sampai dewasa</strong>, yang memberi perlindungan sekitar <strong>20 tahun</strong> pada usia dewasa.</p>

<h2>Imunisasi Ulangan di Sekolah</h2>
<p>IDAI merinci pemberian imunisasi ulangan melalui jalur sekolah:</p>
<ul>
<li><strong>Kelas 1 SD:</strong> campak dan DT</li>
<li><strong>Kelas 2, 3, dan 6:</strong> TT (tetanus toksoid)</li>
</ul>
<p>Program di sekolah ini penting diketahui orang tua agar tidak dianggap duplikasi yang tidak perlu. Catat setiap pemberian di buku imunisasi anak.</p>

<h2>Bayi Lahir Prematur</h2>
<p>Pertanyaan soal bayi prematur juga dijawab IDAI. Untuk bayi prematur, pemberian <strong>polio oral, DTP, hepatitis B, dan Hib</strong> disebutkan diberikan setelah usia 2 bulan. Keputusan tetap dibuat bersama dokter yang merawat, dengan mempertimbangkan kondisi dan berat badan bayi.</p>

<h2>Yang Sebaiknya Dilakukan Orang Tua</h2>
<ol>
<li><strong>Simpan buku imunisasi</strong> dan bawa ke setiap kunjungan kesehatan maupun program sekolah.</li>
<li><strong>Periksa kelengkapan secara berkala</strong>, jangan hanya saat ada jadwal.</li>
<li><strong>Kalau ada yang terlewat, jadwalkan menyusul</strong> &amp;mdash; bukan dimulai dari nol, melainkan dilanjutkan sesuai penilaian tenaga kesehatan.</li>
<li><strong>Jangan lewatkan imunisasi ulangan</strong> hanya karena anak sudah pernah divaksin saat bayi.</li>
</ol>

<blockquote><p>Imunisasi yang tertunda masih bisa diselamatkan. Yang tidak bisa dipulihkan adalah penyakit yang sempat menyerang selama masa tanpa perlindungan.</p></blockquote>

<p><em>Catatan: artikel IDAI ini membahas prinsip jadwal dan imunisasi ulangan. Untuk tabel jadwal terbaru per jenis vaksin, rujuk rekomendasi jadwal imunisasi IDAI edisi terkini dan program imunisasi rutin Kemenkes.</em> Sumber: <a href="https://www.idai.or.id/artikel/klinik/imunisasi/tanya-jawab-jadwal-imunisasi" target="_blank" rel="noopener noreferrer nofollow">Tanya Jawab Jadwal Imunisasi &amp;mdash; IDAI</a>.</p>', 'IMUNISASI'::"public"."blog_category", 'blog/3bfd1771-3f9c-4a66-a031-6e626d13dc2c/1793329896417.jpg', true),
  ('demam-pada-bayi-kapan-ke-dokter', 'Demam pada Bayi: Batas Suhu dan Kapan Harus Hubungi Dokter', 'Suhu rektal 38 derajat Celsius atau lebih sudah disebut demam. AAP menyarankan bayi di bawah 3 bulan dengan demam apa pun segera dihubungkan ke dokter.', '<p>Demam pada bayi menakutkan karena sulit dinilai dari penampilan. American Academy of Pediatrics (AAP) memberi batas angka yang jelas, dan batas itu berbeda menurut usia bayi.</p>

<h2>Batas Suhu Menurut Usia</h2>
<p>Suhu rektal <strong>38&amp;deg;C (100,4&amp;deg;F) atau lebih</strong> sudah termasuk demam. Kapan harus menghubungi dokter:</p>
<ul>
<li><strong>Di bawah 3 bulan:</strong> hubungi dokter <strong>segera</strong> untuk demam apa pun sejak 38&amp;deg;C (100,4&amp;deg;F).</li>
<li><strong>Usia 3&amp;ndash;6 bulan:</strong> hubungi dokter jika suhu mencapai <strong>38,3&amp;deg;C (101&amp;deg;F)</strong> atau lebih.</li>
<li><strong>Di atas 6 bulan:</strong> hubungi dokter jika suhu mencapai <strong>39,4&amp;deg;C (103&amp;deg;F)</strong> atau lebih.</li>
</ul>
<p>Mengapa bayi di bawah 3 bulan diperlakukan berbeda? Pada usia itu tanda infeksi serius bisa sangat samar, dan demam mungkin satu-satunya petunjuk. Ambangnya karena itu dibuat paling ketat.</p>

<h2>Cara Mengukur yang Benar</h2>
<p>AAP menyebut pengukuran rektal sebagai yang <strong>paling dapat diandalkan dan paling akurat untuk bayi, terutama di bawah 3 bulan</strong>. Beberapa catatan penting:</p>
<ul>
<li><strong>Termometer telinga tidak dianjurkan di bawah 6 bulan</strong> karena saluran telinga bayi masih terlalu kecil.</li>
<li><strong>Jangan mengandalkan rabaan tangan</strong> atau strip demam yang ditempel di dahi.</li>
<li>Catat angka dan waktu pengukuran &amp;mdash; informasi ini berguna saat berbicara dengan dokter.</li>
</ul>

<h2>Penyebab Demam dan Hal yang Sering Disalahpahami</h2>
<p>Demam adalah gejala, bukan penyakit. AAP menyebut berbagai penyebab: infeksi telinga, batuk pilek, infeksi saluran kemih, infeksi tenggorokan, sinus, dan saluran cerna, RSV, croup, influenza, pneumonia, sepsis, serta meningitis.</p>
<p>Satu kesalahpahaman umum: <strong>tumbuh gigi tidak menyebabkan demam sejati</strong>. Kenaikan suhu akibat tumbuh gigi masih berada dalam rentang normal. Jika suhu melewati 100,3&amp;deg;F, AAP menyarankan untuk berkonsultasi ke dokter dan tidak menganggapnya sekadar efek tumbuh gigi.</p>

<h2>Kejang Demam</h2>
<p>Kejang demam terjadi pada anak usia <strong>6 bulan sampai 5 tahun</strong>. AAP menyebut kejang jenis ini <strong>biasanya berlangsung kurang dari 1 menit</strong> dan umumnya tidak berbahaya. Meski demikian, hubungi layanan gawat darurat jika anak tidak bernapas atau kejang berlangsung <strong>lebih dari 15 menit</strong>.</p>
<p>Saat kejang terjadi, baringkan anak menyamping di permukaan aman, jangan memasukkan apa pun ke mulutnya, dan catat lama kejang.</p>

<h2>Soal Obat Penurun Panas</h2>
<p>Artikel AAP ini tidak mencantumkan dosis parasetamol atau ibuprofen, dan menyerahkan pengaturan obat kepada dokter anak. Jangan menebak dosis dari ukuran sendok rumah tangga &amp;mdash; dosis obat penurun panas pada bayi dihitung berdasarkan berat badan. Tanyakan dosis yang tepat kepada tenaga kesehatan dan gunakan alat ukur yang disertakan bersama obat.</p>

<blockquote><p>Pada bayi di bawah 3 bulan, demam bukan hal yang ditunggu perkembangannya. Hubungi dokter pada hari yang sama.</p></blockquote>

<p>Sumber: <a href="https://www.healthychildren.org/English/health-issues/conditions/fever/Pages/Fever-and-Your-Baby.aspx" target="_blank" rel="noopener noreferrer nofollow">Fever and Your Baby &amp;mdash; HealthyChildren.org (AAP)</a>.</p>', 'KESEHATAN'::"public"."blog_category", 'blog/8b37fa67-b6b6-4005-965c-7489a04cbc53/1793329685843.jpg', true),
  ('diare-anak-oralit-dan-zinc', 'Diare pada Anak: Oralit dan Zinc Sesuai Panduan WHO', 'WHO mendefinisikan diare sebagai 3 kali atau lebih tinja cair per hari. Zinc menurunkan durasi diare 25 persen dan diberikan sebagai suplementasi 10-14 hari bersama oralit.', '<p>Diare masih menjadi salah satu penyebab kematian anak terbesar di dunia, padahal penanganan dasarnya murah dan sederhana. WHO mencatat <strong>443.832 kematian pada anak di bawah 5 tahun</strong> akibat penyakit diare, dan <strong>50.851 kematian pada anak usia 5&amp;ndash;9 tahun</strong>.</p>

<h2>Apa yang Disebut Diare</h2>
<p>WHO mendefinisikan diare sebagai <strong>keluarnya 3 kali atau lebih tinja lunak atau cair per hari</strong>, atau lebih sering dibandingkan kebiasaan normal orang tersebut. Definisi terakhir ini penting: bayi yang hanya mendapat ASI memang sering berak lunak, dan itu belum tentu diare.</p>
<p>WHO membedakan beberapa jenis:</p>
<ul>
<li><strong>Diare cair akut</strong> &amp;mdash; berlangsung beberapa jam sampai beberapa hari; termasuk kolera.</li>
<li><strong>Diare berdarah (disentri)</strong>.</li>
<li><strong>Diare persisten</strong> &amp;mdash; berlangsung <strong>14 hari atau lebih</strong>.</li>
</ul>
<p>Beban globalnya besar: WHO menyebut hampir <strong>1,7 miliar kasus diare pada anak setiap tahun</strong>, dan anak di bawah 3 tahun di negara berpenghasilan rendah rata-rata mengalami <strong>3 episode per tahun</strong>.</p>

<h2>Dua Tulang Punggung Pengobatan</h2>
<h3>Oralit</h3>
<p>Oralit adalah campuran air bersih, garam, dan gula. WHO menyebut biayanya hanya beberapa sen per dosis. Fungsinya mengganti cairan dan elektrolit yang hilang &amp;mdash; dehidrasi, bukan kumannya, yang paling sering membunuh pada diare akut.</p>

<h3>Zinc</h3>
<p>Zinc bekerja melengkapi oralit. Menurut WHO, zinc <strong>menurunkan durasi diare sebesar 25%</strong> dan <strong>mengurangi volume tinja sebesar 30%</strong>. WHO menyebut pemberiannya sebagai <strong>suplementasi selama 10&amp;ndash;14 hari</strong>.</p>
<p>Perhatikan: zinc tetap diteruskan sampai 10&amp;ndash;14 hari meskipun diare sudah berhenti lebih cepat. Ini bagian yang paling sering tidak diselesaikan keluarga.</p>

<h2>Pencegahan</h2>
<p>WHO menyebut langkah-langkah berikut:</p>
<ol>
<li>Akses ke air minum yang aman</li>
<li>Sanitasi yang layak</li>
<li>Mencuci tangan dengan sabun</li>
<li><strong>ASI eksklusif selama 6 bulan pertama</strong></li>
<li>Kebersihan diri dan kebersihan makanan yang baik</li>
<li>Edukasi kesehatan tentang cara penularan infeksi</li>
<li><strong>Vaksinasi rotavirus</strong></li>
</ol>
<p>Daftar ini memberi gambaran jelas: diare adalah masalah air, sanitasi, dan perilaku &amp;mdash; bukan hanya masalah obat.</p>

<h2>Yang Dilakukan di Rumah</h2>
<p>Teruskan menyusui dan memberi makan selama anak diare. Berikan oralit sesuai anjuran tenaga kesehatan, sedikit-sedikit tapi sering. Jangan memberikan obat antidiare pada anak tanpa petunjuk dokter.</p>

<blockquote><p>Segera bawa anak ke fasilitas kesehatan jika ada tinja berdarah, tidak mau minum, muntah terus-menerus, lemas atau sulit dibangunkan, mata terlihat sangat cekung, atau diare berlanjut lebih dari dua minggu.</p></blockquote>

<p>Sumber: <a href="https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease" target="_blank" rel="noopener noreferrer nofollow">lembar fakta WHO tentang penyakit diare</a>.</p>', 'KESEHATAN'::"public"."blog_category", 'blog/e83f925b-7158-48a6-890d-4b5c62eb5ecc/1793329686211.jpg', true),
  ('stunting-dan-1000-hari-pertama', 'Stunting, Wasting, dan Pentingnya 1000 Hari Pertama Kehidupan', 'WHO mendefinisikan stunting, wasting, dan underweight sebagai ukuran lebih dari dua simpangan baku di bawah median standar pertumbuhan, dan menyebut 1000 hari dari konsepsi hingga ulang tahun kedua sebagai jendela kritis.', '<p>Istilah stunting sering dipakai tanpa definisi yang jelas. WHO memberi batasan teknisnya, dan batasan itu menjelaskan mengapa stunting berbeda dari sekadar &amp;quot;anak pendek&amp;quot; atau &amp;quot;anak kurus&amp;quot;.</p>

<h2>Tiga Istilah, Tiga Makna Berbeda</h2>
<ul>
<li><strong>Stunting</strong> &amp;mdash; tinggi badan rendah untuk usianya. WHO menyebutnya akibat kekurangan gizi kronis atau berulang, umumnya terkait kondisi sosial ekonomi yang buruk, kesehatan dan gizi ibu yang tidak memadai, sering sakit, atau praktik pemberian makan bayi dan anak yang tidak tepat pada awal kehidupan.</li>
<li><strong>Wasting</strong> &amp;mdash; berat badan rendah untuk tinggi badannya. Ini menandakan kehilangan berat badan yang baru terjadi dan berat, akibat kurang makan atau penyakit infeksi seperti diare. Anak dengan wasting sedang maupun berat punya risiko kematian lebih tinggi, tapi responsnya terhadap pengobatan baik.</li>
<li><strong>Underweight</strong> &amp;mdash; berat badan rendah untuk usianya. Anak dengan kondisi ini bisa mengalami stunting, wasting, atau keduanya.</li>
</ul>
<p>Ambang teknisnya sama untuk ketiganya: <strong>pengukuran lebih dari dua simpangan baku di bawah median standar pertumbuhan WHO</strong>.</p>

<h2>Skala Masalahnya</h2>
<p>WHO mencatat angka pada anak di bawah 5 tahun tahun 2022:</p>
<ul>
<li><strong>Stunting: 149 juta anak</strong></li>
<li><strong>Wasting: 45 juta anak</strong></li>
<li><strong>Kelebihan berat badan atau obesitas: 37 juta anak</strong></li>
</ul>
<p>WHO juga menyebut bahwa <strong>hampir 50% kematian anak di bawah 5 tahun</strong> di negara berpenghasilan rendah dan menengah terkait dengan kekurangan gizi.</p>

<h2>Jendela 1000 Hari</h2>
<p>WHO menyoroti <strong>1000 hari dari masa konsepsi sampai ulang tahun kedua anak</strong> sebagai periode yang memberi hasil gizi terbaik dengan manfaat jangka panjang. Dampak stunting bukan hanya pada tinggi badan &amp;mdash; WHO menyatakan stunting menghambat anak mencapai potensi fisik dan kognitifnya.</p>
<p>Implikasi praktisnya: intervensi paling efektif dimulai sebelum anak lahir, melalui gizi dan kesehatan ibu selama kehamilan, lalu berlanjut ke menyusui dan mutu MPASI.</p>

<h2>Apa yang Bisa Dilakukan</h2>
<ol>
<li><strong>Perhatikan gizi ibu sejak kehamilan</strong>, bukan hanya setelah bayi lahir.</li>
<li><strong>Menyusui sejak dini dan secara eksklusif</strong> pada 6 bulan pertama.</li>
<li><strong>Beri MPASI yang padat gizi</strong> mulai usia 6 bulan, dengan sumber protein hewani di setiap kali makan utama.</li>
<li><strong>Cegah dan tangani infeksi berulang</strong>, terutama diare &amp;mdash; sakit berulang adalah salah satu jalur menuju stunting.</li>
<li><strong>Ukur panjang/tinggi badan secara teratur</strong>, bukan hanya berat badan. Stunting hanya terlihat jika tinggi badan diukur dan diplot pada grafik.</li>
</ol>

<blockquote><p>Stunting terbentuk perlahan dan baru terlihat ketika sudah berlangsung lama. Karena itu pemantauan pertumbuhan yang rutin lebih penting daripada menunggu anak tampak pendek.</p></blockquote>

<p>Sumber: <a href="https://www.who.int/news-room/fact-sheets/detail/malnutrition" target="_blank" rel="noopener noreferrer nofollow">lembar fakta WHO tentang malnutrisi</a>.</p>', 'KESEHATAN'::"public"."blog_category", 'blog/8e709a89-587d-4b57-8a87-b493446de133/1793329686775.jpg', true),
  ('tidur-aman-bayi', 'Tidur Aman Bayi: Rekomendasi AAP untuk Menurunkan Risiko SIDS', 'AAP menganjurkan bayi selalu ditidurkan telentang di permukaan datar dan keras, serta berbagi kamar tanpa berbagi tempat tidur setidaknya 6 bulan pertama, yang menurunkan risiko SIDS sekitar separuh.', '<p>Kematian bayi terkait tidur adalah jenis kematian yang paling bisa dicegah lewat perubahan kebiasaan sederhana. AAP menyebut sekitar <strong>3.500 kematian bayi terkait tidur setiap tahun di Amerika Serikat</strong>. Kebijakan AAP 2022 merangkum langkah-langkah yang menurunkan risiko itu.</p>

<h2>Aturan Dasar</h2>
<h3>Selalu Telentang</h3>
<p>AAP menyatakan bayi harus <strong>selalu ditidurkan dalam posisi telentang</strong>, baik untuk tidur siang maupun tidur malam. Bukan menyamping, bukan tengkurap.</p>

<h3>Permukaan Tidur</h3>
<ul>
<li><strong>Keras dan datar</strong> &amp;mdash; tanpa kemiringan lebih dari 10 derajat.</li>
<li>Gunakan tempat tidur bayi, bassinet, tempat tidur bayi portabel, atau <em>play yard</em> yang memenuhi standar keamanan.</li>
<li><strong>Hanya sprei yang terpasang kencang.</strong> Tanpa bantal, selimut, pelindung pinggir (<em>bumper</em>), atau mainan.</li>
</ul>

<h3>Berbagi Kamar, Bukan Berbagi Tempat Tidur</h3>
<p>AAP menganjurkan bayi tidur di kamar orang tua pada permukaan tidurnya sendiri <strong>setidaknya selama 6 bulan pertama</strong>. AAP menyebut berbagi kamar <strong>menurunkan risiko SIDS sekitar 50%</strong>.</p>
<p>Sebaliknya, berbagi tempat tidur tidak dianjurkan. Angka risiko yang disebut AAP:</p>
<ul>
<li>Tidur bersama bayi di sofa atau kursi berlapis empuk: risiko <strong>67 kali lebih tinggi</strong>.</li>
<li>Berbagi tempat tidur pada bayi <strong>di bawah 4 bulan</strong>: risiko <strong>5&amp;ndash;10 kali lebih tinggi</strong>.</li>
<li>Berbagi tempat tidur disertai penggunaan alkohol atau zat lain: risiko <strong>10 kali lebih tinggi</strong>.</li>
</ul>

<h2>Suhu dan Bedong</h2>
<p>Untuk mencegah kepanasan, AAP menyebut bayi cukup memakai <strong>satu lapis lebih banyak</strong> daripada yang dipakai pengasuhnya. Lepas topi di dalam ruangan setelah pulang dari rumah sakit. Periksa tanda kepanasan: berkeringat, dada terasa panas, atau kulit memerah.</p>
<p>Soal bedong, AAP menyebut agar <strong>berhenti membedong ketika bayi mulai menunjukkan usaha berguling</strong> &amp;mdash; umumnya pada usia <strong>3&amp;ndash;4 bulan</strong>, tapi bisa lebih awal.</p>

<h2>Faktor Pendukung Lain</h2>
<ol>
<li><strong>Menyusui</strong> &amp;mdash; AAP menyebut menyusui berapa lama pun bermanfaat, idealnya sebagai sumber tunggal selama 6 bulan.</li>
<li><strong>Empeng saat tidur siang dan tidur malam</strong> &amp;mdash; bagi bayi yang menyusu, mantapkan menyusui lebih dulu.</li>
<li><strong>Tummy time saat terjaga dan diawasi</strong> &amp;mdash; AAP menyebut 15&amp;ndash;30 menit per hari pada usia 7 minggu.</li>
<li><strong>Datang ke semua kunjungan kesehatan anak</strong> dan lengkapi imunisasi.</li>
<li><strong>Tanpa asap</strong> &amp;mdash; tidak merokok, mengisap vape, atau menggunakan zat selama kehamilan dan setelah bayi lahir.</li>
<li><strong>Perawatan kehamilan yang teratur.</strong></li>
</ol>

<blockquote><p>Pastikan semua pengasuh &amp;mdash; nenek, kakek, pengasuh harian, siapa pun yang menidurkan bayi &amp;mdash; tahu aturan telentang dan tempat tidur bersih. Satu kali tidur di tempat yang tidak aman sudah cukup berisiko.</p></blockquote>

<p>Sumber: <a href="https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx" target="_blank" rel="noopener noreferrer nofollow">A Parent&#39;s Guide to Safe Sleep &amp;mdash; HealthyChildren.org (AAP)</a>.</p>', 'PERAWATAN'::"public"."blog_category", 'blog/20aa854f-301f-4f1a-9d8e-0c6d19b9f2dc/1793329898370.jpg', true),
  ('perawatan-tali-pusat-bayi', 'Perawatan Tali Pusat: Cukup Dijaga Bersih dan Kering', 'Menurut AAP, sisa tali pusat akan mengering dan lepas sendiri saat bayi berusia 3 minggu. Tidak perlu alkohol, cukup dijaga bersih, dan segera periksakan bila ada tanda infeksi.', '<p>Perawatan tali pusat sering dibuat lebih rumit daripada seharusnya. Panduan AAP singkat: jaga bersih, biarkan kering, dan jangan diberi macam-macam.</p>

<h2>Berapa Lama Sampai Lepas</h2>
<p>AAP menyatakan sisa tali pusat <strong>seharusnya mengering dan lepas pada saat bayi berusia 3 minggu</strong>. Jika masih menempel melewati waktu itu, perlu diperiksakan ke dokter.</p>

<h2>Cara Merawat</h2>
<ul>
<li><strong>Tidak perlu alkohol.</strong> AAP menyebut cukup dijaga kebersihannya.</li>
<li><strong>Lipat popok di bawah tali pusat</strong> agar tidak terkena air kencing.</li>
<li>Biarkan area tersebut terbuka terhadap udara sehingga lebih cepat kering.</li>
</ul>
<p>Prinsipnya bersih dan kering. Membubuhkan ramuan, bedak, atau apa pun ke pangkal tali pusat justru menambah risiko infeksi.</p>

<h2>Tanda Infeksi: Hubungi Dokter Anak</h2>
<p>AAP menyebut hubungi dokter anak jika muncul:</p>
<ul>
<li><strong>Cairan kekuningan berbau tidak enak</strong> dari tali pusat</li>
<li><strong>Kulit kemerahan</strong> di sekitar pangkal tali pusat</li>
<li><strong>Bayi menangis</strong> ketika tali pusat atau kulit di sebelahnya disentuh</li>
</ul>
<p>Ketiga tanda ini menunjukkan kemungkinan infeksi dan tidak boleh ditunggu. Infeksi pada area ini bisa menyebar cepat pada bayi baru lahir.</p>

<h2>Perdarahan Saat Lepas</h2>
<p>Beberapa tetes darah di popok saat tali pusat lepas adalah hal normal. Namun perdarahan yang aktif &amp;mdash; darah yang terus keluar &amp;mdash; perlu dihubungi ke dokter <strong>segera</strong>.</p>

<h2>Granuloma dan Hernia Umbilikalis</h2>
<p>Setelah tali pusat lepas, kadang terbentuk <strong>granuloma</strong>: jaringan kemerahan kecil di pusar. AAP menyebut kondisi ini biasanya hilang dalam <strong>sekitar satu minggu</strong>; jika bertahan, dokter anak dapat melakukan kauterisasi.</p>
<p>Hal lain yang sering mengkhawatirkan orang tua adalah <strong>hernia umbilikalis</strong> &amp;mdash; pusar yang menonjol ketika bayi menangis. AAP menyebut kondisi ini <strong>biasanya sembuh sendiri dalam 12 sampai 18 bulan pertama</strong>. Pembedahan hanya dipertimbangkan jika belum menutup pada <strong>usia 3&amp;ndash;5 tahun</strong>.</p>
<p>Satu peringatan tegas dari AAP: <strong>jangan menempelkan plester atau koin</strong> pada pusar yang menonjol. Praktik ini tidak membantu penutupan dan dapat melukai kulit bayi.</p>

<h2>Ringkasan Praktis</h2>
<ol>
<li>Cuci tangan sebelum menyentuh area tali pusat.</li>
<li>Jaga kering; lipat popok di bawahnya.</li>
<li>Jangan menarik atau mempercepat pelepasan tali pusat.</li>
<li>Jangan membubuhkan apa pun ke pangkalnya.</li>
<li>Periksa setiap hari untuk kemerahan, cairan berbau, atau nyeri saat disentuh.</li>
</ol>

<blockquote><p>Perawatan tali pusat yang baik hampir seluruhnya soal tidak melakukan apa-apa yang berlebihan &amp;mdash; selain mengamati dan menjaga kebersihan.</p></blockquote>

<p>Sumber: <a href="https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/Umbilical-Cord-Care.aspx" target="_blank" rel="noopener noreferrer nofollow">Umbilical Cord Care &amp;mdash; HealthyChildren.org (AAP)</a>.</p>', 'PERAWATAN'::"public"."blog_category", 'blog/a8bda831-6b5e-45e1-9f8d-9a381e68cee3/1793329898780.jpg', true),
  ('tiga-langkah-asi-eksklusif', 'Tiga Langkah Menuju ASI Eksklusif Menurut IDAI', 'IDAI merangkum keberhasilan ASI eksklusif dalam tiga langkah: keyakinan, teknik menyusui yang benar, dan pemantauan. Tanda ASI cukup antara lain bayi berkemih minimal 6 kali sehari.', '<p>Banyak ibu berhenti menyusui bukan karena ASI tidak cukup, tapi karena tidak tahu cara menilai apakah ASI cukup. IDAI menyusun jalannya dalam tiga langkah berurutan.</p>

<h2>Langkah 1: Keyakinan</h2>
<p>IDAI menempatkan keyakinan sebagai langkah pertama, bukan sebagai motivasi kosong. ASI mengandung zat gizi yang mudah dicerna dan zat kekebalan yang tidak bisa didapat dari sumber lain, serta mendukung pertumbuhan pada dua tahun pertama yang kritis.</p>
<p>Manfaatnya juga menyentuh ibu dan keluarga. IDAI menyebut menyusui memberi efek kontrasepsi alami, membantu pemulihan rahim lebih cepat, dan meningkatkan daya tahan tubuh ibu. Bagi keluarga, menyusui lebih hemat, tidak perlu peralatan penyiapan, dan menurunkan risiko infeksi pada bayi.</p>

<h2>Langkah 2: Teknik</h2>
<h3>Kondisi Ibu dan Bayi</h3>
<p>Ibu perlu cukup istirahat dan percaya diri; bayi perlu sehat dan dalam keadaan terjaga. Ibu yang kelelahan atau cemas akan jauh lebih sulit menyusui dengan nyaman.</p>

<h3>Inisiasi Menyusu Dini dan Rawat Gabung</h3>
<p>IDAI menyebut kontak kulit ke kulit <strong>minimal 1 jam setelah lahir</strong>. Rawat gabung &amp;mdash; ibu dan bayi di satu ruangan &amp;mdash; memungkinkan bayi disusui kapan pun ia mau.</p>

<h3>Posisi dan Pelekatan</h3>
<p>Dekatkan bayi, badannya lurus menghadap ke dada ibu. Rangsang refleks mengisap dengan sentuhan di sudut bibir. IDAI menekankan agar <strong>area kehitaman di sekitar puting (areola) dimasukkan sebanyak-banyaknya ke dalam mulut bayi</strong> &amp;mdash; bukan hanya putingnya.</p>
<p>Tanda pelekatan yang benar menurut IDAI:</p>
<ul>
<li>Mulut bayi terbuka lebar</li>
<li>Bibir terlipat keluar</li>
<li>Isapan lambat dengan pipi membulat</li>
</ul>
<p>Pelekatan yang keliru adalah penyebab paling umum nyeri puting dan kesan &amp;quot;ASI kurang&amp;quot;.</p>

<h2>Langkah 3: Pemantauan dan Peralihan</h2>
<h3>Tanda ASI Cukup</h3>
<ul>
<li>Bayi <strong>berkemih minimal 6 kali sehari</strong></li>
<li>Kenaikan berat badan sesuai usianya</li>
</ul>
<p>Dua tanda ini jauh lebih bisa dipercaya daripada perasaan payudara terasa kosong atau bayi yang sering menyusu. Bayi memang menyusu sering &amp;mdash; itu normal, bukan tanda kekurangan.</p>

<h3>Durasi dan Peralihan ke MPASI</h3>
<p>IDAI menyebut ASI eksklusif sampai <strong>usia 6 bulan</strong>, lalu menyusui dilanjutkan <strong>sampai setidaknya 2 tahun</strong> atau lebih. Pada usia 6 bulan, MPASI diperkenalkan sementara ASI tetap diberikan.</p>

<h2>Jika Terasa Sulit</h2>
<ol>
<li>Minta bantuan menilai pelekatan dari tenaga kesehatan atau konselor menyusui &amp;mdash; sebaiknya dilihat langsung, bukan hanya didiskusikan.</li>
<li>Periksa catatan berkemih dan berat badan sebelum memutuskan menambah susu formula.</li>
<li>Pastikan ibu mendapat istirahat dan dukungan pekerjaan rumah dari keluarga.</li>
</ol>

<blockquote><p>Nyeri hebat saat menyusui bukan hal yang harus ditahan. Nyeri adalah tanda pelekatan perlu diperbaiki &amp;mdash; dan itu bisa diperbaiki.</p></blockquote>

<p>Sumber: <a href="https://www.idai.or.id/artikel/klinik/asi/1-2-3-menuju-asi-eksklusif" target="_blank" rel="noopener noreferrer nofollow">1-2-3 Menuju ASI Eksklusif &amp;mdash; IDAI</a>.</p>', 'IBU'::"public"."blog_category", 'blog/b4fdad64-5b1e-46f0-9013-f9e766875044/1793329687314.jpg', true),
  ('kesehatan-mental-ibu-pasca-melahirkan', 'Kesehatan Mental Ibu: Satu dari Sepuluh Ibu Mengalaminya', 'WHO menyebut sekitar 10 persen ibu hamil dan 13 persen ibu yang baru melahirkan mengalami gangguan jiwa, dengan angka lebih tinggi di negara berkembang, dan hal ini berdampak pada tumbuh kembang anak.', '<p>Kesehatan mental ibu jarang masuk daftar periksa pascapersalinan, padahal angkanya tidak kecil dan dampaknya langsung terasa pada bayi.</p>

<h2>Seberapa Sering Terjadi</h2>
<p>WHO menyebut <strong>sekitar 10% ibu hamil dan 13% ibu yang baru melahirkan</strong> mengalami gangguan jiwa secara global. Di negara berkembang, angkanya lebih tinggi: <strong>15,6% selama kehamilan</strong> dan <strong>19,8% setelah melahirkan</strong>. Salah satu analisis yang dikutip WHO menemukan sekitar <strong>20% ibu di negara berkembang</strong> mengalami depresi klinis setelah persalinan.</p>
<p>Artinya, dalam satu kelompok posyandu berisi sepuluh ibu baru, kemungkinan ada satu atau dua yang sedang mengalaminya. Ini bukan kasus langka.</p>

<h2>Faktor yang Meningkatkan Risiko</h2>
<p>WHO menyebut beberapa faktor risiko:</p>
<ul>
<li>Kemiskinan</li>
<li>Migrasi</li>
<li>Paparan kekerasan</li>
<li>Konflik</li>
<li>Bencana alam</li>
<li>Dukungan sosial yang rendah</li>
</ul>
<p>Perhatikan bahwa hampir semuanya adalah keadaan di luar kendali ibu sendiri. Ini penting untuk melawan anggapan bahwa gangguan jiwa pascapersalinan adalah soal ibu yang &amp;quot;kurang kuat&amp;quot; atau &amp;quot;kurang bersyukur&amp;quot;.</p>

<h2>Dampak pada Bayi</h2>
<p>WHO menyatakan gangguan jiwa ibu yang tidak ditangani berdampak pada bayi melalui kelekatan ibu&amp;ndash;bayi yang melemah, menyusui yang terganggu, dan perawatan bayi yang tidak optimal. Gangguan jiwa pada ibu dapat menghambat pertumbuhan fisik dan perkembangan anak kecil.</p>
<p>Sisi baiknya ada: WHO menyebut penelitian menunjukkan bahwa <strong>mengobati depresi pada ibu memperbaiki pertumbuhan dan perkembangan anak, serta menurunkan risiko diare dan malnutrisi</strong>. Menangani kesehatan mental ibu adalah intervensi gizi anak sekaligus.</p>

<h2>Yang Dianjurkan WHO</h2>
<ol>
<li><strong>Integrasikan kesehatan mental ibu ke layanan kesehatan umum</strong> &amp;mdash; layanan kesehatan perempuan, layanan ibu dan anak, serta kesehatan reproduksi.</li>
<li><strong>Latih tenaga kesehatan non-spesialis</strong> untuk mengenali dan menangani, menggunakan panduan intervensi mhGAP.</li>
<li><strong>Libatkan kader kesehatan masyarakat</strong> dengan pendekatan berbasis bukti seperti program <em>Thinking Healthy</em>.</li>
<li><strong>Utamakan deteksi dini</strong> dan intervensi yang hemat biaya di tingkat komunitas.</li>
</ol>
<p>Pesan utamanya: penanganan tidak harus dimulai dari psikiater. Deteksi di layanan primer dan dukungan komunitas sudah bisa banyak membantu.</p>

<h2>Apa yang Bisa Dilakukan Keluarga</h2>
<p>Tanyakan kondisi perasaan ibu, bukan hanya kondisi bayi. Perhatikan perubahan yang bertahan: sedih terus-menerus, hilang minat, sulit tidur meski bayi tidur, merasa tidak mampu mengurus bayi, atau pikiran menyakiti diri. Bagikan beban pekerjaan rumah dan perawatan bayi secara nyata, bukan sekadar menawarkan.</p>

<blockquote><p>Pikiran untuk menyakiti diri sendiri atau bayi adalah alasan untuk mencari bantuan tenaga kesehatan pada hari itu juga, bukan nanti. Hubungi fasilitas kesehatan terdekat.</p></blockquote>

<p>Sumber: <a href="https://www.who.int/teams/mental-health-and-substance-use/promotion-prevention/maternal-mental-health" target="_blank" rel="noopener noreferrer nofollow">halaman WHO tentang kesehatan mental ibu</a>.</p>', 'IBU'::"public"."blog_category", 'blog/49478ef9-8212-48c3-81f4-39407bb69417/1793330208234.webp', true)
ON CONFLICT ("slug") DO NOTHING;
