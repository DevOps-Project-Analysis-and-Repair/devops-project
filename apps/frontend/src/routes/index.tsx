import { createFileRoute } from '@tanstack/react-router'
import { useState, type ChangeEvent } from 'react';
import { FileSelection } from '../components/FileSelection';

export const Route = createFileRoute('/')({
  component: Index,
});

// Webkit directory is not stable, but required for getting the full path of directories
// It is however, supported by all major browser vendors: https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory#browser_compatibility
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

function Index() {
  const [files, setFiles] = useState<File[]>([]);

  function onChange(event: ChangeEvent<HTMLInputElement, HTMLInputElement>): void {
    // event.target.files is iterable, but not an array
    const fileTree = event.target.files ?? [];
    const files: File[] = []

    for (const file of fileTree) {
      files.push(file);
    }

    // TODO: Filter files, only keep text based files (utf-8, ascii)

    setFiles(files);
  }

  return (
    <div>
      <label htmlFor='upload-files'>Upload files</label>
      <label htmlFor='upload-directory'>Upload directory</label>

      <input
        type='file'
        id='upload-files'
        style={{display: 'none'}}
        multiple
        onChange={onChange}>
      </input>

      <input
        type='file'
        id='upload-directory'
        style={{display: 'none'}}
        multiple
        webkitdirectory='true'
        onChange={onChange}>
      </input>

      { FileSelection(files) }
    </div>
  )
};
