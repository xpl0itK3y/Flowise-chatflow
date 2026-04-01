import { Module } from '@nestjs/common';
import { FlowiseClient } from './flowise.client';
import { SeoController } from './seo.controller';
import { SeoResponseParser } from './seo-response.parser';
import { SeoResponseValidator } from './seo-response.validator';
import { SeoService } from './seo.service';

@Module({
  controllers: [SeoController],
  providers: [SeoService, FlowiseClient, SeoResponseParser, SeoResponseValidator],
})
export class SeoModule {}
