import { Project, ProjectFile } from "./types";

export function findFile(fileId: string, project: Project): ProjectFile | null {
  // Find file searches in both the original project files as the repaired files
  for (const file of project.files) {
    if (file.id === fileId) { return file };
  }

  // Flatmap all the repaired for easy searching
  const repairedFiles = Object.values(project.repairedFiles).flatMap(x => x);

  for (const file of repairedFiles) {
    if (file.id === fileId) { return file };
  }

  return null;
}

export function latest<T>(array: T[]): T | undefined {
  const len = array.length;

  if (len === 0) { return undefined; }

  return array[len - 1];
}
