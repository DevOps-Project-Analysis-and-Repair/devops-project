import { Card, CardContent, Grid, Typography, Box } from "@mui/material";

interface Metric {
  id: string;
  name: string;
  value: string;
}

interface ComparisonMetricsViewProps {
  first?: Metric[];
  last?: Metric[];
}

export function ComparisonMetricsView({ first = [], last = [] }: ComparisonMetricsViewProps) {
  const map = new Map<string, { name: string; first?: string; last?: string }>();

  first.forEach((m) => {
    map.set(m.id, { name: m.name, first: m.value });
  });

  last.forEach((m) => {
    const existing = map.get(m.id);
    if (existing) {
      existing.last = m.value;
    } else {
      map.set(m.id, { name: m.name, last: m.value });
    }
  });

  const metrics = Array.from(map.entries());

  return (
    <Grid container spacing={2} mt={2}>
      {metrics.map(([id, metric]) => {
        const diff =
          metric.first && metric.last && !isNaN(Number(metric.first)) && !isNaN(Number(metric.last))
            ? Number(metric.last) - Number(metric.first)
            : null;

        return (
          <Grid key={id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {metric.name}
                </Typography>

                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Box>
                    <Typography variant="caption">First</Typography>
                    <Typography variant="h6">{metric.first ?? "-"}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption">Last</Typography>
                    <Typography variant="h6">{metric.last ?? "-"}</Typography>
                  </Box>

                  <Box textAlign="right">
                    <Typography variant="caption">Δ</Typography>
                    <Typography
                      variant="h6"
                      color={
                        diff == null
                          ? "text.primary"
                          : diff > 0
                          ? "success.main"
                          : diff < 0
                          ? "error.main"
                          : "text.primary"
                      }
                    >
                      {diff == null ? "-" : diff > 0 ? `+${diff}` : diff}
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