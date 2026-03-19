import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeViewer } from "./CodeViewer";

describe("CodeViewer", () => {
  it("renders code content correctly", () => {
    const code = `console.log("Hello World");`;
    render(<CodeViewer content={code} language="javascript" />);

    const codeElement = screen.getByText(/"Hello World"/);
    expect(codeElement).toBeDefined();
  });
});
