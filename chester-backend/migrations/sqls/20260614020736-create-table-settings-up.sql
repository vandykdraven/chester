-- 1. Buat Tabel Key-Value
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT,
  `description` VARCHAR(255),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Masukkan Pengaturan Dasar (Termasuk tempat untuk API KiriminAja)
INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`, `description`) VALUES
('shop_name', 'Chester Collection', 'Nama toko yang tampil di web'),
('shop_phone', '081234567890', 'Nomor WhatsApp Admin / CS'),
('shop_address', 'Surakarta, Jawa Tengah', 'Alamat toko offline / titik jemput kurir'),
('kiriminaja_api_key', '', 'API Key dari Dashboard KiriminAja'),
('kiriminaja_is_production', '0', 'Set ke 1 jika sudah live, 0 untuk Sandbox/Testing');