const nodemailer = require("nodemailer");
const axios = require("axios");

// Fungsi pembantu untuk memformat angka menjadi Rupiah di backend
const formatRupiahBackend = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

// =======================================================================
// UTILS: LOGIKA PENGIRIMAN NOTIFIKASI EMAIL & WHATSAPP
// =======================================================================
class Notifier {
  // 1. Fungsi Internal untuk Mengambil Kunci Config dari Database Settings
  static async getConfig(db) {
    const [rows] = await db.query(
      "SELECT setting_key, setting_value FROM settings",
    );
    const config = {};
    rows.forEach((item) => {
      config[item.setting_key] = item.setting_value;
    });
    return config;
  }

  // 2. Fungsi Internal: Pengirim WhatsApp via Gateway Fonnte
  static async sendWhatsApp(apiKey, targetNumber, message) {
    if (!apiKey || !targetNumber)
      return console.log("⚠️ WA Gagal: API Key atau Nomor Tujuan kosong.");
    try {
      await axios.post(
        "https://api.fonnte.com/send",
        {
          target: targetNumber,
          message: message,
          countryCode: "62", // Otomatisasi format kode negara Indonesia
        },
        {
          headers: { Authorization: apiKey },
        },
      );
      console.log(`✅ WA sukses dikirim ke ${targetNumber}`);
    } catch (error) {
      console.error(
        "❌ Fonnte WA Error:",
        error.response?.data || error.message,
      );
    }
  }

  // 3. Fungsi Internal: Pengirim Email via SMTP Transporter Nodemailer
  static async sendEmail(config, toEmail, subject, htmlContent) {
    if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
      return console.log(
        "⚠️ Email Gagal: Konfigurasi SMTP di settings belum lengkap.",
      );
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port) || 465,
        secure: parseInt(config.smtp_port) === 465, // True jika port 465, false jika 587
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password,
        },
      });

      await transporter.sendMail({
        from: `"${config.shop_name || "Chester Collection"}" <${config.smtp_user}>`,
        to: toEmail,
        subject: subject,
        html: htmlContent,
      });
      console.log(`✅ Email sukses dikirim ke ${toEmail}`);
    } catch (error) {
      console.error("❌ SMTP Email Error:", error.message);
    }
  }

  // =======================================================================
  // TRIGGER 1: NOTIFIKASI SAAT PESANAN BARU MASUK (CHECKOUT)
  // =======================================================================
  static async sendNewOrderNotification(db, orderData, customerData, items) {
    const config = await this.getConfig(db);

    const invoice = orderData.invoice_number;
    const totalBayar = formatRupiahBackend(orderData.total_amount);
    const detailProduk = items
      .map((item) => `- ${item.name} (${item.variant}) x${item.quantity}`)
      .join("\n");

    // --- A. UNTUK KONSUMEN ---
    const waCustomer = `Halo Kak ${customerData.fullname}, terima kasih sudah berbelanja di ${config.shop_name || "Chester Collection"}! 🛍️\n\nPesanan Kakak dengan nomor *${invoice}* telah berhasil kami terima dan sedang menunggu pembayaran.\n\n*Rincian Belanja:*\n${detailProduk}\n\n*Total Tagihan:* *${totalBayar}*\n\nJika Kakak belum melakukan transfer, Kakak bisa melihat instruksi pembayaran dan rekening toko melalui tautan berikut:\nhttps://domainanda.com/payment-confirmation/${orderData.id}\n\nTerima kasih! ✨`;

    const emailCustomerHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; padding: 20px; rounded: 12px;">
        <h2 style="color: #db2777;">Terima Kasih Atas Pesanan Anda!</h2>
        <p>Hai <strong>${customerData.fullname}</strong>,</p>
        <p>Pesanan Anda dengan nomor invoice <strong>${invoice}</strong> telah kami terima dan saat ini sedang menunggu pembayaran.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <h3 style="color: #555;">Rincian Pesanan:</h3>
        <p style="white-space: pre-line; line-height: 1.6;">${detailProduk}</p>
        <p style="font-size: 16px;"><strong>Total Tagihan: <span style="color: #db2777;">${totalBayar}</span></strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Ini adalah email otomatis, mohon tidak membalas email ini secara langsung.</p>
      </div>
    `;

    // Kirim ke Konsumen
    await this.sendWhatsApp(
      config.fonnte_api_key,
      customerData.phone,
      waCustomer,
    );
    await this.sendEmail(
      config,
      customerData.email,
      `Invoice Pesanan Masuk #${invoice}`,
      emailCustomerHtml,
    );

    // --- B. UNTUK ADMIN TOKO ---
    if (config.shop_phone || config.smtp_user) {
      const waAdmin = `📢 *NOTIFIKASI ORDER BARU MASUK!* 📢\n\nAda pesanan baru dengan nomor *${invoice}* oleh pelanggan *${customerData.fullname}* (${customerData.phone}).\n\n*Item Pesanan:*\n${detailProduk}\n\n*Total Nilai Transaksi:* *${totalBayar}*\n\nHarap segera periksa dashboard admin untuk memproses pesanan tersebut! 🚀`;

      const emailAdminHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background-color: #fff9fb; border: 2px dashed #db2777; padding: 20px;">
          <h2 style="color: #db2777; margin-top: 0;">📢 Pemberitahuan Order Baru Masuk!</h2>
          <p>Halo Admin,</p>
          <p>Sistem mendeteksi transaksi baru yang berhasil dibuat oleh pelanggan berikut:</p>
          <table style="font-size: 14px; text-align: left;">
            <tr><th>Nama Pelanggan</th><td>: ${customerData.fullname}</td></tr>
            <tr><th>Invoice No</th><td>: <strong>${invoice}</strong></td></tr>
            <tr><th>Total Transaksi</th><td>: <strong>${totalBayar}</strong></td></tr>
          </table>
          <h3 style="color: #555; margin-top: 20px;">Daftar Barang Belanjaan:</h3>
          <p style="white-space: pre-line; line-height: 1.6; background: #fff; padding: 10px; border: 1px solid #eee;">${detailProduk}</p>
          <p>Segera siapkan produk dan lakukan pengaturan penjemputan kurir di dashboard admin panel.</p>
        </div>
      `;

      // Kirim ke Admin Toko (Menggunakan config HP Toko & email pengirim smtp sebagai email admin)
      await this.sendWhatsApp(
        config.fonnte_api_key,
        config.shop_phone,
        waAdmin,
      );
      await this.sendEmail(
        config,
        config.smtp_user,
        `[ADMIN NOTIFICATION] Order Baru Masuk #${invoice}`,
        emailAdminHtml,
      );
    }
  }

  // =======================================================================
  // TRIGGER 2: NOTIFIKASI SAAT PESANAN SELESAI DIKIRIM (RESI TURUN / PICKUP)
  // =======================================================================
  static async sendShippingNotification(
    db,
    invoiceNumber,
    customerData,
    courierCompany,
    airwayBill,
  ) {
    const config = await this.getConfig(db);

    const namaKurir = String(courierCompany).toUpperCase();

    const waShipping = `Kabar gembira Kak ${customerData.fullname}! 🎉\n\nPesanan Kakak dengan nomor invoice *${invoiceNumber}* telah selesai kami kemas dan *SEDANG DIKIRIM* oleh kurir.\n\n*Ekspedisi:* ${namaKurir}\n*Nomor Resi (AWB):* *${airwayBill}*\n\nKakak sudah bisa melakukan pelacakan resi secara berkala langsung di website ekspedisi terkait atau via menu profil di website kami.\n\nTerima kasih atas kepercayaannya berbelanja di ${config.shop_name || "Chester Collection"}! ❤️`;

    const emailShippingHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 12px;">
        <h2 style="color: #16a34a; margin-top: 0;">📦 Paket Anda Sedang Dalam Perjalanan!</h2>
        <p>Hai <strong>${customerData.fullname}</strong>,</p>
        <p>Pesanan Anda dengan nomor invoice <strong>${invoiceNumber}</strong> telah kami serahkan ke pihak logistik ekspedisi untuk dikirimkan ke alamat Anda.</p>
        <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="font-weight: bold; width: 40%;">Jasa Ekspedisi</td><td>: ${namaKurir}</td></tr>
            <tr><td style="font-weight: bold;">Nomor Resi (AWB)</td><td>: <span style="color: #16a34a; font-weight: bold; font-family: monospace;">${airwayBill}</span></td></tr>
          </table>
        </div>
        <p>Silakan gunakan nomor resi di atas untuk melacak posisi paket Anda secara berkala. Selamat menunggu paket Anda tiba!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} ${config.shop_name || "Chester Collection"}</p>
      </div>
    `;

    // Kirim notifikasi pengiriman ke konsumen
    await this.sendWhatsApp(
      config.fonnte_api_key,
      customerData.phone,
      waShipping,
    );
    await this.sendEmail(
      config,
      customerData.email,
      `Paket Anda Telah Dikirim! #${invoiceNumber}`,
      emailShippingHtml,
    );
  }
}

module.exports = Notifier;
