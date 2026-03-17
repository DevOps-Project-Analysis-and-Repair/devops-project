type MetricName =
  | "coverage"
  | "bugs"
  | "reliability_rating"
  | "code_smells"
  | "duplicated_lines_density"
  | "security_rating"
  | "ncloc"
  | "vulnerabilities"
  | "sqale_rating";

type MetricItem = {
  metric: string;
  value: number;
  bestValue?: boolean;
};

type SonarReport = {
  metrics?: MetricItem[];
};

type ProjectJson = {
  projectId: string;
  analysis?: {
    sonar?: SonarReport[];
  };
};

type ExtractedMetric = {
  value: number | null;
  bestValue?: boolean;
};

type MetricMap = Record<MetricName, ExtractedMetric>;

export type ExtractedSonarMetrics = {
  projectId: string;
  first?: MetricMap;
  last?: MetricMap;
};

const TARGET_METRICS: MetricName[] = [
  "coverage",
  "bugs",
  "reliability_rating",
  "code_smells",
  "duplicated_lines_density",
  "security_rating",
  "ncloc",
  "vulnerabilities",
  "sqale_rating",
];

function buildMetricMap(report?: SonarReport): MetricMap {
  const metricMap = Object.fromEntries(
    TARGET_METRICS.map((name) => [name, { value: null }])
  ) as MetricMap;

  for (const metricItem of report?.metrics ?? []) {
    if (TARGET_METRICS.includes(metricItem.metric as MetricName)) {
      const metricName = metricItem.metric as MetricName;
      metricMap[metricName] = {
        value: metricItem.value,
        bestValue: metricItem.bestValue,
      };
    }
  }

  return metricMap;
}

export function extractSonarMetrics(json: ProjectJson): ExtractedSonarMetrics {
  const sonarReports = json.analysis?.sonar ?? [];

  const firstReport = sonarReports[0];
  const lastReport = sonarReports[sonarReports.length - 1];

  console.log(json);

  return {
    projectId: json.projectId,
    first: firstReport ? buildMetricMap(firstReport) : undefined,
    last: lastReport ? buildMetricMap(lastReport) : undefined,
  };
}

export function mapMetricsForView(metricMap: Record<MetricName, ExtractedMetric>) {
  return [
    { id: "coverage", name: "Coverage", value: String(metricMap.coverage.value ?? "-") },
    { id: "bugs", name: "Bugs", value: String(metricMap.bugs.value ?? "-") },
    { id: "reliability_rating", name: "Reliability", value: String(metricMap.reliability_rating.value ?? "-") },
    { id: "code_smells", name: "Code Smells", value: String(metricMap.code_smells.value ?? "-") },
    { id: "duplicated_lines_density", name: "Duplicated Lines %", value: String(metricMap.duplicated_lines_density.value ?? "-") },
    { id: "security_rating", name: "Security", value: String(metricMap.security_rating.value ?? "-") },
    { id: "ncloc", name: "NCLOC", value: String(metricMap.ncloc.value ?? "-") },
    { id: "vulnerabilities", name: "Vulnerabilities", value: String(metricMap.vulnerabilities.value ?? "-") },
    { id: "sqale_rating", name: "Maintainability", value: String(metricMap.sqale_rating.value ?? "-") },
  ];
}