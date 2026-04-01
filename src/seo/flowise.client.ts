import { Injectable } from '@nestjs/common';
import { GenerateSeoDto } from './dto/generate-seo.dto';
import { FLOWISE_TIMEOUT_MS } from './seo.constants';
import {
  FlowiseTimeoutError,
  FlowiseUnavailableError,
  InvalidLlmJsonError,
} from './seo.errors';

interface FlowisePredictionRequest {
  question: string;
  overrideConfig: {
    sessionId?: string;
  };
}

@Injectable()
export class FlowiseClient {
  async predict(dto: GenerateSeoDto): Promise<unknown> {
    const flowiseUrl = this.getPredictionUrl();
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

      try {
        return await response.json();
      } catch (error) {
        throw new InvalidLlmJsonError(
          error instanceof Error
            ? `Flowise returned invalid JSON: ${error.message}`
            : 'Flowise returned invalid JSON',
        );
      }
    } catch (error) {
      if (error instanceof FlowiseUnavailableError) {
        throw error;
      }

      if (error instanceof InvalidLlmJsonError) {
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

  private getPredictionUrl(): string {
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
        ...(dto.session_id ? { sessionId: dto.session_id } : {}),
      },
    };
  }

  private buildPrompt(dto: GenerateSeoDto): string {
    return [
      'You are an SEO copywriter for e-commerce.',
      '',
      'Generate SEO content for the product below.',
      `product_name: ${dto.product_name}`,
      `category: ${dto.category}`,
      `keywords: ${dto.keywords.join(', ')}`,
      '',
      'Return valid JSON only.',
      '',
      'Required fields:',
      '- title',
      '- meta_description',
      '- h1',
      '- description',
      '- bullets',
      '',
      'Rules:',
      '- title: concise SEO title',
      '- meta_description: 140-160 chars',
      '- h1: clear product headline',
      '- description: 2 short paragraphs',
      '- bullets: array of 4-6 benefit-oriented bullet strings',
    ].join('\n');
  }
}
