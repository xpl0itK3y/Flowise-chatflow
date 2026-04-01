import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class GenerateSeoDto {
  @IsString()
  @MinLength(1)
  @Matches(/\S/, { message: 'product_name should not be empty' })
  product_name!: string;

  @IsString()
  @MinLength(1)
  @Matches(/\S/, { message: 'category should not be empty' })
  category!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(/\S/, { each: true, message: 'each keyword should not be empty' })
  keywords!: string[];

  @IsOptional()
  @IsString()
  session_id?: string;
}
