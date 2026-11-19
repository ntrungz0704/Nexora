import type { ProductDto } from '@nexora/shared';

export function getProductImage(product: Partial<ProductDto> | undefined): string {
  if (!product) return '/assets/images/placeholder.webp';

  const thumb = product.thumbnailUrl?.trim();
  if (thumb && (thumb.startsWith('http') || thumb.startsWith('/assets/'))) {
    return thumb;
  }

  const name = (product.name || '').toLowerCase();
  const catSlug = (product.category?.slug || '').toLowerCase();
  const searchStr = `${name} ${catSlug}`;

  if (searchStr.includes('laptop') || searchStr.includes('macbook') || searchStr.includes('zenbook')) {
    return '/assets/images/placeholders/laptop.png';
  }
  if (searchStr.includes('màn hình') || searchStr.includes('monitor') || searchStr.includes('oled') || searchStr.includes('odyssey')) {
    return '/assets/images/placeholders/màn-hình.png';
  }
  if (searchStr.includes('vga') || searchStr.includes('rtx') || searchStr.includes('gtx') || searchStr.includes('radeon') || searchStr.includes('card')) {
    return '/assets/images/placeholders/vga.png';
  }
  if (searchStr.includes('cpu') || searchStr.includes('intel') || searchStr.includes('core i') || searchStr.includes('ryzen')) {
    return '/assets/images/placeholders/cpu.png';
  }
  if (searchStr.includes('ssd') || searchStr.includes('hdd') || searchStr.includes('ổ cứng') || searchStr.includes('ram') || searchStr.includes('kingston')) {
    return '/assets/images/placeholders/ssd.png';
  }
  if (searchStr.includes('case') || searchStr.includes('vỏ')) {
    return '/assets/images/placeholders/case.png';
  }
  if (searchStr.includes('cooling') || searchStr.includes('tản') || searchStr.includes('fan')) {
    return '/assets/images/placeholders/fan.png';
  }
  if (searchStr.includes('psu') || searchStr.includes('nguồn')) {
    return '/assets/images/placeholders/psu.png';
  }

  return '/assets/images/placeholder.webp';
}
