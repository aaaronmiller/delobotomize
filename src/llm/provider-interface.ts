/**
 * Model-Agnostic LLM Provider Interface
 *
 * Provides a unified interface for multiple LLM providers:
 * - OpenRouter (access to many models)
 * - Gemini (Google)
 * - Anthropic (Claude)
 * - OpenAI (GPT)
 * - Cohere (embeddings + generation)
 *
 * This abstraction ensures delobotomize works regardless of provider choice.
 */

export interface LLMConfig {
  provider: 'openrouter' | 'gemini' | 'anthropic' | 'openai' | 'cohere';
  apiKey: string;
  model?: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stop?: string[];
}

export interface CompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'error';
}

export interface EmbeddingRequest {
  text: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    totalTokens: number;
  };
}

/**
 * Base interface that all LLM providers must implement
 */
export interface ILLMProvider {
  readonly name: string;
  readonly supportsEmbeddings: boolean;

  /**
   * Generate text completion
   */
  complete(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Generate embeddings for semantic search
   */
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /**
   * Test if the provider is properly configured
   */
  testConnection(): Promise<boolean>;

  /**
   * Get available models for this provider
   */
  getAvailableModels(): Promise<string[]>;
}

/**
 * Factory for creating LLM providers
 */
export class LLMProviderFactory {
  static async create(config: LLMConfig): Promise<ILLMProvider> {
    switch (config.provider) {
      case 'openrouter':
        const { OpenRouterProvider } = await import('./providers/openrouter');
        return new OpenRouterProvider(config);

      case 'gemini':
        const { GeminiProvider } = await import('./providers/gemini');
        return new GeminiProvider(config);

      case 'anthropic':
        const { AnthropicProvider } = await import('./providers/anthropic');
        return new AnthropicProvider(config);

      case 'openai':
        const { OpenAIProvider } = await import('./providers/openai');
        return new OpenAIProvider(config);

      case 'cohere':
        const { CohereProvider } = await import('./providers/cohere');
        return new CohereProvider(config);

      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  /**
   * Create provider from environment variables
   */
  static async createFromEnv(): Promise<ILLMProvider> {
    // Check for provider-specific API keys in order of preference
    if (process.env.OPENROUTER_API_KEY) {
      return this.create({
        provider: 'openrouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet'
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      return this.create({
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
      });
    }

    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      return this.create({
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!,
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
      });
    }

    if (process.env.OPENAI_API_KEY) {
      return this.create({
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o'
      });
    }

    if (process.env.COHERE_API_KEY) {
      return this.create({
        provider: 'cohere',
        apiKey: process.env.COHERE_API_KEY,
        model: process.env.COHERE_MODEL || 'command-r-plus'
      });
    }

    throw new Error(
      'No LLM provider configured. Set one of: OPENROUTER_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY, COHERE_API_KEY'
    );
  }
}

/**
 * Default models for each provider
 */
export const DEFAULT_MODELS = {
  openrouter: {
    completion: 'anthropic/claude-3.5-sonnet',
    embedding: 'openai/text-embedding-3-small'
  },
  gemini: {
    completion: 'gemini-2.0-flash-exp',
    embedding: 'text-embedding-004'
  },
  anthropic: {
    completion: 'claude-3-5-sonnet-20241022',
    embedding: null // Anthropic doesn't provide embeddings
  },
  openai: {
    completion: 'gpt-4o',
    embedding: 'text-embedding-3-small'
  },
  cohere: {
    completion: 'command-r-plus',
    embedding: 'embed-english-v3.0'
  }
};

/**
 * Error types for LLM operations
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class RateLimitError extends LLMError {
  constructor(provider: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
  retryAfter?: number;
}

export class AuthenticationError extends LLMError {
  constructor(provider: string) {
    super(`Authentication failed for ${provider}`, provider, 401);
    this.name = 'AuthenticationError';
  }
}