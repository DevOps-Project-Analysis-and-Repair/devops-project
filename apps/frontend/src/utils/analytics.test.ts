import { describe, expect, it } from "vitest";
import {
    extractSonarMetrics,
    groupIssuesByPath,
    mapMetricsForView,
    type IssueItem,
} from "./analytics";

describe("extractSonarMetrics", () => {
    it("extracts first and last metrics", () => {
        const json = {
            sonar: [
                {
                    metrics: [{ metric: "coverage", value: 80 }],
                },
                {
                    metrics: [{ metric: "coverage", value: 90 }],
                },
            ],
        };

        const result = extractSonarMetrics(json);

        expect(result.first?.coverage.value).toBe(80);
        expect(result.last?.coverage.value).toBe(90);
    });

    it("returns only first when single report", () => {
        const json = {
            sonar: [{ metrics: [{ metric: "bugs", value: 5 }] }],
        };

        const result = extractSonarMetrics(json);

        expect(result.first?.bugs.value).toBe(5);
        expect(result.last).toBeUndefined();
    });

    it("handles missing sonar data", () => {
        const result = extractSonarMetrics({});

        expect(result.first).toBeUndefined();
        expect(result.last).toBeUndefined();
    });

    it("fills missing metrics with null", () => {
        const json = {
            sonar: [{ metrics: [] }],
        };

        const result = extractSonarMetrics(json);

        expect(result.first?.coverage.value).toBeNull();
        expect(result.first?.bugs.value).toBeNull();
    });

    it("includes bestValue when present", () => {
        const json = {
            sonar: [
                {
                    metrics: [
                        { metric: "coverage", value: 95, bestValue: true },
                    ],
                },
            ],
        };

        const result = extractSonarMetrics(json);

        expect(result.first?.coverage.bestValue).toBe(true);
    });
});

describe("groupIssuesByPath", () => {
    const issue = (filePath: string): IssueItem => ({
        issueKey: Math.random().toString(),
        message: "msg",
        severity: "MAJOR",
        type: "BUG",
        line: 1,
        rule: "rule",
        tags: [],
        startLine: 1,
        endLine: 1,
        startOffset: 0,
        endOffset: 0,
        filePath,
    });

    it("groups issues by file path", () => {
        const json = {
            sonar: [
                {
                    issues: [issue("a.ts"), issue("b.ts"), issue("a.ts")],
                },
            ],
        };

        const result = groupIssuesByPath(json);

        expect(result.get("a.ts")?.length).toBe(2);
        expect(result.get("b.ts")?.length).toBe(1);
    });

    it("uses only latest report", () => {
        const json = {
            sonar: [
                { issues: [issue("old.ts")] },
                { issues: [issue("new.ts")] },
            ],
        };

        const result = groupIssuesByPath(json);

        expect(result.has("old.ts")).toBe(false);
        expect(result.has("new.ts")).toBe(true);
    });

    it("returns empty map when no reports", () => {
        const result = groupIssuesByPath({});

        expect(result.size).toBe(0);
    });

    it("handles empty issues array", () => {
        const json = {
            sonar: [{ issues: [] }],
        };

        const result = groupIssuesByPath(json);

        expect(result.size).toBe(0);
    });
});

describe("mapMetricsForView", () => {
    const baseMetricMap = {
        coverage: { value: 80 },
        bugs: { value: 5 },
        reliability_rating: { value: 1 },
        code_smells: { value: 10 },
        duplicated_lines_density: { value: 2 },
        security_rating: { value: 1 },
        ncloc: { value: 1000 },
        vulnerabilities: { value: 0 },
        sqale_rating: { value: 1 },
    };

    it("maps metrics to view format", () => {
        const result = mapMetricsForView(baseMetricMap);

        expect(result).toEqual(
            expect.arrayContaining([
                { id: "coverage", name: "Coverage", value: "80" },
                { id: "bugs", name: "Bugs", value: "5" },
            ])
        );
    });

    it("converts null values to '-'", () => {
        const map = {
            ...baseMetricMap,
            coverage: { value: null },
        };

        const result = mapMetricsForView(map);

        const coverage = result.find((x) => x.id === "coverage");
        expect(coverage?.value).toBe("-");
    });

    it("returns all 9 metrics", () => {
        const result = mapMetricsForView(baseMetricMap);

        expect(result.length).toBe(9);
    });

    it("stringifies numeric values", () => {
        const result = mapMetricsForView(baseMetricMap);

        result.forEach((item) => {
            expect(typeof item.value).toBe("string");
        });
    });
});