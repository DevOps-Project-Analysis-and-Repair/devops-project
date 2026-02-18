import type { JSX } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import cb from 'react-syntax-highlighter/dist/esm/styles/prism/cb';

export type CodeViewerParams = { content: string, language: string };

export function CodeViewer(params: CodeViewerParams): JSX.Element {
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
