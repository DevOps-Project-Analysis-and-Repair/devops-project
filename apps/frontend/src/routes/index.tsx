import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, type ChangeEvent, type JSX } from 'react';
import { dir, file, findInDirectory, type FileSystemDirectory, type FileSystemFile, type FileSystemNode } from '../filesystem';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import cb from 'react-syntax-highlighter/dist/esm/styles/prism/cb';

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

function filesToFileSystemTree(files: File[]): FileSystemDirectory | null {
  if (files.length === 0) { return null; }

  const root = dir(".");

  for (const entry of files) {
    const path = entry.webkitRelativePath || entry.name;
    const pathParts = path.split('/');

    const pathDirectories = pathParts.slice(0, -1);
    const pathFile = pathParts.slice(-1)[0];
    
    let cwd = root;

    for (const part of pathDirectories) {
      const result = findInDirectory(part, cwd);

      if (result === null) {
        const newCwd = dir(part);
        cwd.children.push(newCwd);
        cwd = newCwd;
        continue;
      }

      if (result.kind === "directory") {
        cwd = result;
        continue;
      }
    }

    cwd.children.push(file(pathFile, entry));
  }

  return root;
}

function FileSelection(files: File[]): JSX.Element {
  type FileContent = { content: string, language: string };

  const [fileTree, setFileTree] = useState<FileSystemDirectory | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);

  function renderFileTree(root: FileSystemDirectory): JSX.Element {
    function renderDirectory(directory: FileSystemDirectory): JSX.Element {
      const hasChildren = directory.children.length > 0;

      return (<li key={directory.id}>
        <span>{directory.name}</span>
        {hasChildren && <ul>{directory.children.map(node => renderNode(node))}</ul>}
      </li>);
    }

    function renderFile(file: FileSystemFile): JSX.Element {
      async function onClickName() {
        const content = await file.handle.text(); // great naming once again
        const re = new RegExp("\.([^.]+)$");
        const res = re.exec(file.name);

        if (res === null) { throw "Invalid file name"; }

        const ext = res[1];
        setFileContent({ content, language: ext });
      }

      return (<li key={file.id}><button onClick={() => onClickName()}>{file.name}</button></li>);
    }

    function renderNode(node: FileSystemNode): JSX.Element {
      switch (node.kind) {
        case 'directory': return renderDirectory(node);
        case 'file': return renderFile(node);
      }
    }
 
    return (
      <ul className='directory-container'>
        {root.children.map(node => renderNode(node))}
      </ul>
    );
  }

  useEffect(() => {
    setFileTree(filesToFileSystemTree(files));
  }, [files]);

  if (files.length === 0) { return <></> };

  return (<>
    <hr></hr>

    { fileTree && renderFileTree(fileTree) }
    { fileContent &&
      <SyntaxHighlighter
        showLineNumbers
        wrapLongLines
        language={fileContent.language}
        style={cb}>
          {fileContent.content}
      </SyntaxHighlighter> }
  </>);
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
