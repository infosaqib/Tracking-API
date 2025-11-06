import { envValues } from '@app/core';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { GptPromptOptions, GptResponse } from './gpt.types';
import { constructSowPrompt } from './gpt.utils';

@Injectable()
export class GptService implements OnModuleInit {
  private readonly logger = new Logger(GptService.name);

  private openai: any = null;

  private isInitialized = false;

  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  async onModuleInit() {
    await this.initializationPromise;
  }

  private async initialize() {
    const OpenAI = (await import('openai')).default;
    this.openai = new OpenAI({
      apiKey: envValues.gpt.apiKey,
      baseURL: envValues.gpt.endpoint,
      defaultQuery: {
        'api-version': envValues.gpt.deploymentVersion,
      },
      defaultHeaders: { 'api-key': envValues.gpt.apiKey },
      timeout: 30000,
    });
    this.isInitialized = true;
    this.logger.log('GPT initialized');
  }

  private async ensureInitialized() {
    if (!this.isInitialized && this.initializationPromise) {
      await this.initializationPromise;
    }
    if (!this.isInitialized) {
      throw new BadRequestException('GPT not initialized');
    }
  }

  /**
   * Extracts a JSON string from a given text.
   * If the text is wrapped in triple backticks and 'json' keyword, it extracts the content within.
   * Otherwise, it assumes the text itself is a JSON string.
   * @param text The input string potentially containing JSON.
   * @returns The extracted JSON string or null if not found.
   */
  private extractJsonString(text: string): string | null {
    // Regex to find content within ```json ... ```
    const match = text.match(/```json\s*(\{.*?\})\s*```/s);
    if (match && match[1]) {
      return match[1];
    }
    // If no backticks, assume the entire text is the JSON string
    return text;
  }

  async generateSowMarkdown(options: GptPromptOptions): Promise<GptResponse> {
    await this.ensureInitialized();
    const prompt = constructSowPrompt(
      options.serviceName,
      options.serviceDescription,
    );

    const response = await this.openai.chat.completions.create({
      model: envValues.gpt.deploymentVersion || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional scope of work document generator. Generate comprehensive, well-structured scope of work documents in markdown format. Be specific, detailed, and professional. ',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const responseContent = response?.choices?.[0]?.message?.content?.trim();

    if (!responseContent) {
      this.logger.error('No content received from GPT for SOW generation.');
      throw new BadRequestException(
        'Failed to generate SOW: Empty response from AI.',
      );
    }

    try {
      const jsonString = this.extractJsonString(responseContent);

      if (!jsonString) {
        this.logger.error(
          'No valid JSON found in GPT response for SOW generation.',
        );
        throw new BadRequestException(
          'Failed to generate SOW: Invalid JSON format in AI response.',
        );
      }

      const parsedResponse = JSON.parse(jsonString);

      if (!parsedResponse || typeof parsedResponse.markdown !== 'string') {
        this.logger.error(
          'Parsed JSON does not contain a "markdown" field for SOW generation.',
        );
        throw new BadRequestException(
          'Failed to generate SOW: AI response did not contain expected markdown.',
        );
      }

      let markdownContent = parsedResponse.markdown;
      // Sanitize the markdown field to remove any triple backticks and any leading/trailing whitespace
      if (typeof parsedResponse.markdown === 'string') {
        markdownContent = markdownContent
          .replace(/```[\s\S]*?(\n)?/g, '')
          .trim();
      }

      return {
        markdown: markdownContent,
        comments: parsedResponse.comments,
        bottomComment: parsedResponse.bottomComment || '',
        metadata: {
          generatedAt: new Date().toISOString(),
          serviceName: options.serviceName,
          propertyCount: options.propertyIds.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error parsing GPT response for SOW generation: ${error}`,
      );
      // Re-throwing the error or returning a more specific error message based on your error handling strategy
      throw new BadRequestException(
        `Failed to process AI response for SOW generation: ${error}`,
      );
    }
  }

  async modifySowMarkdown(params: {
    markdown: string;
    message: string;
  }): Promise<{
    markdown: string;
    wasModified: boolean;
    comments: string;
    bottomComment: string;
  }> {
    // Sanitize the message to prevent command injection
    const sanitizedMessage = params.message
      .replace(/[`'"\\]/g, '') // Remove quotes and backslashes
      .replace(/\${.*?}/g, '') // Remove template literal expressions
      .trim(); // Remove leading/trailing whitespace

    if (!sanitizedMessage) {
      return {
        markdown: params.markdown,
        wasModified: false,
        comments: 'Empty or invalid message provided.',
        bottomComment: '',
      };
    }

    const prompt = `You are an AI assistant tasked with updating a Statement of Work (SOW) based on user comments.

    Here is the markdown of an SOW:
    ${params.markdown}
    
    Here are the user's comments:
    ${sanitizedMessage}
    
    TASK:
    1. Review the user’s comments carefully.  
    2. If the comment is **directly related to the contract, scope of work, services, service frequency, or any existing heading from the original SOW**, update the SOW accordingly.  
    3. If the comment is **not related to any contract, scope of work, services **, do NOT update the SOW.  
       - In such cases, the **comments** MUST always include this mandatory line exactly:  
         "This platform is optimized for Scope of Work (SOW) inputs only. Please provide SOW-related content."  
       - You may add a friendly conversational note around it, but the mandatory line must be present verbatim.  
    4. Make your response conversational and empathetic. The output should feel like ChatGPT is talking to the user, with:
       - A **comments**: a natural brief response (with the mandatory line if out-of-context).  
       - A **bottomComment**: a friendly follow-up like “Would you like me to make more changes?” or “Do you want to refine this further?”  
    
    OUTPUT FORMAT (strict JSON only, no extra text):
    {
      "comments": "Brief summary of what was done or why no changes were made (must include mandatory line if out-of-context).", max-limit: 100 characters
      "markdown": "The complete updated SOW markdown content here (if changes were made, or the original SOW content if no relevant changes were made).",
      "bottomComment": "Friendly closing remark that invites the user to continue, like ChatGPT would do.", max-limit: 100 characters 
      "wasModified": true/false
    }`;

    const response = await this.openai.chat.completions.create({
      model: envValues.gpt.deploymentVersion || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseContent = response?.choices?.[0]?.message?.content?.trim();

    if (!responseContent) {
      this.logger.error('No content received from GPT for SOW modification.');
      // Keep original markdown if no content is returned
      return {
        markdown: params.markdown,
        wasModified: false,
        comments: 'Failed to modify SOW: Empty response from AI.',
        bottomComment: '',
      };
    }

    try {
      const jsonString = this.extractJsonString(responseContent);

      if (!jsonString) {
        this.logger.error(
          'No valid JSON found in GPT response for SOW modification.',
        );
        // Keep original markdown if JSON is not found
        return {
          markdown: params.markdown,
          wasModified: false,
          comments: 'Failed to modify SOW: Invalid JSON format in AI response.',
          bottomComment: '',
        };
      }

      const parsedResponse = JSON.parse(jsonString);

      // Ensure that the parsed response has the expected structure and types
      if (
        !parsedResponse ||
        typeof parsedResponse.markdown !== 'string' ||
        typeof parsedResponse.wasModified !== 'boolean' ||
        typeof parsedResponse.comments !== 'string'
      ) {
        this.logger.error(
          'Parsed JSON does not contain expected fields for SOW modification.',
        );
        // Keep original markdown if expected fields are missing
        return {
          markdown: params.markdown,
          wasModified: false,
          comments:
            'Failed to modify SOW: AI response did not contain expected fields.',
          bottomComment: '',
        };
      }

      let markdownContent = parsedResponse.markdown;
      // Sanitize the markdown field to remove any triple backticks and any leading/trailing whitespace
      if (typeof parsedResponse.markdown === 'string') {
        markdownContent = markdownContent
          .replace(/```[\s\S]*?(\n)?/g, '')
          .trim();
      }

      return {
        markdown: markdownContent,
        wasModified: parsedResponse.wasModified,
        comments: parsedResponse.comments,
        bottomComment: parsedResponse.bottomComment,
        //  parsedResponse.wasModified
        //   ? parsedResponse.comments
        //   : 'This platform  is optimized for Scope of Work (SOW) inputs only. Please provide SOW-related content.',
      };
    } catch (error) {
      this.logger.error(
        `Error parsing GPT response for SOW modification: ${error}`,
      );
      // In case of any parsing error, return the original markdown and a descriptive comment
      return {
        markdown: params.markdown,
        wasModified: false,
        comments: `Failed to modify SOW due to parsing error: ${error}`,
        bottomComment: '',
      };
    }
  }
}
