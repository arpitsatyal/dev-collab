import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { HighlightedCode } from '../../shared/MarkdownContent';

export default function CodeBlock({
    node: { attrs, textContent },
    selected,
}: any) {
    const language = attrs.language || 'text';

    return (
        <NodeViewWrapper
            className="code-block"
            style={{ position: 'relative', margin: '1rem 0', width: 'fit-content', maxWidth: '100%', minWidth: '400px' }}
        >
            <div
                contentEditable={false}
                style={{
                    display: selected ? 'none' : 'block',
                    cursor: 'pointer',
                    position: 'relative'
                }}
            >
                <HighlightedCode code={textContent || ' '} language={language} />
            </div>

            <pre
                style={{
                    display: selected ? 'block' : 'none',
                    background: '#1e1e1e',
                    padding: '1rem',
                    borderRadius: '8px',
                    color: '#d4d4d4',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    minWidth: '200px',
                }}
            >
                <NodeViewContent as="code" />
            </pre>
        </NodeViewWrapper>
    );
}
