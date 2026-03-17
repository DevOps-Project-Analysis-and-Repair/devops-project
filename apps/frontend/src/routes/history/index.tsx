import {
  Link as ButtonLink,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { API_BASE_URL, type UploadProject } from "../../api";
import { Container } from "../../components/ui/Container";
export const Route = createFileRoute("/history/")({
  component: RouteComponent,
});


function RouteComponent() {

  const { data: projects, isPending, error } = useQuery<UploadProject[]>({
    queryKey: ["projects"],
    queryFn: () => fetch(`${API_BASE_URL}/upload/projects`).then((r) => r.json()),
  });

  return (
    <Container>
      <Link to="/">
        <ButtonLink
          component="button"
          type="button"
          variant="body2"
          sx={{ alignSelf: "center" }}
        >
          Go Back
        </ButtonLink>
      </Link>
      <hr />
      <TableContainer component={Paper}>
        {isPending && <><CircularProgress color="inherit" /></>}

        {!isPending && !error &&  (
          <Table sx={{ minWidth: 650 }} aria-label="Project history">
            <TableHead>
              <TableRow>
                <TableCell>Projects</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Link to={`/project/$id`} params={{ id: project.id }}>
                      {project.name}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
     
      </TableContainer>
    </Container>
  );
}
