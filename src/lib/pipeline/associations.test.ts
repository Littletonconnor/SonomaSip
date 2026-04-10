import { describe, expect, it } from 'vitest';
import {
  ASSOCIATION_SOURCES,
  extractAnchors,
  filterMembers,
  parseAssociationHtml,
} from './associations';

describe('extractAnchors', () => {
  it('extracts href + plain text from simple anchors', () => {
    const html = `
      <a href="/a">First</a>
      <a href="https://example.com/">Second</a>
    `;
    expect(extractAnchors(html)).toEqual([
      { href: '/a', text: 'First' },
      { href: 'https://example.com/', text: 'Second' },
    ]);
  });

  it('strips nested tags from link text', () => {
    const html = `<a href="/w"><h3 class="x"><span>Jordan</span> Winery</h3></a>`;
    expect(extractAnchors(html)).toEqual([{ href: '/w', text: 'Jordan Winery' }]);
  });

  it('decodes &amp; and &nbsp; in link text', () => {
    const html = `<a href="/w">Jordan&nbsp;Vineyard&nbsp;&amp;&nbsp;Winery</a>`;
    expect(extractAnchors(html)).toEqual([{ href: '/w', text: 'Jordan Vineyard & Winery' }]);
  });

  it('handles single-quoted href attributes', () => {
    const html = `<a class='card' href='/x' data-id='7'>Foo</a>`;
    expect(extractAnchors(html)).toEqual([{ href: '/x', text: 'Foo' }]);
  });

  it('skips anchors with empty text', () => {
    const html = `<a href="/a"></a><a href="/b">B</a>`;
    expect(extractAnchors(html)).toEqual([{ href: '/b', text: 'B' }]);
  });

  it('skips anchors without href', () => {
    const html = `<a name="top">Top</a><a href="/b">B</a>`;
    expect(extractAnchors(html)).toEqual([{ href: '/b', text: 'B' }]);
  });
});

describe('filterMembers — sonoma_vintners', () => {
  const config = ASSOCIATION_SOURCES.sonoma_vintners;
  const baseUrl = 'https://sonomavintners.com/find-wineries/';

  it('treats external winery links as website_url', () => {
    const links = [{ href: 'https://www.jordanwinery.com/', text: 'Jordan Vineyard & Winery' }];
    const members = filterMembers(links, config, baseUrl);
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      source: 'sonoma_vintners',
      name: 'Jordan Vineyard & Winery',
      website_url: 'https://www.jordanwinery.com',
      detail_url: null,
      source_id: 'jordanwinery.com',
    });
  });

  it('treats internal member links as detail_url', () => {
    const links = [{ href: '/find-wineries/totally-new-winery/', text: 'Totally New Winery' }];
    const members = filterMembers(links, config, baseUrl);
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      website_url: null,
      detail_url: 'https://sonomavintners.com/find-wineries/totally-new-winery',
      source_id: 'sonomavintners.com/find-wineries/totally-new-winery',
    });
  });

  it('drops navigation links by text', () => {
    const links = [
      { href: '/', text: 'Home' },
      { href: '/about', text: 'About Us' },
      { href: '/events', text: 'Events' },
      { href: '/find-wineries/', text: 'Find Wineries' },
    ];
    expect(filterMembers(links, config, baseUrl)).toEqual([]);
  });

  it('drops social / platform hosts', () => {
    const links = [
      { href: 'https://facebook.com/sonomavintners', text: 'Follow Us' },
      { href: 'https://instagram.com/sonomawine', text: 'Instagram' },
      { href: 'https://www.yelp.com/biz/jordan', text: 'Jordan on Yelp' },
    ];
    expect(filterMembers(links, config, baseUrl)).toEqual([]);
  });

  it('drops internal links that do not match the member pattern', () => {
    const links = [
      { href: '/privacy', text: 'Privacy Policy' },
      { href: '/blog/some-post', text: 'A blog post title' },
    ];
    expect(filterMembers(links, config, baseUrl)).toEqual([]);
  });

  it('drops generic "Read More" / "Learn More" link text', () => {
    const links = [
      { href: 'https://www.jordanwinery.com/', text: 'Read More' },
      { href: 'https://www.jordanwinery.com/', text: 'Learn more' },
    ];
    expect(filterMembers(links, config, baseUrl)).toEqual([]);
  });

  it('dedupes repeated entries by normalized name + source_id', () => {
    const links = [
      { href: 'https://www.jordanwinery.com/', text: 'Jordan Winery' },
      { href: 'https://www.jordanwinery.com/visit', text: 'Jordan Winery' },
    ];
    const members = filterMembers(links, config, baseUrl);
    expect(members).toHaveLength(1);
  });

  it('ignores non-http(s) schemes', () => {
    const links = [
      { href: 'mailto:info@jordan.com', text: 'Email Jordan' },
      { href: 'tel:+17075551212', text: 'Call Jordan' },
      { href: 'javascript:void(0)', text: 'Open' },
    ];
    expect(filterMembers(links, config, baseUrl)).toEqual([]);
  });
});

describe('filterMembers — wine_road', () => {
  const config = ASSOCIATION_SOURCES.wine_road;
  const baseUrl = 'https://www.wineroad.com/wineries/';

  it('routes /wineries/<slug>/ links to detail_url', () => {
    const links = [{ href: '/wineries/cline-cellars/', text: 'Cline Cellars' }];
    const members = filterMembers(links, config, baseUrl);
    expect(members).toHaveLength(1);
    expect(members[0].detail_url).toBe('https://www.wineroad.com/wineries/cline-cellars');
    expect(members[0].website_url).toBeNull();
  });

  it('drops the "All Wineries" anchor', () => {
    const links = [{ href: '/wineries/', text: 'All Wineries' }];
    expect(filterMembers(links, config, baseUrl)).toEqual([]);
  });
});

describe('parseAssociationHtml — end-to-end fixture', () => {
  it('parses a realistic SCV fixture', () => {
    const html = `
<!DOCTYPE html>
<html><body>
<nav>
  <a href="/">Home</a>
  <a href="/about">About Us</a>
  <a href="https://facebook.com/x">Facebook</a>
</nav>
<ul class="winery-grid">
  <li><h3><a href="https://www.jordanwinery.com/">Jordan Vineyard &amp; Winery</a></h3></li>
  <li><h3><a href="https://www.iron-horse-vineyards.com">Iron Horse Vineyards</a></h3></li>
  <li><h3><a href="https://sonomavintners.com/find-wineries/new-place/">New Place Winery</a></h3></li>
  <li><a href="https://www.jordanwinery.com/">Read More</a></li>
</ul>
</body></html>`;
    const members = parseAssociationHtml(
      html,
      ASSOCIATION_SOURCES.sonoma_vintners,
      'https://sonomavintners.com/find-wineries/',
    );
    expect(members.map((m) => m.name)).toEqual([
      'Jordan Vineyard & Winery',
      'Iron Horse Vineyards',
      'New Place Winery',
    ]);
    expect(members[0].website_url).toBe('https://www.jordanwinery.com');
    expect(members[2].detail_url).toBe('https://sonomavintners.com/find-wineries/new-place');
  });

  it('parses a realistic Wine Road fixture with mixed link types', () => {
    const html = `
<section>
  <article><a href="/wineries/cline-cellars/"><h2>Cline Cellars</h2></a></article>
  <article><a href="/wineries/benziger-family-winery/"><h2>Benziger Family Winery</h2></a></article>
  <article><a href="https://www.francisfordcoppolawinery.com/">Francis Ford Coppola Winery</a></article>
  <article><a href="/wineries/">All Wineries</a></article>
</section>`;
    const members = parseAssociationHtml(
      html,
      ASSOCIATION_SOURCES.wine_road,
      'https://www.wineroad.com/wineries/',
    );
    expect(members.map((m) => m.name).sort()).toEqual([
      'Benziger Family Winery',
      'Cline Cellars',
      'Francis Ford Coppola Winery',
    ]);
    const coppola = members.find((m) => m.name.includes('Coppola'))!;
    expect(coppola.website_url).toBe('https://www.francisfordcoppolawinery.com');
    expect(coppola.detail_url).toBeNull();
    const cline = members.find((m) => m.name === 'Cline Cellars')!;
    expect(cline.website_url).toBeNull();
    expect(cline.detail_url).toBe('https://www.wineroad.com/wineries/cline-cellars');
  });
});
