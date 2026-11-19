import type { ProductDto } from '@nexora/shared';

export function getProductImage(product: Partial<ProductDto> | undefined): string {
  if (!product) return '/assets/images/placeholder.webp';

  const thumb = product.thumbnailUrl?.trim();
  // If thumb is an actual review/unlinked or valid high-res photo and NOT a tiny category icon
  if (thumb && thumb.startsWith('/assets/images/review/unlinked/')) {
    return thumb;
  }
  if (thumb && !thumb.includes('/categories/category-') && !thumb.includes('/placeholders/')) {
    return thumb;
  }

  const name = (product.name || '').toLowerCase();
  const slug = (product.slug || '').toLowerCase();
  const catSlug = (product.category?.slug || '').toLowerCase();
  const searchStr = `${name} ${slug} ${catSlug}`;

  // 1. Specific High-Res Product Match
  if (searchStr.includes('superlight') || (searchStr.includes('chuột') && searchStr.includes('logitech'))) {
    return '/assets/images/review/unlinked/logitech-g-pro-x-wireless.jpg';
  }
  if (searchStr.includes('g913') || searchStr.includes('k70') || (searchStr.includes('bàn phím') && searchStr.includes('logitech'))) {
    return '/assets/images/review/unlinked/logitech-g213.jpg';
  }
  if (searchStr.includes('odyssey') || searchStr.includes('g9') || (searchStr.includes('samsung') && searchStr.includes('màn'))) {
    return '/assets/images/review/unlinked/samsung-odyssey.jpg';
  }
  if (searchStr.includes('ultragear') || searchStr.includes('27gr95qe') || (searchStr.includes('lg') && searchStr.includes('màn'))) {
    return '/assets/images/review/unlinked/monitor-lg-27.jpg';
  }
  if (searchStr.includes('tuf') || searchStr.includes('rtx 4070') || searchStr.includes('vga-asus')) {
    return '/assets/images/review/unlinked/rtx-4070-super.jpg';
  }
  if (searchStr.includes('14900k') || searchStr.includes('i9') || searchStr.includes('cpu-intel')) {
    return '/assets/images/review/unlinked/cpu_14.png';
  }
  if (searchStr.includes('990 pro') || searchStr.includes('ssd-samsung')) {
    return '/assets/images/review/unlinked/ssd-samsung.jpg';
  }
  if (searchStr.includes('zephyrus') || searchStr.includes('rog')) {
    return '/assets/images/review/unlinked/rog-zephyrus.jpg';
  }
  if (searchStr.includes('macbook')) {
    return '/assets/images/review/unlinked/macbook-pro.jpg';
  }
  if (searchStr.includes('nitro') || searchStr.includes('predator')) {
    return '/assets/images/review/unlinked/acer-predator.jpg';
  }
  if (searchStr.includes('legion') || searchStr.includes('lenovo')) {
    return '/assets/images/review/unlinked/lenovo-legion.jpg';
  }
  if (searchStr.includes('ultra 4090') || searchStr.includes('pc-gaming')) {
    return '/assets/images/review/unlinked/pc-advanced.jpg';
  }
  if (searchStr.includes('creator') || searchStr.includes('workstation')) {
    return '/assets/images/review/unlinked/pc-workstation.jpg';
  }

  // 2. Generic High-Res Category Fallback
  if (searchStr.includes('laptop')) {
    return '/assets/images/review/unlinked/rog-zephyrus.jpg';
  }
  if (searchStr.includes('màn hình') || searchStr.includes('monitor')) {
    return '/assets/images/review/unlinked/display1.png';
  }
  if (searchStr.includes('vga') || searchStr.includes('card')) {
    return '/assets/images/review/unlinked/rtx-4070-super.jpg';
  }
  if (searchStr.includes('cpu') || searchStr.includes('intel') || searchStr.includes('ryzen')) {
    return '/assets/images/review/unlinked/cpu_ryzen7.jpg';
  }
  if (searchStr.includes('bàn phím') || searchStr.includes('keyboard')) {
    return '/assets/images/review/unlinked/keyboard1.png';
  }
  if (searchStr.includes('chuột') || searchStr.includes('mouse')) {
    return '/assets/images/review/unlinked/logitech-g-pro-x-wireless.jpg';
  }
  if (searchStr.includes('ssd') || searchStr.includes('ram')) {
    return '/assets/images/review/unlinked/ssd-samsung.jpg';
  }
  if (searchStr.includes('pc')) {
    return '/assets/images/review/unlinked/pc-advanced.jpg';
  }

  return '/assets/images/review/unlinked/rog-zephyrus.jpg';
}
