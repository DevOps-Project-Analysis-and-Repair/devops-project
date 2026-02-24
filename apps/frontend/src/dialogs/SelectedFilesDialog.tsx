import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useState, type Dispatch, type SetStateAction } from "react";
import { CodeViewer, type CodeViewerParams } from "../components/CodeViewer";
import { FileTree } from "../components/FileTree";
import type { FileSystemDirectory, FileSystemFile } from "../filesystem";

interface SelectedFilesDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  files: FileSystemDirectory;
}

export function SelectedFilesDialog({
  open,
  setOpen,
  files,
}: SelectedFilesDialogProps) {
  const [fileContent, setFileContent] = useState<CodeViewerParams | null>(null);

  const handleClose = () => {
    setOpen(false);
  };

  function getFileExtension(filepath: string): string | undefined {
    const extensionRegExp = new RegExp("\.([^.]+)$");
    const res = extensionRegExp.exec(filepath);
    return res?.[1];
  }

  async function onFileClick(file: FileSystemFile) {
    const content = await file.handle.text(); // great naming once again
    const fileExtension = getFileExtension(file.name);

    if (!fileExtension) {
      throw "Invalid file name";
    }

    setFileContent({ content, language: fileExtension });
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Selected files</DialogTitle>
        <DialogContent>
          <FileTree directory={files} onFileClick={onFileClick} />
          {fileContent && (
            <CodeViewer
              content={fileContent.content}
              language={fileContent.language}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleClose} autoFocus>
            Start Upload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
