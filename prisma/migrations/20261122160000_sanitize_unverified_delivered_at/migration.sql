-- Migration: Sanitize unverified delivered_at values
-- Historical orders whose delivered_at was set to updated_at without an authentic fulfillment event
-- must be set to NULL so they are safely rejected by the 7-day eligibility check instead of relying on an unverified timestamp.
UPDATE `orders` 
SET `delivered_at` = NULL 
WHERE `delivered_at` = `updated_at`;
