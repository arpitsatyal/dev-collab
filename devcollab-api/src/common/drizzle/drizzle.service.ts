import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';
import * as schema from './schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private client: ReturnType<typeof postgres>;
  db: PostgresJsDatabase<typeof schema>;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = postgres(this.configService.getOrThrow<string>('DATABASE_URL'));
    this.db = drizzle(this.client, { schema });
  }

  async onModuleDestroy() {
    await this.client.end();
  }
}
