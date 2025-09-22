# Error Handling System

This document describes the comprehensive error handling system implemented in the Tracking API.

## Overview

The error handling system provides:

- Custom error classes for different error types
- Global error handler middleware
- Async error wrappers for route handlers
- Error monitoring and alerting
- Structured error logging
- Error statistics and trends

## Error Classes

### Base Error Classes

#### `AppError`

Base error class for all application errors.

```javascript
throw new AppError("Something went wrong", 500, "INTERNAL_ERROR");
```

#### `ValidationError`

For input validation errors.

```javascript
throw new ValidationError("Validation failed", [
  { field: "email", message: "Email is required" },
]);
```

#### `AuthenticationError`

For authentication failures.

```javascript
throw new AuthenticationError("Invalid credentials", "INVALID_CREDENTIALS");
```

#### `AuthorizationError`

For authorization failures.

```javascript
throw new AuthorizationError("Admin access required", "ADMIN_REQUIRED");
```

#### `NotFoundError`

For resource not found errors.

```javascript
throw new NotFoundError("User not found", "USER_NOT_FOUND");
```

#### `ConflictError`

For resource conflicts.

```javascript
throw new ConflictError("Email already exists", "EMAIL_ALREADY_EXISTS");
```

#### `RateLimitError`

For rate limiting violations.

```javascript
throw new RateLimitError("Too many requests", 900, "RATE_LIMIT_EXCEEDED");
```

#### `ExternalServiceError`

For external service failures.

```javascript
throw new ExternalServiceError(
  "Stripe",
  "Payment failed",
  "PAYMENT_SERVICE_ERROR"
);
```

#### `DatabaseError`

For database operation failures.

```javascript
throw new DatabaseError("Failed to save user", "USER_SAVE_FAILED");
```

#### `ConfigurationError`

For configuration errors.

```javascript
throw new ConfigurationError(
  "Missing required configuration",
  "MISSING_CONFIG"
);
```

#### `BusinessLogicError`

For business logic violations.

```javascript
throw new BusinessLogicError(
  "Cannot cancel shipped order",
  "ORDER_ALREADY_SHIPPED"
);
```

## Async Error Wrappers

### `asyncHandler`

Wraps async route handlers to catch errors.

```javascript
const { asyncHandler } = require("../utils/errors");

router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    res.json({ success: true, data: user });
  })
);
```

### `wrapAsync`

Alternative wrapper function.

```javascript
const { wrapAsync } = require("../utils/asyncWrapper");

const getUser = wrapAsync(async (req, res) => {
  // Your async code here
});
```

### `wrapController`

Wraps all methods in a controller.

```javascript
const { wrapController } = require("../utils/asyncWrapper");

const wrappedController = wrapController(controller);
```

## Error Monitoring

### Error Statistics

Get error statistics via the monitoring API:

```bash
GET /api/v1/monitoring/stats
```

### Error Trends

Get error trends over time:

```bash
GET /api/v1/monitoring/trends?timeWindow=3600000
```

### Recent Errors

Get recent errors with filtering:

```bash
GET /api/v1/monitoring/errors?limit=50&severity=high&category=database
```

## Error Response Format

All errors follow a consistent response format:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "path": "/api/v1/users/123",
  "method": "GET",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "value": null
    }
  ]
}
```

## Error Severity Levels

- **Critical** (500+): System-level errors
- **High** (400-499): Client errors
- **Medium** (300-399): Redirection errors
- **Low** (200-299): Success responses

## Error Categories

- `validation`: Input validation errors
- `authentication`: Authentication failures
- `authorization`: Authorization failures
- `not_found`: Resource not found
- `conflict`: Resource conflicts
- `rate_limit`: Rate limiting violations
- `external_service`: External service failures
- `database`: Database operation failures
- `configuration`: Configuration errors
- `business_logic`: Business logic violations
- `unknown`: Unclassified errors

## Alert Thresholds

Default alert thresholds:

- Critical: 1 error
- High: 10 errors
- Medium: 50 errors
- Low: 100 errors

## Configuration

Error monitoring can be configured in the environment:

```env
# Enable/disable error monitoring
MONITORING_ENABLED=true

# Alert webhooks
MONITORING_CRITICAL_WEBHOOK=https://hooks.slack.com/...
MONITORING_HIGH_PRIORITY_WEBHOOK=https://hooks.slack.com/...
MONITORING_MEDIUM_PRIORITY_WEBHOOK=https://hooks.slack.com/...
MONITORING_LOW_PRIORITY_WEBHOOK=https://hooks.slack.com/...
```

## Best Practices

### 1. Use Appropriate Error Classes

Choose the most specific error class for your use case.

```javascript
// Good
throw new ValidationError("Email is required");

// Avoid
throw new AppError("Email is required", 400);
```

### 2. Provide Meaningful Error Codes

Use descriptive error codes for easier debugging.

```javascript
// Good
throw new AuthenticationError("Invalid token", "INVALID_TOKEN");

// Avoid
throw new AuthenticationError("Invalid token", "AUTH_ERROR");
```

### 3. Include Context in Errors

Add relevant context to help with debugging.

```javascript
const error = new DatabaseError("Failed to save user");
error.userId = userId;
error.operation = "create";
throw error;
```

### 4. Use Async Wrappers

Always wrap async route handlers to catch errors.

```javascript
// Good
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    // Your code
  })
);

// Avoid
router.get("/users", async (req, res) => {
  // Your code - errors won't be caught
});
```

### 5. Log Errors Appropriately

Use the error logger for consistent error logging.

```javascript
const { ErrorLogger } = require("../utils/errors");
const logger = new ErrorLogger(console);

logger.log(error, req, { additional: "context" });
```

## Monitoring Endpoints

### Health Check

```bash
GET /api/v1/monitoring/health
```

### Error Statistics

```bash
GET /api/v1/monitoring/stats
```

### Error Trends

```bash
GET /api/v1/monitoring/trends?timeWindow=3600000
```

### Reset Monitoring Data

```bash
POST /api/v1/monitoring/reset
{
  "resetCounts": true,
  "resetHistory": false
}
```

### Update Thresholds

```bash
PUT /api/v1/monitoring/thresholds
{
  "critical": 1,
  "high": 10,
  "medium": 50,
  "low": 100
}
```

### Toggle Monitoring

```bash
POST /api/v1/monitoring/toggle
{
  "enabled": true
}
```

### Get Recent Errors

```bash
GET /api/v1/monitoring/errors?limit=50&severity=high&category=database
```

## Error Handling Flow

1. **Error Occurs**: An error is thrown in a route handler or service
2. **Async Wrapper**: The async wrapper catches the error
3. **Global Handler**: The global error handler processes the error
4. **Error Classification**: The error is classified by type and severity
5. **Logging**: The error is logged with appropriate level
6. **Monitoring**: The error is tracked for monitoring and alerting
7. **Response**: A structured error response is sent to the client

## Troubleshooting

### Common Issues

1. **Errors not being caught**: Make sure to use async wrappers
2. **Inconsistent error format**: Use the custom error classes
3. **Missing error context**: Add relevant context to errors
4. **Alert spam**: Adjust alert thresholds and cooldowns

### Debug Mode

Enable debug mode for detailed error information:

```env
NODE_ENV=development
```

This will include stack traces and additional error details in responses.

## Integration with External Services

The error monitoring system can be integrated with:

- **Slack**: For real-time alerts
- **PagerDuty**: For critical error escalation
- **Email**: For error notifications
- **SMS**: For urgent alerts
- **Webhooks**: For custom integrations

## Performance Considerations

- Error monitoring is designed to be lightweight
- Error history is limited to 1000 entries
- Alert cooldowns prevent spam
- Async operations don't block request processing

## Security

- Sensitive data is redacted from error logs
- Error details are filtered based on environment
- Monitoring endpoints require admin authentication
- Error responses don't expose internal implementation details
