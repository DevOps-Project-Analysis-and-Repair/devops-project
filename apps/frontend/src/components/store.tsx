import type { FileSystemDirectory } from "../filesystem";

let storedFiles: FileSystemDirectory | null = null;

export function getStoredFiles() {
  return storedFiles;
}

export function setStoredFiles(files: FileSystemDirectory | null) {
  storedFiles = files;
}
