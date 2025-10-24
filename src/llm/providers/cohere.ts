/**
 * Cohere Provider
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

export class CohereProvider implements ILLMProvider {
  readonly name = 'cohere';
  readonly supportsEmbeddings = true;

  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'command-r-plus';
    this.baseURL = config.baseURL || 'https://api.cohere.ai/v1';
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // Cohere uses a different format: preamble + message
    const preamble = request.systemPrompt || undefined;
    const message = request.prompt;

    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        message,
        preamble,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        stop_sequences: request.stop
      })
    });

    if (!response.ok) await this.handleError(response);

    const data = await response.json() as any;

    return {
      content: data.text,
      model: this.model,
      usage: {
        promptTokens: data.meta?.billed_units?.input_tokens || 0,
        completionTokens: data.meta?.billed_units?.output_tokens || 0,
        totalTokens: (data.meta?.billed_units?.input_tokens || 0) + (data.meta?.billed_units?.output_tokens || 0)
      },
      finishReason: data.finish_reason === 'COMPLETE' ? 'stop' : 'length'
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const texts = Array.isArray(request.text) ? request.text : [request.text];
    const model = request.model || 'embed-english-v3.0';

    const response = await fetch(`${this.baseURL}/embed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        texts,
        input_type: 'search_document',
        embedding_types: ['float']
      })
    });

    if (!response.ok) await this.handleError(response);

    const data = await response.json() as any;

    return {
      embeddings: data.embeddings.float,
      model,
      usage: {
        totalTokens: data.meta?.billed_units?.input_tokens || texts.reduce((sum, t) => sum + t.length / 4, 0)
      }
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
    return [
      'command-r-plus',
      'command-r',
      'command',
      'command-light'
    ];
  }

  private async handleError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = `HTTP ${status}`;

    try {
      const errorData = await response.json() as any;
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Couldn't parse error
    }

    if (status === 401 || status === 403) {
      throw new AuthenticationError(this.name);
    }

    if (status === 429) {
      throw new RateLimitError(this.name);
    }

    throw new LLMError(errorMessage, this.name, status);
  }
}
