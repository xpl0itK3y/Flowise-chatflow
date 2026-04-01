import { Injectable } from '@nestjs/common';
import { GenerateSeoDto } from './dto/generate-seo.dto';
import { SeoContent } from './interfaces/seo-content.interface';
import { FLOWISE_TIMEOUT_MS } from './seo.constants';
import {
  EmptyLlmResponseError,
  FlowiseTimeoutError,
  FlowiseUnavailableError,
  InvalidLlmJsonError,
} from './seo.errors';

interface FlowisePredictionRequest {
  question: string;
  overrideConfig: {
    product_name: string;
    category: string;
    keywords: string;
  };
}

@Injectable()
export class SeoService {
  async generateSeo(dto: GenerateSeoDto): Promise<SeoContent> {
    const rawResponse = await this.requestPrediction(dto);
    return this.parseSeoContent(rawResponse);
  }

  private async requestPrediction(dto: GenerateSeoDto): Promise<unknown> {
    const flowiseUrl = this.getFlowisePredictionUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FLOWISE_TIMEOUT_MS);

    try {
      const response = await fetch(flowiseUrl, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(this.buildPayload(dto)),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new FlowiseUnavailableError(
          `Flowise API returned ${response.status} ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof FlowiseUnavailableError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new FlowiseTimeoutError(FLOWISE_TIMEOUT_MS);
      }

      throw new FlowiseUnavailableError(
        error instanceof Error ? error.message : 'Unknown Flowise error',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private getFlowisePredictionUrl(): string {
    const baseUrl = process.env.FLOWISE_BASE_URL;
    const chatflowId = process.env.FLOWISE_CHATFLOW_ID;

    if (!baseUrl || !chatflowId) {
      throw new FlowiseUnavailableError(
        'FLOWISE_BASE_URL or FLOWISE_CHATFLOW_ID is not configured',
      );
    }

    return `${baseUrl.replace(/\/$/, '')}/api/v1/prediction/${chatflowId}`;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const apiKey = process.env.FLOWISE_API_KEY;

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    return headers;
  }

  private buildPayload(dto: GenerateSeoDto): FlowisePredictionRequest {
    return {
      question: this.buildPrompt(dto),
      overrideConfig: {
        product_name: dto.product_name,
        category: dto.category,
        keywords: dto.keywords.join(', '),
      },
    };
  }

  private buildPrompt(dto: GenerateSeoDto): string {
    return [
      'Generate SEO content for the product using the provided variables.',
      `product_name: ${dto.product_name}`,
      `category: ${dto.category}`,
      `keywords: ${dto.keywords.join(', ')}`,
      'Return valid JSON only.',
    ].join('\n');
  }

  private parseSeoContent(rawResponse: unknown): SeoContent {
    if (rawResponse && typeof rawResponse === 'object') {
      const directObject = this.extractDirectObject(rawResponse);

      if (directObject) {
        return this.validateSeoContent(directObject);
      }
    }

    const rawContent = this.extractContent(rawResponse);

    if (!rawContent) {
      throw new EmptyLlmResponseError();
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      throw new InvalidLlmJsonError(
        error instanceof Error
          ? `LLM returned invalid JSON: ${error.message}`
          : 'LLM returned invalid JSON',
      );
    }

    return this.validateSeoContent(parsed);
  }

  private extractContent(rawResponse: unknown): string {
    if (typeof rawResponse === 'string') {
      return rawResponse.trim();
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
    return value.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
  }

  private validateSeoContent(value: unknown): SeoContent {
    if (!value || typeof value !== 'object') {
      throw new InvalidLlmJsonError('Parsed JSON must be an object');
    }

    const candidate = value as Record<string, unknown>;
    const fields = ['title', 'meta_description', 'h1', 'description'];

    for (const field of fields) {
      if (typeof candidate[field] !== 'string' || !candidate[field]?.toString().trim()) {
        throw new InvalidLlmJsonError(`Missing or invalid field: ${field}`);
      }
    }

    if (
      !Array.isArray(candidate.bullets) ||
      candidate.bullets.some(
        (item) => typeof item !== 'string' || item.trim().length === 0,
      )
    ) {
      throw new InvalidLlmJsonError('Field bullets must be a non-empty string array');
    }

    return {
      title: candidate.title as string,
      meta_description: candidate.meta_description as string,
      h1: candidate.h1 as string,
      description: candidate.description as string,
      bullets: candidate.bullets as string[],
    };
  }
}
