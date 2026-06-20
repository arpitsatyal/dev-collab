import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { MissionService } from './services/mission.service';
import { MissionRunnerService } from './services/mission-runner.service';
import { Observable, map, filter, concat, from, concatMap } from 'rxjs';
import { MissionStatus } from './enums/mission.enums';

@Controller('missions')
export class MissionController {
  constructor(
    private readonly missionService: MissionService,
    private readonly missionRunner: MissionRunnerService,
  ) { }

  @Post()
  async createMission(@Body() body: { workspaceId: string; goal: string }) {
    const mission = await this.missionService.createMission({
      workspaceId: body.workspaceId,
      goal: body.goal,
    });
    // Start mission in background
    void this.missionRunner.runMission(mission.id);
    return mission;
  }

  @Get(':id')
  getMission(@Param('id') id: string) {
    return this.missionService.getMission(id);
  }

  @Get('workspace/:workspaceId')
  getWorkspaceMissions(@Param('workspaceId') workspaceId: string) {
    return this.missionService.getWorkspaceMissions(workspaceId);
  }

  @Sse('stream/:missionId')
  streamMission(
    @Param('missionId') missionId: string,
  ): Observable<MessageEvent> {
    const history$ = from(this.missionService.getMissionLogs(missionId)).pipe(
      concatMap((logs: any[]) => from(logs)),
      map((log) => ({ data: log }) as MessageEvent),
    );

    return from(this.missionService.getMission(missionId)).pipe(
      concatMap((mission) => {
        if (mission?.status === MissionStatus.COMPLETED || mission?.status === MissionStatus.FAILED) {
          return history$;
        }

        const live$ = this.missionService.getLogObservable().pipe(
          filter((log) => log.missionId === missionId),
          map((log) => ({ data: log }) as MessageEvent),
        );

        return concat(history$, live$);
      }),
    );
  }

  @Post(':id/resume')
  async resumeMission(
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; feedback?: string },
  ) {
    return this.missionRunner.resumeMission(id, body.action, body.feedback);
  }
}
