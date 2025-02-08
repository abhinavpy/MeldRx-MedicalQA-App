import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@radix-ui/react-tooltip';
import '../styling/APIResponseDisplay.css';

const APIResponseDisplay = ({ response }) => {
  if (!response?.choices?.[0]?.message?.content) {
    return <div className="diagnosis-card">No analysis available</div>;
  }

  const citations = response.citations || [];
  const content = response.choices[0].message.content;

  // Preprocess the markdown to replace citation markers like [1] with HTML spans
  const processedContent = content.replace(/\[(\d+)\]/g, (match, number) => {
    const index = parseInt(number, 10) - 1;
    return citations[index]
      ? `<span class="citation" data-index="${index}">[${number}]</span>`
      : match;
  });

  // Custom renderer for <span> elements. If a span has the "citation" class and a valid data-index, wrap it in a tooltip.
  const SpanRenderer = ({ node, ...props }) => {
    if (props.className === 'citation' && props['data-index'] !== undefined) {
      const index = props['data-index'];
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span {...props} />
          </TooltipTrigger>
          <TooltipContent side="top" className="citation-tooltip">
            <div className="citation-tooltip-header">
              Citation [{parseInt(index, 10) + 1}]
            </div>
            <a
              href={citations[index]}
              target="_blank"
              rel="noopener noreferrer"
              className="citation-link"
            >
              {citations[index]}
            </a>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <span {...props} />;
  };

  return (
    <TooltipProvider>
      <div className="api-response-wrapper">
        <div className="diagnosis-card">
          <div className="diagnosis-header">
            <h2 className="diagnosis-title">
              <span role="img" aria-label="ai-icon">📚</span> Clinical Analysis of this patient
            </h2>
            <p className="diagnosis-subtitle">
              AI-powered medical insights with academic references:
            </p>
          </div>
          <div className="api-response-content">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={{ span: SpanRenderer }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default APIResponseDisplay;
