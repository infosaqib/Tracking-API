# Delete Service Data Script

This script deletes a service and all its related data from the database. It handles the deletion in the correct order to maintain referential integrity.

## Usage

```bash
# Run the script with a service ID
yarn ts-node scripts/delete-service-data/delete-service-data.ts <service-id>

# Run in dry-run mode to see what would be deleted
yarn ts-node scripts/delete-service-data/delete-service-data.ts <service-id> --dry-run
```

## What Gets Deleted

The script will delete:

1. Property Contract Services associated with the service
2. Vendor Services associated with the service
3. Property Service Maps associated with the service
4. Sub Services associated with the service
5. The service itself

## Safety Features

- The script uses a database transaction to ensure all deletions succeed or none do
- Dry-run mode allows you to see what would be deleted without actually deleting anything
- The script verifies the service exists before attempting deletion
- All related data is deleted in the correct order to maintain referential integrity

## Example Output

### Dry Run

```
Dry run results:
Service: { id: '...', name: '...', ... }
Number of sub-services: 5
Number of property service maps: 10
Number of vendor services: 3
Number of property contract services: 2
```

### Actual Run

```
Successfully deleted service and related data:
Deleted service: { id: '...', name: '...', ... }
Deleted sub-services: 5
Deleted property service maps: 10
Deleted vendor services: 3
Deleted property contract services: 2
```
