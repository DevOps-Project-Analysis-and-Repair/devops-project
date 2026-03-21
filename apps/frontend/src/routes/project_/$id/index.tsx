import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Typography
} from "@mui/material";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CodeViewer,
  type CodeViewerProps,
} from "../../../components/CodeViewer";
import { FileTree } from "../../../components/FileTree";
import { MenuButtonGroup, type MenuButtonItem } from "../../../components/MenuButtonGroup";
import {
  AnalyzeAndRepairDialog,
  type AnalyzeAndRepairData,
} from "../../../components/partials/AnalyzeAndRepairDialog";
import { CodeIssuesView } from "../../../components/partials/CodeIssuesView";
import { ComparisonMetricsView } from "../../../components/partials/ComparisonMetricsView";
import { Container } from "../../../components/ui/Container";
import { getAnalysisResults } from "../../../services/analysisService";
import { downloadFile, getAnalysis, getProject, getProjectAnalysis } from "../../../services/uploadService";
import { sleep } from "../../../utils";
import { extractSonarMetrics, groupIssuesByPath, mapMetricsForView, type ExtractedSonarMetrics, type IssueItem } from "../../../utils/analytics";
import { type UploadProject } from "../../../utils/api";
import {
  getFileExtension,
  uploadFilesToFileSystemTree,
  type FileSystemFile,
} from "../../../utils/filesystem";

export const Route = createFileRoute("/project_/$id/")({
  component: Project,
});


const flex110 = { flexGrow: 1, flexShrink: 1, flexBasis: 0 };



function Project() {
  const [project, setProject] = useState<UploadProject | null>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const [fileContent, setFileContent] = useState<CodeViewerProps | null>(null);
  const [iterationContent, setIterationContent] =
    useState<CodeViewerProps | null>(null);
  const [projectUnderAnalysis, setAnalyzeProject] =
    useState<AnalyzeAndRepairData | null>(null);
  const [sonarMetrics, setSonarMetrics] = useState<ExtractedSonarMetrics | null>(null);
  const [sonarIssues, setSonarIssues] = useState<Map<string, IssueItem[]> | null>(null);

  const { id } = Route.useParams();

  async function downloadProject() {
    const project = await getProject(id);
    setProject(project);
  }

  async function downloadAnalytics(signal: AbortSignal) {
    const result = await getProjectAnalysis(id);
    
    if (Object.keys(result).length >= 1) {
      setSonarMetrics(extractSonarMetrics(result));
      setSonarIssues(groupIssuesByPath(result));
      return;
    }
    
    const analyticsResult = await getAnalysisResults(id);

    if (!analyticsResult.analysisId) { throw new Error("Unable to get analysis id"); }
    
    while (true) {
      if (signal.aborted) { return; }
      await sleep(1000);
    
      const analysisResults = await getAnalysis(id);
    
      if (Object.keys(analysisResults).length === 0) { continue; }

      if (analysisResults.sonar) {
        setSonarMetrics(extractSonarMetrics(analysisResults));
        setSonarIssues(groupIssuesByPath(analysisResults));
        return;
      }
    }
  }

  useEffect(() => {
    const abortController = new AbortController();

    downloadProject()
      .then(() => setInitialLoad(false))
      .catch((e) => setError(e));

    downloadAnalytics(abortController.signal);

    return () => { abortController.abort(); }
  }, []);

  if (initialLoad) return <CircularProgress />;

  if (error || !project) return <div> An error occured {error?.message} </div>;

  async function onFileClick(file: FileSystemFile) {
    setFileContent(null);
    setIterationContent(null);

    const content = await downloadFile(id, file?.downloadId || ''); 
    
    const fileExtension = getFileExtension(file.name);

    if (!fileExtension) {
      throw "Invalid file name";
    }

    setFileContent({ content, language: fileExtension, id: file.downloadId, filepath: file.path });
  }

  function getFileIterations(project: UploadProject, fileId: string): MenuButtonItem[] {
    const iterations = (project.repairedFiles[fileId] ??= []);

    return iterations.map((x) => {
      return { id: x.id, label: x.iteration };
    });
  }

  async function onFileIterationClick(fileId: string) {
    const content = await downloadFile(id, fileId);
    
    setIterationContent({
      content,
      language: fileContent!.language,
      id: fileId,
    });
  }

  async function analyzeProject() {
    if (!project || !fileContent || !fileContent.id) {
      return;
    }
    
    setAnalyzeProject({ projectId: project.id, fileId: fileContent.id });
  }

  async function postAnalyzedProject() {
    setAnalyzeProject(null);

    await Promise.all([
      downloadProject(),
      downloadAnalytics(new AbortController().signal)
    ]);
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

        <Box sx={{ width: "100%", pt: 2 }}>
          {(!sonarMetrics?.first && !sonarMetrics?.last) ? (
            <Typography>No analysis available yet.</Typography>
          ) : (
            <>
              <Typography sx={{ mb: 1 }}>Analysis comparison</Typography>
              <ComparisonMetricsView
                first={sonarMetrics?.first ? mapMetricsForView(sonarMetrics.first) : []}
                last={sonarMetrics?.last ? mapMetricsForView(sonarMetrics.last) : []}
              />
            </>
          )}
        </Box>

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
                    disabled={!sonarMetrics}
                    component="label"
                    role={undefined}
                    variant="contained"
                    tabIndex={-1}
                    onClick={analyzeProject}
                    startIcon={<TroubleshootIcon />}
                  >
                    { !sonarMetrics ? <>Analyzing</> : <>Repair & Analyze</>}
                  </Button>

                  <CodeViewer
                    content={fileContent.content}
                    language={fileContent.language}
                  />
                </Box>
              </Box>

              <Divider orientation="vertical" flexItem />

              <Box sx={{ display: "flex", overflowY: "auto", ...flex110 }}>
                <Box p={2} sx={{ minWidth: "100%" }}>
                  <MenuButtonGroup
                    items={getFileIterations(project, fileContent.id!)}
                    onItemClick={onFileIterationClick}
                  />

                  {iterationContent && (
                    <CodeViewer
                      content={iterationContent.content}
                      language={iterationContent.language}
                    />
                  )}

                  {
                    (sonarIssues?.get(fileContent.filepath!) ?? []).length >= 1 && <CodeIssuesView issues={sonarIssues?.get(fileContent.filepath!) ?? []} />
                  }
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