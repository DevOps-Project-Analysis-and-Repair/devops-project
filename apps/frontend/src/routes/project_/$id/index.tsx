import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { API_BASE_URL, type UploadProject } from "../../../api";
import {
  CodeViewer,
  type CodeViewerProps,
} from "../../../components/CodeViewer";
import { FileTree } from "../../../components/FileTree";
import {
  AnalyzeAndRepairDialog,
  type AnalyzeAndRepairData,
} from "../../../components/partials/AnalyzeAndRepairDialog";
import { MetricsView } from "../../../components/partials/MetricsView";
import { Container } from "../../../components/ui/Container";
import {
  downloadFile,
  getFileExtension,
  uploadFilesToFileSystemTree,
  type FileSystemFile,
} from "../../../filesystem";

export const Route = createFileRoute("/project_/$id/")({
  component: Project,
});

type FileIterationData = { id: string; iteration: number };
const flex110 = { flexGrow: 1, flexShrink: 1, flexBasis: 0 };

function FileIterations(props: {
  iterations: FileIterationData[];
  handler: (id: string) => void;
}) {
  const { iterations, handler } = props;

  return (
    <>
      <ButtonGroup variant="outlined">
        {iterations.map((x) => (
          <Button key={x.id} onClick={() => handler(x.id)}>
            {x.iteration}
          </Button>
        ))}
      </ButtonGroup>
    </>
  );
}

const metrics = [
  { id: "1", name: "Maintainability", value: "3.2%" },
  { id: "2", name: "Issues", value: "17" },
  { id: "3", name: "Quality", value: "4" },
  { id: "4", name: "CC", value: "55" },
  { id: "5", name: "R", value: "55%" },
];

function Project() {
  const [project, setProject] = useState<UploadProject | null>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const [fileContent, setFileContent] = useState<CodeViewerProps | null>(null);
  const [iterationContent, setIterationContent] =
    useState<CodeViewerProps | null>(null);
  const [projectUnderAnalysis, setAnalyzeProject] =
    useState<AnalyzeAndRepairData | null>(null);

  const { id } = Route.useParams();

  async function downloadProject() {
    const resp = await fetch(`${API_BASE_URL}/upload/projects/${id}`);

    console.log(resp);

    setProject(await resp.json());
  }

  useEffect(() => {
    downloadProject()
      .then(() => setInitialLoad(false))
      .catch((e) => setError(e));
  }, []);

  if (initialLoad) return <CircularProgress />;

  if (error || !project) return <div> An error occured {error?.message} </div>;

  async function onFileClick(file: FileSystemFile) {
    setFileContent(null);
    setIterationContent(null);

    const content = await downloadFile(
      `${API_BASE_URL}/upload/projects/${id}/files/${file.downloadId}`,
    );
    const fileExtension = getFileExtension(file.name);

    if (!fileExtension) {
      throw "Invalid file name";
    }

    setFileContent({ content, language: fileExtension, id: file.downloadId });
  }

  function getFileIterations(
    project: UploadProject,
    fileId: string,
  ): FileIterationData[] {
    const iterations = (project.repairedFiles[fileId] ??= []);

    return iterations.map((x) => {
      return { id: x.id, iteration: x.iteration };
    });
  }

  async function onFileIterationClick(fileId: string) {
    console.log(fileId);

    const content = await downloadFile(
      `${API_BASE_URL}/upload/projects/${id}/files/${fileId}`,
    );

    // using filecontent here is the biggest hack of 2k26
    setIterationContent({
      content,
      language: fileContent!.language,
      id: fileId,
    });
  }

  async function analyzeProject() {
    if (!project) {
      return;
    }
    if (!fileContent || !fileContent.id) {
      return;
    }

    setAnalyzeProject({ projectId: project.id, fileId: fileContent.id });
  }

  async function postAnalyzedProject() {
    setAnalyzeProject(null);

    // Refresh project
    await downloadProject();
  }


  return (
    <>
      <AnalyzeAndRepairDialog
        data={projectUnderAnalysis}
        onComplete={postAnalyzedProject}
      />
      <Container direction="column" overflow="auto">
        <Button
          component={Link}
          to={`/`}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          Back to home screen
        </Button>
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
        >
          Project {project.name} ({project.files.length})
        </Typography>

        <Box sx={{ display: "flex", direction: "row" }} pt={2}>
          {project.files && (
            <FileTree
              directory={uploadFilesToFileSystemTree(project.files)}
              onFileClick={onFileClick}
            />
          )}

          {fileContent && (
            <Box
              sx={{
                display: "flex",
                direction: "row",
                overflow: "auto",
                ...flex110,
              }}
            >
              <Box sx={{ display: "flex", overflowY: "auto", ...flex110 }}>
                <Box p={2} sx={{ minWidth: "100%" }}>
                  <Button
                    component="label"
                    role={undefined}
                    variant="contained"
                    tabIndex={-1}
                    onClick={analyzeProject}
                    startIcon={<TroubleshootIcon />}
                  >
                    Analyze & Repair
                  </Button>

                  <MetricsView metrics={metrics} />

                  <CodeViewer
                    content={fileContent.content}
                    language={fileContent.language}
                  />
                </Box>
              </Box>

              <Divider orientation="vertical" flexItem />

              <Box sx={{ display: "flex", overflowY: "auto", ...flex110 }}>
                <Box p={2} sx={{ minWidth: "100%" }}>
                  <FileIterations
                    iterations={getFileIterations(project, fileContent.id!)}
                    handler={onFileIterationClick}
                  />

                  {iterationContent && (
                    <CodeViewer
                      content={iterationContent.content}
                      language={iterationContent.language}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
        {project && (
          <div>
            <h3>Sonarcube results</h3>
            <a
              href={`https://sonarcloud.io/project/overview?id=devops-software-engineering_${project.id}`}
            >
              Sonarcube project
            </a>
          </div>
        )}
      </Container>
    </>
  );
}
