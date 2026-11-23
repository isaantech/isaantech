const ALLOWED_TAGS = new Set(['P','BR','H1','H2','H3','H4','STRONG','B','EM','I','U','S','DEL','UL','OL','LI','BLOCKQUOTE','PRE','CODE','A','FIGURE','FIGCAPTION','IMG','TABLE','THEAD','TBODY','TR','TH','TD','HR','SPAN','DIV','IFRAME']);
const ALLOWED_STYLES = new Set(['color','background-color','font-family','font-size','text-align','margin-left','margin-bottom']);

export function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function inlineMarkdown(value) {
  let s = escapeHtml(value);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return s;
}

export function markdownToHtml(markdown='') {
  const lines = String(markdown).replace(/\r/g, '').split('\n');
  const out = [];
  let paragraph = [], listType = null, listItems = [], quote = [];
  const flushParagraph = () => { if (paragraph.length) { out.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`); paragraph=[]; } };
  const flushList = () => { if (listItems.length) { out.push(`<${listType}>${listItems.map(x=>`<li>${inlineMarkdown(x)}</li>`).join('')}</${listType}>`); listItems=[]; listType=null; } };
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote><p>${inlineMarkdown(quote.join(' '))}</p></blockquote>`); quote=[]; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushParagraph(); flushList(); flushQuote(); continue; }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    const quoted = line.match(/^>\s?(.*)$/);
    if (heading) { flushParagraph(); flushList(); flushQuote(); const level=heading[1].length; out.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); }
    else if (bullet || numbered) { flushParagraph(); flushQuote(); const nextType=bullet?'ul':'ol'; if (listType && listType!==nextType) flushList(); listType=nextType; listItems.push((bullet||numbered)[1]); }
    else if (quoted) { flushParagraph(); flushList(); quote.push(quoted[1]); }
    else { flushList(); flushQuote(); paragraph.push(line); }
  }
  flushParagraph(); flushList(); flushQuote();
  return sanitizeArticleHtml(out.join('\n'));
}

export function sanitizeArticleHtml(html='') {
  if (typeof window === 'undefined' || !window.DOMParser) return escapeHtml(String(html));
  const doc = new DOMParser().parseFromString(`<div>${String(html)}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  const cleanNode = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 1) {
        const tag = child.tagName;
        if (!ALLOWED_TAGS.has(tag)) {
          if (['SCRIPT','STYLE','OBJECT','EMBED','FORM','INPUT','BUTTON','SVG','MATH'].includes(tag)) child.remove();
          else { cleanNode(child); child.replaceWith(...child.childNodes); }
          return;
        }
        [...child.attributes].forEach(attr => {
          const name = attr.name.toLowerCase();
          if (name === 'style') {
            const safe = attr.value.split(';').map(rule=>rule.trim()).filter(Boolean).filter(rule=>{const parts=rule.split(':');const property=parts.shift()?.trim().toLowerCase();const value=parts.join(':').trim();return ALLOWED_STYLES.has(property) && (property!=='margin-bottom' || /^(10|18|28)px$/.test(value)) && !/url\s*\(|expression|javascript/i.test(rule);}).join('; ');
            if (safe) child.setAttribute('style', safe); else child.removeAttribute('style');
          } else if (tag === 'A' && ['href','target','rel','title'].includes(name)) {
            if (name === 'href' && !/^(https?:|mailto:)/i.test(attr.value)) child.removeAttribute(attr.name);
          } else if (tag === 'IMG' && ['src','alt','title','width','height'].includes(name)) {
            if (name === 'src' && !/^https?:\/\//i.test(attr.value)) child.removeAttribute(attr.name);
          } else if (tag === 'IFRAME' && ['src','title','allow','allowfullscreen','loading'].includes(name)) {
            if (name === 'src' && !/^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]{11}/i.test(attr.value)) child.remove();
          } else if (name === 'id' && ['H1','H2','H3'].includes(tag)) { /* retain safe generated heading ids */ } else if (!['class','colspan','rowspan'].includes(name)) child.removeAttribute(attr.name);
        });
        if (tag === 'A') { child.setAttribute('rel','noopener noreferrer'); if (!child.getAttribute('target')) child.setAttribute('target','_blank'); }
        if (tag === 'IFRAME') { child.setAttribute('loading','lazy'); child.setAttribute('allowfullscreen',''); }
        cleanNode(child);
      } else if (child.nodeType !== 3) child.remove();
    });
  };
  cleanNode(root);
  return root.innerHTML;
}

export function getArticleHtml(article) {
  const body = article?.body || '';
  const rendered = article?.body_format === 'html' || /<\/?(p|h[1-6]|ul|ol|div|figure|table|blockquote)\b/i.test(body) ? sanitizeArticleHtml(body) : markdownToHtml(body);
  if (typeof window === 'undefined' || !window.DOMParser) return rendered;
  const doc = new DOMParser().parseFromString(`<div>${rendered}</div>`, 'text/html');
  doc.body.querySelectorAll('h1,h2,h3').forEach((heading,index)=>{ if(!heading.id){ const slug=heading.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || `section-${index+1}`; heading.id=`${slug}-${index+1}`; } });
  return doc.body.firstElementChild.innerHTML;
}

export function getArticleHeadings(html='') {
  if (typeof window === 'undefined' || !window.DOMParser) return [];
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  return [...doc.querySelectorAll('h1,h2,h3')].map((el,i)=>({id:el.id || `section-${i+1}`, text:el.textContent.trim(), level:Number(el.tagName.slice(1))})).filter(x=>x.text);
}

export function readingMinutes(html='') {
  const text = String(html).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words/220));
}
