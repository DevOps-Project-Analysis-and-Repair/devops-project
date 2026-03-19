import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MenuButtonGroup, type MenuButtonItem } from "./MenuButtonGroup";

describe("MenuButtonGroup", () => {
  const items: MenuButtonItem[] = [
    { id: "one", label: 1 },
    { id: "two", label: 2 },
    { id: "three", label: 3 },
  ];

  it("renders all buttons with correct labels", () => {
    render(<MenuButtonGroup items={items} onItemClick={() => {}} />);

    items.forEach((item) => {
      expect(screen.getByText(item.label.toString())).toBeDefined();
    });
  });

  it("calls onItemClick with correct id when a button is clicked", () => {
    const onItemClick = vi.fn();

    render(<MenuButtonGroup items={items} onItemClick={onItemClick} />);

    const button = screen.getByText("2");
    fireEvent.click(button);

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith("two");
  });
});