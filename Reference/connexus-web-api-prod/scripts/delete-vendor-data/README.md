# Delete Vendor Data Script

This script deletes a vendor and all its related data from the database. It handles the deletion in the correct order to maintain referential integrity.

## Usage

```bash
# Run the script with a vendor ID
yarn ts-node scripts/delete-vendor-data/delete-vendor-data.ts <vendor-id>

# Run in dry-run mode to see what would be deleted
yarn ts-node scripts/delete-vendor-data/delete-vendor-data.ts <vendor-id> --dry-run
```

## What Gets Deleted

The script will delete:

1. Vendor Servicable Areas
2. Vendor Notes
3. Vendor Services
4. Approved Client Vendors
5. Contracts and related data:
   - Property Contract Services
   - Property Contracts
   - Contracts
6. Update child companies to remove parent reference
7. Finally delete the vendor itself

## Safety Features

- The script uses a database transaction to ensure all deletions succeed or none do
- Dry-run mode allows you to see what would be deleted without actually deleting anything
- The script verifies the vendor exists before attempting deletion
- All related data is deleted in the correct order to maintain referential integrity
- Child companies are updated to remove parent reference instead of being deleted
- Increased transaction timeout to handle large amounts of data

## Example Output

### Dry Run

```
Dry run results:
Vendor: { id: '...', name: '...', ... }
Number of vendor services: 5
Number of vendor notes: 3
Number of vendor servicable areas: 2
Number of contracts: 4
Number of approved client vendors: 2
Number of child companies: 1
```

### Actual Run

```
Successfully deleted vendor and related data:
Deleted vendor: { id: '...', name: '...', ... }
Deleted vendor services: 5
Deleted vendor notes: 3
Deleted vendor servicable areas: 2
Deleted contracts: 4
Deleted approved client vendors: 2
Updated child companies: 1
```
