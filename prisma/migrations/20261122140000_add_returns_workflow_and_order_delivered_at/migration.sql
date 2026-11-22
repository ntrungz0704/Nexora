-- AlterTable orders: Add delivered_at and backfill for already DELIVERED orders
ALTER TABLE `orders` ADD COLUMN `delivered_at` DATETIME(3) NULL AFTER `paid_at`;
UPDATE `orders` SET `delivered_at` = `updated_at` WHERE `order_status` = 'DELIVERED' AND `delivered_at` IS NULL;

-- AlterTable return_requests: update status ENUM with PROCESSING, add return_code, rejection_reason, handled_by
ALTER TABLE `return_requests` MODIFY COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED') NOT NULL DEFAULT 'PENDING';
ALTER TABLE `return_requests` ADD COLUMN `return_code` VARCHAR(50) NOT NULL AFTER `id`;
ALTER TABLE `return_requests` ADD COLUMN `rejection_reason` VARCHAR(255) NULL AFTER `reason`;
ALTER TABLE `return_requests` ADD COLUMN `handled_by` INTEGER UNSIGNED NULL AFTER `rejection_reason`;

CREATE UNIQUE INDEX `return_requests_return_code_key` ON `return_requests`(`return_code`);
CREATE INDEX `idx_return_requests_handler` ON `return_requests`(`handled_by`);
ALTER TABLE `return_requests` ADD CONSTRAINT `return_requests_handled_by_fkey` FOREIGN KEY (`handled_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable return_items
CREATE TABLE `return_items` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `return_request_id` INTEGER UNSIGNED NOT NULL,
    `order_item_id` BIGINT UNSIGNED NOT NULL,
    `product_id` INTEGER UNSIGNED NOT NULL,
    `quantity` INTEGER UNSIGNED NOT NULL,
    `resolution` ENUM('REFUND', 'REPLACE', 'REPAIR') NOT NULL DEFAULT 'REFUND',
    `is_resellable` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_return_items_request`(`return_request_id`),
    INDEX `idx_return_items_order_item`(`order_item_id`),
    INDEX `idx_return_items_product`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `return_items` ADD CONSTRAINT `return_items_return_request_id_fkey` FOREIGN KEY (`return_request_id`) REFERENCES `return_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `return_items` ADD CONSTRAINT `return_items_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `return_items` ADD CONSTRAINT `return_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable return_audit_logs
CREATE TABLE `return_audit_logs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `return_request_id` INTEGER UNSIGNED NOT NULL,
    `from_status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED') NOT NULL,
    `to_status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED') NOT NULL,
    `actor_id` INTEGER UNSIGNED NOT NULL,
    `actor_role` ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL,
    `notes` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_return_audit_logs_request`(`return_request_id`),
    INDEX `idx_return_audit_logs_actor`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `return_audit_logs` ADD CONSTRAINT `return_audit_logs_return_request_id_fkey` FOREIGN KEY (`return_request_id`) REFERENCES `return_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `return_audit_logs` ADD CONSTRAINT `return_audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
