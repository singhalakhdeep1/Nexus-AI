// ─── Domain Events ────────────────────────────────────────────────────────────
// Domain events are immutable records of something that happened in the domain.
// They are the bridge between the domain layer and infrastructure concerns
// (Liveblocks broadcasts, analytics, email notifications, audit logs).

export interface DomainEvent {
    readonly eventId: string;
    readonly occurredAt: Date;
    readonly eventType: string;
}

function makeEvent<T extends object>(eventType: string, payload: T): DomainEvent & T {
    return {
        eventId: crypto.randomUUID(),
        occurredAt: new Date(),
        eventType,
        ...payload,
    };
}

// ── Task Events ────────────────────────────────────────────────────────────────

export type TaskCreatedEvent = DomainEvent & {
    eventType: "task.created";
    taskId: string;
    projectId: string;
    title: string;
    createdBy: string;
    assigneeId: string | null;
    priority: string;
};

export type TaskMovedEvent = DomainEvent & {
    eventType: "task.moved";
    taskId: string;
    projectId: string;
    fromStatus: string;
    toStatus: string;
    movedBy: string;
};

export type TaskUpdatedEvent = DomainEvent & {
    eventType: "task.updated";
    taskId: string;
    projectId: string;
    updatedBy: string;
    changes: Record<string, { from: unknown; to: unknown }>;
};

export type TaskDeletedEvent = DomainEvent & {
    eventType: "task.deleted";
    taskId: string;
    projectId: string;
    deletedBy: string;
};

export type TaskAssignedEvent = DomainEvent & {
    eventType: "task.assigned";
    taskId: string;
    projectId: string;
    assigneeId: string;
    assignedBy: string;
};

// ── Project Events ─────────────────────────────────────────────────────────────

export type ProjectCreatedEvent = DomainEvent & {
    eventType: "project.created";
    projectId: string;
    organizationId: string;
    name: string;
    createdBy: string;
};

export type ProjectArchivedEvent = DomainEvent & {
    eventType: "project.archived";
    projectId: string;
    archivedBy: string;
};

// ── Union type for all events ─────────────────────────────────────────────────

export type AnyDomainEvent =
    | TaskCreatedEvent
    | TaskMovedEvent
    | TaskUpdatedEvent
    | TaskDeletedEvent
    | TaskAssignedEvent
    | ProjectCreatedEvent
    | ProjectArchivedEvent;

// ── Factories ─────────────────────────────────────────────────────────────────

export const DomainEvents = {
    taskCreated: (p: Omit<TaskCreatedEvent, keyof DomainEvent | "eventType">): TaskCreatedEvent => makeEvent("task.created", p) as TaskCreatedEvent,
    taskMoved: (p: Omit<TaskMovedEvent, keyof DomainEvent | "eventType">): TaskMovedEvent => makeEvent("task.moved", p) as TaskMovedEvent,
    taskUpdated: (p: Omit<TaskUpdatedEvent, keyof DomainEvent | "eventType">): TaskUpdatedEvent => makeEvent("task.updated", p) as TaskUpdatedEvent,
    taskDeleted: (p: Omit<TaskDeletedEvent, keyof DomainEvent | "eventType">): TaskDeletedEvent => makeEvent("task.deleted", p) as TaskDeletedEvent,
    taskAssigned: (p: Omit<TaskAssignedEvent, keyof DomainEvent | "eventType">): TaskAssignedEvent => makeEvent("task.assigned", p) as TaskAssignedEvent,
    projectCreated: (p: Omit<ProjectCreatedEvent, keyof DomainEvent | "eventType">): ProjectCreatedEvent => makeEvent("project.created", p) as ProjectCreatedEvent,
    projectArchived: (p: Omit<ProjectArchivedEvent, keyof DomainEvent | "eventType">): ProjectArchivedEvent => makeEvent("project.archived", p) as ProjectArchivedEvent,
};
