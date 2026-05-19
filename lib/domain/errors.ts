// ─── Domain Errors ────────────────────────────────────────────────────────────
// These are pure business rule violations — no HTTP, no framework, no Supabase.
// tRPC routers catch these and map them to the correct TRPCError code.

export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DomainError";
    }
}

export class ValidationError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export class ForbiddenError extends DomainError {
    constructor(message = "Access denied") {
        super(message);
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends DomainError {
    constructor(resource: string) {
        super(`${resource} not found`);
        this.name = "NotFoundError";
    }
}

export class ConflictError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = "ConflictError";
    }
}
