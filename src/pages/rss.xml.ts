/**
 * Feed RSS del blog — generato a build time, zero dipendenze.
 * Include solo gli articoli pubblicati on-site (niente coming-soon
 * né rimandi esterni), ordinati dal più recente.
 */
import { getCollection } from 'astro:content';
import { SITE, SITE_NAME, SITE_TAGLINE } from '../config';

function esc(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function GET(): Promise<Response> {
  const posts = (await getCollection('articoli'))
    .filter((a) => a.data.status === 'published' && !a.data.externalUrl)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const items = posts
    .map((p) => {
      const url = `${SITE}/articoli/${p.id}/`;
      return [
        '    <item>',
        `      <title>${esc(p.data.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${p.data.date.toUTCString()}</pubDate>`,
        `      <category>${esc(p.data.category)}</category>`,
        `      <description>${esc(p.data.excerpt)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(`Il blog di Andrea Bellettati — ${SITE_TAGLINE}`)}</description>
    <language>it</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
