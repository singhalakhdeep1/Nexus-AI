import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityBadge } from "@/components/shared/priority-badge";

describe("PriorityBadge", () => {
    it("renders urgency label for urgent priority", () => {
        render(<PriorityBadge priority="urgent" />);
        expect(screen.getByText(/urgent/i)).toBeInTheDocument();
    });

    it("renders high priority", () => {
        render(<PriorityBadge priority="high" />);
        expect(screen.getByText(/high/i)).toBeInTheDocument();
    });

    it("renders medium priority", () => {
        render(<PriorityBadge priority="medium" />);
        expect(screen.getByText(/medium/i)).toBeInTheDocument();
    });

    it("renders low priority", () => {
        render(<PriorityBadge priority="low" />);
        expect(screen.getByText(/low/i)).toBeInTheDocument();
    });

    it("renders no_priority", () => {
        render(<PriorityBadge priority="no_priority" />);
        expect(screen.getByText(/no priority/i)).toBeInTheDocument();
    });

    it("renders only icon when iconOnly=true", () => {
        const { container } = render(<PriorityBadge priority="high" iconOnly />);
        expect(container.querySelector("svg")).toBeInTheDocument();
        expect(screen.queryByText(/high/i)).not.toBeInTheDocument();
    });
});
