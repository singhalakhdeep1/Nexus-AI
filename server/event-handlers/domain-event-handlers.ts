// ─── Domain Event Handlers ────────────────────────────────────────────────────
// These are infrastructure-side handlers — they wire domain events to
// real-world side effects: Liveblocks broadcasts, analytics, email notifications.
//
// Import this once at server startup (in the tRPC route handler) so all handlers
// are registered before any request is processed.

import { eventPublisher } from "@/lib/domain/events/event-publisher";
import type {
    TaskCreatedEvent,
    TaskMovedEvent,
    TaskUpdatedEvent,
    TaskDeletedEvent,
} from "@/lib/domain/events/domain-events";

let initialized = false;

export function initializeDomainEventHandlers() {
    // Guard: only register once per server process
    if (initialized) return;
    initialized = true;

    // ── Task Created ───────────────────────────────────────────────────────────
    eventPublisher.on<TaskCreatedEvent>("task.created", async (event) => {
        // In production: broadcast to Liveblocks room so all connected clients
        // see the new task without polling.
        // await liveblocksClient.broadcastEvent(`project:${event.projectId}`, {
        //     type: "TASK_CREATED",
        //     taskId: event.taskId,
        // });

        // Analytics: track task creation event
        // await analytics.track({ event: "Task Created", properties: event });

        // Notify assignee if one was set
        if (event.assigneeId) {
            console.log(`[Event] task.created → notify assignee ${event.assigneeId} for task ${event.taskId}`);
            // await notificationService.notifyTaskAssigned(event);
        }

        console.log(`[Event] task.created: ${event.taskId} in project ${event.projectId}`);
    });

    // ── Task Moved ────────────────────────────────────────────────────────────
    eventPublisher.on<TaskMovedEvent>("task.moved", async (event) => {
        // Broadcast real-time update to all project members via Liveblocks
        // await liveblocksClient.broadcastEvent(`project:${event.projectId}`, {
        //     type: "TASK_MOVED",
        //     taskId: event.taskId,
        //     fromStatus: event.fromStatus,
        //     toStatus: event.toStatus,
        // });

        // Activity log
        console.log(
            `[Event] task.moved: ${event.taskId} — "${event.fromStatus}" → "${event.toStatus}" by ${event.movedBy}`
        );
    });

    // ── Task Updated ──────────────────────────────────────────────────────────
    eventPublisher.on<TaskUpdatedEvent>("task.updated", async (event) => {
        // Re-index in vector DB for AI/RAG search if title or description changed
        if (event.changes.title || event.changes.description) {
            console.log(`[Event] task.updated → re-index task ${event.taskId} in vector store`);
            // await vectorService.reindex(event.taskId);
        }

        console.log(`[Event] task.updated: ${event.taskId} — changes: ${Object.keys(event.changes).join(", ")}`);
    });

    // ── Task Deleted ──────────────────────────────────────────────────────────
    eventPublisher.on<TaskDeletedEvent>("task.deleted", async (event) => {
        // Remove from vector store to prevent stale AI results
        console.log(`[Event] task.deleted → remove task ${event.taskId} from vector store`);
        // await vectorService.delete(event.taskId);

        console.log(`[Event] task.deleted: ${event.taskId} by ${event.deletedBy}`);
    });

    console.log("[DomainEvents] All handlers initialized");
}
