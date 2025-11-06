/* eslint-disable no-console */
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Body, Get, Param, Post, Res } from '@nestjs/common';

import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AgentService } from './agent.service';
import {
  AnswerAgentRequestDto,
  AnswerAgentResponseDto,
  GenerateDocumentResponseDto,
  StartAgentDto,
  StartAgentResponseDto,
} from './dto/agent.dto';

@ApiTags('Agent')
@RouteController('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('start')
  @ApiOperation({
    summary: 'Start a new agent session',
    description: 'Initiates a new Scope of Work generation session',
  })
  @ApiBody({ type: StartAgentDto })
  @ApiResponse({
    status: 201,
    description: 'Session started successfully',
    type: StartAgentResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async start(
    @Body() dto: StartAgentDto,
    @GetRequestUser() user: RequestUser,
  ): Promise<StartAgentResponseDto> {
    console.log('[AgentController] /agent/start called', {
      serviceName: dto.serviceName,
      clientId: dto.clientId,
      userId: user.connexus_user_id,
    });

    try {
      const res = await this.agentService.start(dto);
      return res;
    } catch (err: any) {
      console.error('[AgentController] start failed', {
        message: err?.message,
        stack: err?.stack,
        userId: user.connexus_user_id,
      });
      throw err;
    }
  }

  @Post('answer')
  @ApiOperation({
    summary: 'Answer a question in the session',
    description:
      'Provides an answer to continue the Scope of Work generation process',
  })
  @ApiBody({ type: AnswerAgentRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Answer processed successfully',
    type: AnswerAgentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async answer(
    @Body() body: AnswerAgentRequestDto,
    @GetRequestUser() user: RequestUser,
  ): Promise<AnswerAgentResponseDto> {
    try {
      const res = await this.agentService.answer(body);
      return res;
    } catch (err: any) {
      console.error('[AgentController] answer failed', {
        id: body?.id,
        message: err?.message,
        stack: err?.stack,
        userId: user.connexus_user_id,
      });
      throw err;
    }
  }

  @Get('generate/:id')
  @ApiOperation({
    summary: 'Generate final document',
    description: 'Generates the final Scope of Work document for the session',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Document generated successfully',
    type: GenerateDocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generate(
    @Param('id') id: string,
    @GetRequestUser() user: RequestUser,
  ): Promise<GenerateDocumentResponseDto> {
    console.log('[AgentController] /agent/generate called', {
      id,
      userId: user.connexus_user_id,
    });
    try {
      const res = await this.agentService.generate(id);

      return res;
    } catch (err: any) {
      console.error('[AgentController] generate failed', {
        id,
        message: err?.message,
        stack: err?.stack,
        userId: user.connexus_user_id,
      });
      throw err;
    }
  }

  @Get('document/:id')
  @ApiOperation({
    summary: 'Get current document',
    description: 'Retrieves the current document state for the session',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: GenerateDocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCurrentDocument(
    @Param('id') id: string,
    @GetRequestUser() user: RequestUser,
  ): Promise<GenerateDocumentResponseDto> {
    console.log('[AgentController] /agent/document called', {
      id,
      userId: user.connexus_user_id,
    });
    try {
      const res = await this.agentService.getCurrentDocument(id);

      return res;
    } catch (err: any) {
      console.error('[AgentController] getCurrentDocument failed', {
        id,
        message: err?.message,
        stack: err?.stack,
        userId: user.connexus_user_id,
      });
      throw err;
    }
  }

  @Get('stream/document/:id')
  @ApiOperation({
    summary: 'Stream document updates',
    description:
      "Streams real-time updates to the document as it's being generated",
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Stream started successfully',
    content: {
      'text/event-stream': {
        schema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async streamDocumentUpdate(
    @Param('id') id: string,
    @Res() res: Response,
    @GetRequestUser() user: RequestUser,
  ): Promise<void> {
    console.log('[AgentController] /agent/stream/document called', {
      id,
      userId: user.connexus_user_id,
    });
    try {
      await this.agentService.streamDocumentUpdate(id, res);
    } catch (err: any) {
      console.error('[AgentController] streamDocumentUpdate failed', {
        id,
        message: err?.message,
        stack: err?.stack,
        userId: user.connexus_user_id,
      });
      if (!res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ error: 'Failed to stream document update' })}\n\n`,
        );
        res.write('event: end\ndata: [DONE]\n\n');
        res.end();
      }
    }
  }

  @Get('stream/generate/:id')
  @ApiOperation({
    summary: 'Stream final generation',
    description: 'Streams the final document generation process',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Stream started successfully',
    content: {
      'text/event-stream': {
        schema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async streamGenerate(
    @Param('id') id: string,
    @Res() res: Response,
    @GetRequestUser() user: RequestUser,
  ): Promise<void> {
    console.log('[AgentController] /agent/stream/generate called', {
      id,
      userId: user.connexus_user_id,
    });
    try {
      await this.agentService.streamGenerate(id, res);
    } catch (err: any) {
      console.error('[AgentController] streamGenerate failed', {
        id,
        message: err?.message,
        stack: err?.stack,
        userId: user.connexus_user_id,
      });
      if (!res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ error: 'Failed to stream generation' })}\n\n`,
        );
        res.write('event: end\ndata: [DONE]\n\n');
        res.end();
      }
    }
  }
}
