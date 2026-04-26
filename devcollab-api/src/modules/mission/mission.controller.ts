import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { MissionService } from './mission.service';
import { Observable, map, filter, concat, from, concatMap } from 'rxjs';

@Controller('missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) { }

  @Post()
  async createMission(
    @Body() body: { workspaceId: string; goal: string },
  ) {
    const mission = await this.missionService.createMission({
      workspaceId: body.workspaceId,
      goal: body.goal,
    });
    // Start mission in background
    void this.missionService.runMission(mission.id);
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
  streamMission(@Param('missionId') missionId: string): Observable<MessageEvent> {
    const history$ = from(this.missionService.getMissionLogs(missionId)).pipe(
      concatMap((logs: any[]) => from(logs)), // Flatten the array into individual events
      map((log) => ({ data: log } as MessageEvent)),
    );

    const live$ = this.missionService.getLogObservable().pipe(
      filter((log) => log.missionId === missionId),
      map((log) => ({ data: log } as MessageEvent)),
    );

    return concat(history$, live$);
  }
}
