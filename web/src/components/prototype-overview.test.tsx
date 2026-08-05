import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrototypeOverview } from "./prototype-overview";

describe("PrototypeOverview", () => {
  it("renders the approved prototype path and learner outcome", () => {
    render(<PrototypeOverview />);
    expect(screen.getByRole("heading", { level: 1, name: "Anatomical position and directional terms" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Use anatomical position as a shared reference/ })).toBeInTheDocument();
    expect(screen.getAllByText(/Draft/)).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
  });
});
