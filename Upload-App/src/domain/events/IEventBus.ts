import type { IDomainEvent } from '@/domain/events/IDomainEvent.js';
import type { IEventHandler } from '@/domain/events/IEventHandler.js';

export interface IEventBus {
    publish<T extends IDomainEvent>(event: T): void;

    subscribe<T extends IDomainEvent>(
        eventName: string, 
        handler: IEventHandler<T>
    ): void;
}