# Potential Vendors API Documentation

## Overview

The Potential Vendors API endpoint allows you to retrieve a paginated list of vendors that can potentially service a specific property for a given RFP. The matching is based on vendor service capabilities and geographic coverage.

## Endpoint

```
GET /rfp/{rfpId}/properties/{propertyId}/potential-vendors
```

## Path Parameters

| Parameter    | Type          | Required | Description                                      | Example                                |
| ------------ | ------------- | -------- | ------------------------------------------------ | -------------------------------------- |
| `rfpId`      | string (UUID) | Yes      | Unique identifier of the RFP                     | `123e4567-e89b-12d3-a456-426614174000` |
| `propertyId` | string (UUID) | Yes      | Unique identifier of the property within the RFP | `987fcdeb-51a2-43d1-9f12-123456789abc` |

## Query Parameters

| Parameter       | Type          | Required | Description                             | Example                          |
| --------------- | ------------- | -------- | --------------------------------------- | -------------------------------- |
| `page`          | number        | No       | Page number for pagination (default: 1) | `1`                              |
| `limit`         | number        | No       | Number of items per page (default: 10)  | `20`                             |
| `status`        | array[string] | No       | Filter by vendor status                 | `["ACTIVE", "DRAFT"]`            |
| `stage`         | array[string] | No       | Filter by vendor stage                  | `["CNX_APPROVED", "ONBOARDING"]` |
| `sort`          | string        | No       | Sort field (name, createdAt, status)    | `name`                           |
| `sortDirection` | string        | No       | Sort direction (asc, desc)              | `asc`                            |

### Valid Status Values

- `ACTIVE`
- `DRAFT`
- `INACTIVE`

### Valid Stage Values

- `ONBOARDING`
- `CNX_APPROVED`
- `CNX_NOT_APPROVED`
- `CHANGING_INFO`
- `APPLYING`
- `IN_ACTIVE`

## Vendor Matching Logic

The API uses the following priority order to determine how a vendor matches with a property:

1. **Continental US Coverage** (`CONTINENTAL_US_COVERAGE`)

   - Vendors that service the entire continental United States
   - Highest priority match type

2. **Outside RFP Interest** (`OUTSIDE_RFP_INTEREST`)

   - Vendors interested in receiving RFPs outside their normal service area
   - Second highest priority

3. **State-wide Coverage** (`STATE_WIDE_COVERAGE`)

   - Vendors that service the entire state where the property is located
   - No specific city or county restrictions

4. **City Coverage** (`CITY_COVERAGE`)

   - Vendors that specifically service the city where the property is located

5. **County Coverage** (`COUNTY_COVERAGE`)

   - Vendors that specifically service the county where the property is located

6. **Specific Location** (`SPECIFIC_LOCATION`)
   - Vendors with other specific location-based service areas

## Response Format

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "vendor-123",
      "name": "ABC Services Inc.",
      "logo": "https://example.com/logo.png",
      "status": "ACTIVE",
      "stage": "CNX_APPROVED",
      "address": "123 Main Street, City, State 12345",
      "website": "https://abcservices.com",
      "city": {
        "id": "city-456",
        "cityName": "New York"
      },
      "state": {
        "id": "state-789",
        "stateName": "New York"
      },
      "country": {
        "id": "country-001",
        "countryName": "United States"
      },
      "vendorServiceCoverContinentalUs": false,
      "vendorInterestedReceiveRfpOutside": false,
      "parentCompany": {
        "id": "parent-123",
        "name": "ABC Holdings"
      },
      "tenant": {
        "id": "tenant-456",
        "name": "Property Management Co",
        "parentTenant": {
          "id": "parent-tenant-789",
          "name": "Parent Management Group"
        }
      },
      "vendorService": {
        "vendorServiceType": "PRIMARY_SERVICE",
        "service": {
          "id": "service-123",
          "servicesName": "Landscaping"
        }
      },
      "matchType": "STATE_WIDE_COVERAGE",
      "matchingServiceableArea": {
        "id": "area-456",
        "stateId": "state-789",
        "cityId": null,
        "countyId": null
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10
  }
}
```

### Error Responses

#### 404 Not Found - RFP Not Found

```json
{
  "statusCode": 404,
  "message": "RFP not found",
  "error": "Not Found"
}
```

#### 404 Not Found - Property Not Found

```json
{
  "statusCode": 404,
  "message": "Property not found",
  "error": "Not Found"
}
```

#### 404 Not Found - Property Not Associated with RFP

```json
{
  "statusCode": 404,
  "message": "Property is not associated with this RFP",
  "error": "Not Found"
}
```

#### 400 Bad Request - Invalid Parameters

```json
{
  "statusCode": 400,
  "message": [
    "status must be a valid enum value",
    "page must be a positive number"
  ],
  "error": "Bad Request"
}
```

#### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Failed to retrieve potential vendors",
  "error": "Internal Server Error"
}
```

## Usage Examples

### Basic Request

```bash
curl -X GET "https://api.example.com/rfp/123e4567-e89b-12d3-a456-426614174000/properties/987fcdeb-51a2-43d1-9f12-123456789abc/potential-vendors"
```

### With Pagination

```bash
curl -X GET "https://api.example.com/rfp/123e4567-e89b-12d3-a456-426614174000/properties/987fcdeb-51a2-43d1-9f12-123456789abc/potential-vendors?page=2&limit=20"
```

### With Status Filter

```bash
curl -X GET "https://api.example.com/rfp/123e4567-e89b-12d3-a456-426614174000/properties/987fcdeb-51a2-43d1-9f12-123456789abc/potential-vendors?status=ACTIVE&status=DRAFT"
```

### With Sorting

```bash
curl -X GET "https://api.example.com/rfp/123e4567-e89b-12d3-a456-426614174000/properties/987fcdeb-51a2-43d1-9f12-123456789abc/potential-vendors?sort=name&sortDirection=asc"
```

### Complex Query with Multiple Filters

```bash
curl -X GET "https://api.example.com/rfp/123e4567-e89b-12d3-a456-426614174000/properties/987fcdeb-51a2-43d1-9f12-123456789abc/potential-vendors?status=ACTIVE&stage=CNX_APPROVED&page=1&limit=15&sort=name&sortDirection=desc"
```

## JavaScript/TypeScript Example

```typescript
interface PotentialVendorsParams {
  rfpId: string;
  propertyId: string;
  page?: number;
  limit?: number;
  status?: string[];
  stage?: string[];
  sort?: string;
  sortDirection?: 'asc' | 'desc';
}

async function getPotentialVendors(params: PotentialVendorsParams) {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status)
    params.status.forEach((s) => queryParams.append('status', s));
  if (params.stage) params.stage.forEach((s) => queryParams.append('stage', s));
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.sortDirection)
    queryParams.append('sortDirection', params.sortDirection);

  const url = `/rfp/${params.rfpId}/properties/${params.propertyId}/potential-vendors?${queryParams}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching potential vendors:', error);
    throw error;
  }
}

// Usage example
const vendors = await getPotentialVendors({
  rfpId: '123e4567-e89b-12d3-a456-426614174000',
  propertyId: '987fcdeb-51a2-43d1-9f12-123456789abc',
  status: ['ACTIVE'],
  stage: ['CNX_APPROVED'],
  page: 1,
  limit: 20,
  sort: 'name',
  sortDirection: 'asc',
});
```

## Performance Considerations

- The API uses database indexes for optimal query performance
- Pagination is recommended for large result sets
- Filtering by status and stage can significantly improve response times
- Geographic matching is optimized with proper indexing on serviceable areas

## Rate Limiting

Standard API rate limiting applies:

- 1000 requests per hour per API key
- 100 requests per minute per API key

## Authentication

This endpoint requires valid authentication headers. Include your API key in the request:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -X GET "https://api.example.com/rfp/.../potential-vendors"
```
