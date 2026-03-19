import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyzeAndRepairDialog } from "./AnalyzeAndRepairDialog";


import { getAnalysis, performAnalysis } from "../../services/analysisService";
import { fixFile } from "../../services/fixService";
import { sleep } from "../../util";

vi.mock("../../services/analysisService", () => ({
    performAnalysis: vi.fn(),
    getAnalysis: vi.fn(),
  }));
  
  vi.mock("../../services/fixService", () => ({
    fixFile: vi.fn(),
  }));
  
  vi.mock("../../util", () => ({
    sleep: vi.fn(),
  }));
  

describe("AnalyzeAndRepairDialog", () => {
  const data = { projectId: "p1", fileId: "f1" };

  beforeEach(() => {
    vi.clearAllMocks();

    /* eslint-disable @typescript-eslint/no-explicit-any */
    (fixFile as any).mockResolvedValue(undefined);

    (performAnalysis as any).mockResolvedValue({
      analysisId: "a1",
    });

    (getAnalysis as any).mockResolvedValue({
      sonar: [{ projectAnalysisId: "a1" }],
    });

    (sleep as any).mockResolvedValue(undefined);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  it("opens dialog when data is provided", () => {
    render(
      <AnalyzeAndRepairDialog data={data} onComplete={vi.fn()} />
    );

    expect(screen.getByText("Analyze and Repair Dialog")).toBeDefined();
  });

  it("renders initial actions", async () => {
    render(
      <AnalyzeAndRepairDialog data={data} onComplete={vi.fn()} />
    );

    expect(await screen.findByText("Fix file (1/2)")).toBeDefined();
    expect(await screen.findByText("Analyze updated project (2/2)")).toBeDefined();
  });

  it("calls fixFile and performAnalysis", async () => {
    render(
      <AnalyzeAndRepairDialog data={data} onComplete={vi.fn()} />
    );

    await waitFor(() => {
      expect(fixFile).toHaveBeenCalledWith("p1", "f1");
    });

    await waitFor(() => {
      expect(performAnalysis).toHaveBeenCalledWith("p1");
    });
  });


  it("does not open dialog when data is null", () => {
    render(
      <AnalyzeAndRepairDialog data={null} onComplete={vi.fn()} />
    );

    expect(
      screen.queryByText("Analyze and Repair Dialog")
    ).toBeNull();
  });

  it("handles polling loop correctly", async () => {
    // simulate delayed analysis appearance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getAnalysis as any)
      .mockResolvedValueOnce({ sonar: [] })
      .mockResolvedValueOnce({ sonar: [] })
      .mockResolvedValueOnce({
        sonar: [{ projectAnalysisId: "a1" }],
      });

    render(
      <AnalyzeAndRepairDialog data={data} onComplete={vi.fn()} />
    );

    await waitFor(() => {
      expect(getAnalysis).toHaveBeenCalledTimes(3);
    });
  });
});