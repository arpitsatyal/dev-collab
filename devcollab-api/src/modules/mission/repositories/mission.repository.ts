import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { missions, missionSteps } from 'src/common/drizzle/schema';
import { BaseRepository } from 'src/common/drizzle/base.repository';

@Injectable()
export class MissionRepository extends BaseRepository<typeof missions> {
  constructor(drizzle: DrizzleService) {
    super(drizzle, missions);
  }

  async findByWorkspaceId(workspaceId: string) {
    return this.drizzle.db.query.missions.findMany({
      where: eq(missions.workspaceId, workspaceId),
      with: {
        steps: true,
      },
      orderBy: (missions, { desc }) => [desc(missions.createdAt)],
    });
  }

  async findById(id: string) {
    return this.drizzle.db.query.missions.findFirst({
      where: eq(missions.id, id),
      with: {
        steps: true,
      },
    });
  }

  async appendLog(id: string, log: string) {
    return this.drizzle.db
      .update(missions)
      .set({
        logs: sql`COALESCE(${missions.logs}, '') || ${log} || '\n'`,
        updatedAt: new Date(),
      })
      .where(eq(missions.id, id))
      .returning();
  }
}

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

  async appendLog(id: string, log: string) {
    return this.drizzle.db
      .update(missionSteps)
      .set({
        logs: sql`COALESCE(${missionSteps.logs}, '') || ${log} || '\n'`,
      })
      .where(eq(missionSteps.id, id))
      .returning();
  }
}
