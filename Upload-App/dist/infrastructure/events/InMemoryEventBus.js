export class InMemoryEventBus {
    registry = new Map();
    /*
        * Publish event đến tất cả subscribers.
        * Fire-and-forget: không block caller, lỗi handler được log.
    */
    publish(event) {
        const handlers = this.registry.get(event.eventName) ?? [];
        for (const handler of handlers) {
            Promise.resolve(handler.handle(event)).catch((error) => {
                console.error(`[EventBus] Unhandled error in handler for event ${event.eventName}:`, error);
            });
        }
    }
    /*
        * Đăng ký handler cho một loại event.
        * Một event có thể có nhiều handlers (audit log, notification, analytics...).
    */
    subscribe(eventName, handler) {
        const handlers = this.registry.get(eventName) ?? [];
        this.registry.set(eventName, [...handlers, handler]);
        console.log(`[EventBus] Registered handler for "${eventName}"`);
    }
    unSubscribeAll(eventName) {
        this.registry.delete(eventName);
        console.log(`[EventBus] Unsubscribed all handlers for "${eventName}"`);
    }
    ;
}
//# sourceMappingURL=InMemoryEventBus.js.map