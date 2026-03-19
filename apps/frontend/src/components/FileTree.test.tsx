import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileSystemDirectory } from "../utils/filesystem";
import { FileTree } from "./FileTree";

const mockData: FileSystemDirectory = {
  id: 1,
  name: "root",
  kind: "directory",
  children: [
    {
      id: 2,
      name: "file1.txt",
      path: "file1.txt",
      kind: "file",
      handle: new File([], "file1.txt"),
    },
  ],
};

describe("FileTree", () => {
  it("renders without crashing", () => {
    render(<FileTree directory={mockData} onFileClick={vi.fn()} />);

    expect(screen.getByText("root")).toBeInTheDocument();
  });
});
