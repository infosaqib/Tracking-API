# Background Jobs Application

This application handles background processing tasks using AWS SQS (Simple Queue Service).

## SQS Configuration

The application listens to the `EXPORT_QUEUE_URL` for export-related tasks using NestJS ConfigService for configuration management.

### Environment Variables Required

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1

# SQS Queue URL
EXPORT_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/your-account-id/export-queue
```

### Configuration Management

The application uses NestJS ConfigService to manage configuration:

- SQS queue URL is retrieved via `configService.get('EXPORT_QUEUE_URL')`
- AWS region is retrieved via `configService.get('AWS_REGION')`
- AWS credentials are automatically picked up from environment variables

### Message Handler

The application includes a message handler in `ExportSqsListenerService` that:

1. Listens to messages from the export queue
2. Parses the message body
3. Logs the processing steps
4. Returns `true` to acknowledge successful processing
5. Returns `false` to retry failed messages

### Running the Application

```bash
# Development
npm run start:dev background-jobs

# Production
npm run start:prod background-jobs
```

### Running with Docker Compose

```bash
# Development mode
docker-compose --profile dev up

# Production mode
docker-compose --profile prod up

# Build and run in background
docker-compose --profile prod up -d

# Stop services
docker-compose down
```

### Environment Setup

1. Copy the environment template:

   ```bash
   cp env.example .env
   ```

2. Update the `.env` file with your actual values:
   - AWS credentials
   - Database connection strings
   - SQS queue URL

### Message Format

The SQS message should contain a JSON body with export-related data:

```json
{
  "exportType": "csv",
  "data": {
    "userId": "123",
    "filters": {}
  }
}
```

### Customization

To implement your specific export logic, modify the `handleExportMessage` method in `ExportSqsListenerService` and uncomment the `processExport` method call.
