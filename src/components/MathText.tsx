import katex from 'katex';
import React from 'react';

interface MathTextProps {
  text: string;
  className?: string;
}

type Segment =
  | { type: 'text'; content: string }
  | { type: 'inline'; content: string }
  | { type: 'block'; content: string };

/**
 * Splits text into plain text, inline math ($...$ or \(...\)),
 * and block math ($$...$$ or \[...\]).
 */
function parseMathSegments(input: string): Segment[] {
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([\s\S]+?\\\))/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: input.slice(lastIndex, match.index),
      });
    }

    const token = match[0];
    if (token.startsWith('$$') && token.endsWith('$$')) {
      segments.push({ type: 'block', content: token.slice(2, -2).trim() });
    } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
      segments.push({ type: 'block', content: token.slice(2, -2).trim() });
    } else if (token.startsWith('$') && token.endsWith('$')) {
      segments.push({ type: 'inline', content: token.slice(1, -1).trim() });
    } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
      segments.push({ type: 'inline', content: token.slice(2, -2).trim() });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({ type: 'text', content: input.slice(lastIndex) });
  }

  return segments;
}

function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return latex;
  }
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;
  const segments = parseMathSegments(text);

  return (
    <span className={`whitespace-pre-line break-words ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
        }
        const html = renderKatex(seg.content, seg.type === 'block');
        if (seg.type === 'block') {
          return (
            <span
              key={idx}
              className="block my-2 overflow-x-auto py-1"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return (
          <span
            key={idx}
            className="inline-block align-middle mx-0.5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
};
