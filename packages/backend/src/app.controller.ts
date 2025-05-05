import { Controller, Get } from '@nestjs/common';
import { helloWorld } from 'common';

@Controller()
export class AppController {
  @Get('hello')
  getHello(): string {
    // return 'hi';
    return helloWorld();
  }
}
