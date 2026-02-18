export type FileSystemNode = FileSystemDirectory | FileSystemFile;
export type FileSystemDirectory = { kind: 'directory', id: number, name: string, children: FileSystemNode[] };
export type FileSystemFile = { kind: 'file', id: number, name: string, file: File };

let id = 0;

export function dir(name: string): FileSystemDirectory {
  return { kind: 'directory', id: id++, name, children: [] };
}

export function file(name: string, file: File): FileSystemFile {
  return { kind: 'file', id: id++, name, file };
}

export function findInDirectory(name: string, dir: FileSystemDirectory): FileSystemNode | null {
  for (const child of dir.children) {
    if (child.kind !== 'directory') { continue; }

    if (child.name === name) { return child; }
  }

  return null;
}