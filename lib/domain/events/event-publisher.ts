// ─── Domain Event Publisher ───────────────────────────────────────────────────
// Decouples domain events from their handlers.
// Use cases publish events. Infrastructure handlers (Liveblocks, analytics,
// email, audit log) subscribe and react — without the use case knowing about them.

import type { AnyDomainEvent } from "@/lib/domain/events/domain-events";

type EventHandler<T extends AnyDomainEvent> = (event: T) => void | Promise<void>;

class DomainEventPublisher {
    private handlers = new Map<string, EventHandler<AnyDomainEvent>[]>();

    /** Subscribe a handler to a specific event type */
    on<T extends AnyDomainEvent>(
        eventType: T["eventType"],
        handler: EventHandler<T>
    ): () => void {
        const existing = this.handlers.get(eventType) ?? [];
        this.handlers.set(eventType, [...existing, handler as EventHandler<AnyDomainEvent>]);

        // Return unsubscribe fn
        return () => {
            const current = this.handlers.get(eventType) ?? [];
            this.handlers.set(eventType, current.filter(h => h !== handler));
        };
    }

    /** Publish an event — all subscribers are called concurrently */
    async publish(event: AnyDomainEvent): Promise<void> {
        const handlers = this.handlers.get(event.eventType) ?? [];
        await Promise.allSettled(handlers.map(h => h(event)));
    }

    /** Publish multiple events in sequence */
    async publishAll(events: AnyDomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.publish(event);
        }
    }
}

// Singleton — shared across the entire server process
export const eventPublisher = new DomainEventPublisher();
export type { EventHandler };
