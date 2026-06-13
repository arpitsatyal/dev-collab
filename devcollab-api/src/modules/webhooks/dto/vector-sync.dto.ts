import { IsEnum, IsObject, IsString, IsOptional } from 'class-validator';
import { SyncType } from 'src/common/vector-store/vector-store.service';

export class VectorSyncPayloadDto {
  @IsEnum(['workspace', 'workItem', 'snippet', 'doc'] as any)
  type: SyncType;

  @IsObject()
  data: { id: string };

  @IsOptional()
  @IsString()
  action?: 'upsert' | 'delete';
}
