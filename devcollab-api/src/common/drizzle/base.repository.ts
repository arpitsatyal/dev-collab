import { eq, inArray, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { AnyPgColumn, AnyPgTable, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { DrizzleService } from './drizzle.service';
import { v4 as uuid } from 'uuid';

export abstract class BaseRepository<
  TTable extends PgTableWithColumns<any> & { id: AnyPgColumn },
  TInsert extends InferInsertModel<TTable> = InferInsertModel<TTable>,
  TUpdate extends Partial<InferInsertModel<TTable>> = Partial<InferInsertModel<TTable>>,
> {
  constructor(
    protected readonly drizzle: DrizzleService,
    protected readonly table: TTable,
  ) { }

  async findById(
    id: InferSelectModel<TTable>['id'],
  ): Promise<InferSelectModel<TTable> | undefined> {
    const [row] = await this.drizzle.db
      .select()
      .from(this.table as AnyPgTable)
      .where(eq(this.table.id, id)) as unknown as InferSelectModel<TTable>[];
    return row;
  }

  async findMany(): Promise<InferSelectModel<TTable>[]> {
    return this.drizzle.db.select().from(this.table as AnyPgTable) as unknown as InferSelectModel<TTable>[];
  }

  async findManyByIds(
    ids: InferSelectModel<TTable>['id'][],
  ): Promise<InferSelectModel<TTable>[]> {
    if (!ids.length) return [];
    return this.drizzle.db
      .select()
      .from(this.table as AnyPgTable)
      .where(inArray(this.table.id, ids)) as unknown as InferSelectModel<TTable>[];
  }

  async create(data: Omit<TInsert, 'id'>) {
    const insertData: TInsert = { id: uuid(), ...(data as TInsert) };

    // Auto-inject createdAt and updatedAt if present
    if ('createdAt' in this.table) {
      (insertData as TInsert & { createdAt?: Date }).createdAt = new Date();
    }
    if ('updatedAt' in this.table) {
      (insertData as TInsert & { updatedAt?: Date }).updatedAt = new Date();
    }

    const [row] = await this.drizzle.db
      .insert(this.table as AnyPgTable)
      .values(insertData)
      .returning() as unknown as InferSelectModel<TTable>[];
    return row;
  }

  async update(
    id: InferSelectModel<TTable>['id'],
    data: TUpdate,
  ) {
    const updateData: TUpdate = { ...data };

    // Auto-inject updatedAt if present
    if ('updatedAt' in this.table) {
      (updateData as TUpdate & { updatedAt?: Date }).updatedAt = new Date();
    }

    const [row] = await this.drizzle.db
      .update(this.table as AnyPgTable)
      .set(updateData)
      .where(eq(this.table.id, id))
      .returning() as unknown as InferSelectModel<TTable>[];
    return row;
  }

  async delete(id: InferSelectModel<TTable>['id']) {
    const [row] = await this.drizzle.db
      .delete(this.table as AnyPgTable)
      .where(eq(this.table.id, id))
      .returning() as unknown as InferSelectModel<TTable>[];
    return row;
  }
}
