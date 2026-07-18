import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';
import type { IEventHandler } from '../../domain/events/IEventHandler.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
export declare class InMemoryEventBus implements IEventBus {
    private readonly registry;
    publish<T extends IDomainEvent>(event: T): void;
    subscribe<T extends IDomainEvent>(eventName: string, handler: IEventHandler<T>): void;
    unSubscribeAll(eventName: string): void;
}
//# sourceMappingURL=InMemoryEventBus.d.ts.map