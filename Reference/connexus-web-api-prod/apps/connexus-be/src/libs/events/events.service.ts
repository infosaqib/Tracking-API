import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayload } from './types/event-types';

@Injectable()
export class EventsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(event: EventPayload) {
    this.eventEmitter.emit(event.type, event.payload);
  }

  on(
    event: EventPayload['type'],
    listener: (data: EventPayload['payload']) => void,
  ) {
    this.eventEmitter.on(event, listener);
  }

  off(
    event: EventPayload['type'],
    listener: (data: EventPayload['payload']) => void,
  ) {
    this.eventEmitter.off(event, listener);
  }
}
