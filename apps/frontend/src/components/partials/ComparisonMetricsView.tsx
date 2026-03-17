import { Card, CardContent, Grid, Typography, Box } from "@mui/material";

interface Metric {
  id: string;
  name: string;
  value: string;
  bestValue?: boolean;
}

interface ComparisonMetricsViewProps {
  first?: Metric[];
  last?: Metric[];
}

type Trend = "better" | "worse" | "same" | "unknown";

const higherIsBetterMetricIds = new Set<string>([
  "coverage",
  "duplicated_lines_density",
]);

const lowerIsBetterMetricIds = new Set<string>([
  "bugs",
  "vulnerabilities",
  "code_smells",
  "security_hotspots",
  "violations",
  "duplicated_blocks",
  "duplicated_files",
  "duplicated_lines",
  "ncloc",
  "complexity",
  "cognitive_complexity",
]);

function parseNumeric(value?: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

function getTrend(id: string, first?: string, last?: string): Trend {
  const firstNum = parseNumeric(first);
  const lastNum = parseNumeric(last);

  if (firstNum === undefined || lastNum === undefined) return "unknown";
  if (firstNum === lastNum) return "same";

  if (higherIsBetterMetricIds.has(id)) {
    return lastNum > firstNum ? "better" : "worse";
  }

  if (lowerIsBetterMetricIds.has(id)) {
    return lastNum < firstNum ? "better" : "worse";
  }

  return lastNum > firstNum ? "worse" : "better";
}

function getValueColor(bestValue?: boolean) {
  if (bestValue === true) return "success.main";
  if (bestValue === false) return "error.main";
  return "text.primary";
}

function getDeltaColor(trend: Trend) {
  switch (trend) {
    case "better":
      return "success.main";
    case "worse":
      return "error.main";
    case "same":
      return "warning.main";
    default:
      return "text.primary";
  }
}

function getCardBorderColor(bestValue?: boolean, trend?: Trend) {
  if (bestValue === true) return "success.main";
  if (bestValue === false) return "error.main";

  switch (trend) {
    case "better":
      return "success.light";
    case "worse":
      return "error.light";
    case "same":
      return "warning.light";
    default:
      return "divider";
  }
}

export function ComparisonMetricsView({
  first = [],
  last = [],
}: ComparisonMetricsViewProps) {
  const map = new Map<
    string,
    {
      name: string;
      first?: string;
      last?: string;
      firstBestValue?: boolean;
      lastBestValue?: boolean;
    }
  >();

  first.forEach((m) => {
    map.set(m.id, {
      name: m.name,
      first: m.value,
      firstBestValue: m.bestValue,
    });
  });

  last.forEach((m) => {
    const existing = map.get(m.id);
    if (existing) {
      existing.last = m.value;
      existing.lastBestValue = m.bestValue;
    } else {
      map.set(m.id, {
        name: m.name,
        last: m.value,
        lastBestValue: m.bestValue,
      });
    }
  });

  const metrics = Array.from(map.entries());

  return (
    <Grid container spacing={2} mt={2}>
      {metrics.map(([id, metric]) => {
        const hasFirst = metric.first !== undefined && metric.first !== null;
        const hasLast = metric.last !== undefined && metric.last !== null;

        const firstNum = parseNumeric(metric.first);
        const lastNum = parseNumeric(metric.last);

        const diff =
          hasFirst &&
          hasLast &&
          firstNum !== undefined &&
          lastNum !== undefined
            ? lastNum - firstNum
            : undefined;

        const trend = getTrend(id, metric.first, metric.last);
        const latestBestValue = metric.lastBestValue ?? metric.firstBestValue;

        return (
          <Grid key={id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card
              elevation={2}
              sx={{
                border: 1,
                borderColor: getCardBorderColor(latestBestValue, trend),
              }}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {metric.name}
                </Typography>

                <Box display="flex" justifyContent="space-between" mt={1} gap={2}>
                  <Box>
                    <Typography variant="caption">First</Typography>
                    <Typography
                      variant="h6"
                      color={getValueColor(metric.firstBestValue)}
                    >
                      {metric.first ?? "??"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption">Last</Typography>
                    <Typography
                      variant="h6"
                      color={getValueColor(metric.lastBestValue)}
                    >
                      {metric.last ?? "??"}
                    </Typography>
                  </Box>

                  <Box textAlign="right">
                    <Typography variant="caption">Δ</Typography>
                    <Typography variant="h6" color={getDeltaColor(trend)}>
                      {diff === undefined ? "??" : diff > 0 ? `+${diff}` : diff}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}