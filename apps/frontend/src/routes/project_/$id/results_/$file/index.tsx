import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Button, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { API_BASE_URL } from "../../../../../api";
import CodeDiffViewer from "../../../../../components/CodeDiffViewer";
import { Container } from "../../../../../components/ui/Container";
import { downloadFile } from "../../../../../filesystem";

export const Route = createFileRoute("/project_/$id/results_/$file/")({
  component: RouteComponent,
});

function parseMarkdownCodeBlock(str: string) {
  const normalized = str.replace(/\\n/g, "\n");
  const match = normalized.match(/```(\w+)?\n([\s\S]*?)```/);
  if (!match) return null;

  return {
    language: match[1] || "text",
    code: match[2],
  };
}

function RouteComponent() {
  const { id, file } = Route.useParams();

  const {
    data: fileContent,
    isPending,
    error,
  } = useQuery<string>({
    queryKey: [id, "files", file],
    queryFn: () =>
      downloadFile(`${API_BASE_URL}/upload/projects/${id}/files/${file}`),
  });

  const stored = localStorage.getItem("TMP_RESULT") || "";
  const after = JSON.parse(stored);
  const afterCode = parseMarkdownCodeBlock(after);

  if (isPending) return <CircularProgress />;

  if (error || !fileContent)
    return <div> an error occured: {error?.message} </div>;

  return (
    <Container>
      <Button
        component={Link}
        to={`/project/${id}`}
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        sx={{
          mb: 3,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 500,
        }}
      >
        Back to project
      </Button>

      <CodeDiffViewer
        beforeCode={fileContent}
        afterCode={afterCode?.code || ""}
        language={afterCode?.language || "unknown"}
      ></CodeDiffViewer>
    </Container>
  );
}
