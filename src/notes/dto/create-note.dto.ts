import { IsNotEmpty, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  readonly text: string;

  @IsPositive()
  toId: number;
}
