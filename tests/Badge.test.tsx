import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ListingStatusBadge } from "@/components/ui/Badge";

describe("ListingStatusBadge", () => {
  it("shows a text label alongside color, not color alone", () => {
    render(<ListingStatusBadge status="pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
