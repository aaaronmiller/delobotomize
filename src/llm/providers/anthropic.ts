/**
 * Anthropic Provider
 *
 * Provides access to Claude models via Anthropic API.
 * Note: Anthropic doesn't provide embeddings - use another provider for that.
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

export class AnthropicProvider implements ILLMProvider {
  readonly name = 'anthropic';
  readonly supportsEmbeddings = false;

  private apiKey: string;
  private model: string;
  private baseURL: string;
  private defaultMaxTokens: number;
  private defaultTemperature: number;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.baseURL = config.baseURL || 'https://api.anthropic.com/v1';
    this.defaultMaxTokens = config.maxTokens || 4096;
    this.defaultTemperature = config.temperature || 1.0;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: request.maxTokens || this.defaultMaxTokens,
          temperature: request.temperature ?? this.defaultTemperature,
          system: request.systemPrompt,
          messages: [
            {
              role: 'user',
              content: request.prompt
            }
          ],
          stop_sequences: request.stop
        })
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json() as any;

      return {
        content: data.content[0].text,
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        },
        finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason
      };
    } catch (error) {
      if (error instanceof LLMError) throw error;
      throw new LLMError(
        `Anthropic completion failed: ${error}`,
        this.name,
        undefined,
        error as Error
      );
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new LLMError(
      'Anthropic does not provide embeddings. Use OpenRouter, OpenAI, or Cohere for embeddings.',
      this.name
    );
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
    // Anthropic doesn't have a models endpoint, return known models
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  private async handleError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = `HTTP ${status}`;

    try {
      const errorData = await response.json() as any;
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Couldn't parse error
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