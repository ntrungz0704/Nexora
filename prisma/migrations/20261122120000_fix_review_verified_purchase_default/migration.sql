-- AlterTable: update default for is_verified_purchase to false
ALTER TABLE `reviews` ALTER COLUMN `is_verified_purchase` SET DEFAULT false;

-- Data remediation: Mark historical reviews as unverified (false) unless they have a matching DELIVERED order
UPDATE `reviews` r
SET r.`is_verified_purchase` = false
WHERE NOT EXISTS (
    SELECT 1 
    FROM `order_items` oi
    INNER JOIN `orders` o ON oi.`order_id` = o.`id`
    WHERE oi.`product_id` = r.`product_id`
      AND o.`user_id` = r.`user_id`
      AND o.`order_status` = 'DELIVERED'
);
