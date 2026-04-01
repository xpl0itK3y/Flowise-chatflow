import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class GenerateSeoDto {
  @IsString()
  @MinLength(1)
  product_name!: string;

  @IsString()
  @MinLength(1)
  category!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  keywords!: string[];

  @IsOptional()
  @IsString()
  session_id?: string;
}

