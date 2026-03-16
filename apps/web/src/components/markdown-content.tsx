import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent(props: { content: string }) {
  const components: Components = {
    a: ({ ...rest }) => <a target="_blank" rel="noreferrer" {...rest} />,
    img: ({ alt, src }) => (
      <figure className="overflow-hidden rounded-[28px] border border-black/5 bg-white/70">
        <img className="h-auto w-full object-cover" src={src ?? ""} alt={alt ?? ""} />
        {alt ? <figcaption className="px-4 py-3 text-sm text-[var(--color-soft-ink)]">{alt}</figcaption> : null}
      </figure>
    ),
  };

  return (
    <div className="article-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {props.content}
      </ReactMarkdown>
    </div>
  );
}
