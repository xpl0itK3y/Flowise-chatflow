import { Injectable } from '@nestjs/common';
import {
  EmptyLlmResponseError,
  InvalidLlmJsonError,
} from './seo.errors';

@Injectable()
export class SeoResponseParser {
  parse(rawResponse: unknown): unknown {
    if (rawResponse && typeof rawResponse === 'object') {
      const directObject = this.extractDirectObject(
        rawResponse as Record<string, unknown>,
      );

      if (directObject) {
        return directObject;
      }
    }

    const rawContent = this.extractContent(rawResponse);

    if (!rawContent) {
      throw new EmptyLlmResponseError();
    }

    try {
      return JSON.parse(rawContent);
    } catch (error) {
      throw new InvalidLlmJsonError(
        error instanceof Error
          ? `LLM returned invalid JSON: ${error.message}`
          : 'LLM returned invalid JSON',
      );
    }
  }

  private extractContent(rawResponse: unknown): string {
    if (typeof rawResponse === 'string') {
      return this.stripCodeFence(rawResponse.trim());
    }

    if (!rawResponse || typeof rawResponse !== 'object') {
      return '';
    }

    const candidates = ['text', 'result', 'response', 'json'];

    for (const key of candidates) {
      const value = (rawResponse as Record<string, unknown>)[key];

      if (typeof value === 'string' && value.trim()) {
        return this.stripCodeFence(value.trim());
      }

      if (value && typeof value === 'object') {
        return JSON.stringify(value);
      }
    }

    return '';
  }

  private extractDirectObject(rawResponse: Record<string, unknown>): unknown {
    const directCandidates = ['json', 'output', 'data'];

    for (const key of directCandidates) {
      const value = rawResponse[key];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value;
      }
    }

    return null;
  }

  private stripCodeFence(value: string): string {
    return value
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '');
  }
}
