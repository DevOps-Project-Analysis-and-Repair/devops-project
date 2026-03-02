import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import { Button, CircularProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { API_BASE_URL, type UploadProject } from "../../../api";
import {
  CodeViewer,
  type CodeViewerParams,
} from "../../../components/CodeViewer";
import { FileTree } from "../../../components/FileTree";
import { getStoredFiles } from "../../../components/store";
import { Container } from "../../../components/ui/Container";
import { getFileExtension, type FileSystemFile } from "../../../filesystem";
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

  console.log(project);
  // if (id !== "123") {
  //   throw notFound();
  // }

  const files = getStoredFiles();

  async function onFileClick(file: FileSystemFile) {
    const content = await file.handle.text(); // great naming once again
    const fileExtension = getFileExtension(file.name);

    if (!fileExtension) {
      throw "Invalid file name";
    }

    setFileContent({ content, language: fileExtension });
  }

  return (
    <Container direction="row" overflow="auto">
       <Typography
          component="h1"
          variant="h4"
          sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
        >
          Project {project.name} ({project.files.length})
        </Typography>

        
      {files && <FileTree directory={files!} onFileClick={onFileClick} />} 
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
    </Container>
  );
}
