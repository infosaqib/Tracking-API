import { Controller } from '@nestjs/common';
import { SqsService } from './sqs.service';

@Controller('sqs')
export class SqsController {
  constructor(private readonly sqsService: SqsService) {}
}
