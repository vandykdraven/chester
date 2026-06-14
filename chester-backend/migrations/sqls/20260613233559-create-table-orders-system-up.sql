SET FOREIGN_KEY_CHECKS=0;

-- 1. TABEL INDUK PESANAN (ORDERS)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(50) NOT NULL UNIQUE, -- Contoh: INV-20260614-001
  `user_id` INT NOT NULL,
  
  -- Alamat Pengiriman (Dicopy dari user_addresses saat checkout agar data permanen)
  `recipient_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `province_id` INT NOT NULL,
  `province_name` VARCHAR(100),
  `city_id` INT NOT NULL,
  `city_name` VARCHAR(100),
  `subdistrict_id` INT NOT NULL, -- Sangat krusial untuk KiriminAja
  `subdistrict_name` VARCHAR(100),
  `postal_code` VARCHAR(10),
  `full_address` TEXT NOT NULL,
  
  -- Data Logistik KiriminAja
  `courier_name` VARCHAR(50) NOT NULL, -- Contoh: 'jne', 'jnt', 'sicepat'
  `courier_service` VARCHAR(50) NOT NULL, -- Contoh: 'REG', 'EZ', 'SIUNTUNG'
  `shipping_cost` DECIMAL(12,2) NOT NULL,
  `airway_bill` VARCHAR(100) NULL, -- Nomor Resi Otomatis dari KiriminAja
  `kiriminaja_order_id` VARCHAR(100) NULL, -- ID Referensi unik dari KiriminAja
  
  -- Total Biaya Transaksi
  `subtotal_products` DECIMAL(12,2) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL, -- (Subtotal + Ongkir)
  
  -- Alur Status Otomatis KiriminAja
  -- 'pending' = Belum Bayar
  -- 'paid' = Sudah Bayar, Perlu Dikirim
  -- 'shipping' = Sedang Dikirim (Resi sudah keluar & kurir pickup)
  -- 'completed' = Selesai (Paket sampai berdasarkan Webhook)
  -- 'cancelled' = Dibatalkan
  `status` ENUM('pending', 'paid', 'shipping', 'completed', 'cancelled') DEFAULT 'pending',
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABEL RINCIAN ITEM PESANAN (ORDER_ITEMS)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `variant_key` VARCHAR(100) NULL, -- Menyimpan info warna/ukuran, contoh: 'Brown' atau 'XL'
  `price` DECIMAL(12,2) NOT NULL, -- Harga saat dibeli (jaga-jaga jika di masa depan harga produk berubah)
  `quantity` INT NOT NULL,
  `weight` INT NOT NULL, -- Berat dalam gram (wajib untuk kalkulasi KiriminAja)
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;