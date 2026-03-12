import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { API_BASE_URL, BASE_URL, type UploadProject } from "../../../api";
import {
  CodeViewer,
  type CodeViewerProps,
} from "../../../components/CodeViewer";
import { FileTree } from "../../../components/FileTree";
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

function Project() {
  const [fileContent, setFileContent] = useState<CodeViewerProps | null>(null);
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const {
    data: project,
    isPending,
    error,
  } = useQuery<UploadProject>({
    queryKey: ["projects", id],
    queryFn: () =>
      fetch(`${API_BASE_URL}/upload/projects/${id}`).then((r) => r.json()),
  });

  if (isPending) return <CircularProgress />;

  if (error) return <div> An error occured {error.message} </div>;

  async function onFileClick(file: FileSystemFile) {
    const content = await downloadFile(
      `${API_BASE_URL}/upload/projects/${id}/files/${file.downloadId!}`,
    );
    const fileExtension = getFileExtension(file.name);

    if (!fileExtension) {
      throw "Invalid file name";
    }

    setFileContent({ content, language: fileExtension, id: file.downloadId });
  }

  async function repairFile() {
    const result = await fetch(
      `${BASE_URL}/fix/projects/${id}/files/${fileContent?.id}`,
      {
        method: "POST",
      },
    )
      .then((res) => res.text())
      .catch((err) => console.error(err));

    localStorage.setItem("TMP_RESULT", JSON.stringify(result));
    console.log(result);
    navigate({
      to: `/project/$id/results/$file`,
      params: { id, file: fileContent?.id! },
    });
  }

  async function analyzeFile() {
    const result = await fetch(
      `${BASE_URL}/scan/${id}`,
      {
        method: "POST",
      },
    )
      .then((res) => res.text())
      .catch((err) => console.error(err));

    localStorage.setItem("TMP_RESULT", JSON.stringify(result));
    console.log(result);
    // navigate({
    //   to: `/project/$id/results/$file`,
    //   params: { id, file: fileContent?.id! },
    // });
  }

  return (
    <Container direction="column" overflow="auto">
      <Typography
        component="h1"
        variant="h4"
        sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
      >
        Project {project.name} ({project.files.length})
      </Typography>
      <Stack direction="row" overflow="auto" margin={2}>
        {project.files && (
          <FileTree
            directory={uploadFilesToFileSystemTree(project.files)}
            onFileClick={onFileClick}
          />
        )}
        <div>
          {fileContent && (
            <>
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                onClick={analyzeFile}
                startIcon={<TroubleshootIcon />}
              >
                Analyze & Repair
              </Button>
              <CodeViewer
                content={fileContent.content}
                language={fileContent.language}
              />
            </>
          )}
        </div>
      </Stack>
    </Container>
  );
}
