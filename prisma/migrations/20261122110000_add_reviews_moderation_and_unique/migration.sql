-- AlterTable
ALTER TABLE `reviews` 
    ADD COLUMN `is_verified_purchase` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `status` ENUM('APPROVED', 'HIDDEN') NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `uq_reviews_user_product` ON `reviews`(`user_id`, `product_id`);

-- CreateIndex
CREATE INDEX `idx_reviews_product_status_rating` ON `reviews`(`product_id`, `status`, `rating`);
