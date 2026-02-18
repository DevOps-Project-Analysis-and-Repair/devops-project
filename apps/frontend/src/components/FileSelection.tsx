import { type JSX, useState, useEffect } from "react";
import { filesToFileSystemTree, type FileSystemDirectory, type FileSystemFile, type FileSystemNode } from "../filesystem";
import { type CodeViewerParams, CodeViewer } from "./CodeViewer";

export function FileSelection(files: File[]): JSX.Element {
  const [fileTree, setFileTree] = useState<FileSystemDirectory | null>(null);
  const [fileContent, setFileContent] = useState<CodeViewerParams | null>(null);

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
    { fileContent && CodeViewer(fileContent)}
  </>);
}
