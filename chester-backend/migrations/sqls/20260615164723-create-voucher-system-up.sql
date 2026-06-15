SET FOREIGN_KEY_CHECKS=0;

-- 1. TABEL MASTER VOUCHER
CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `discount_type` ENUM('shipping', 'fixed', 'percent') NOT NULL,
  `discount_value` DECIMAL(12,2) NOT NULL,
  `max_discount` DECIMAL(12,2) DEFAULT 0,
  `min_purchase` DECIMAL(12,2) DEFAULT 0,
  `target_buyer` ENUM('all', 'new_customer') DEFAULT 'all',
  `is_claimable` BOOLEAN DEFAULT FALSE,
  `is_auto_apply` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `quota` INT DEFAULT 0,
  `used_count` INT DEFAULT 0,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABEL DOMPET VOUCHER PELANGGAN
CREATE TABLE IF NOT EXISTS `user_vouchers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `voucher_id` INT NOT NULL,
  `is_used` BOOLEAN DEFAULT FALSE,
  `used_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_voucher` (`user_id`, `voucher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. UPDATE TABEL ORDERS
ALTER TABLE `orders` 
ADD COLUMN `voucher_id` INT NULL AFTER `kiriminaja_order_id`,
ADD COLUMN `discount_amount` DECIMAL(12,2) DEFAULT 0 AFTER `shipping_cost`,
ADD CONSTRAINT `fk_order_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS=1;