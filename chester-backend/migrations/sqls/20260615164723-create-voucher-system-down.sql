SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE `orders` DROP FOREIGN KEY `fk_order_voucher`;
ALTER TABLE `orders` DROP COLUMN `voucher_id`;
ALTER TABLE `orders` DROP COLUMN `discount_amount`;

DROP TABLE IF EXISTS `user_vouchers`;
DROP TABLE IF EXISTS `vouchers`;

SET FOREIGN_KEY_CHECKS=1;