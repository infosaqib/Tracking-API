import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import {
  ValidationErrorResponseDto,
  UnauthorizedErrorResponseDto,
  NotFoundErrorResponseDto,
} from '../common/dto/error-response.dto';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':trackingId')
  @ApiOperation({ summary: 'Get tracking by tracking ID' })
  @ApiResponse({ status: 200, description: 'Tracking retrieved successfully' })
  @ApiResponse({
    status: 404,
    description: 'Tracking not found',
    type: NotFoundErrorResponseDto,
  })
  findByTrackingId(@Param('trackingId') trackingId: string) {
    return this.trackingService.findByTrackingId(trackingId);
  }

  @Patch(':trackingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.seller)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tracking status' })
  @ApiResponse({ status: 200, description: 'Tracking updated successfully' })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tracking not found',
    type: NotFoundErrorResponseDto,
  })
  update(@Param('trackingId') trackingId: string, @Body() updateTrackingDto: UpdateTrackingDto) {
    return this.trackingService.updateTracking(trackingId, updateTrackingDto);
  }
}

