// ─── Priority Value Object ────────────────────────────────────────────────────

import { ValidationError } from "@/lib/domain/errors";

export type PriorityValue = "low" | "medium" | "high" | "urgent";

const PRIORITY_WEIGHTS: Record<PriorityValue, number> = {
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4,
};

export class Priority {
    private constructor(readonly value: PriorityValue) { }

    static of(value: string): Priority {
        const valid: PriorityValue[] = ["low", "medium", "high", "urgent"];
        if (!valid.includes(value as PriorityValue)) {
            throw new ValidationError(`Invalid priority: "${value}"`);
        }
        return new Priority(value as PriorityValue);
    }

    static low() { return new Priority("low"); }
    static medium() { return new Priority("medium"); }
    static high() { return new Priority("high"); }
    static urgent() { return new Priority("urgent"); }

    weight(): number { return PRIORITY_WEIGHTS[this.value]; }

    isHigherThan(other: Priority): boolean {
        return this.weight() > other.weight();
    }

    equals(other: Priority): boolean { return this.value === other.value; }
    toString() { return this.value; }
}
