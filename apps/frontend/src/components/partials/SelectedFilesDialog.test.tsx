import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileSystemDirectory } from "../../filesystem";
import { SelectedFilesDialog } from "./SelectedFilesDialog";


describe("SelectedFilesDialog", () => {
  const mockFiles: FileSystemDirectory = {
    id: 0,
    kind: "directory",
    name: "root",
    children: [],
  };

  it("renders dialog with title and buttons", () => {
    const setOpen = vi.fn();
    const onClickAction = vi.fn();

    render(
      <SelectedFilesDialog
        open={true}
        isUploading={{ uploading: false, progress: 0 }}
        setOpen={setOpen}
        onClickAction={onClickAction}
        files={mockFiles}
      />
    );

    expect(screen.getByText("Selected files")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Start Upload")).toBeInTheDocument();
  });

});