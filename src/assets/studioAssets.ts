import heroStudioImg from './images/hero_studio_showcase_1795620628219.jpg';
import agencyBlueprintImg from './images/blueprint_agency_studio_1795620629276.jpg';
import portfolioBlueprintImg from './images/blueprint_portfolio_craft_1795620629151.jpg';
import saasBlueprintImg from './images/blueprint_saas_waitlist_1795620629069.jpg';
import commerceBlueprintImg from './images/blueprint_commerce_store_1795620628977.jpg';
import creatorAvatarImg from './images/avatar_creator_profile_1795620629479.jpg';

export const STUDIO_IMAGES = {
  heroWorkspace: heroStudioImg,
  agencyBlueprint: agencyBlueprintImg,
  portfolioBlueprint: portfolioBlueprintImg,
  saasBlueprint: saasBlueprintImg,
  commerceBlueprint: commerceBlueprintImg,
  creatorAvatar: creatorAvatarImg,
} as const;

export function getBlueprintImageForCategory(category?: string, name?: string): string {
  const key = `${category || ''} ${name || ''}`.toLowerCase();
  if (key.includes('portfolio')) return STUDIO_IMAGES.portfolioBlueprint;
  if (key.includes('commerce') || key.includes('store') || key.includes('shop')) {
    return STUDIO_IMAGES.commerceBlueprint;
  }
  if (key.includes('saas') || key.includes('waitlist') || key.includes('app')) {
    return STUDIO_IMAGES.saasBlueprint;
  }
  return STUDIO_IMAGES.agencyBlueprint;
}
