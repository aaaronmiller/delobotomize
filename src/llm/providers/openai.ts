/**
 * OpenAI Provider
 * Supports both completion and embeddings
 */

import {
  ILLMProvider,
  LLMConfig,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  LLMError,
  AuthenticationError,
  RateLimitError
} from '../provider-interface';

export class OpenAIProvider implements ILLMProvider {
  readonly name = 'openai';
  readonly supportsEmbeddings = true;

  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o';
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const messages: any[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        stop: request.stop
      })
    });

    if (!response.ok) await this.handleError(response);

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
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const input = Array.isArray(request.text) ? request.text : [request.text];
    const model = request.model || 'text-embedding-3-small';

    const response = await fetch(`${this.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, input })
    });

    if (!response.ok) await this.handleError(response);

    const data = await response.json() as any;
    return {
      embeddings: data.data.map((item: any) => item.embedding),
      model: data.model,
      usage: { totalTokens: data.usage.total_tokens }
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.complete({ prompt: 'Test', maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }

  private async handleError(response: Response): Promise<never> {
    const status = response.status;
    if (status === 401) throw new AuthenticationError(this.name);
    if (status === 429) throw new RateLimitError(this.name);
    throw new LLMError(`OpenAI error: ${status}`, this.name, status);
  }
}