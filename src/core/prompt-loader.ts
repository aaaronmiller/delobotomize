import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

export interface PromptMetadata {
  prompt_id: string;
  baseline_version: string;
  author?: string;
  created?: string;
  updated?: string;
}

export interface OptimizationMetadata {
  baseline_version: string;
  test_variations: Array<{
    id: string;
    hypothesis: string;
    changes: string;
    expected_improvement: string;
  }>;
  performance_metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    last_evaluated?: string;
  };
}

export interface Prompt {
  id: string;
  content: string;
  metadata: PromptMetadata;
  optimization?: OptimizationMetadata;
}

export interface PromptLoaderOptions {
  version?: string;
  includeOptimization?: boolean;
  fallback?: boolean;
}

/**
 * Loads and manages versioned prompts with optimization metadata
 */
export class PromptLoader {
  private promptsPath = './prompts';
  private cache: Map<string, Prompt> = new Map();

  constructor(promptsPath?: string) {
    if (promptsPath) {
      this.promptsPath = promptsPath;
    }
  }

  /**
   * Load a specific prompt by ID
   */
  async load(promptId: string, options: PromptLoaderOptions = {}): Promise<Prompt> {
    const cacheKey = `${promptId}:${options.version || 'latest'}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Find the prompt file
    const promptFile = await this.findPromptFile(promptId);
    if (!promptFile) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    // Parse the file
    const prompt = await this.parsePromptFile(promptFile);

    // Cache it
    this.cache.set(cacheKey, prompt);

    return prompt;
  }

  /**
   * Load all prompts from a directory
   */
  async loadAll(options: PromptLoaderOptions = {}): Promise<Prompt[]> {
    const prompts: Prompt[] = [];

    // Recursively find all .md files
    const files = await this.findAllPromptFiles();

    for (const file of files) {
      try {
        const prompt = await this.parsePromptFile(file);
        prompts.push(prompt);
      } catch (error) {
        console.error(`Failed to load prompt ${file}:`, error);
      }
    }

    return prompts;
  }

  /**
   * Get a specific variation of a prompt
   */
  async getVariation(promptId: string, variationId: string): Promise<string> {
    const prompt = await this.load(promptId, { includeOptimization: true });

    if (!prompt.optimization) {
      throw new Error(`No optimization metadata found for prompt: ${promptId}`);
    }

    const variation = prompt.optimization.test_variations.find(v => v.id === variationId);
    if (!variation) {
      throw new Error(`Variation not found: ${variationId}`);
    }

    // Apply the variation changes to the base content
    return this.applyVariation(prompt.content, variation.changes);
  }

  /**
   * Update performance metrics for a prompt
   */
  async updateMetrics(promptId: string, metrics: OptimizationMetadata['performance_metrics']): Promise<void> {
    const promptFile = await this.findPromptFile(promptId);
    if (!promptFile) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    const content = await fs.readFile(promptFile, 'utf-8');
    const parts = this.splitFrontMatter(content);

    // Parse and update YAML
    let frontMatter: any = yaml.parse(parts.frontMatter || '{}');

    if (!frontMatter.optimization_metadata) {
      frontMatter.optimization_metadata = {};
    }

    frontMatter.optimization_metadata.performance_metrics = {
      ...frontMatter.optimization_metadata.performance_metrics,
      ...metrics,
      last_evaluated: new Date().toISOString()
    };

    // Write back
    const updatedContent = this.combineFrontMatter(
      yaml.stringify(frontMatter),
      parts.content
    );

    await fs.writeFile(promptFile, updatedContent);

    // Clear cache
    this.cache.clear();
  }

  /**
   * Clear the prompt cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // Private methods

  private async findPromptFile(promptId: string): Promise<string | null> {
    // Search recursively through prompts directory
    const files = await this.findAllPromptFiles();

    for (const file of files) {
      const fileName = path.basename(file, '.md');

      if (fileName === promptId) {
        return file;
      }

      // Also check if promptId matches the metadata
      try {
        const content = await fs.readFile(file, 'utf-8');
        const { frontMatter } = this.splitFrontMatter(content);
        if (frontMatter) {
          const metadata = yaml.parse(frontMatter) as PromptMetadata;
          if (metadata.prompt_id === promptId) {
            return file;
          }
        }
      } catch {
        // Skip invalid files
      }
    }

    return null;
  }

  private async findAllPromptFiles(): Promise<string[]> {
    const files: string[] = [];

    const scan = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    };

    try {
      await scan(this.promptsPath);
    } catch (error) {
      console.error(`Failed to scan prompts directory: ${this.promptsPath}`, error);
    }

    return files;
  }

  private async parsePromptFile(filePath: string): Promise<Prompt> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontMatter, content: markdown } = this.splitFrontMatter(content);

    if (!frontMatter) {
      throw new Error(`No front matter found in: ${filePath}`);
    }

    const metadata = yaml.parse(frontMatter) as PromptMetadata & { optimization_metadata?: OptimizationMetadata };

    return {
      id: metadata.prompt_id || path.basename(filePath, '.md'),
      content: markdown.trim(),
      metadata: {
        prompt_id: metadata.prompt_id,
        baseline_version: metadata.baseline_version,
        author: metadata.author,
        created: metadata.created,
        updated: metadata.updated
      },
      optimization: metadata.optimization_metadata
    };
  }

  private splitFrontMatter(content: string): { frontMatter: string; content: string } {
    const lines = content.split('\n');

    if (lines[0] !== '---') {
      return { frontMatter: '', content };
    }

    const endIdx = lines.findIndex((line, idx) => idx > 0 && line === '---');
    if (endIdx === -1) {
      return { frontMatter: '', content };
    }

    const frontMatter = lines.slice(1, endIdx).join('\n');
    const contentLines = lines.slice(endIdx + 1).join('\n');

    return { frontMatter, content: contentLines };
  }

  private combineFrontMatter(frontMatter: string, content: string): string {
    return `---\n${frontMatter}---\n\n${content}`;
  }

  private applyVariation(baseContent: string, changes: string): string {
    // Simple variation application - can be made more sophisticated
    // For now, just append the changes as context
    return `${baseContent}\n\n## Variation Applied\n${changes}`;
  }
}