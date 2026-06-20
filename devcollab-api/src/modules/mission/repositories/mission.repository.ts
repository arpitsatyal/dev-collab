import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/drizzle/base.repository';
import { missions } from 'src/common/drizzle/schema';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { eq } from 'drizzle-orm';

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
        missionLogs: {
          orderBy: (missionLogs, { asc }) => [asc(missionLogs.sequence)],
        },
      },
      orderBy: (missions, { desc }) => [desc(missions.createdAt)],
    });
  }

  async findById(id: string) {
    return this.drizzle.db.query.missions.findFirst({
      where: eq(missions.id, id),
      with: {
        steps: true,
        missionLogs: {
          orderBy: (missionLogs, { asc }) => [asc(missionLogs.sequence)],
        },
      },
    });
  }
}
