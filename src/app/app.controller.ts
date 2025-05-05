import { Controller, Inject } from '@nestjs/common';
import appConfig from './app.config';
import { ConfigType } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
  ) {}
}
