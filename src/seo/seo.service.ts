import { Injectable } from '@nestjs/common';
import { GenerateSeoDto } from './dto/generate-seo.dto';
import { SeoContent } from './interfaces/seo-content.interface';
import { FlowiseClient } from './flowise.client';
import { SeoResponseParser } from './seo-response.parser';
import { SeoResponseValidator } from './seo-response.validator';

@Injectable()
export class SeoService {
  constructor(
    private readonly flowiseClient: FlowiseClient,
    private readonly seoResponseParser: SeoResponseParser,
    private readonly seoResponseValidator: SeoResponseValidator,
  ) {}

  async generateSeo(dto: GenerateSeoDto): Promise<SeoContent> {
    const rawResponse = await this.flowiseClient.predict(dto);
    const parsedResponse = this.seoResponseParser.parse(rawResponse);
    return this.seoResponseValidator.validate(parsedResponse);
  }
}
