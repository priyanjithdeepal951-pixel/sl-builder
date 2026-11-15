import { CanvasBlock, NavbarLinkItem, SitePage } from '../types/builder';

/**
 * Resolves the effective list of interactive links for a `ui-navbar` block.
 * Priority:
 * 1. Explicit `block.navLinks` configured by the user.
 * 2. Multi-page `pages` list when the site has more than 1 page.
 * 3. Parsed items from `block.subtitle` (e.g. "Features · Blueprints · Docs · Pricing"),
 *    smartly matched to matching page or section blocks when possible.
 */
export function getEffectiveNavLinks(
  block: CanvasBlock,
  pages?: SitePage[],
  blocksOnPage?: CanvasBlock[]
): NavbarLinkItem[] {
  if (Array.isArray(block.navLinks) && block.navLinks.length > 0) {
    return block.navLinks;
  }

  if (pages && pages.length > 1) {
    return pages.map((p) => ({
      id: `nav_page_${p.id}`,
      label: p.name,
      action: 'navigate-page',
      targetPageId: p.id,
    }));
  }

  const rawLabels = (block.subtitle || '')
    .split(/[·,|]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return rawLabels.map((label, idx) => {
    const lower = label.toLowerCase();

    // Smart auto-match to a block on the current page if available
    const matchedBlock = blocksOnPage?.find((b) => {
      if (b.id === block.id) return false;
      const bName = b.name.toLowerCase();
      const bContent = (b.content || '').toLowerCase();
      if (lower.includes('pric') && b.type === 'ui-pricing') return true;
      if (lower.includes('doc') || lower.includes('faq')) {
        return b.type === 'ui-accordion' || b.type === 'ui-paragraph';
      }
      if (lower.includes('feature') && (b.type === 'ui-card' || b.type === 'ui-stat')) return true;
      if (lower.includes('contact') && (b.type === 'ui-input' || b.type === 'ui-textarea')) return true;
      return bName.includes(lower) || bContent.includes(lower);
    });

    if (matchedBlock) {
      return {
        id: `nav_auto_${idx}`,
        label,
        action: 'scroll-to-block',
        targetBlockId: matchedBlock.id,
      };
    }

    return {
      id: `nav_auto_${idx}`,
      label,
      action: 'alert',
      message: `Clicked "${label}" — configure its target in the JavaScript tab!`,
    };
  });
}
