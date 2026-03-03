import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { API_BASE_URL, type UploadProject } from "../../../api";
import {
  CodeViewer,
  type CodeViewerParams,
} from "../../../components/CodeViewer";
import { FileTree } from "../../../components/FileTree";
import { Container } from "../../../components/ui/Container";
import { downloadFile, getFileExtension, uploadFilesToFileSystemTree, type FileSystemFile } from "../../../filesystem";

export const Route = createFileRoute("/project_/$id/")({
  component: Project,
});

function Project() {
  const [fileContent, setFileContent] = useState<CodeViewerParams | null>(null);
  const { id } = Route.useParams();

  const { data: project, isPending, error } = useQuery<UploadProject>({
    queryKey: ["projects", id],
    queryFn: () => fetch(`${API_BASE_URL}/upload/projects/${id}`).then((r) => r.json()),
  });

  if(isPending) return <CircularProgress />;

  if(error) return <div> An error occured {error.message} </div>;

  async function onFileClick(file: FileSystemFile) {
    const content = await downloadFile(`${API_BASE_URL}/upload/projects/${id}/files/${file.downloadId!}`);
    const fileExtension = getFileExtension(file.name);

    if (!fileExtension) {
      throw "Invalid file name";
    }

    setFileContent({ content, language: fileExtension });
  }

  async function analyzeFile() {
    fetch("http://127.0.0.1:4000/llm-service/analyze", {
      method: "POST",
      body: fileContent?.content || "",
    })
      .then((res) => res.text())
      .then((data) => console.log(data))
      .catch((err) => console.error(err));
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
        {project.files && <FileTree directory={uploadFilesToFileSystemTree(project.files)} onFileClick={onFileClick} />}
        <div>
          {fileContent && (
            <>
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
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
