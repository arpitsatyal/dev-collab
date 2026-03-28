import { Controller, Get, Req, Res } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('')
  getTest(@Req() req, @Res() res) {
    res.render('index');
  }
}
