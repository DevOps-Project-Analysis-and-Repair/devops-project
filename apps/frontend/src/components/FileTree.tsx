import { styled } from "@mui/material";
import { TreeItem } from "@mui/x-tree-view";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import type { JSX } from "react";
import type { FileSystemDirectory, FileSystemFile } from "../filesystem";

export interface FileTreeProps {
  directory: FileSystemDirectory;
  onFileClick: (file: FileSystemFile) => void;
}

export interface FileTreeItemProps {
  item: FileSystemDirectory | FileSystemFile;
  onFileClick: (file: FileSystemFile) => void;
}

const FileTreeContainer = styled("div")({
  marginRight: "8px",
  minWidth: "25ch",
});

export function FileTreeItem({
  item,
  onFileClick,
}: FileTreeItemProps): JSX.Element {
  switch (item.kind) {
    case "directory":
      return (
        <TreeItem itemId={String(item.id)} label={item.name}>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              onFileClick={onFileClick}
            />
          ))}
        </TreeItem>
      );
    case "file":
      return (
        <TreeItem
          itemId={String(item.id)}
          label={item.name}
          onClick={() => onFileClick(item)}
        />
      );
  }
}

export function FileTree({
  directory,
  onFileClick,
}: FileTreeProps): JSX.Element {
  if (!directory.children.length) return <></>;

  return (
    <FileTreeContainer>
      <SimpleTreeView defaultExpandedItems={[String(directory.id)]}>
        <TreeItem itemId={String(directory.id)} label={directory.name}>
          {directory.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              onFileClick={onFileClick}
            />
          ))}
        </TreeItem>
      </SimpleTreeView>
    </FileTreeContainer>
  );
}
