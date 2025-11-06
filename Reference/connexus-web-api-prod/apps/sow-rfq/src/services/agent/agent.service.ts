/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import { envValues } from '@app/core';
import { PrismaService as PrismaClientService } from '@app/prisma';
import { constructSowAgentPrompt, GptPromptOptions } from '@app/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentSession,
  AnswerRequest,
  AnswerResponse,
  GenerateResponse,
  InterviewDecision,
  StartResponse,
} from './agent.types';
import { StartAgentDto } from './dto/agent.dto';

@Injectable()
export class AgentService implements OnModuleDestroy {
  private readonly sessions: Map<string, AgentSession> = new Map();

  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private readonly MAX_CONVERSATION_LENGTH = 100; // Prevent unlimited conversation growth

  private readonly MAX_SESSIONS = 1000; // Prevent memory explosion

  constructor(private readonly prisma: PrismaClientService) {
    // Start cleanup interval
    this.startCleanupInterval();
  }

  onModuleDestroy() {
    // Clean up all sessions when module is destroyed
    this.sessions.clear();
  }

  private startCleanupInterval(): void {
    // Clean up expired sessions every hour
    setInterval(
      () => {
        this.cleanupExpiredSessions();
      },
      60 * 60 * 1000, // 1 hour
    );
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    this.sessions.forEach((session, id) => {
      if (now - session.createdAt > this.SESSION_TIMEOUT) {
        expiredSessions.push(id);
      }
    });

    expiredSessions.forEach((id) => {
      this.sessions.delete(id);
      console.log(`[AgentService] Cleaned up expired session: ${id}`);
    });

    // If we have too many sessions, remove oldest ones
    if (this.sessions.size > this.MAX_SESSIONS) {
      const sessionsArray = Array.from(this.sessions.entries());
      sessionsArray.sort((a, b) => a[1].createdAt - b[1].createdAt);

      const sessionsToRemove = sessionsArray.slice(
        0,
        this.sessions.size - this.MAX_SESSIONS,
      );
      sessionsToRemove.forEach(([id]) => {
        this.sessions.delete(id);
        console.log(
          `[AgentService] Cleaned up old session due to limit: ${id}`,
        );
      });
    }
  }

  private truncateConversation(session: AgentSession): void {
    if (session.conversation.length > this.MAX_CONVERSATION_LENGTH) {
      // Keep the first and last few messages, remove the middle ones
      const keepCount = Math.floor(this.MAX_CONVERSATION_LENGTH / 2);
      const firstMessages = session.conversation.slice(0, keepCount);
      const lastMessages = session.conversation.slice(-keepCount);

      session.conversation = [
        ...firstMessages,
        {
          role: 'assistant',
          content: '... (conversation truncated for performance) ...',
        },
        ...lastMessages,
      ];

      console.log(
        `[AgentService] Truncated conversation for session: ${session.id}`,
      );
    }
  }

  async start(options: StartAgentDto): Promise<StartResponse> {
    try {
      console.log(
        '[AgentService] start - validating inputs and generating sample SOW',
      );

      // Validate client exists
      const client = await this.prisma.client.client.findUnique({
        where: { id: options.clientId },
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }

      // Validate service exists
      const service = await this.prisma.client.services.findUnique({
        where: { id: options.serviceId },
        select: { id: true, servicesName: true, serviceDescription: true },
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }

      // Validate properties exist and belong to the client
      const properties = await this.prisma.client.clientProperties.findMany({
        where: {
          id: { in: options.propertyIds },
          deletedAt: null,
          clientId: options.clientId,
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });

      if (properties.length === 0) {
        throw new NotFoundException(
          'Properties not found or do not belong to the specified client',
        );
      }

      if (properties.length !== options.propertyIds.length) {
        throw new BadRequestException(
          'Some properties were not found or do not belong to the specified client',
        );
      }

      // Ensure unique scope name for this client
      await this.ensureUniqueScopeName(options.sowName, options.clientId);

      const sampleSow = await this.generateSampleSOW({
        serviceName: service.servicesName,
        serviceDescription: service.serviceDescription,
        sowName: options.sowName,
        clientName: client.name,
        propertyIds: options.propertyIds,
      });

      const session: AgentSession = {
        id: uuidv4(),
        createdAt: Date.now(),
        conversation: [],
        sampleSow,
        phase: 'review',
        collectedInfo: {},
        serviceName: service.servicesName,
        serviceDescription: service.serviceDescription,
      };

      this.sessions.set(session.id, session);

      const question = `Here's a sample Scope of Work for ${options.serviceName}:\n\n${sampleSow}\n\nWould you like any changes or modifications to this scope of work? Please let me know what specific aspects you'd like to adjust.`;

      console.log('[AgentService] start success', { id: session.id });

      return {
        id: session.id,
        questionKey: 'review_changes',
        question,
        remaining: 1,
        sampleSow,
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('[AgentService] start error', {
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error('[AgentService] start error', { error });
      }
      throw error;
    }
  }

  private async ensureUniqueScopeName(
    scopeName: string,
    clientId: string,
  ): Promise<void> {
    const existingScope = await this.prisma.client.scopeOfWork.findFirst({
      where: {
        scopeName: { equals: scopeName, mode: 'insensitive' },
        deletedAt: null,
        clientId,
      },
    });

    if (existingScope) {
      throw new BadRequestException(
        'Scope of work name must be unique for this client',
      );
    }
  }

  async answer(body: AnswerRequest): Promise<AnswerResponse> {
    const { id, answer } = body;
    console.log('[AgentService] answer', { id });

    try {
      const session = this.sessions.get(id);
      if (!session) {
        console.error('[AgentService] answer invalid session', { id });
        throw new NotFoundException('Session not found');
      }

      // Add user's response to conversation
      session.conversation.push({ role: 'user', content: answer });

      // Handle different phases
      if (session.phase === 'review') {
        return await this.handleReviewPhase(session, answer);
      }
      if (session.phase === 'interview') {
        return await this.handleInterviewPhase(session, answer);
      }
      if (session.phase === 'summary') {
        return await this.handleSummaryPhase(session, answer);
      }

      return { id, done: true };
    } catch (error) {
      if (error instanceof Error) {
        console.error('[AgentService] answer error', {
          id,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error('[AgentService] answer error', { id, error });
      }
      throw error;
    }
  }

  private async handleReviewPhase(
    session: AgentSession,
    answer: string,
  ): Promise<AnswerResponse> {
    const lower = answer.toLowerCase();

    // Check if user wants no changes
    if (
      lower.includes('no') ||
      lower.includes('no change') ||
      lower.includes('looks good') ||
      lower.includes('good as is')
    ) {
      console.log('[AgentService] user accepted sample as-is', {
        id: session.id,
      });
      session.phase = 'complete';
      return { id: session.id, done: true };
    }

    // User wants changes - move to interview phase
    session.phase = 'interview';
    session.collectedInfo.change_requests = answer;

    // Use LLM to ask the first relevant question
    const nextQuestion = await this.getNextQuestion(session);

    if (nextQuestion) {
      session.conversation.push({ role: 'assistant', content: nextQuestion });
      return {
        id: session.id,
        done: false,
        next: {
          questionKey: 'llm_question',
          question: nextQuestion,
          remaining: 1,
        },
      };
    }

    // If no question needed, move to summary
    return this.moveToSummaryPhase(session);
  }

  private async handleInterviewPhase(
    session: AgentSession,
    answer: string,
  ): Promise<AnswerResponse> {
    // Check if user wants to generate final document
    const wantsGenerate = this.detectGenerateIntent(answer);
    if (wantsGenerate) {
      console.log('[AgentService] user requested generation during interview', {
        id: session.id,
      });
      return this.moveToSummaryPhase(session);
    }

    // Store the answer with a key based on conversation context
    const infoKey = `info_${session.conversation.length}`;
    session.collectedInfo[infoKey] = answer;

    // Use LLM to decide next action
    const nextAction = await this.analyzeInterviewAndDecide(session);

    if (nextAction.done) {
      console.log('[AgentService] LLM determined interview complete', {
        id: session.id,
      });
      return this.moveToSummaryPhase(session);
    }

    if (nextAction.question) {
      session.conversation.push({
        role: 'assistant',
        content: nextAction.question,
      });

      console.log('[AgentService] next question (LLM-driven)', {
        id: session.id,
        question: `${nextAction.question.substring(0, 100)}...`,
      });

      return {
        id: session.id,
        done: false,
        next: {
          questionKey: 'llm_question',
          question: nextAction.question,
          remaining: 1,
        },
      };
    }

    // Fallback - move to summary
    return this.moveToSummaryPhase(session);
  }

  private async handleSummaryPhase(
    session: AgentSession,
    answer: string,
  ): Promise<AnswerResponse> {
    const lower = answer.toLowerCase();

    if (
      lower.includes('yes') ||
      lower.includes('approve') ||
      lower.includes('ok') ||
      lower.includes('good') ||
      lower.includes('proceed')
    ) {
      console.log('[AgentService] user approved changes', { id: session.id });
      session.phase = 'complete';
      return { id: session.id, done: true };
    }

    if (
      lower.includes('no') ||
      lower.includes('cancel') ||
      lower.includes('stop')
    ) {
      console.log('[AgentService] user rejected changes', { id: session.id });
      session.phase = 'complete';
      return { id: session.id, done: true };
    }

    // If unclear response, ask for clarification
    const clarificationQuestion =
      'Please confirm: Do you approve these changes to proceed with generating the final Scope of Work? (Yes/No)';
    session.conversation.push({
      role: 'assistant',
      content: clarificationQuestion,
    });

    return {
      id: session.id,
      done: false,
      next: {
        questionKey: 'confirmation',
        question: clarificationQuestion,
        remaining: 1,
      },
    };
  }

  private async moveToSummaryPhase(
    session: AgentSession,
  ): Promise<AnswerResponse> {
    console.log('[AgentService] moving to summary phase', { id: session.id });
    session.phase = 'summary';

    const summary = await this.generateChangeSummary(session);
    session.conversation.push({ role: 'assistant', content: summary });

    return {
      id: session.id,
      done: false,
      next: {
        questionKey: 'summary_approval',
        question: summary,
        remaining: 1,
      },
    };
  }

  private async getNextQuestion(session: AgentSession): Promise<string | null> {
    const conversationHistory = session.conversation
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const directive = `You are a ${session.serviceName} Scope of Work specialist. Based on the user's change requests, ask ONE specific clarifying question to gather more information needed for the SOW.

CONTEXT:
- Sample SOW: ${session.sampleSow}
- User's change requests: ${session.collectedInfo.change_requests}
- Conversation History:
${conversationHistory}

TASK:
Ask ONE specific, relevant question to clarify the user's requirements. Focus on the most important missing information needed to modify the SOW.

GUIDELINES:
- Ask specific questions about the changes they mentioned
- Focus on practical details needed for the SOW
- Keep the question concise and focused
- If sufficient information is already provided, return null

Return ONLY the question as a string, or "null" if no question is needed.`;

    const requestBody = {
      messages: [{ role: 'user', content: directive }],
      max_tokens: 256,
      temperature: 0.3,
      top_p: 0.95,
    };

    try {
      const resp = await fetch(envValues.gpt.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': envValues.gpt.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!resp.ok) {
        console.error(
          '[AgentService] Azure OpenAI API error:',
          resp.status,
          await resp.text(),
        );
        return null;
      }

      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || '';

      if (text.toLowerCase().includes('null') || text.trim() === '') {
        return null;
      }

      return text.trim();
    } catch (error) {
      console.error('[AgentService] getNextQuestion error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  private async analyzeInterviewAndDecide(
    session: AgentSession,
  ): Promise<InterviewDecision> {
    const conversationHistory = session.conversation
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const directive = `You are a ${session.serviceName} Scope of Work specialist. Analyze the conversation and decide what to do next.

CONTEXT:
- Sample SOW: ${session.sampleSow}
- Collected Information: ${JSON.stringify(session.collectedInfo)}
- Conversation History:
${conversationHistory}

TASK:
Based on the conversation, determine if:
1) We have enough information to proceed to summary (return {"done": true})
2) We need to ask another clarifying question (return {"done": false, "question": "your question here"})

GUIDELINES:
- Ask specific, relevant questions based on what the user has mentioned
- Focus on missing or unclear information needed for the SOW
- If sufficient information is collected, signal completion
- Keep questions concise and focused

Return ONLY valid JSON: {"done": boolean, "question": string (if done=false)}`;

    const requestBody = {
      messages: [{ role: 'user', content: directive }],
      max_tokens: 512,
      temperature: 0.3,
      top_p: 0.95,
    };

    try {
      const resp = await fetch(envValues.gpt.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': envValues.gpt.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!resp.ok) {
        console.error(
          '[AgentService] Azure OpenAI API error:',
          resp.status,
          await resp.text(),
        );
        return { done: true };
      }

      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || '';

      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (e) {
        return { done: true };
      }
    } catch (error) {
      console.error('[AgentService] analyzeInterviewAndDecide error:', error);
      return { done: true };
    }
  }

  private async generateChangeSummary(session: AgentSession): Promise<string> {
    const conversationHistory = session.conversation
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const directive = `You are a Scope of Work specialist. Create a summary of changes to be made to the SOW.

CONTEXT:
- Original Sample SOW: ${session.sampleSow}
- Collected Information: ${JSON.stringify(session.collectedInfo)}
- Conversation History:
${conversationHistory}

TASK:
Create a clear summary showing:
1. What changes will be made to the original SOW
2. What new information will be added
3. What sections will be modified

Format as a professional summary that the user can review and approve.

Return the summary as plain text.`;

    const requestBody = {
      messages: [{ role: 'user', content: directive }],
      max_tokens: 1024,
      temperature: 0.4,
      top_p: 0.95,
    };

    try {
      const resp = await fetch(envValues.gpt.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': envValues.gpt.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!resp.ok) {
        console.error(
          '[AgentService] Azure OpenAI API error:',
          resp.status,
          await resp.text(),
        );
        return 'Summary generation failed. Please proceed with the changes discussed.';
      }

      const data = await resp.json();
      const summary =
        data?.choices?.[0]?.message?.content || 'Summary generation failed.';

      return `${summary}\n\nDo you approve these changes to proceed with generating the final Scope of Work? (Yes/No)`;
    } catch (error) {
      console.error('[AgentService] generateChangeSummary error:', error);
      return 'Summary generation failed. Please proceed with the changes discussed.\n\nDo you approve these changes to proceed with generating the final Scope of Work? (Yes/No)';
    }
  }

  private detectGenerateIntent(text: string): boolean {
    const lower = text.toLowerCase();
    const generateKeywords = [
      'generate',
      'final',
      'finalize',
      'complete',
      'done',
      'ready',
      'produce',
      'create',
      'make',
      'build',
      'finish',
      'submit',
      'looks good',
      'good to go',
      "that's all",
      'that is all',
    ];
    return generateKeywords.some((keyword) => lower.includes(keyword));
  }

  private async generateSampleSOW(options: GptPromptOptions): Promise<string> {
    const prompt = constructSowAgentPrompt(
      options.serviceName,
      options.serviceDescription,
    );

    const requestBody = {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.95,
    };

    try {
      const resp = await fetch(envValues.gpt.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': envValues.gpt.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!resp.ok) {
        console.error(
          '[AgentService] Azure OpenAI API error:',
          resp.status,
          await resp.text(),
        );
        throw new Error(`Azure OpenAI API error: ${resp.status}`);
      }

      const data = await resp.json();
      return (
        data?.choices?.[0]?.message?.content || 'Sample SOW generation failed'
      );
    } catch (error) {
      console.error('[AgentService] generateSampleSOW error', {
        message: error,
      });
      return 'Sample SOW generation failed - please proceed with manual input';
    }
  }

  async getCurrentDocument(id: string): Promise<GenerateResponse> {
    try {
      console.log('[AgentService] getCurrentDocument', { id });

      const session = this.sessions.get(id);
      if (!session) {
        console.error('[AgentService] getCurrentDocument invalid session', {
          id,
        });
        throw new NotFoundException('Session not found');
      }

      // If interview is complete, return the final document
      if (session.phase === 'complete') {
        return await this.generate(id);
      }

      // If we have collected information, generate an updated document
      if (Object.keys(session.collectedInfo).length > 1) {
        // More than just change_requests
        const conversationSummary = session.conversation
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join('\n');

        const prompt = `Generate an updated Scope of Work for a ${session.serviceName} project based on the following information:

ORIGINAL SAMPLE SOW:
${session.sampleSow}

COLLECTED INFORMATION:
${JSON.stringify(session.collectedInfo, null, 2)}

CONVERSATION HISTORY:
${conversationSummary}

Create a comprehensive, professional Scope of Work that incorporates all the changes and requirements discussed so far. This is an intermediate update - the document may be further refined as more information is collected. Format it as clean markdown with proper sections and structure.`;

        const requestBody = {
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
          temperature: 0.5,
          top_p: 0.95,
        };

        const resp = await fetch(envValues.gpt.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': envValues.gpt.apiKey,
          },
          body: JSON.stringify(requestBody),
        });

        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          console.error(
            '[AgentService] getCurrentDocument Azure OpenAI error',
            { status: resp.status, errText },
          );
          throw new Error('Failed to generate current document');
        }

        const data = await resp.json();
        const markdown =
          data?.choices?.[0]?.message?.content ||
          'Failed to generate current document';

        let markdownContent = markdown;
        // Sanitize the markdown field to remove any triple backticks and any leading/trailing whitespace
        if (typeof markdown === 'string') {
          markdownContent = markdownContent
            .replace(/```[\s\S]*?(\n)?/g, '')
            .trim();
        }

        console.log('[AgentService] getCurrentDocument success', { id });

        return { id, markdown: markdownContent };
      }

      // Return the original sample SOW
      return { id, markdown: session.sampleSow };
    } catch (error) {
      console.error('[AgentService] getCurrentDocument error', {
        id,
        message: error,
        stack: error,
      });
      throw error;
    }
  }

  async generate(id: string): Promise<GenerateResponse> {
    try {
      console.log('[AgentService] generate', { id });

      const session = this.sessions.get(id);
      if (!session) {
        console.error('[AgentService] generate invalid session', { id });
        throw new NotFoundException('Session not found');
      }

      const conversationSummary = session.conversation
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `Generate a final Scope of Work for a ${session.serviceName} project based on the following information:

ORIGINAL SAMPLE SOW:
${session.sampleSow}

COLLECTED INFORMATION:
${JSON.stringify(session.collectedInfo, null, 2)}

CONVERSATION HISTORY:
${conversationSummary}

Create a comprehensive, professional Scope of Work that incorporates all the changes and requirements discussed in the conversation. Format it as clean markdown with proper sections and structure.`;

      const requestBody = {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.5,
        top_p: 0.95,
      };

      const resp = await fetch(envValues.gpt.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': envValues.gpt.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        console.error('[AgentService] generate Azure OpenAI error', {
          status: resp.status,
          errText,
        });
        throw new Error('Failed to generate final SOW');
      }

      const data = await resp.json();
      const markdown =
        data?.choices?.[0]?.message?.content || 'Failed to generate SOW';

      let markdownContent = markdown;
      // Sanitize the markdown field to remove any triple backticks and any leading/trailing whitespace
      if (typeof markdown === 'string') {
        markdownContent = markdownContent
          .replace(/```[\s\S]*?(\n)?/g, '')
          .trim();
      }

      console.log('[AgentService] getCurrentDocument success', { id });

      return { id, markdown: markdownContent };
    } catch (error) {
      console.error('[AgentService] generate error', {
        id,
        message: error,
        stack: error,
      });
      throw error;
    }
  }

  private setSSEHeaders(res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'X-Accel-Buffering': 'no', // Prevents nginx from buffering the response
      'X-Content-Type-Options': 'nosniff',
      Pragma: 'no-cache',
      Expires: '0',
    });
  }

  async streamDocumentUpdate(id: string, res: Response): Promise<void> {
    try {
      console.log('[AgentService] streamDocumentUpdate', { id });

      const session = this.sessions.get(id);
      if (!session) {
        console.error('[AgentService] streamDocumentUpdate invalid session', {
          id,
        });
        res.write(
          `data: ${JSON.stringify({ error: 'Session not found' })}\n\n`,
        );
        res.write('event: end\ndata: [DONE]\n\n');
        res.end();
        return;
      }

      // Set SSE headers with nginx support
      this.setSSEHeaders(res);

      // If interview is complete, stream the final document
      if (session.phase === 'complete') {
        await this.streamGenerate(id, res);
        return;
      }

      // If we have collected information, generate an updated document
      if (Object.keys(session.collectedInfo).length > 1) {
        // More than just change_requests
        const conversationSummary = session.conversation
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join('\n');

        const prompt = `Generate an updated Scope of Work for a ${session.serviceName} project based on the following information:

ORIGINAL SAMPLE SOW:
${session.sampleSow}

COLLECTED INFORMATION:
${JSON.stringify(session.collectedInfo, null, 2)}

CONVERSATION HISTORY:
${conversationSummary}

Create a comprehensive, professional Scope of Work that incorporates all the changes and requirements discussed so far. This is an intermediate update - the document may be further refined as more information is collected. Format it as clean markdown with proper sections and structure.`;

        await this.streamAzureOpenAIResponse(prompt, res, 'document_update');
        return;
      }

      // Return the original sample SOW
      res.write(`data: ${JSON.stringify({ text: session.sampleSow })}\n\n`);
      res.write('event: end\ndata: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('[AgentService] streamDocumentUpdate error', {
        id,
        message: error,
        stack: error,
      });
      res.write(
        `data: ${JSON.stringify({ error: 'Failed to stream document update' })}\n\n`,
      );
      res.write('event: end\ndata: [DONE]\n\n');
      res.end();
    }
  }

  async streamGenerate(id: string, res: Response): Promise<void> {
    try {
      console.log('[AgentService] streamGenerate', { id });

      const session = this.sessions.get(id);
      if (!session) {
        console.error('[AgentService] streamGenerate invalid session', { id });
        res.write(
          `data: ${JSON.stringify({ error: 'Session not found' })}\n\n`,
        );
        res.write('event: end\ndata: [DONE]\n\n');
        res.end();
        return;
      }

      // Set SSE headers with nginx support
      this.setSSEHeaders(res);

      const conversationSummary = session.conversation
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `Generate a final Scope of Work for a ${session.serviceName} project based on the following information:

ORIGINAL SAMPLE SOW:
${session.sampleSow}

COLLECTED INFORMATION:
${JSON.stringify(session.collectedInfo, null, 2)}

CONVERSATION HISTORY:
${conversationSummary}

Create a comprehensive, professional Scope of Work that incorporates all the changes and requirements discussed in the conversation. Format it as clean markdown with proper sections and structure.`;

      await this.streamAzureOpenAIResponse(prompt, res, 'final_generation');
    } catch (error) {
      console.error('[AgentService] streamGenerate error', {
        id,
        message: error,
        stack: error,
      });
      res.write(
        `data: ${JSON.stringify({ error: 'Failed to stream final generation' })}\n\n`,
      );
      res.write('event: end\ndata: [DONE]\n\n');
      res.end();
    }
  }

  private async streamAzureOpenAIResponse(
    prompt: string,
    res: Response,
    operation: string,
  ): Promise<void> {
    try {
      console.log(`[AgentService] streamAzureOpenAIResponse - ${operation}`);

      const requestBody = {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.5,
        top_p: 0.95,
        stream: true,
      };

      const response = await fetch(envValues.gpt.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': envValues.gpt.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[AgentService] Azure OpenAI API error: ${response.status} ${response.statusText}`,
        );
        console.error(`[AgentService] Error response body:`, errorText);

        let errorMessage = 'Failed to get response from Azure OpenAI';
        if (response.status === 400) {
          errorMessage = 'Invalid request to Azure OpenAI API';
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized - check Azure OpenAI API key';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden - check Azure OpenAI permissions';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded - try again later';
        }

        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.write('event: end\ndata: [DONE]\n\n');
        res.end();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.error(`[AgentService] No reader available for ${operation}`);
        res.write('event: end\ndata: [DONE]\n\n');
        res.end();
        return;
      }

      console.log(`[AgentService] Starting to read stream for ${operation}`);

      let jsonBuffer = '';

      let done = false;
      while (!done) {
        // eslint-disable-next-line no-await-in-loop
        const result = await reader.read();
        done = result.done;

        if (done) {
          console.log(`[AgentService] Stream completed for ${operation}`);
          break;
        }

        const { value } = result;

        if (!value) {
          break;
        }

        const chunk = new TextDecoder().decode(value);
        console.log(
          `[AgentService] Raw chunk received for ${operation}:`,
          `${chunk.substring(0, 100)}...`,
        );
        jsonBuffer += chunk;

        try {
          const lines = jsonBuffer.split('\n');

          // Use array iteration instead of for...of and avoid continue
          lines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed === '') {
              return;
            }
            if (trimmed === 'data: [DONE]') {
              console.log(`[AgentService] Stream finished for ${operation}`);
              res.write('event: end\ndata: [DONE]\n\n');
              res.end();
              return;
            }

            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') {
                console.log(`[AgentService] Stream finished for ${operation}`);
                res.write('event: end\ndata: [DONE]\n\n');
                res.end();
                return;
              }

              try {
                const parsed = JSON.parse(data);

                if (parsed.choices?.[0]?.delta?.content) {
                  const text = parsed.choices[0].delta.content;
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                } else if (parsed.choices?.[0]?.finish_reason) {
                  console.log(
                    `[AgentService] Stream finished with reason: ${parsed.choices[0].finish_reason}`,
                  );
                  res.write('event: end\ndata: [DONE]\n\n');
                  res.end();
                } else if (parsed.error) {
                  console.error(
                    `[AgentService] Azure OpenAI API error in stream:`,
                    parsed.error,
                  );
                  res.write(
                    `data: ${JSON.stringify({ error: parsed.error.message || 'Azure OpenAI API error' })}\n\n`,
                  );
                }
              } catch (parseError) {
                console.error(
                  `[AgentService] Failed to parse line:`,
                  line,
                  parseError,
                );
              }
            }
          });

          // Clear processed lines from buffer
          const lastLine = lines[lines.length - 1];
          if (lastLine.startsWith('data: ')) {
            jsonBuffer = lastLine;
          } else {
            jsonBuffer = '';
          }
        } catch (bufferError) {
          console.error(
            `[AgentService] Error processing buffer for ${operation}:`,
            bufferError,
          );
        }
      }

      res.write('event: end\ndata: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error(
        `[AgentService] streamAzureOpenAIResponse error for ${operation}:`,
        error,
      );
      res.write(
        `data: ${JSON.stringify({ error: 'Failed to stream response' })}\n\n`,
      );
      res.write('event: end\ndata: [DONE]\n\n');
      res.end();
    }
  }
}
