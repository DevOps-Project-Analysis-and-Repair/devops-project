import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import { Button } from "@mui/material";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  CodeViewer,
  type CodeViewerParams,
} from "../../../components/CodeViewer";
import { FileTree } from "../../../components/FileTree";
import { getStoredFiles } from "../../../components/store";
import { Container } from "../../../components/ui/Container";
import { getFileExtension } from "../../../filesystem";
export const Route = createFileRoute("/project_/$id/")({
  component: Project,
});

function Project() {
  const [fileContent, setFileContent] = useState<CodeViewerParams | null>(null);

  const { id } = Route.useParams();
  console.log(id);
  if (id !== "123") {
    throw notFound();
  }

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
    <Container direction="row">
      <FileTree directory={files!} onFileClick={onFileClick} />
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
