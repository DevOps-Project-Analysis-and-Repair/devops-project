import type { JSX } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import cb from 'react-syntax-highlighter/dist/esm/styles/prism/cb';

export type CodeViewerProps = { content: string, language: string, id?: string, filepath?: string };

export function CodeViewer(params: CodeViewerProps): JSX.Element {
  return (
    <>  
      <SyntaxHighlighter
        showLineNumbers
        wrapLongLines
        language={params.language}
        style={cb}>
          {params.content}
      </SyntaxHighlighter>
    </>
  );
}
