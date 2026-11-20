import type { ReactNode } from 'react';

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((p, i) => {
    const k = `${keyPrefix}-${i}`;
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={k}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={k}>{p.slice(1, -1)}</code>;
    if (p.startsWith('*') && p.endsWith('*')) return <em key={k}>{p.slice(1, -1)}</em>;
    return <span key={k}>{p}</span>;
  });
}

/** Renderer Markdown kecil, aman (tanpa dangerouslySetInnerHTML). */
export function Markdown({ text, compact = false }: { text: string; compact?: boolean }) {
  const lines = text.split('\n');
  const out: ReactNode[] = [];
  let list: ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flush = () => {
    if (!list.length || !listType) return;
    out.push(listType === 'ul' ? <ul key={`l-${out.length}`}>{list}</ul> : <ol key={`l-${out.length}`}>{list}</ol>);
    list = [];
    listType = null;
  };

  lines.forEach((line, i) => {
    const t = line.trimEnd();
    if (!t) { flush(); return; }
    if (/^---+$/.test(t)) { flush(); out.push(<hr key={i} />); return; }
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush();
      const level = h[1].length;
      const content = inline(h[2], `h${i}`);
      if (level === 1) out.push(<h1 key={i}>{content}</h1>);
      else if (level === 2) out.push(<h2 key={i}>{content}</h2>);
      else out.push(<h3 key={i}>{content}</h3>);
      return;
    }
    if (t.startsWith('> ')) { flush(); out.push(<blockquote key={i}>{inline(t.slice(2), `q${i}`)}</blockquote>); return; }
    const ul = t.match(/^[-•]\s+(.*)$/);
    const ol = t.match(/^\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      const type = ul ? 'ul' : 'ol';
      if (listType && listType !== type) flush();
      listType = type;
      list.push(<li key={i}>{inline((ul ?? ol)![1], `li${i}`)}</li>);
      return;
    }
    flush();
    out.push(<p key={i}>{inline(t, `p${i}`)}</p>);
  });
  flush();

  return <div className={`md ${compact ? 'md-compact' : ''}`}>{out}</div>;
}
