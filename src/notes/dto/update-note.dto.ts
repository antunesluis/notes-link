import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @IsOptional()
  readonly text?: string;

  @IsBoolean()
  @IsOptional()
  readonly read?: boolean;
}
