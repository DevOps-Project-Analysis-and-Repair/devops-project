import { Description } from "@mui/icons-material";
import Button from "@mui/material/Button";
import MuiCard from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type ChangeEvent } from "react";
import { SelectedFilesDialog } from "../dialogs/SelectedFilesDialog";
import { filesToFileSystemTree, type FileSystemDirectory } from "../filesystem";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [{ title: "Ask Vincent" }],
  }),
});

// Webkit directory is not stable, but required for getting the full path of directories
// It is however, supported by all major browser vendors: https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory#browser_compatibility
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

const EMPTY_ROOT_DIRECTORY: FileSystemDirectory = {
  kind: "directory",
  id: -1,
  name: "Root",
  children: [],
};

function Index() {
  const [files, setFiles] = useState<FileSystemDirectory>(EMPTY_ROOT_DIRECTORY);
  const [open, setOpen] = useState(false);

  function onChange(
    event: ChangeEvent<HTMLInputElement, HTMLInputElement>,
  ): void {
    // TODO: Filter files, only keep text based files (utf-8, ascii)
    const files: File[] = [...(event.target.files ?? [])];
    const directory = filesToFileSystemTree(files);
    if (!directory) {
      console.error("Could not convert to directory");
      return;
    }

    setFiles(directory);
    setOpen(true);
  }

  return (
    <SignInContainer direction="column" justifyContent="space-between">
      <Card variant="outlined">
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
        >
          Analyze code
        </Typography>
        <Typography component="p" variant="subtitle1" sx={{ width: "100%" }}>
          Upload your source code to receive analysis and improve quality.
        </Typography>
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<Description />}
        >
          Upload files
          <input
            type="file"
            id="upload-files"
            style={{ display: "none" }}
            multiple
            onChange={onChange}
          ></input>
        </Button>

        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<Description />}
        >
          Upload directory
          <input
            type="file"
            style={{ display: "none" }}
            webkitdirectory="true"
            onChange={onChange}
          ></input>
        </Button>
      </Card>
      <SelectedFilesDialog files={files} open={open} setOpen={setOpen} />
    </SignInContainer>
  );
}
