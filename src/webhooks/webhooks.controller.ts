import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import {
  ValidationErrorResponseDto,
  ErrorResponseDto,
} from '../common/dto/error-response.dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive webhook' })
  @ApiResponse({ status: 200, description: 'Webhook received and processed successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid webhook payload',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async receiveWebhook(@Body() body: any, @Headers() headers: any) {
    return this.webhooksService.handleWebhook(body, headers);
  }
}

