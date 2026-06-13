import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { VectorStorePort } from 'src/common/vector-store/ports/vector-store.port';
import { VectorSyncPayloadDto } from './dto/vector-sync.dto';

@Controller('webhooks/vector-sync')
export class VectorSyncController {
  constructor(private readonly vectorStoreService: VectorStorePort) {}

  @Post()
  @HttpCode(200)
  async handle(@Body() payload: VectorSyncPayloadDto) {
    const { type, data, action } = payload || {};

    await this.vectorStoreService.syncToVectorStore(
      type,
      data.id,
      (action as any) ?? 'upsert',
    );
    return { success: true };
  }
}
