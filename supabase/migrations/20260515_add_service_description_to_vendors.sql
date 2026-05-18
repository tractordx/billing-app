-- Migration: Add service_description to vendors table
-- Purpose: Bring service_description from agreements table into vendors
--          so a vendor's scope of work is captured at the vendor level
-- Date: 2026-05-15

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS service_description TEXT;
