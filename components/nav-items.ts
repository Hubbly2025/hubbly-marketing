/**
 * Single source of truth for the landing nav.
 *
 * This array used to be duplicated in app/page.tsx (desktop) and
 * components/landing-interactions.tsx (mobile menu), so adding a link in one
 * place silently shipped a mobile menu missing it. Both import this now.
 *
 * Every href must point at an id that exists AND carries scroll-mt-32, or the
 * target lands behind the sticky ticker + header.
 *
 * Kept to four items on purpose: at five, the desktop bar runs out of room and
 * the labels collide.
 */

export const navItems = [
  ["HOW IT WORKS", "#how-it-works"],
  ["THE WORKSPACE", "#workspace"],
  ["INTEGRATIONS", "#integrations"],
  // Was PRICING → #pricing. Hubbly Voice is sales-led with no public pricing,
  // so that section is gone and the anchor would be dead. FAQ is a real target.
  ["FAQ", "#faq"],
] as const
