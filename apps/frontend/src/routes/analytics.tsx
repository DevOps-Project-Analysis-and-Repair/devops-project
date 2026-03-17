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

type ExtractedSonarMetrics = {
  projectId: string;
  first?: Record<MetricName, ExtractedMetric>;
  latest?: Record<MetricName, ExtractedMetric>;
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

function buildMetricMap(report?: SonarReport) {
  const metricMap = Object.fromEntries(
    TARGET_METRICS.map((name) => [name, { value: null }])
  ) as Record<MetricName, ExtractedMetric>;

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

  return {
    projectId: json.projectId,
    first: sonarReports[0] ? buildMetricMap(sonarReports[0]) : undefined,
    latest:
      sonarReports.length > 1
        ? buildMetricMap(sonarReports[sonarReports.length - 1])
        : sonarReports[0]
        ? buildMetricMap(sonarReports[0])
        : undefined,
  };
}