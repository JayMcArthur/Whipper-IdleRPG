import { getCollection } from 'astro:content';
import { referenceRoutes } from '../lib/routes';
import { base, site } from '../lib/site';

export async function GET() {
  const guides = await getCollection('guides');
  const paths = referenceRoutes(guides.map(guide => guide.id)).filter(route => route.props.page.kind !== 'guide' || route.props.locale === 'en');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(route => `<url><loc>${site}${base}/${route.params.path}/</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
