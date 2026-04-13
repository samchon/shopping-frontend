"use client";

import ReactMarkdown from "react-markdown";
import sanitizeHtml from "sanitize-html";

export function ContentBody({
  format,
  body,
}: {
  format: "txt" | "md" | "html";
  body: string;
}) {
  if (format === "html") {
    return (
      <div
        className="prose prose-stone max-w-none prose-headings:font-semibold prose-a:text-primary"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(body, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]),
            allowedAttributes: {
              ...sanitizeHtml.defaults.allowedAttributes,
              "*": ["class"],
              a: ["href", "name", "target", "rel"],
              img: ["src", "alt", "title"],
            },
          }),
        }}
      />
    );
  }

  if (format === "md") {
    return (
      <div className="prose prose-stone max-w-none prose-headings:font-semibold prose-a:text-primary">
        <ReactMarkdown>{body}</ReactMarkdown>
      </div>
    );
  }

  return <p className="whitespace-pre-wrap leading-7 text-muted-foreground">{body}</p>;
}
