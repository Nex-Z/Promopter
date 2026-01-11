"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
import remarkGithubAlerts from "remark-github-blockquote-alert";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import "remark-github-blockquote-alert/alert.css";

// Extended sanitize schema to allow more HTML elements
const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [
        ...(defaultSchema.tagNames || []),
        "details",
        "summary",
        "iframe",
        "video",
        "audio",
        "source",
        "mark",
        "kbd",
        "abbr",
        "sup",
        "sub",
    ],
    attributes: {
        ...defaultSchema.attributes,
        "*": [...(defaultSchema.attributes?.["*"] || []), "className", "style"],
        iframe: ["src", "width", "height", "frameBorder", "allow", "allowFullScreen"],
        video: ["src", "controls", "width", "height", "poster"],
        audio: ["src", "controls"],
        source: ["src", "type"],
    },
};

interface MarkdownPreviewProps {
    content: string;
    title?: string;
    className?: string;
}

export function MarkdownPreview({ content, title, className = "" }: MarkdownPreviewProps) {
    return (
        <div className={`prose prose-stone dark:prose-invert max-w-none ${className}`}>
            {title && <h1>{title}</h1>}
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath, remarkEmoji, remarkGithubAlerts]}
                rehypePlugins={[
                    rehypeRaw,
                    [rehypeSanitize, sanitizeSchema],
                    rehypeKatex,
                    rehypeHighlight,
                    rehypeSlug,
                    [rehypeAutolinkHeadings, { behavior: "wrap" }],
                ]}
                components={{
                    // Custom heading styles
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold tracking-tight mb-4">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-semibold tracking-tight mt-8 mb-4 border-b border-border pb-2">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mt-6 mb-3">{children}</h3>
                    ),
                    // Code blocks
                    code: ({ className, children, ...props }) => {
                        const isInline = !className;
                        if (isInline) {
                            return (
                                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code className={`${className} block`} {...props}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm">
                            {children}
                        </pre>
                    ),
                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            className="text-primary underline underline-offset-4 hover:text-primary/80"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    ),
                    // Blockquote
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                            {children}
                        </blockquote>
                    ),
                    // Lists
                    ul: ({ children }) => (
                        <ul className="my-4 ml-6 list-disc space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="my-4 ml-6 list-decimal space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-relaxed">{children}</li>
                    ),
                    // Tables
                    table: ({ children }) => (
                        <div className="my-4 overflow-x-auto">
                            <table className="w-full border-collapse border border-border text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-muted">{children}</thead>
                    ),
                    th: ({ children }) => (
                        <th className="border border-border px-4 py-2 text-left font-semibold">{children}</th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-border px-4 py-2">{children}</td>
                    ),
                    // Task lists (GFM checkbox)
                    input: ({ checked, ...props }) => (
                        <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="mr-2 accent-primary"
                            {...props}
                        />
                    ),
                    // Horizontal rule
                    hr: () => <hr className="my-8 border-border" />,
                    // Images
                    img: ({ src, alt }) => (
                        <img
                            src={src}
                            alt={alt ?? ""}
                            className="max-w-full rounded-lg my-4"
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
