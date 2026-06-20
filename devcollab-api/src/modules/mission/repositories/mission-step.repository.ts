import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/drizzle/base.repository';
import { missionSteps } from 'src/common/drizzle/schema/missions';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { eq } from 'drizzle-orm';

@Injectable()
export class MissionStepRepository extends BaseRepository<typeof missionSteps> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, missionSteps);
  }

  async findByMissionId(missionId: string) {
    return this.drizzle.db.query.missionSteps.findMany({
      where: eq(missionSteps.missionId, missionId),
      orderBy: (missionSteps, { asc }) => [asc(missionSteps.createdAt)],
    });
  }
}
