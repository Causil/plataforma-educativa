import katex from 'katex';
import 'katex/dist/katex.min.css';

/** Renderiza LaTeX con KaTeX (R23). */
export function Math({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: block });
  return (
    <span
      className={block ? 'math-block' : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Texto con matemáticas inline: divide por $...$ y renderiza cada tramo. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('$') && p.endsWith('$') ? (
          <Math key={i} tex={p.slice(1, -1)} />
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
