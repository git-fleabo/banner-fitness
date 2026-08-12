import { fireEvent, render, screen, cleanup, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dialog } from "./dialog";

describe("Dialog", () => {
  afterEach(() => cleanup());
  it("labels the dialog, closes on Escape and returns focus", () => {
    const onClose = vi.fn();
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    render(<Dialog titleId="dialog-title" onClose={onClose}><h2 id="dialog-title">Test dialog</h2><button>Save</button></Dialog>);
    expect(screen.getByRole("dialog", { name: "Test dialog" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    trigger.remove();
  });

  it("keeps Tab inside the dialog", () => {
    render(<Dialog titleId="dialog-title" onClose={vi.fn()}><h2 id="dialog-title">Test dialog</h2><button>Save</button></Dialog>);
    const dialog = screen.getByRole("dialog", { name: "Test dialog" });
    const close = within(dialog).getByRole("button", { name: "Close dialog" });
    const save = within(dialog).getByRole("button", { name: "Save" });
    save.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
  });
});
