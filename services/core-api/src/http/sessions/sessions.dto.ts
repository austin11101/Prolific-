import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class SaveSessionDto {
  @IsUUID()
  eventId!: string;

  @IsUUID()
  lessonRevisionId!: string;

  @IsString()
  @IsNotEmpty()
  readingMode!: string;

  @IsInt()
  @Min(1)
  paceWpm!: number;

  @IsInt()
  @Min(0)
  wordsRead!: number;

  @IsInt()
  @Min(0)
  durationSeconds!: number;

  @IsBoolean()
  isCompleted!: boolean;

  @IsDateString()
  occurredAt!: string;
}
