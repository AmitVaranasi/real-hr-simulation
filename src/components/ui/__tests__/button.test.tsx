import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../button";

describe("Button", () => {
  it("renders its children into a real button element", () => {
    render(<Button>Save &amp; Continue</Button>);
    expect(
      screen.getByRole("button", { name: "Save & Continue" })
    ).toBeInTheDocument();
  });

  it("applies the variant and size classes, not just the base ones", () => {
    render(
      <Button variant="orange" size="lg">
        Continue
      </Button>
    );
    const el = screen.getByRole("button");
    expect(el.className).toContain("--portal-brand");
    expect(el.className).toContain("h-12");
  });

  it("lets a caller's className through alongside the variant", () => {
    // cn() merges via tailwind-merge, so a caller override must survive
    // rather than being dropped or duplicated.
    render(<Button className="w-full">Wide</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("does not fire onClick while disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Submit
      </Button>
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards a ref to the underlying button", () => {
    let node: HTMLButtonElement | null = null;
    render(<Button ref={(el) => void (node = el)}>Ref</Button>);
    expect(node).toBeInstanceOf(HTMLButtonElement);
  });
});
