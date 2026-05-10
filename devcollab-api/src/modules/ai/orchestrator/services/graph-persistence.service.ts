import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';

@Injectable()
export class GraphPersistenceService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private saver: PostgresSaver;

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });

    this.saver = new PostgresSaver(this.pool);

    // Initialize the saver (creates necessary tables if they don't exist)
    await this.saver.setup();
    console.log('PostgresSaver (LangGraph) setup successful.');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  getSaver(): PostgresSaver {
    return this.saver;
  }
}
