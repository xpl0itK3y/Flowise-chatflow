import { Injectable } from '@nestjs/common';
import { GenerateSeoDto } from './dto/generate-seo.dto';
import { FLOWISE_TIMEOUT_MS } from './seo.constants';
import {
  FlowiseTimeoutError,
  FlowiseUnavailableError,
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
}

