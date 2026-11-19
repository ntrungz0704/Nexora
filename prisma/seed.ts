import 'dotenv/config';
import { PrismaClient, UserRole, UserStatus, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-computed bcrypt hash for 'password123' (rounds = 10)
const DEFAULT_PASSWORD_HASH = '$2b$10$BJs.vgkcjsVinzK0KVxgjez/H7WwawZeD5.22AOQW7DuExInaU2xW';

async function main(): Promise<void> {
  console.log('Seeding Nexora database...');

  // 1. Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nexora.local' },
    update: {
      fullName: 'Quản Trị Viên Nexora',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      phone: '0901234567',
    },
    create: {
      email: 'admin@nexora.local',
      fullName: 'Quản Trị Viên Nexora',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      phone: '0901234567',
    },
  });

  const _staffUser = await prisma.user.upsert({
    where: { email: 'staff@nexora.local' },
    update: {
      fullName: 'Kỹ Thuật Viên Nexora',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      phone: '0902345678',
    },
    create: {
      email: 'staff@nexora.local',
      fullName: 'Kỹ Thuật Viên Nexora',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      phone: '0902345678',
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@nexora.local' },
    update: {
      fullName: 'Nguyễn Văn An',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      phone: '0903456789',
    },
    create: {
      email: 'customer@nexora.local',
      fullName: 'Nguyễn Văn An',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      phone: '0903456789',
    },
  });

  // Customer default address
  await prisma.customerAddress.deleteMany({ where: { userId: customerUser.id } });
  await prisma.customerAddress.create({
    data: {
      userId: customerUser.id,
      recipientName: 'Nguyễn Văn An',
      phone: '0903456789',
      streetAddress: '123 Đường Nguyễn Huệ',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'TP. Hồ Chí Minh',
      isDefault: true,
    },
  });

  // 2. Store Settings
  const defaultSettings = [
    {
      settingKey: 'store.name',
      settingValue: 'Nexora Tech Store',
      description: 'Cửa hàng công nghệ phần cứng chuyên biệt Nexora',
    },
    {
      settingKey: 'store.business_model',
      settingValue: 'single-vendor',
      description: 'Mô hình đơn cửa hàng (Single-Vendor)',
    },
    {
      settingKey: 'store.currency',
      settingValue: 'VND',
      description: 'Đơn vị tiền tệ giao dịch chính thức',
    },
    {
      settingKey: 'store.hotline',
      settingValue: '1800 2097',
      description: 'Tổng đài hỗ trợ miễn phí',
    },
    {
      settingKey: 'store.email',
      settingValue: 'hotro@nexora.vn',
      description: 'Email hỗ trợ kỹ thuật và mua hàng',
    },
  ];

  for (const item of defaultSettings) {
    await prisma.storeSetting.upsert({
      where: { settingKey: item.settingKey },
      update: { settingValue: item.settingValue, description: item.description },
      create: item,
    });
  }

  // 3. Brands
  const brandList = [
    {
      name: 'ASUS',
      slug: 'asus',
      logoUrl: '/assets/images/brands/asus.png',
      description: 'Thương hiệu công nghệ hàng đầu thế giới với dòng ROG Gaming danh tiếng.',
    },
    {
      name: 'ACER',
      slug: 'acer',
      logoUrl: '/assets/images/brands/acer.png',
      description: 'Nhà sản xuất máy tính xách tay và màn hình nổi tiếng với dòng Nitro, Predator.',
    },
    {
      name: 'MSI',
      slug: 'msi',
      logoUrl: '/assets/images/brands/msi.png',
      description: 'Chuyên gia linh kiện, bo mạch chủ và laptop gaming hiệu năng cao.',
    },
    {
      name: 'Lenovo',
      slug: 'lenovo',
      logoUrl: '/assets/images/brands/lenovo.png',
      description: 'Hãng máy tính toàn cầu với dòng ThinkPad và Legion Gaming bền bỉ.',
    },
    {
      name: 'Apple',
      slug: 'apple',
      logoUrl: '/assets/images/brands/apple.png',
      description: 'Hệ sinh thái Mac, MacBook cao cấp dùng chip Apple Silicon.',
    },
    {
      name: 'Dell',
      slug: 'dell',
      logoUrl: '/assets/images/brands/dell.png',
      description: 'Máy trạm, laptop doanh nhân và Alienware chuyên dụng cho game thủ.',
    },
    {
      name: 'Gigabyte',
      slug: 'gigabyte',
      logoUrl: '/assets/images/brands/gigabyte.png',
      description: 'Linh kiện VGA, Mainboard AORUS đỉnh cao cho ép xung.',
    },
    {
      name: 'Samsung',
      slug: 'samsung',
      logoUrl: '/assets/images/brands/samsung.png',
      description: 'Dẫn đầu màn hình Odyssey OLED và ổ cứng SSD 990 Pro tốc độ cao.',
    },
    {
      name: 'LG',
      slug: 'lg',
      logoUrl: '/assets/images/brands/lg.png',
      description: 'Màn hình UltraGear, TV OLED và dòng Laptop LG Gram siêu nhẹ.',
    },
    {
      name: 'Corsair',
      slug: 'corsair',
      logoUrl: '/assets/images/brands/corsair.png',
      description: 'Nguồn, tản nhiệt, RAM DDR5 và phụ kiện gaming gear đẳng cấp.',
    },
    {
      name: 'Logitech',
      slug: 'logitech',
      logoUrl: '/assets/images/brands/logitech.png',
      description: 'Chuột, bàn phím cơ không dây Lightspeed hàng đầu cho eSports.',
    },
  ];

  const brandMap = new Map<string, number>();
  for (const b of brandList) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, logoUrl: b.logoUrl, description: b.description },
      create: b,
    });
    brandMap.set(b.slug, brand.id);
  }

  // 4. Categories (16 core tech categories matching techpilot.io.vn)
  const categoryDefs = [
    { name: 'Laptop', slug: 'laptop', icon: 'fa-solid fa-laptop', sortOrder: 1 },
    { name: 'Laptop Gaming', slug: 'laptop-gaming', icon: 'fa-solid fa-gamepad', sortOrder: 2 },
    { name: 'PC Nexora', slug: 'pc-nexora', icon: 'fa-solid fa-desktop', sortOrder: 3 },
    { name: 'Main, CPU, VGA', slug: 'main-cpu-vga', icon: 'fa-solid fa-microchip', sortOrder: 4 },
    {
      name: 'Case, Nguồn, Tản',
      slug: 'case-nguon-tan',
      icon: 'fa-solid fa-hard-drive',
      sortOrder: 5,
    },
    { name: 'Ổ cứng SSD & HDD', slug: 'o-cung', icon: 'fa-solid fa-server', sortOrder: 6 },
    {
      name: 'Loa, Micro, Webcam',
      slug: 'loa-micro-webcam',
      icon: 'fa-solid fa-volume-high',
      sortOrder: 7,
    },
    { name: 'Màn hình', slug: 'man-hinh', icon: 'fa-solid fa-tv', sortOrder: 8 },
    { name: 'Bàn phím', slug: 'ban-phim', icon: 'fa-solid fa-keyboard', sortOrder: 9 },
    {
      name: 'Chuột + Lót chuột',
      slug: 'chuot-lot-chuot',
      icon: 'fa-solid fa-computer-mouse',
      sortOrder: 10,
    },
    { name: 'Tai Nghe', slug: 'tai-nghe', icon: 'fa-solid fa-headphones', sortOrder: 11 },
    { name: 'Ghế - Bàn Gaming', slug: 'ghe-ban', icon: 'fa-solid fa-chair', sortOrder: 12 },
    {
      name: 'Phần mềm, mạng',
      slug: 'phan-mem-mang',
      icon: 'fa-solid fa-network-wired',
      sortOrder: 13,
    },
    { name: 'Phụ kiện (Hub, sạc, cáp)', slug: 'phu-kien', icon: 'fa-solid fa-plug', sortOrder: 14 },
    {
      name: 'Thiết bị văn phòng',
      slug: 'thiet-bi-van-phong',
      icon: 'fa-solid fa-print',
      sortOrder: 15,
    },
    { name: 'Sạc dự phòng', slug: 'sac-du-phong', icon: 'fa-solid fa-battery-half', sortOrder: 16 },
  ];

  const catMap = new Map<string, number>();
  for (const c of categoryDefs) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, sortOrder: c.sortOrder },
      create: c,
    });
    catMap.set(c.slug, cat.id);
  }

  // 5. Banners
  const banners = [
    {
      title: 'NVIDIA RTX 50 SERIES - Kỷ nguyên đồ họa thế hệ mới',
      imageUrl: '/assets/images/banner-rtx-bg.jpg',
      linkUrl: '/products/rtx-50-series',
      placement: 'hero',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'ASUS ROG Zephyrus G16 - Sức mạnh vượt trội',
      imageUrl: '/assets/images/rog-banner-bg.jpg',
      linkUrl: '/products/asus-rog-zephyrus-g16',
      placement: 'hero',
      sortOrder: 2,
      isActive: true,
    },
    {
      title: 'MacBook Pro 16 M3 Max - Cực phẩm Apple',
      imageUrl: '/assets/images/apple-banner-bg.jpg',
      linkUrl: '/products/macbook-pro-16-m3-max',
      placement: 'hero',
      sortOrder: 3,
      isActive: true,
    },
    {
      title: 'PC Gaming Ultra Max - Chiến thần hiệu năng',
      imageUrl: '/assets/images/banner-1.jpg',
      linkUrl: '/build-pc',
      placement: 'hero',
      sortOrder: 4,
      isActive: true,
    },
    {
      title: 'Samsung Odyssey OLED G9 - Trải nghiệm vô cực',
      imageUrl: '/assets/images/banner-3.jpg',
      linkUrl: '/products/samsung-odyssey-oled-g9',
      placement: 'hero',
      sortOrder: 5,
      isActive: true,
    },
    {
      title: 'BUILD PC THEO YÊU CẦU',
      imageUrl: '/assets/images/banner-build-pc.jpg',
      linkUrl: '/build-pc',
      placement: 'sidebar',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'MUA NGAY - TRẢ SAU (COD)',
      imageUrl: '/assets/images/banner-pay-later.jpg',
      linkUrl: '/catalog',
      placement: 'sidebar',
      sortOrder: 2,
      isActive: true,
    },
    {
      title: 'THU CŨ ĐỔI MỚI MÁY CŨ',
      imageUrl: '/assets/images/banner-trade-in.jpg',
      linkUrl: '/thu-cu-doi-moi',
      placement: 'sidebar',
      sortOrder: 3,
      isActive: true,
    },
  ];

  await prisma.banner.deleteMany({});
  for (const b of banners) {
    await prisma.banner.create({ data: b });
  }

  // 6. Products
  const productsData = [
    // Laptops & Gaming Laptops
    {
      name: 'ASUS ROG Zephyrus G16 (2024)',
      slug: 'asus-rog-zephyrus-g16',
      sku: 'LAP-ROG-G16-01',
      categoryId: catMap.get('laptop-gaming') || 1,
      brandId: brandMap.get('asus'),
      price: 64990000,
      salePrice: 59990000,
      stockQuantity: 15,
      thumbnailUrl: '/assets/images/categories/category-laptop.png',
      shortDescription:
        'Laptop gaming cao cấp siêu mỏng nhẹ với màn hình OLED 2.5K 240Hz, CPU Intel Core Ultra 9 và card đồ họa RTX 4070.',
      specs: {
        cpu: 'Intel® Core™ Ultra 9 185H',
        ram: '32GB LPDDR5X 7467MHz',
        gpu: 'NVIDIA® GeForce RTX™ 4070 8GB GDDR6',
        storage: '1TB SSD M.2 PCIe 4.0 NVMe',
        display: '16 inch 2.5K (2560x1600) OLED 240Hz 0.2ms DCI-P3 100%',
        weight: '1.85 kg',
      },
      isFeatured: true,
      isHot: true,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'MacBook Pro 16 inch M3 Max',
      slug: 'macbook-pro-16-m3-max',
      sku: 'LAP-APL-MBP16-01',
      categoryId: catMap.get('laptop') || 1,
      brandId: brandMap.get('apple'),
      price: 94990000,
      salePrice: 89990000,
      stockQuantity: 10,
      thumbnailUrl: '/assets/images/review/unlinked/macbook-pro.jpg',
      shortDescription:
        'Quái vật hiệu năng sáng tạo đồ họa chuyên nghiệp với chip Apple M3 Max 14-core CPU, 30-core GPU, màn hình Liquid Retina XDR.',
      specs: {
        cpu: 'Apple M3 Max (14-core CPU)',
        ram: '36GB Unified Memory',
        gpu: 'Apple 30-core GPU',
        storage: '1TB SSD siêu tốc',
        display: '16.2 inch Liquid Retina XDR (3456x2234) ProMotion 120Hz',
        weight: '2.16 kg',
      },
      isFeatured: true,
      isHot: true,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Acer Nitro 16 Phoenix (2024)',
      slug: 'acer-nitro-16-phoenix',
      sku: 'LAP-ACR-NIT16-01',
      categoryId: catMap.get('laptop-gaming') || 1,
      brandId: brandMap.get('acer'),
      price: 29990000,
      salePrice: 26490000,
      stockQuantity: 25,
      thumbnailUrl: '/assets/images/categories/category-laptop.png',
      shortDescription:
        'Laptop gaming tầm trung quốc dân với tản nhiệt kim loại lỏng, AMD Ryzen 7 7840HS và RTX 4060 8GB.',
      specs: {
        cpu: 'AMD Ryzen™ 7 7840HS (8 nhân 16 luồng)',
        ram: '16GB DDR5 5600MHz (nâng cấp tối đa 64GB)',
        gpu: 'NVIDIA® GeForce RTX™ 4060 8GB GDDR6 (140W)',
        storage: '512GB SSD PCIe 4.0 NVMe',
        display: '16 inch WQXGA (2560x1600) 165Hz sRGB 100%',
        weight: '2.6 kg',
      },
      isFeatured: true,
      isHot: true,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Lenovo Legion Pro 5 16IRX9',
      slug: 'lenovo-legion-pro-5',
      sku: 'LAP-LNV-LEG5-01',
      categoryId: catMap.get('laptop-gaming') || 1,
      brandId: brandMap.get('lenovo'),
      price: 43990000,
      salePrice: 39990000,
      stockQuantity: 18,
      thumbnailUrl: '/assets/images/categories/category-laptop.png',
      shortDescription:
        'Cỗ máy gaming chuẩn thi đấu eSports với vi xử lý Intel Core i7-14700HX và card màn hình RTX 4070.',
      specs: {
        cpu: 'Intel® Core™ i7-14700HX (20 nhân 28 luồng)',
        ram: '32GB DDR5 5600MHz',
        gpu: 'NVIDIA® GeForce RTX™ 4070 8GB GDDR6 (140W)',
        storage: '1TB SSD M.2 2280 PCIe 4.0x4 NVMe',
        display: '16 inch WQXGA (2560x1600) IPS 240Hz 500nits 100% sRGB',
        weight: '2.5 kg',
      },
      isFeatured: true,
      isHot: false,
      status: ProductStatus.ACTIVE,
    },
    // Desktop PCs
    {
      name: 'PC Gaming Nexora Ultra RTX 4090 i9-14900K',
      slug: 'pc-gaming-nexora-ultra-4090',
      sku: 'PC-NX-ULTRA-4090',
      categoryId: catMap.get('pc-nexora') || 1,
      brandId: brandMap.get('asus'),
      price: 135000000,
      salePrice: 124990000,
      stockQuantity: 5,
      thumbnailUrl: '/assets/images/categories/category-pc.png',
      shortDescription:
        'Siêu phẩm PC Gaming hủy diệt mọi tựa game 4K Ray Tracing và Render 3D hạng nặng với tản nhiệt nước AIO 360mm RGB.',
      specs: {
        cpu: 'Intel® Core™ i9-14900K (24 nhân 32 luồng)',
        mainboard: 'ASUS ROG MAXIMUS Z790 HERO',
        ram: '64GB (2x32GB) Corsair Dominator Titanium DDR5 6000MHz',
        gpu: 'ASUS ROG Strix GeForce RTX 4090 24GB GDDR6X',
        storage: '2TB Samsung 990 PRO PCIe 4.0 NVMe',
        psu: 'Corsair RM1200x Shift 1200W 80 Plus Gold ATX 3.0',
        case: 'Lian Li O11 Dynamic EVO RGB Black',
      },
      isFeatured: true,
      isHot: true,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'PC Nexora Creator i7-14700K RTX 4070 Super',
      slug: 'pc-nexora-creator-4070s',
      sku: 'PC-NX-CREATOR-4070S',
      categoryId: catMap.get('pc-nexora') || 1,
      brandId: brandMap.get('msi'),
      price: 52000000,
      salePrice: 47990000,
      stockQuantity: 8,
      thumbnailUrl: '/assets/images/categories/category-pc.png',
      shortDescription:
        'Cấu hình tối ưu tuyệt hảo cho đồ họa Adobe Premiere, After Effects, AutoCAD và dựng hình Blender.',
      specs: {
        cpu: 'Intel® Core™ i7-14700K (20 nhân 28 luồng)',
        mainboard: 'MSI MAG Z790 TOMAHAWK WIFI DDR5',
        ram: '32GB (2x16GB) Kingston Fury Beast DDR5 6000MHz',
        gpu: 'MSI GeForce RTX 4070 SUPER 12G VENTUS 2X OC',
        storage: '1TB Kingston KC3000 PCIe 4.0 NVMe',
        psu: 'MSI MAG A850GL PCIE5 850W 80 Plus Gold',
        case: 'NZXT H5 Flow All Black',
      },
      isFeatured: true,
      isHot: false,
      status: ProductStatus.ACTIVE,
    },
    // Main/CPU/VGA Components
    {
      name: 'Card màn hình ASUS TUF Gaming GeForce RTX 4070 Ti SUPER 16GB',
      slug: 'vga-asus-tuf-rtx-4070-ti-super',
      sku: 'VGA-ASUS-4070TIS-16G',
      categoryId: catMap.get('main-cpu-vga') || 1,
      brandId: brandMap.get('asus'),
      price: 25990000,
      salePrice: 23990000,
      stockQuantity: 20,
      thumbnailUrl: '/assets/images/categories/category-vga.png',
      shortDescription:
        'Độ bền quân đội TUF Gaming, kiến trúc Ada Lovelace, DLSS 3 và 16GB VRAM GDDR6X cho độ phân giải 2K/4K siêu mượt.',
      specs: {
        engine: 'NVIDIA® GeForce RTX™ 4070 Ti SUPER',
        cuda: '8448 CUDA Cores',
        vram: '16GB GDDR6X 256-bit',
        clock: 'OC mode: 2640 MHz / Default: 2610 MHz',
        power: 'Đề xuất nguồn 750W trở lên (1x 16-pin)',
      },
      isFeatured: true,
      isHot: true,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'CPU Intel Core i9-14900K (Up to 6.0GHz, 24 nhân 32 luồng)',
      slug: 'cpu-intel-core-i9-14900k',
      sku: 'CPU-INT-14900K',
      categoryId: catMap.get('main-cpu-vga') || 1,
      brandId: brandMap.get('asus'),
      price: 15490000,
      salePrice: 14290000,
      stockQuantity: 30,
      thumbnailUrl: '/assets/images/categories/category-cpu.png',
      shortDescription:
        'Vi xử lý flagship thế hệ thứ 14 Raptor Lake Refresh với tần số turbo lên tới 6.0GHz, hiệu năng ép xung đỉnh cao.',
      specs: {
        socket: 'LGA 1700',
        cores: '24 nhân (8 P-core + 16 E-core)',
        threads: '32 luồng',
        cache: '36MB Intel® Smart Cache',
        tdp: '125W Base / 253W Max Turbo',
      },
      isFeatured: false,
      isHot: true,
      status: ProductStatus.ACTIVE,
    },
    // Monitors
    {
      name: 'Màn hình cong Samsung Odyssey OLED G9 49 inch 240Hz 0.03ms',
      slug: 'samsung-odyssey-oled-g9',
      sku: 'MON-SS-G9-49OLED',
      categoryId: catMap.get('man-hinh') || 1,
      brandId: brandMap.get('samsung'),
      price: 39990000,
      salePrice: 34500000,
      stockQuantity: 6,
      thumbnailUrl: '/assets/images/categories/category-monitor.png',
      shortDescription:
        'Màn hình gaming OLED siêu rộng 32:9 với độ cong 1800R chuẩn rạp chiếu phim, chuẩn màu DisplayHDR True Black 400.',
      specs: {
        size: '49 inch Dual QHD (5120 x 1440)',
        panel: 'QD-OLED 1800R',
        refreshRate: '240Hz',
        responseTime: '0.03ms (GtG)',
        sync: 'AMD FreeSync Premium Pro',
      },
      isFeatured: true,
      isHot: true,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Màn hình LG UltraGear 27GR95QE-B 27 inch OLED 240Hz',
      slug: 'man-hinh-lg-ultragear-27gr95qe',
      sku: 'MON-LG-27OLED-240',
      categoryId: catMap.get('man-hinh') || 1,
      brandId: brandMap.get('lg'),
      price: 21990000,
      salePrice: 18990000,
      stockQuantity: 12,
      thumbnailUrl: '/assets/images/categories/category-monitor.png',
      shortDescription:
        'Tấm nền OLED 2K QHD 240Hz siêu phản hồi 0.03ms, chuẩn màu DCI-P3 98.5% cho game thủ FPS chuyên nghiệp.',
      specs: {
        size: '27 inch QHD (2560 x 1440)',
        panel: 'OLED',
        refreshRate: '240Hz',
        responseTime: '0.03ms (GtG)',
        color: 'DCI-P3 98.5%, HDR10',
      },
      isFeatured: true,
      isHot: false,
      status: ProductStatus.ACTIVE,
    },
    // Peripherals (Keyboards & Mice)
    {
      name: 'Bàn phím cơ không dây Logitech G913 TKL Lightspeed RGB',
      slug: 'ban-phim-logitech-g913-tkl',
      sku: 'KB-LOG-G913TKL',
      categoryId: catMap.get('ban-phim') || 1,
      brandId: brandMap.get('logitech'),
      price: 4990000,
      salePrice: 3890000,
      stockQuantity: 40,
      thumbnailUrl: '/assets/images/categories/category-keyboard.png',
      shortDescription:
        'Switch cơ học GL Tactile low-profile siêu mỏng, vỏ nhôm phay xước cao cấp, kết nối Lightspeed không độ trễ 1ms.',
      specs: {
        connectivity: 'Lightspeed Wireless 1ms, Bluetooth, USB',
        switch: 'GL Tactile Low Profile',
        battery: 'Thời lượng lên tới 40 giờ bật LED RGB',
        layout: 'Tenkeyless (TKL) 87 phím',
      },
      isFeatured: true,
      isHot: true,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Chuột Gaming không dây Logitech G Pro X Superlight 2',
      slug: 'chuot-logitech-g-pro-x-superlight-2',
      sku: 'MOU-LOG-GPX2',
      categoryId: catMap.get('chuot-lot-chuot') || 1,
      brandId: brandMap.get('logitech'),
      price: 3690000,
      salePrice: 3290000,
      stockQuantity: 50,
      thumbnailUrl: '/assets/images/categories/category-mouse.png',
      shortDescription:
        'Chuột esports số 1 thế giới trọng lượng siêu nhẹ 60g, switch hybrid cơ-quang học Lightforce, cảm biến HERO 2 32.000 DPI.',
      specs: {
        weight: '60g',
        sensor: 'HERO 2 (100 – 32.000 DPI)',
        pollingRate: '4000Hz (0.25ms)',
        battery: 'Lên tới 95 giờ sử dụng liên tục',
      },
      isFeatured: true,
      isHot: true,
      status: ProductStatus.ACTIVE,
    },
    // SSD / Storage
    {
      name: 'Ổ cứng SSD Samsung 990 PRO 2TB PCIe 4.0 M.2 NVMe',
      slug: 'ssd-samsung-990-pro-2tb',
      sku: 'SSD-SS-990PRO-2TB',
      categoryId: catMap.get('o-cung') || 1,
      brandId: brandMap.get('samsung'),
      price: 5490000,
      salePrice: 4790000,
      stockQuantity: 35,
      thumbnailUrl: '/assets/images/categories/category-storage.png',
      shortDescription:
        'Tốc độ đọc/ghi tuần tự đỉnh bảng lên tới 7.450 / 6.900 MB/s, công nghệ tản nhiệt Nickel thông minh bảo vệ dữ liệu.',
      specs: {
        capacity: '2TB',
        interface: 'PCIe Gen 4.0 x4, NVMe 2.0',
        readSpeed: 'Lên tới 7.450 MB/s',
        writeSpeed: 'Lên tới 6.900 MB/s',
        tbw: '1200 TBW, bảo hành 5 năm',
      },
      isFeatured: false,
      isHot: true,
      status: ProductStatus.ACTIVE,
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        sku: p.sku,
        categoryId: p.categoryId,
        brandId: p.brandId,
        price: p.price,
        salePrice: p.salePrice,
        stockQuantity: p.stockQuantity,
        thumbnailUrl: p.thumbnailUrl,
        shortDescription: p.shortDescription,
        specs: p.specs,
        isFeatured: p.isFeatured,
        isHot: p.isHot,
        status: p.status,
      },
      create: p,
    });

    // Seed product image
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    if (p.thumbnailUrl) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: p.thumbnailUrl,
          altText: p.name,
          sortOrder: 1,
        },
      });
    }
  }

  // 7. Demo Cart for Customer
  const firstProd = await prisma.product.findFirst({
    where: { slug: 'ban-phim-logitech-g913-tkl' },
  });
  const secondProd = await prisma.product.findFirst({
    where: { slug: 'chuot-logitech-g-pro-x-superlight-2' },
  });

  const customerCart = await prisma.cart.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: { userId: customerUser.id },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: customerCart.id } });
  if (firstProd) {
    await prisma.cartItem.create({
      data: {
        cartId: customerCart.id,
        productId: firstProd.id,
        quantity: 1,
      },
    });
  }
  if (secondProd) {
    await prisma.cartItem.create({
      data: {
        cartId: customerCart.id,
        productId: secondProd.id,
        quantity: 1,
      },
    });
  }

  // 8. Demo Wishlist
  await prisma.wishlist.deleteMany({ where: { userId: customerUser.id } });
  if (firstProd) {
    await prisma.wishlist.create({
      data: {
        userId: customerUser.id,
        productId: firstProd.id,
      },
    });
  }

  // 9. Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: 'STOREFRONT_CATALOG_SEEDED',
      entityType: 'Catalog',
      entityId: 'storefront_baseline',
      metadata: {
        seededCategories: categoryDefs.length,
        seededBrands: brandList.length,
        seededProducts: productsData.length,
        seededBanners: banners.length,
      },
    },
  });

  console.log(
    `Nexora catalog and storefront seeded successfully with ${productsData.length} products, ${categoryDefs.length} categories, and ${banners.length} banners!`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
