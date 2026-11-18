-- Step 1: Temporarily expand users.role ENUM to include both legacy 'SELLER' and official 'STAFF'
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('CUSTOMER', 'SELLER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER';

-- Step 2: Safely migrate any existing 'SELLER' user rows to 'STAFF' (preserving IDs, timestamps, and FKs)
UPDATE `users`
SET
  `role` = 'STAFF',
  `email` = CASE
    WHEN `email` = 'seller.demo@nexora.test' THEN 'staff.demo@nexora.test'
    ELSE `email`
  END,
  `full_name` = CASE
    WHEN `full_name` = 'Nexora Demo Seller' THEN 'Nexora Demo Staff'
    ELSE `full_name`
  END
WHERE `role` = 'SELLER';

-- Step 3: Contract users.role ENUM to the locked Single-Vendor role set ('CUSTOMER', 'STAFF', 'ADMIN')
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER';
