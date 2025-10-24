/**
 * OpenRouter Provider
 *
 * Provides access to multiple LLM models through OpenRouter API.
 * Supports both completion and embeddings (via OpenAI models).
 */

import {
  ILLMProvider,
  LLMConfig,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  LLMError,
  RateLimitError,
  AuthenticationError
} from '../provider-interface';

export class OpenRouterProvider implements ILLMProvider {
  readonly name = 'openrouter';
  readonly supportsEmbeddings = true;

  private apiKey: string;
  private model: string;
  private baseURL: string;
  private defaultMaxTokens: number;
  private defaultTemperature: number;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'anthropic/claude-3.5-sonnet';
    this.baseURL = config.baseURL || 'https://openrouter.ai/api/v1';
    this.defaultMaxTokens = config.maxTokens || 4096;
    this.defaultTemperature = config.temperature || 0.7;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const messages: Array<{ role: string; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: request.prompt
    });

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/delobotomize/delobotomize',
          'X-Title': 'Delobotomize'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: request.maxTokens || this.defaultMaxTokens,
          temperature: request.temperature ?? this.defaultTemperature,
          stop: request.stop
        })
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json() as any;

      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        finishReason: data.choices[0].finish_reason
      };
    } catch (error) {
      if (error instanceof LLMError) throw error;
      throw new LLMError(
        `OpenRouter completion failed: ${error}`,
        this.name,
        undefined,
        error as Error
      );
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const texts = Array.isArray(request.text) ? request.text : [request.text];
    const embeddingModel = request.model || 'openai/text-embedding-3-small';

    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/delobotomize/delobotomize',
          'X-Title': 'Delobotomize'
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: texts
        })
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json() as any;

      return {
        embeddings: data.data.map((item: any) => item.embedding),
        model: data.model,
        usage: {
          totalTokens: data.usage.total_tokens
        }
      };
    } catch (error) {
      if (error instanceof LLMError) throw error;
      throw new LLMError(
        `OpenRouter embedding failed: ${error}`,
        this.name,
        undefined,
        error as Error
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.complete({
        prompt: 'Say "OK" if you can read this.',
        maxTokens: 10
      });
      return response.content.toLowerCase().includes('ok');
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) return [];

      const data = await response.json() as any;
      return data.data.map((model: any) => model.id);
    } catch {
      return [];
    }
  }

  private async handleError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = `HTTP ${status}`;

    try {
      const errorData = await response.json() as any;
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
    } catch {
      // Couldn't parse error, use default message
    }

    if (status === 401 || status === 403) {
      throw new AuthenticationError(this.name);
    }

    if (status === 429) {
      const retryAfter = response.headers.get('retry-after');
      throw new RateLimitError(
        this.name,
        retryAfter ? parseInt(retryAfter) : undefined
      );
    }

    throw new LLMError(errorMessage, this.name, status);
  }
}