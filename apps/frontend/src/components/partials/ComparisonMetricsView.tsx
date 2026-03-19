import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

interface Metric {
  readonly id: string;
  readonly name: string;
  readonly value: string;
  readonly bestValue?: boolean;
}

interface ComparisonMetricsViewProps {
  readonly first?: ReadonlyArray<Metric>;
  readonly last?: ReadonlyArray<Metric>;
}

type Trend = "better" | "worse" | "same" | "unknown";

const higherIsBetterMetricIds: ReadonlySet<string> = new Set<string>([
  "coverage",
  "line_coverage",
  "branch_coverage",
  "test_success_density",
]);

const lowerIsBetterMetricIds: ReadonlySet<string> = new Set<string>([
  "bugs",
  "vulnerabilities",
  "code_smells",
  "security_hotspots",
  "violations",
  "duplicated_blocks",
  "duplicated_files",
  "duplicated_lines",
  "duplicated_lines_density",
  "ncloc",
  "complexity",
  "cognitive_complexity",
  "sqale_index",
  "technical_debt",
  "reliability_remediation_effort",
  "security_remediation_effort",
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

function getTrendColor(trend: Trend) {
  switch (trend) {
    case "better":
      return "success";
    case "worse":
      return "error";
    case "same":
      return "default";
    default:
      return "default";
  }
}

function getDeltaText(diff?: number) {
  if (diff === undefined) return "??";
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

function getTrendLabel(trend: Trend) {
  switch (trend) {
    case "better":
      return "Improved";
    case "worse":
      return "Regressed";
    case "same":
      return "Unchanged";
    default:
      return "Unknown";
  }
}

function getTrendIcon(trend: Trend) {
  switch (trend) {
    case "better":
      return <TrendingUpIcon fontSize="small" />;
    case "worse":
      return <TrendingDownIcon fontSize="small" />;
    case "same":
    default:
      return <TrendingFlatIcon fontSize="small" />;
  }
}

function getDeltaColor(trend: Trend) {
  switch (trend) {
    case "better":
      return "success.main";
    case "worse":
      return "error.main";
    default:
      return "text.primary";
  }
}

export function ComparisonMetricsView({
  first = [],
  last = [],
}: Readonly<ComparisonMetricsViewProps>) {
  const map = new Map<
    string,
    {
      readonly name: string;
      readonly first?: string;
      readonly last?: string;
      readonly firstBestValue?: boolean;
      readonly lastBestValue?: boolean;
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
    <Grid container spacing={{ xs: 1.5, sm: 2 }} mt={1}>
      {metrics.map(([id, metric]) => {
        const firstNum = parseNumeric(metric.first);
        const lastNum = parseNumeric(metric.last);

        const diff =
          firstNum !== undefined && lastNum !== undefined
            ? lastNum - firstNum
            : undefined;

        const trend = getTrend(id, metric.first, metric.last);

        return (
          <Grid key={id} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: 3,
                border: 1,
                borderColor: "divider",
                backgroundColor: "background.paper",
              }}
            >
              <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        lineHeight: 1.3,
                        pr: 1,
                        minHeight: 40,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {metric.name}
                    </Typography>

                    <Chip
                      size="small"
                      icon={getTrendIcon(trend)}
                      label={getTrendLabel(trend)}
                      color={getTrendColor(trend)}
                      variant={trend === "same" || trend === "unknown" ? "outlined" : "filled"}
                      sx={{ flexShrink: 0 }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto 1fr",
                      alignItems: "center",
                      gap: 1.5,
                      py: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        textAlign: "center",
                        px: 1,
                        py: 1.25,
                        borderRadius: 2,
                        backgroundColor: "action.hover",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        First
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: getValueColor(metric.firstBestValue),
                          lineHeight: 1.2,
                          wordBreak: "break-word",
                        }}
                      >
                        {metric.first ?? "??"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        minWidth: 72,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Delta
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          lineHeight: 1.2,
                          color: getDeltaColor(trend),
                        }}
                      >
                        {getDeltaText(diff)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        textAlign: "center",
                        px: 1,
                        py: 1.25,
                        borderRadius: 2,
                        backgroundColor: "action.hover",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Last
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: getValueColor(metric.lastBestValue),
                          lineHeight: 1.2,
                          wordBreak: "break-word",
                        }}
                      >
                        {metric.last ?? "??"}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
