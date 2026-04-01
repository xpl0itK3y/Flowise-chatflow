import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  GatewayTimeoutException,
  HttpCode,
  InternalServerErrorException,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { GenerateSeoDto } from './dto/generate-seo.dto';
import { SeoContent } from './interfaces/seo-content.interface';
import {
  EmptyLlmResponseError,
  FlowiseTimeoutError,
  FlowiseUnavailableError,
  InvalidLlmJsonError,
} from './seo.errors';
import { SeoService } from './seo.service';

@Controller('api')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Post('generate-seo')
  @HttpCode(200)
  async generateSeo(
    @Body() dto: GenerateSeoDto,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const seoContent = await this.seoService.generateSeo(dto);
      this.streamSeoContent(response, seoContent);
    } catch (error) {
      const mappedError = this.mapError(error);
      const status = mappedError.getStatus();
      response.status(status).json({
        statusCode: status,
        error: mappedError.name,
        message: mappedError.message,
      });
    }
  }

  private streamSeoContent(response: Response, seoContent: SeoContent): void {
    response.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    response.setHeader('Transfer-Encoding', 'chunked');
    response.setHeader('Cache-Control', 'no-cache, no-transform');

    const chunks = [
      { type: 'meta', status: 'started' },
      { type: 'title', value: seoContent.title },
      { type: 'meta_description', value: seoContent.meta_description },
      { type: 'h1', value: seoContent.h1 },
      { type: 'description', value: seoContent.description },
      { type: 'bullets', value: seoContent.bullets },
      { type: 'done', status: 'completed' },
    ];

    for (const chunk of chunks) {
      response.write(`${JSON.stringify(chunk)}\n`);
    }

    response.end();
  }

  private mapError(error: unknown):
    | GatewayTimeoutException
    | BadGatewayException
    | BadRequestException
    | InternalServerErrorException {
    if (error instanceof FlowiseTimeoutError) {
      return new GatewayTimeoutException(error.message);
    }

    if (error instanceof FlowiseUnavailableError) {
      return new BadGatewayException(error.message);
    }

    if (error instanceof EmptyLlmResponseError) {
      return new BadGatewayException(error.message);
    }

    if (error instanceof InvalidLlmJsonError) {
      return new BadGatewayException(error.message);
    }

    if (error instanceof BadRequestException) {
      return error;
    }

    return new InternalServerErrorException('Unexpected SEO generation error');
  }
}
