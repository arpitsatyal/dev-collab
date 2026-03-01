
import React from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MarkdownContentProps {
    content: string;
}

const MarkdownComponents: any = {
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        const isBlock = !inline && (!!language || children?.toString().includes('\n'));

        if (isBlock) {
            return (
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language || 'text'}
                    PreTag="div"
                    showLineNumbers={false}
                    customStyle={{
                        margin: 0,
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        padding: '1rem',
                        background: '#1e1e1e',
                        width: 'fit-content',
                        maxWidth: '100%'
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                            fontSize: '0.9rem',
                        }
                    }}
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            );
        }

        return (
            <code className={className} style={{
                background: 'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.9em',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                color: 'light-dark(var(--mantine-color-red-7), var(--mantine-color-red-4))',
            }} {...props}>
                {children}
            </code>
        );
    },

    pre: ({ children }: any) => (
        <div style={{
            margin: '1.25rem 0',
            maxWidth: '100%',
            overflow: 'hidden',
            display: 'block',
            width: '100%'
        }}>
            <div style={{
                overflowX: 'auto',
                maxWidth: '100%'
            }}>
                {children}
            </div>
        </div>
    ),

    p: ({ children }: any) => (
        <p style={{
            margin: '0.75rem 0',
            lineHeight: '1.6',
            wordBreak: 'normal',
            overflowWrap: 'break-word'
        }}>
            {children}
        </p>
    ),

    h1: ({ children }: any) => (
        <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginTop: '1.5rem',
            marginBottom: '1rem',
            lineHeight: '1.3',
        }}>
            {children}
        </h1>
    ),
    h2: ({ children }: any) => (
        <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginTop: '1.5rem',
            marginBottom: '0.75rem',
            lineHeight: '1.3',
        }}>
            {children}
        </h2>
    ),
    h3: ({ children }: any) => (
        <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginTop: '1.25rem',
            marginBottom: '0.5rem',
            lineHeight: '1.4',
        }}>
            {children}
        </h3>
    ),
    h4: ({ children }: any) => (
        <h4 style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            marginTop: '1rem',
            marginBottom: '0.5rem',
            lineHeight: '1.4',
        }}>
            {children}
        </h4>
    ),

    ul: ({ children }: any) => (
        <ul style={{
            margin: '0.5rem 0 0.5rem 1.5rem',
            paddingLeft: '0.5rem',
            lineHeight: '1.8'
        }}>
            {children}
        </ul>
    ),
    ol: ({ children }: any) => (
        <ol style={{
            margin: '0.5rem 0 0.5rem 1.5rem',
            paddingLeft: '0.5rem',
            lineHeight: '1.8'
        }}>
            {children}
        </ol>
    ),
    li: ({ children }: any) => (
        <li style={{
            marginBottom: '0.25rem',
            paddingLeft: '0.25rem'
        }}>
            {children}
        </li>
    ),

    blockquote: ({ children }: any) => (
        <blockquote style={{
            borderLeft: '4px solid var(--mantine-color-blue-6)',
            paddingLeft: '1rem',
            margin: '1rem 0',
            fontStyle: 'italic',
            color: 'light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-5))'
        }}>
            {children}
        </blockquote>
    ),

    table: ({ children }: any) => (
        <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
            <table style={{
                borderCollapse: 'collapse',
                width: '100%',
                minWidth: '400px',
                fontSize: '0.9rem',
                border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))'
            }}>
                {children}
            </table>
        </div>
    ),
    thead: ({ children }: any) => (
        <thead style={{
            backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-7))'
        }}>
            {children}
        </thead>
    ),
    th: ({ children }: any) => (
        <th style={{
            border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
            padding: '10px 12px',
            textAlign: 'left',
            fontWeight: 700
        }}>
            {children}
        </th>
    ),
    td: ({ children }: any) => (
        <td style={{
            border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
            padding: '8px 12px',
        }}>
            {children}
        </td>
    ),

    hr: () => (
        <hr style={{
            border: 'none',
            borderTop: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
            margin: '1.5rem 0'
        }} />
    ),

    a: ({ href, children, ...props }: any) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                color: 'var(--mantine-color-blue-6)',
                textDecoration: 'underline',
                wordBreak: 'break-word'
            }}
            {...props}
        >
            {children}
        </a>
    ),

    strong: ({ children }: any) => (
        <strong style={{ fontWeight: 700 }}>
            {children}
        </strong>
    ),

    em: ({ children }: any) => (
        <em style={{ fontStyle: 'italic' }}>
            {children}
        </em>
    )
};

const MarkdownContent = ({ content }: MarkdownContentProps) => {
    return (
        <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
            {content}
        </ReactMarkdown>
    );
};

export default MarkdownContent;
