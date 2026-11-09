// HTML to Markdown for this site's own, well-formed markup. Shared by the content review scripts.

const decode = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&middot;/g, '·');

/** A small HTML to Markdown converter for this site's own, well-formed markup. */
export function toMarkdown(html) {
  let s = html
    .replace(/<noscript>[\s\S]*?<\/noscript>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<div class="mini[^"]*"[\s\S]*?<div class="mini-head"[^>]*><div class="mini-line"><\/div><\/div>\s*<\/div>/g, '\n[Timeline graphic]\n')
    .replace(/<caption[\s\S]*?<\/caption>/g, '')
    .replace(/<\/span><span class="tl-desc">/g, ': ')
    .replace(/<\/(a|button)><(a|button)\b/g, '</$1> / <$2');
  s = s.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/g, (_, row) => {
    const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    return `\n| ${cells.join(' | ')} |`;
  });
  s = s
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '\n### $1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '\n- $1')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '\n$1\n')
    .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<code>([\s\S]*?)<\/code>/g, '`$1`')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)')
    .replace(/<(br)\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '');
  return decode(s)
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l, i, a) => l || (a[i - 1] && a[i - 1].trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

