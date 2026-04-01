import { Injectable } from '@nestjs/common';
import { SeoContent } from './interfaces/seo-content.interface';
import { InvalidLlmJsonError } from './seo.errors';

@Injectable()
export class SeoResponseValidator {
  validate(value: unknown): SeoContent {
    if (!value || typeof value !== 'object') {
      throw new InvalidLlmJsonError('Parsed JSON must be an object');
    }

    const candidate = value as Record<string, unknown>;
    const requiredFields = ['title', 'meta_description', 'h1', 'description'];

    for (const field of requiredFields) {
      if (
        typeof candidate[field] !== 'string' ||
        candidate[field].toString().trim().length === 0
      ) {
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

