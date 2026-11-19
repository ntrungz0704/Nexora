import type { ProductDto } from '@nexora/shared';

export function getProductImage(product: Partial<ProductDto> | undefined): string {
  if (!product) return '/assets/images/placeholder.webp';

  const thumb = product.thumbnailUrl?.trim();
  // Override low-res or missing image files with sharp high-res renders
  if (thumb?.includes('samsung-odyssey.jpg')) {
    return '/assets/images/review/unlinked/display.png';
  }
  if (thumb?.includes('monitor-lg-27.jpg')) {
    return '/assets/images/review/unlinked/display1.png';
  }
  if (thumb?.includes('logitech-g913.png')) {
    return '/assets/images/review/unlinked/logitech-g213.jpg';
  }
  if (thumb?.includes('headset-g733')) {
    return '/assets/images/categories/category-headset.png';
  }

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
    return '/assets/images/review/unlinked/display.png';
  }
  if (searchStr.includes('ultragear') || searchStr.includes('27gr95qe') || (searchStr.includes('lg') && searchStr.includes('màn'))) {
    return '/assets/images/review/unlinked/display1.png';
  }
  if (searchStr.includes('tuf') || searchStr.includes('rtx 4070') || searchStr.includes('vga-asus') || searchStr.includes('geforce rtx')) {
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
  if (searchStr.includes('in') || searchStr.includes('canon') || searchStr.includes('epson') || searchStr.includes('van-phong') || searchStr.includes('văn phòng')) {
    return '/assets/images/review/unlinked/printer-canon.jpg';
  }
  if (searchStr.includes('router') || searchStr.includes('wifi') || searchStr.includes('mạng') || searchStr.includes('phan-mem')) {
    return '/assets/images/review/unlinked/router-tplink.jpg';
  }
  if (searchStr.includes('webcam') || searchStr.includes('camera') || searchStr.includes('loa') || searchStr.includes('micro')) {
    return '/assets/images/review/unlinked/camera.jpg';
  }
  if (searchStr.includes('case') || searchStr.includes('nguon') || searchStr.includes('nguồn') || searchStr.includes('tản') || searchStr.includes('deepcool')) {
    return '/assets/images/review/unlinked/case1.jpg';
  }
  if (searchStr.includes('hub') || searchStr.includes('phụ kiện') || searchStr.includes('phu-kien')) {
    return '/assets/images/review/unlinked/prod_625.png';
  }
  if (searchStr.includes('sạc dự phòng') || searchStr.includes('sac-du-phong') || searchStr.includes('powerbank') || searchStr.includes('anker')) {
    return '/assets/images/review/unlinked/prod_632.jpg';
  }
  if (searchStr.includes('tai-nghe') || searchStr.includes('tai nghe') || searchStr.includes('headphone') || searchStr.includes('hyperx')) {
    return '/assets/images/review/unlinked/camera1.jpg';
  }
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
