-- Create a new column as an array of enum values
ALTER TABLE "Vendors" 
ADD COLUMN IF NOT EXISTS "vendorOwnershipArray" "VendorOwnership"[] DEFAULT ARRAY[]::"VendorOwnership"[];

-- Migrate existing data if the old column exists
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Vendors' 
        AND column_name = 'vendorOwnership'
    ) THEN
        -- Update the new array column with existing data
        UPDATE "Vendors"
        SET "vendorOwnershipArray" = ARRAY["vendorOwnership"]::"VendorOwnership"[]
        WHERE "vendorOwnership" IS NOT NULL;

        -- Drop the old column
        ALTER TABLE "Vendors" DROP COLUMN "vendorOwnership";
    END IF;
END $$;

-- Rename the new column to the original name
ALTER TABLE "Vendors" 
RENAME COLUMN "vendorOwnershipArray" TO "vendorOwnership";