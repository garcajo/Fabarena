import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Swords, Shield, Zap } from 'lucide-react';

/**
 * Component to render text with Markdown and FAB-specific icons
 * Replaces tags like {p}, {d}, {r} with Lucide icons
 */
const MarkdownContent = ({ text, className = "" }) => {
    if (!text) return null;

    // Process FAB icons and clean punctuation before markdown rendering
    const processContent = (content) => {
        if (!content) return "";

        return content
            // 1. Reemplazar tags de iconos
            .replace(/\{p\}/g, '::POWER::')
            .replace(/\{d\}/g, '::DEFENSE::')
            .replace(/\{r\}/g, '::RESOURCE::')
            // 2. Limpiar espacios antes de puntuación estándar
            .replace(/\s+([.,!?:;])/g, '$1')
            // 3. Limpiar espacios entre iconos y puntuación (ej: "::POWER:: ." -> "::POWER::.")
            .replace(/(::POWER::|::DEFENSE::|::RESOURCE::)\s+([.,!?:;])/g, '$1$2');
    };

    const processedText = processContent(text);

    const components = {
        // Custom rendering for "text" nodes to find our markers
        p: ({ children }) => {
            const transformMarkers = (child) => {
                if (typeof child !== 'string') return child;

                const parts = child.split(/(::POWER::|::DEFENSE::|::RESOURCE::)/);
                return parts.map((part, i) => {
                    if (part === '::POWER::') return <Swords key={i} size={14} className="fab-icon power-icon" style={{ display: 'inline-block', verticalAlign: 'baseline', margin: '0 1px 0 2px', color: '#ffcc00', position: 'relative', top: '1px' }} />;
                    if (part === '::DEFENSE::') return <Shield key={i} size={14} className="fab-icon defense-icon" style={{ display: 'inline-block', verticalAlign: 'baseline', margin: '0 1px 0 2px', color: '#a0a0a0', position: 'relative', top: '1px' }} />;
                    if (part === '::RESOURCE::') return <Zap key={i} size={14} className="fab-icon resource-icon" style={{ display: 'inline-block', verticalAlign: 'baseline', margin: '0 1px 0 2px', color: '#ff3300', position: 'relative', top: '1px' }} />;
                    return part;
                });
            };

            return <p className="markdown-p" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{React.Children.map(children, transformMarkers)}</p>;
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
