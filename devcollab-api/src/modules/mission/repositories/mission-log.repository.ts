import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { missionLogs } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MissionLogRepository extends BaseRepository<typeof missionLogs> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, missionLogs);
  }

  async findByMissionId(missionId: string) {
    return this.drizzle.db.query.missionLogs.findMany({
      where: eq(missionLogs.missionId, missionId),
      orderBy: (missionLogs, { asc }) => [asc(missionLogs.sequence)],
    });
  }

  async createLog(data: {
    missionId: string;
    message: string;
    stepId?: string;
    type?: string;
    payload?: any;
  }) {
    return this.drizzle.db
      .insert(missionLogs)
      .values({
        id: uuidv4(),
        missionId: data.missionId,
        stepId: data.stepId,
        message: data.message,
        type: data.type || 'log',
        payload: data.payload,
        sequence: new Date(), // Using current timestamp for precision sequence
      })
      .returning();
  }
}
