CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `price` INT NOT NULL,
  `original_price` INT NULL,
  `stock` INT DEFAULT 0,
  `stock_status` ENUM('available', 'low', 'sold') DEFAULT 'available',
  `description` TEXT NULL,
  `seo_title` VARCHAR(150) NULL,
  `seo_description` VARCHAR(255) NULL,
  `seo_keywords` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;