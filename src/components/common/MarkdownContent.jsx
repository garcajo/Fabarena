import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Swords, Shield, Zap } from 'lucide-react';

/**
 * Component to render text with Markdown and FAB-specific icons
 * Replaces tags like {p}, {d}, {r} with Lucide icons
 */
const MarkdownContent = ({ text, className = "" }) => {
    if (!text) return null;

    // Process FAB icons before markdown rendering
    const processFABIcons = (content) => {
        // We use a regex to find {p}, {d}, {r} and replace them with something react-markdown won't touch
        // but that we can identify later, or just handle simple replacements here if they are inline.
        // However, react-markdown is better for the structural part.

        // Let's replace the curly brace tags with a unique marker that react-markdown will ignore
        // and then handle them in the custom components.
        return content
            .replace(/\{p\}/g, '::POWER::')
            .replace(/\{d\}/g, '::DEFENSE::')
            .replace(/\{r\}/g, '::RESOURCE::');
    };

    const processedText = processFABIcons(text);

    const components = {
        // Custom rendering for "text" nodes to find our markers
        p: ({ children }) => {
            const transformMarkers = (child) => {
                if (typeof child !== 'string') return child;

                const parts = child.split(/(::POWER::|::DEFENSE::|::RESOURCE::)/);
                return parts.map((part, i) => {
                    if (part === '::POWER::') return <Swords key={i} size={14} className="fab-icon power-icon" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px', color: '#ffcc00' }} />;
                    if (part === '::DEFENSE::') return <Shield key={i} size={14} className="fab-icon defense-icon" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px', color: '#a0a0a0' }} />;
                    if (part === '::RESOURCE::') return <Zap key={i} size={14} className="fab-icon resource-icon" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px', color: '#ff3300' }} />;
                    return part;
                });
            };

            return <p className="markdown-p">{React.Children.map(children, transformMarkers)}</p>;
        },
        // Ensure strong tags are rendered
        strong: ({ children }) => <strong className="markdown-bold">{children}</strong>,
        em: ({ children }) => <em className="markdown-italic">{children}</em>,
    };

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown components={components}>
                {processedText}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownContent;
