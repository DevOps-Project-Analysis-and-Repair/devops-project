import { Box, Link as ButtonLink, CircularProgress, Container, Grid, Paper, Typography, } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { API_BASE_URL } from '../../../../../api';
import { CodeViewer } from '../../../../../components/CodeViewer';
import { downloadFile } from '../../../../../filesystem';

export const Route = createFileRoute('/project_/$id/results_/$file/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id, file } = Route.useParams();
  
  const { data: fileContent, isPending, error } = useQuery<string>({
    queryKey: [id, "files", file],
    queryFn: () => downloadFile(`${API_BASE_URL}/upload/projects/${id}/files/${file}`),
  });

  const stored = localStorage.getItem("TMP_RESULT") || "";
  const after = JSON.parse(stored);

  if(isPending) return <CircularProgress />;

  if(error || !fileContent) return <div> an error occured: {error?.message} </div>; 

  return (
    <Container>
      <Link to="/">
        <ButtonLink
          component="button"
          type="button"
          variant="body2"
          sx={{ alignSelf: "center" }}
        >
          Go back to project
        </ButtonLink>
      </Link>

      <Box p={2}>
      <Grid container spacing={2}>
        {/* Before Code */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: "16px", height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Before
            </Typography>
            <CodeViewer content={fileContent} language='ts' />
          </Paper>
        </Grid>

        {/* After Code */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: "16px", height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              After
            </Typography>
            <CodeViewer content={after} language='ts' />
          </Paper>
        </Grid>
      </Grid>
    </Box>
    </Container>
  );
}

