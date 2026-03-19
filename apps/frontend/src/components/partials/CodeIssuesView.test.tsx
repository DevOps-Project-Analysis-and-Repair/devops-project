import { ThemeProvider, createTheme } from "@mui/material";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { IssueItem } from "../../utils/analytics";
import { CodeIssuesView } from "./CodeIssuesView";

const renderWithTheme = (ui: React.ReactNode) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

const baseIssue: IssueItem = {
  issueKey: "1",
  message: "Something is wrong",
  severity: "MAJOR",
  type: "BUG",
  status: "OPEN" as IssueItem['status'],
  line: 10,
  rule: "typescript:S123",
  tags: ["bug"],
  startLine: 10,
  endLine: 12,
  startOffset: 1,
  filePath: "/index.ts",
  endOffset: 4,
};

describe("CodeIssuesView", () => {
  it("renders empty state when no issues", () => {
    renderWithTheme(<CodeIssuesView issues={[]} />);

    expect(screen.getByText("Code issues")).toBeDefined();
    expect(
      screen.getByText("No code issues found for this file.")
    ).toBeDefined();
  });

  it("renders provided title", () => {
    renderWithTheme(<CodeIssuesView issues={[]} title="My Issues" />);

    expect(screen.getByText("My Issues")).toBeDefined();
  });

  it("renders issues", () => {
    renderWithTheme(<CodeIssuesView issues={[baseIssue]} />);

    expect(screen.getByText("Something is wrong")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined(); // line number
  });

  it("shows issue count", () => {
    renderWithTheme(
      <CodeIssuesView issues={[baseIssue, { ...baseIssue, issueKey: "2" }]} />
    );

    expect(screen.getByText("2 issues in this file")).toBeDefined();
  });

  it("shows correct summary chips", () => {
    renderWithTheme(
      <CodeIssuesView
        issues={[
          { ...baseIssue, severity: "BLOCKER" },
          { ...baseIssue, issueKey: "2", severity: "CRITICAL" },
          { ...baseIssue, issueKey: "3", severity: "MAJOR" },
          { ...baseIssue, issueKey: "4", severity: "MINOR" },
          { ...baseIssue, issueKey: "5", severity: "INFO" },
        ]}
      />
    );

    expect(screen.getByText("1 blocker")).toBeDefined();
    expect(screen.getByText("1 critical")).toBeDefined();
    expect(screen.getByText("1 major")).toBeDefined();
    expect(screen.getByText("1 minor")).toBeDefined();
    expect(screen.getByText("1 info")).toBeDefined();
  });

  it("shows closed issues in summary", () => {
    renderWithTheme(
      <CodeIssuesView
        issues={[
          { ...baseIssue, status: "CLOSED" },
          { ...baseIssue, issueKey: "2", status: "RESOLVED" },
        ]}
      />
    );

    expect(screen.getByText("2 closed")).toBeDefined();
  });

  it("formats rule correctly", () => {
    renderWithTheme(<CodeIssuesView issues={[baseIssue]} />);

    expect(screen.getByText("Rule: S123")).toBeDefined();
  });

  it("renders tags", () => {
    renderWithTheme(
      <CodeIssuesView
        issues={[{ ...baseIssue, tags: ["bug", "security"] }]}
      />
    );

    expect(screen.getByText("bug")).toBeDefined();
    expect(screen.getByText("security")).toBeDefined();
  });

  it("renders line range when applicable", () => {
    renderWithTheme(<CodeIssuesView issues={[baseIssue]} />);

    expect(screen.getByText("Lines 10-12")).toBeDefined();
  });

  it("does not render line range if invalid", () => {
    renderWithTheme(
      <CodeIssuesView
        issues={[{ ...baseIssue, startLine: 0, endLine: 0 }]}
      />
    );

    expect(screen.queryByText(/Lines/)).toBeNull();
  });

  it("sorts open issues before closed ones", () => {
    const openIssue = { ...baseIssue, issueKey: "1", line: 1, status: "OPEN" };
    const closedIssue = {
      ...baseIssue,
      issueKey: "2",
      line: 1,
      status: "CLOSED",
    };

    renderWithTheme(<CodeIssuesView issues={[closedIssue, openIssue]} />);

    const messages = screen.getAllByText("Something is wrong");
    // first rendered should be open issue
    expect(messages[0]).toBeDefined();
  });

  it("sorts by line number", () => {
    const issue1 = { ...baseIssue, issueKey: "1", line: 20 };
    const issue2 = { ...baseIssue, issueKey: "2", line: 5 };

    renderWithTheme(<CodeIssuesView issues={[issue1, issue2]} />);

    const lines = screen.getAllByText(/^\d+$/).map((el) => el.textContent);
    expect(lines[0]).toBe("5");
    expect(lines[1]).toBe("20");
  });

  it("renders status chip for open issues", () => {
    renderWithTheme(
      <CodeIssuesView
        issues={[{ ...baseIssue, status: "CONFIRMED" }]}
      />
    );

    expect(screen.getByText("Confirmed")).toBeDefined();
  });

  it("renders closed label instead of severity when closed", () => {
    renderWithTheme(
      <CodeIssuesView
        issues={[{ ...baseIssue, status: "CLOSED" }]}
      />
    );

    expect(screen.getByText("Closed")).toBeDefined();
  });
});