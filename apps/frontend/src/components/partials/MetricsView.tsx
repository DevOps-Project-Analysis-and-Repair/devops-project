import { Card, CardContent, Grid, Typography } from "@mui/material";

export interface MetricsViewProps {
  metrics: Metric[];
}

export interface Metric {
  id: string;
  name: string;
  value: string;
}

export function MetricsView({ metrics }: MetricsViewProps) {
  return (
    <Grid container spacing={2} marginTop={3}>
      {metrics.map((metric) => (
        <Grid key={metric.id} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {metric.name}
              </Typography>

              <Typography variant="h5" fontWeight={600}>
                {metric.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
