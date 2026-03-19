import {
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  getFileExtension,
  type FileSystemDirectory,
  type FileSystemFile,
} from "../../filesystem";
import { CodeViewer, type CodeViewerProps } from "../CodeViewer";
import { FileTree } from "../FileTree";

interface SelectedFilesDialogProps {
  readonly open: boolean;
  readonly isUploading: Readonly<{ uploading: boolean; progress: number }>;
  readonly setOpen: Dispatch<SetStateAction<boolean>>;
  readonly onClickAction: () => void;
  readonly files: FileSystemDirectory;
}

export function SelectedFilesDialog({
  open,
  isUploading,
  setOpen,
  onClickAction,
  files,
}: Readonly<SelectedFilesDialogProps>) {
  const [fileContent, setFileContent] = useState<CodeViewerProps | null>(null);

  const handleClose = () => {
    setOpen(false);
  };

  async function onFileClick(file: FileSystemFile) {
    const content = await file.handle.text();
    const fileExtension = getFileExtension(file.name);

    if (!fileExtension) {
      throw new Error("Invalid file name: no extension found");
    }

    setFileContent({ content, language: fileExtension });
  }

  return (
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
        <Button disabled={isUploading.uploading} onClick={handleClose}>Cancel</Button>
        <Button disabled={isUploading.uploading} onClick={onClickAction} autoFocus>
          Start Upload
        </Button>
      </DialogActions>

      <Backdrop
        open={isUploading.uploading}
        sx={{
          position: 'absolute',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          color: '#fff',
          borderRadius: 'inherit',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Dialog>
  );
}
