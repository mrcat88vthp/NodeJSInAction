import type { IDomainEvent } from '@/domain/events/IDomainEvent.js';
import type { IEventHandler } from '@/domain/events/IEventHandler.js';
import type { IEventBus } from '@/domain/events/IEventBus.js';

export class InMemoryEventBus implements IEventBus {

    private readonly registry = new Map<string, IEventHandler[]>();

    /*
        * Publish event đến tất cả subscribers.
        * Fire-and-forget: không block caller, lỗi handler được log.
    */

    publish<T extends IDomainEvent>(event: T): void {
        const handlers = this.registry.get(event.eventName)?? [];

        for(const handler of handlers) {
            Promise.resolve(handler.handle(event)).catch((error: unknown) => {
                console.error(`[EventBus] Unhandled error in handler for event ${event.eventName}:`, error);
            });
        }
    }

    /*
        * Đăng ký handler cho một loại event.
        * Một event có thể có nhiều handlers (audit log, notification, analytics...).
    */
    subscribe<T extends IDomainEvent>(
        eventName: string,
        handler: IEventHandler<T>
    ): void {
        const handlers = this.registry.get(eventName) ?? [];
        this.registry.set(eventName, [...handlers, handler as IEventHandler]);
        console.log(`[EventBus] Registered handler for "${eventName}"`);
    }

    unSubscribeAll(
        eventName: string
    ): void {
        this.registry.delete(eventName);
        console.log(`[EventBus] Unsubscribed all handlers for "${eventName}"`)
    };
}