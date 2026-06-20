import { Controller, Get, Req, Res } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('')
  getTest() {
    return 'OK';
  }
}
