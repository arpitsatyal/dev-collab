import { Module } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import { VectorStorePort } from './ports/vector-store.port';

@Module({
  providers: [
    VectorStoreService,
    { provide: VectorStorePort, useClass: VectorStoreService },
  ],
  exports: [VectorStoreService, VectorStorePort],
})
export class VectorStoreModule { }
