import { IsString, IsNotEmpty } from 'class-validator';

export class SyncBoardDto {
  @IsString()
  @IsNotEmpty()
  boardId: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;
} 