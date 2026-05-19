import { describe, it, expect } from "vitest";
import { cn, formatRelativeTime, getInitials, generateSlug } from "@/lib/utils";

describe("cn()", () => {
    it("merges class names", () => {
        expect(cn("a", "b")).toBe("a b");
    });
    it("handles conditional classes", () => {
        expect(cn("base", false && "skip", "keep")).toBe("base keep");
    });
    it("merges conflicting tailwind classes (last wins)", () => {
        expect(cn("p-2", "p-4")).toBe("p-4");
    });
});

describe("formatRelativeTime()", () => {
    it("returns 'just now' for recent dates", () => {
        const recent = new Date(Date.now() - 10000).toISOString();
        expect(formatRelativeTime(recent)).toBe("just now");
    });
    it("returns minutes ago for 5 minutes ago", () => {
        const fiveMin = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        expect(formatRelativeTime(fiveMin)).toMatch(/5 minutes ago/);
    });
});

describe("getInitials()", () => {
    it("returns two uppercase initials for full name", () => {
        expect(getInitials("John Doe")).toBe("JD");
    });
    it("returns single letter for single name", () => {
        expect(getInitials("Alice")).toBe("A");
    });
    it("handles empty string", () => {
        expect(getInitials("")).toBe("?");
    });
});

describe("generateSlug()", () => {
    it("lowercases and replaces spaces with hyphens", () => {
        expect(generateSlug("My Project")).toBe("my-project");
    });
    it("removes special characters", () => {
        expect(generateSlug("Hello World!")).toBe("hello-world");
    });
});
