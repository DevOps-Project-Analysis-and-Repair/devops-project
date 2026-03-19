import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComparisonMetricsView } from "./ComparisonMetricsView";

describe("ComparisonMetricsView", () => {
  it("renders metrics from both first and last", () => {
    render(
      <ComparisonMetricsView
        first={[{ id: "coverage", name: "Coverage", value: "80" }]}
        last={[{ id: "bugs", name: "Bugs", value: "5" }]}
      />
    );

    expect(screen.getByText("Coverage")).toBeDefined();
    expect(screen.getByText("Bugs")).toBeDefined();
  });

  it("shows correct values for first and last", () => {
    render(
      <ComparisonMetricsView
        first={[{ id: "coverage", name: "Coverage", value: "80" }]}
        last={[{ id: "coverage", name: "Coverage", value: "90" }]}
      />
    );

    expect(screen.getByText("80")).toBeDefined();
    expect(screen.getByText("90")).toBeDefined();
  });

  it("calculates positive delta correctly", () => {
    render(
      <ComparisonMetricsView
        first={[{ id: "coverage", name: "Coverage", value: "80" }]}
        last={[{ id: "coverage", name: "Coverage", value: "85" }]}
      />
    );

    expect(screen.getByText("+5")).toBeDefined();
  });

  it("calculates negative delta correctly", () => {
    render(
      <ComparisonMetricsView
        first={[{ id: "bugs", name: "Bugs", value: "10" }]}
        last={[{ id: "bugs", name: "Bugs", value: "7" }]}
      />
    );

    expect(screen.getByText("-3")).toBeDefined();
  });

  it("shows 'Improved' for higher-is-better metric", () => {
    render(
      <ComparisonMetricsView
        first={[{ id: "coverage", name: "Coverage", value: "80" }]}
        last={[{ id: "coverage", name: "Coverage", value: "85" }]}
      />
    );

    expect(screen.getByText("Improved")).toBeDefined();
  });

  it("shows 'Improved' for lower-is-better metric", () => {
    render(
      <ComparisonMetricsView
        first={[{ id: "bugs", name: "Bugs", value: "10" }]}
        last={[{ id: "bugs", name: "Bugs", value: "5" }]}
      />
    );

    expect(screen.getByText("Improved")).toBeDefined();
  });

  it("shows 'Regressed' when metric worsens", () => {
    render(
      <ComparisonMetricsView
        first={[{ id: "coverage", name: "Coverage", value: "90" }]}
        last={[{ id: "coverage", name: "Coverage", value: "80" }]}
      />
    );

    expect(screen.getByText("Regressed")).toBeDefined();
  });

  it("shows 'Unchanged' when values are equal", () => {
    render(
      <ComparisonMetricsView
        first={[{ id: "coverage", name: "Coverage", value: "80" }]}
        last={[{ id: "coverage", name: "Coverage", value: "80" }]}
      />
    );

    expect(screen.getByText("Unchanged")).toBeDefined();
  });

  it("shows 'Unknown' when values are not numeric", () => {
    render(
      <ComparisonMetricsView
        first={[{ id: "coverage", name: "Coverage", value: "abc" }]}
        last={[{ id: "coverage", name: "Coverage", value: "def" }]}
      />
    );

    expect(screen.getByText("Unknown")).toBeDefined();
    expect(screen.getByText("??")).toBeDefined();
  });

  it("handles missing values gracefully", () => {
    render(
      <ComparisonMetricsView
        first={[{ id: "coverage", name: "Coverage", value: "80" }]}
        last={[]}
      />
    );

    expect(screen.getByText("80")).toBeDefined();
    expect(screen.getAllByText("??").length).toBeGreaterThan(0);
  });
});