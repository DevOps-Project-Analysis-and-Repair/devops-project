import {
  Link as ButtonLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Container } from "../../components/ui/Container";
export const Route = createFileRoute("/history/")({
  component: RouteComponent,
});

function RouteComponent() {
  const rows: string[] = ["123"];
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
        <Table sx={{ minWidth: 650 }} aria-label="Project history">
          <TableHead>
            <TableRow>
              <TableCell>Projects</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Link to={`/project/$id`} params={{ id: row }}>{row}</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
