export type FileSystemNode = FileSystemDirectory | FileSystemFile;
export type FileSystemDirectory = { kind: 'directory', id: number, name: string, children: FileSystemNode[] };
export type FileSystemFile = { kind: 'file', id: number, name: string, path: string, handle: File, downloadId?: string };

function dir(name: string, id: number): FileSystemDirectory {
  return { kind: 'directory', id, name, children: [] };
}

function file(name: string, path: string, id: number, handle: File): FileSystemFile {
  return { kind: 'file', id, path, name, handle };
}

export function findInDirectory(name: string, dir: FileSystemDirectory): FileSystemNode | null {
  for (const child of dir.children) {
    if (child.kind !== 'directory') { continue; }

    if (child.name === name) { return child; }
  }

  return null;
}

export function filesToFileSystemTree(files: File[]): FileSystemDirectory | null {
  if (files.length === 0) { return null; }

  let id = 0;
  const root = dir(".", id++);

  for (const entry of files) {
    const path = entry.webkitRelativePath || entry.name;
    const pathParts = path.split('/');

    const pathDirectories = pathParts.slice(0, -1);
    const pathFile = pathParts.slice(-1)[0];

    let cwd = root;

    for (const part of pathDirectories) {
      const result = findInDirectory(part, cwd);

      if (result === null) {
        const newCwd = dir(part, id++);
        cwd.children.push(newCwd);
        cwd = newCwd;
        continue;
      }

      if (result.kind === "directory") {
        cwd = result;
        continue;
      }
    }

    cwd.children.push(file(pathFile, path, id++, entry));
  }

  return root;
}

export function flattenFileSystem(root: FileSystemDirectory): FileSystemFile[] {
  return root.children.flatMap(node => node.kind === 'file' ? [node] : flattenFileSystem(node));
}

export function getFileExtension(filepath: string): string | undefined {
  const extensionRegExp = new RegExp("\.([^.]+)$");
  const res = extensionRegExp.exec(filepath);
  return res?.[1];
}

export async function urlToFile(url: string, filename: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new File([blob], filename, { type: blob.type });
}