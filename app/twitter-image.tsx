// Reuse the same generated image for Twitter / X cards as for Open Graph.
export { default, alt, size, contentType } from './opengraph-image';

// Route-segment config must be declared statically in this file (it cannot be
// re-exported), so the ISR revalidate window is repeated here.
export const revalidate = 300;
