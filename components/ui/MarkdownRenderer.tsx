
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const renderLine = (line: string) => {
    const parts = line.split('**');
    return parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i}>{part}</strong>;
        }
        return part;
    });
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.substring(4)}</h3>);
      i++;
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-bold mt-5 mb-3">{line.substring(3)}</h2>);
      i++;
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h1>);
      i++;
    } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const listItems = [];
      while (i < lines.length && (lines[i].trim().startsWith('* ') || lines[i].trim().startsWith('- '))) {
        listItems.push(lines[i].trim().substring(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, index) => (
            <li key={index}>{renderLine(item)}</li>
          ))}
        </ul>
      );
    } else if (line.trim() !== '') {
      elements.push(<p key={i}>{renderLine(line)}</p>);
      i++;
    } else {
      i++; // Skip empty lines
    }
  }

  return <>{elements}</>;
};
