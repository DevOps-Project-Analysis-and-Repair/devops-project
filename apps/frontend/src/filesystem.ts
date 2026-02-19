export type FileSystemNode = FileSystemDirectory | FileSystemFile;
export type FileSystemDirectory = { kind: 'directory', id: number, name: string, children: FileSystemNode[] };
export type FileSystemFile = { kind: 'file', id: number, name: string, handle: File };

function dir(name: string, id: number): FileSystemDirectory {
  return { kind: 'directory', id, name, children: [] };
}

function file(name: string, id: number, handle: File): FileSystemFile {
  return { kind: 'file', id, name, handle };
}

export function findInDirectory(name: string, dir: FileSystemDirectory): FileSystemNode | null {
  for (const child of dir.children) {
    if (child.kind !== 'directory') { continue; }

    if (child.name === name) { return child; }
  }

  return null;
  return dir.children.find((child) => child.name === name && child.kind !== 'directory') || null;
}

export function filesToFileSystemTree(files: File[]): FileSystemDirectory | null {
  if (files.length === 0) { return null; }

  let id = 0;
  const root = dir("Root", id++);

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

    cwd.children.push(file(pathFile, id++, entry));
  }

  return root;
}
