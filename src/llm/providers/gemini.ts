/**
 * Gemini Provider (Google)
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
  AuthenticationError
} from '../provider-interface';

export class GeminiProvider implements ILLMProvider {
  readonly name = 'gemini';
  readonly supportsEmbeddings = true;

  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-2.0-flash-exp';
    this.baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const url = `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const parts = [];
    if (request.systemPrompt) {
      parts.push({ text: `System: ${request.systemPrompt}\n\nUser: ${request.prompt}` });
    } else {
      parts.push({ text: request.prompt });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          maxOutputTokens: request.maxTokens || 4096,
          temperature: request.temperature ?? 0.7,
          stopSequences: request.stop
        }
      })
    });

    if (!response.ok) {
      if (response.status === 401) throw new AuthenticationError(this.name);
      throw new LLMError(`Gemini error: ${response.status}`, this.name, response.status);
    }

    const data = await response.json() as any;
    const candidate = data.candidates[0];

    return {
      content: candidate.content.parts[0].text,
      model: this.model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      },
      finishReason: candidate.finishReason === 'STOP' ? 'stop' : 'length'
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const texts = Array.isArray(request.text) ? request.text : [request.text];
    const model = request.model || 'text-embedding-004';
    const url = `${this.baseURL}/models/${model}:embedContent?key=${this.apiKey}`;

    const embeddings: number[][] = [];

    for (const text of texts) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] }
        })
      });

      if (!response.ok) throw new LLMError(`Gemini embedding error`, this.name);

      const data = await response.json() as any;
      embeddings.push(data.embedding.values);
    }

    return {
      embeddings,
      model,
      usage: { totalTokens: texts.reduce((sum, t) => sum + t.length / 4, 0) }
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
    return ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  }
}