import { Injectable } from '@nestjs/common';

@Injectable()
export class AiConfig {
  readonly maxIterations = 15;
}
