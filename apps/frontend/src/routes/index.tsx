import { createFileRoute } from '@tanstack/react-router'
import { useState, type ChangeEvent, type JSX } from 'react';

export const Route = createFileRoute('/')({
  component: Index,
});

// Webkit directory is not stable, but required for uploading complete folders
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

function Index() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  function onChange(event: ChangeEvent<HTMLInputElement, HTMLInputElement>): void {
    // event.target.files is iterable, but not an array
    const fileTree = event.target.files ?? [];
    const files: File[] = []

    for (const file of fileTree) {
      files.push(file);
    }

    setFiles(files);
  }

  async function onClickFile(file: File) {
    console.log(file);

    const text = await file.text();

    console.log(text);
  }

  function renderFiles() {
    let content: JSX.Element[] = [];
    let index = 0;

    for (const file of files) {
      const name = file.webkitRelativePath || file.name;
      content.push(<li key={index++}><button onClick={() => onClickFile(file)}>{name}</button></li>);
    }

    return (<>
      <hr></hr>
      <ul>{content}</ul>
    </>);
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
      
      { message && <p>{message}</p> }

      { files.length >= 1 && renderFiles() }
    </div>
  )
};
