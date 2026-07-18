import type { IDomainEvent } from '../../domain/events/IDomainEvent.js';
export interface IEventHandler<T extends IDomainEvent = IDomainEvent> {
    handle(event: T): void | Promise<void>;
}
//# sourceMappingURL=IEventHandler.d.ts.map