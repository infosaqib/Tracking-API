import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getIndex() {
    return 'Endpoint is working';
  }
}
