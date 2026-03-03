import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { useState, type Dispatch, type SetStateAction } from "react";
import { CodeViewer, type CodeViewerParams } from "../components/CodeViewer";
import { FileTree } from "../components/FileTree";
import {
  getFileExtension,
  type FileSystemDirectory,
  type FileSystemFile,
} from "../filesystem";

interface SelectedFilesDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onClickAction: () => void;
  files: FileSystemDirectory;
}

export function SelectedFilesDialog({
  open,
  setOpen,
  onClickAction,
  files,
}: SelectedFilesDialogProps) {
  const [fileContent, setFileContent] = useState<CodeViewerParams | null>(null);

  const handleClose = () => {
    setOpen(false);
  };

  async function onFileClick(file: FileSystemFile) {
    const content = await file.handle.text();
    const fileExtension = getFileExtension(file.name);

    if (!fileExtension) {
      throw "Invalid file name";
    }

    setFileContent({ content, language: fileExtension });
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>Selected files</DialogTitle>
        <DialogContent>
          <Stack direction="row">
            <FileTree directory={files} onFileClick={onFileClick} />
            {fileContent && (
              <CodeViewer
                content={fileContent.content}
                language={fileContent.language}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={onClickAction} autoFocus>
            Start Upload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
