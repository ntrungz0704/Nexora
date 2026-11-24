import 'dotenv/config';
import fs from 'fs';
import readline from 'readline';
import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

function parseSqlTuples(sqlValuesString: string): string[][] {
  const tuples: string[][] = [];
  let inString = false;
  let escape = false;
  let currentVal = '';
  let currentTuple: string[] = [];
  let inTuple = false;

  for (let i = 0; i < sqlValuesString.length; i++) {
    const char = sqlValuesString[i];

    if (escape) {
      currentVal += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '(') {
        inTuple = true;
        currentTuple = [];
        currentVal = '';
        continue;
      } else if (char === ')') {
        inTuple = false;
        currentTuple.push(currentVal.trim() === 'NULL' ? '' : currentVal);
        tuples.push(currentTuple);
        currentVal = '';
        continue;
      } else if (char === ',' && inTuple) {
        currentTuple.push(currentVal.trim() === 'NULL' ? '' : currentVal);
        currentVal = '';
        continue;
      }
    }

    if (inTuple) {
      currentVal += char;
    }
  }

  return tuples;
}

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/TechPilot/g, 'Nexora')
    .replace(/techpilot\.vn/g, 'nexora.local')
    .replace(/techpilot\.io\.vn/g, 'nexora.local')
    .replace(/techpilot/g, 'nexora');
}

function formatImagePath(path: string | null | undefined): string | null {
  if (!path || path.trim() === '' || path === 'NULL') return null;
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

async function main() {
  console.log('🚀 Starting Full TechPilot -> Nexora Database Import...');
  const sqlFilePath = 'D:/02_Dự Án Phần Mềm/TechPilot (Bản Chính Thức)/database/seed_dev.sql';

  if (!fs.existsSync(sqlFilePath)) {
    throw new Error(`File not found: ${sqlFilePath}`);
  }

  const fileStream = fs.createReadStream(sqlFilePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let brandsTuples: string[][] = [];
  let categoriesTuples: string[][] = [];
  let productsTuples: string[][] = [];
  let productImagesTuples: string[][] = [];

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `brands` VALUES')) {
      brandsTuples = parseSqlTuples(line.replace('INSERT INTO `brands` VALUES ', '').trim());
    } else if (line.startsWith('INSERT INTO `categories` VALUES')) {
      categoriesTuples = parseSqlTuples(line.replace('INSERT INTO `categories` VALUES ', '').trim());
    } else if (line.startsWith('INSERT INTO `products` VALUES')) {
      productsTuples = parseSqlTuples(line.replace('INSERT INTO `products` VALUES ', '').trim());
    } else if (line.startsWith('INSERT INTO `product_images` VALUES')) {
      productImagesTuples = parseSqlTuples(line.replace('INSERT INTO `product_images` VALUES ', '').trim());
    }
  }

  console.log(`Parsed from seed_dev.sql:
- Brands: ${brandsTuples.length}
- Categories: ${categoriesTuples.length}
- Products: ${productsTuples.length}
- Product Images: ${productImagesTuples.length}`);

  // 1. Seed Categories
  console.log('📂 Seeding 21 Categories...');
  const categoryIdMap = new Map<number, number>();

  for (const c of categoriesTuples) {
    const rawId = parseInt(c[0], 10);
    const _parentIdRaw = c[1] && c[1] !== 'NULL' ? parseInt(c[1], 10) : null;
    let name = cleanText(c[2]);
    const slug = c[3];
    if (slug === 'pc') {
      name = 'PC Nexora';
    }

    const cat = await prisma.category.upsert({
      where: { slug },
      update: {
        name,
        icon: c[4] && c[4] !== 'NULL' ? c[4] : null,
        description: c[6] ? cleanText(c[6]) : null,
      },
      create: {
        name,
        slug,
        icon: c[4] && c[4] !== 'NULL' ? c[4] : null,
        description: c[6] ? cleanText(c[6]) : null,
        sortOrder: rawId,
        isActive: true,
      },
    });
    categoryIdMap.set(rawId, cat.id);
  }

  // Also ensure legacy grouped categories exist for search backward compatibility
  const extraCats = [
    { name: 'Main, CPU, VGA', slug: 'main-cpu-vga', icon: 'fa-solid fa-microchip' },
    { name: 'Case, Nguồn, Tản', slug: 'case-nguon-tan', icon: 'fa-solid fa-hard-drive' },
    { name: 'Ổ cứng SSD & HDD', slug: 'o-cung', icon: 'fa-solid fa-server' },
    { name: 'Loa, Micro, Webcam', slug: 'loa-micro-webcam', icon: 'fa-solid fa-volume-high' },
    { name: 'Ghế - Bàn Gaming', slug: 'ghe-ban', icon: 'fa-solid fa-chair' },
    { name: 'Chuột + Lót chuột', slug: 'chuot-lot-chuot', icon: 'fa-solid fa-computer-mouse' },
    { name: 'Phần mềm, mạng', slug: 'phan-mem-mang', icon: 'fa-solid fa-network-wired' },
    { name: 'PC TechPilot', slug: 'pc-techpilot', icon: 'fa-solid fa-desktop' },
    { name: 'Laptop Gaming', slug: 'laptop-gaming', icon: 'fa-solid fa-gamepad' },
  ];
  for (const ec of extraCats) {
    await prisma.category.upsert({
      where: { slug: ec.slug },
      update: { name: ec.name, icon: ec.icon },
      create: { name: ec.name, slug: ec.slug, icon: ec.icon, isActive: true },
    });
  }

  // 2. Seed Brands
  console.log('🏷️ Seeding Brands...');
  const brandIdMap = new Map<number, number>();

  for (const b of brandsTuples) {
    const rawId = parseInt(b[0], 10);
    const name = cleanText(b[1]);
    const slug = b[2];
    const logoUrl = formatImagePath(b[3]);
    const description = b[4] ? cleanText(b[4]) : null;

    const brand = await prisma.brand.upsert({
      where: { slug },
      update: { name, logoUrl, description },
      create: { name, slug, logoUrl, description },
    });
    brandIdMap.set(rawId, brand.id);
  }

  // 3. Seed Products (All 651 products)
  console.log('💻 Seeding 651 Products...');
  let importedCount = 0;

  for (const p of productsTuples) {
    const rawCatId = parseInt(p[4], 10);
    const rawBrandId = p[5] && p[5] !== 'NULL' ? parseInt(p[5], 10) : null;
    const catId = categoryIdMap.get(rawCatId) || 1;
    const brandId = rawBrandId ? brandIdMap.get(rawBrandId) || null : null;

    const sku = p[1];
    const name = cleanText(p[6]);
    const slug = cleanText(p[7]);
    const shortDesc = p[8] ? cleanText(p[8]) : null;
    const desc = p[9] ? cleanText(p[9]) : null;
    const price = parseFloat(p[10]) || 0;
    const salePrice = p[12] && p[12] !== 'NULL' && parseFloat(p[12]) > 0 ? parseFloat(p[12]) : null;
    const thumb = formatImagePath(p[14]);
    const stock = parseInt(p[17], 10) || 20;

    let specsObj: Record<string, unknown> | null = null;
    if (p[19] && p[19].startsWith('{')) {
      try {
        specsObj = JSON.parse(p[19]);
      } catch {
        specsObj = null;
      }
    }

    const isFeatured = p[26] === '1';
    const isHot = p[27] === '1';

    await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        slug,
        categoryId: catId,
        brandId,
        price,
        salePrice,
        stockQuantity: stock > 0 ? stock : 15,
        thumbnailUrl: thumb,
        shortDescription: shortDesc,
        description: desc,
        specs: specsObj,
        isFeatured,
        isHot,
        status: ProductStatus.ACTIVE,
      },
      create: {
        sku,
        name,
        slug,
        categoryId: catId,
        brandId,
        price,
        salePrice,
        stockQuantity: stock > 0 ? stock : 15,
        thumbnailUrl: thumb,
        shortDescription: shortDesc,
        description: desc,
        specs: specsObj,
        isFeatured,
        isHot,
        status: ProductStatus.ACTIVE,
      },
    });

    importedCount++;
    if (importedCount % 100 === 0) {
      console.log(`  Imported ${importedCount}/651 products...`);
    }
  }

  console.log(`✅ Successfully imported ${importedCount} products.`);

  // 4. Seed Product Images
  console.log('🖼️ Seeding Product Images...');
  // Find products to map product ID
  const allProds = await prisma.product.findMany({ select: { id: true, sku: true } });
  const skuToProdId = new Map(allProds.map((p) => [p.sku, p.id]));

  // In TechPilot, product_images had product_id referencing products.id
  // We can match by index or product_id
  let imageCount = 0;
  for (const img of productImagesTuples.slice(0, 500)) {
    const rawProdId = parseInt(img[1], 10);
    // Find the product that corresponded to rawProdId in productsTuples
    const targetProdTuple = productsTuples.find((pt) => parseInt(pt[0], 10) === rawProdId);
    if (!targetProdTuple) continue;

    const prodId = skuToProdId.get(targetProdTuple[1]);
    if (!prodId) continue;

    const imgUrl = formatImagePath(img[2]);
    if (!imgUrl) continue;

    const alt = img[3] ? cleanText(img[3]) : '';
    const pos = parseInt(img[4], 10) || 0;
    const isPrimary = img[5] === '1';

    await prisma.productImage.create({
      data: {
        productId: prodId,
        imageUrl: imgUrl,
        altText: alt,
        position: pos,
        isPrimary,
      },
    }).catch(() => {});
    imageCount++;
  }
  console.log(`✅ Seeded ${imageCount} product images.`);

  // 5. Seed Tech News Posts (Distinct, dedicated images for every single post)
  console.log('📰 Seeding Rich Tech News Posts...');
  const newsList = [
    {
      title: 'Đánh giá chi tiết NVIDIA RTX 50 Series: Bước nhảy vọt kiến trúc Blackwell và DLSS 4',
      slug: 'danh-gia-nvidia-geforce-rtx-5090-hieu-nang-ai',
      excerpt: 'Kiến trúc Blackwell tiến trình 4nm đem lại bước nhảy vọt hiệu năng Ray Tracing và DLSS 4 đột phá cho gaming 4K và AI.',
      content: '<p>NVIDIA đã chính thức công bố dòng card đồ họa GeForce RTX 50 Series với đầu tàu RTX 5090. Với bộ nhớ GDDR7 siêu tốc và hơn 24.000 nhân CUDA, đây là cỗ máy hoàn hảo cho đồ họa 8K và tính toán AI cục bộ.</p><p>Trải nghiệm thực tế cho thấy hiệu năng render Blender và Stable Diffusion tăng hơn 2.3 lần so với thế hệ RTX 4090 trước đây.</p>',
      thumbnailUrl: '/assets/images/news/news-rtx-50.jpg',
      category: 'Phần cứng',
      views: 4520,
    },
    {
      title: 'Top 5 bàn phím cơ không dây văn phòng và gaming đáng mua nhất 2026',
      slug: 'top-5-ban-phim-co-khong-day-dang-mua-nhat-2026',
      excerpt: 'Tổng hợp các mẫu bàn phím cơ gõ êm, pin trâu từ Logitech, Corsair và Keychron cho trải nghiệm làm việc đỉnh cao.',
      content: '<p>Lựa chọn bàn phím cơ không dây đáp ứng tiêu chí gọn gàng, độ trễ thấp và cảm giác gõ mượt mà. Cùng Nexora điểm qua top 5 lựa chọn xuất sắc nhất hiện nay.</p><p>Các mẫu switch hot-swap và kết nối 3 chế độ (Bluetooth 5.3, 2.4GHz Receiver, Type-C) đang là xu hướng được ưa chuộng hàng đầu.</p>',
      thumbnailUrl: '/assets/images/news/news-mouse-gaming.jpg',
      category: 'Gaming Gear',
      views: 3890,
    },
    {
      title: 'Hướng dẫn tự build PC gaming cân mọi tựa game AAA tầm giá 25 triệu',
      slug: 'huong-dan-tu-build-pc-gaming-25-trieu',
      excerpt: 'Chi tiết từng linh kiện từ CPU Core i5 / Ryzen 5 đến RTX 4060 Ti tối ưu hiệu năng trên từng đồng bỏ ra.',
      content: '<p>Build cấu hình PC chơi game mượt mà ở độ phân giải 2K là mong muốn của nhiều game thủ. Bài viết này hướng dẫn chi tiết cách phối hợp linh kiện không bị nghẽn cổ chai.</p><p>Tất cả linh kiện đều được bảo hành chính hãng 36 tháng tại hệ thống showroom Nexora toàn quốc.</p>',
      thumbnailUrl: '/assets/images/news/news-build-pc.jpg',
      category: 'Tư vấn',
      views: 6240,
    },
    {
      title: 'Đánh giá chi tiết Intel Core Ultra 9 285K: Bước tiến kiến trúc Arrow Lake',
      slug: 'danh-gia-chi-tiet-intel-core-ultra-9-285k',
      excerpt: 'Phân tích kiến trúc Arrow Lake, hiệu năng đa nhân, NPU tích hợp và điện năng tiêu thụ mát hơn 40% của Intel Core Ultra 9 285K.',
      content: '<p>Dòng vi xử lý Intel Core Ultra 200S Series mang đến sự thay đổi toàn diện về socket LGA1851 và tiến trình sản xuất tiên tiến, loại bỏ Hyper-Threading để tối ưu IPC thuần túy.</p><p>Nhiệt độ hoạt động giảm ngoạn mục so với i9-14900K, giúp hệ thống hoạt động êm ái và mát mẻ bền bỉ.</p>',
      thumbnailUrl: '/assets/images/news/news-intel-ultra.jpg',
      category: 'Phần cứng',
      views: 5120,
    },
    {
      title: 'So sánh Intel Core i9-14900K vs AMD Ryzen 7 7800X3D: Đâu là Vua Gaming 2026?',
      slug: 'so-sanh-intel-i9-14900k-vs-amd-ryzen-7-7800x3d-vua-gaming',
      excerpt: 'Kiểm nghiệm hiệu năng chơi game thực tế, công suất tiêu thụ và tỷ lệ P/P giữa hai con chip hàng đầu thị trường công nghệ.',
      content: '<p>Ryzen 7 7800X3D với công nghệ 3D V-Cache 96MB tiếp tục chứng minh sức mạnh áp đảo trong các tựa game eSports như CS2, Valorant và Shadow of the Tomb Raider.</p><p>Trong khi đó Core i9-14900K giữ vững vị thế trong các tác vụ dựng hình 3D, Premiere Pro và đa nhiệm nặng.</p>',
      thumbnailUrl: '/assets/images/posts/cpu_i9_vs_ryzen7.jpg',
      category: 'So sánh',
      views: 7420,
    },
    {
      title: 'Hướng dẫn chọn mua laptop sinh viên 2026: Đủ mỏng nhẹ, pin trâu và tối ưu ngân sách',
      slug: 'huong-dan-chon-laptop-sinh-vien-2026',
      excerpt: 'Tư vấn các mẫu laptop từ 12 đến 20 triệu trang bị vi xử lý thế hệ mới, RAM 16GB sẵn sàng cho mọi ngành học.',
      content: '<p>Đối với sinh viên khối kinh tế và công nghệ thông tin, màn hình IPS sắc nét và thời lượng pin trên 8 tiếng là hai tiêu chí quan trọng nhất khi chọn laptop.</p>',
      thumbnailUrl: '/assets/images/posts/laptop_sinh_vien_2026.jpg',
      category: 'Tư vấn',
      views: 8900,
    },
    {
      title: 'Tự build PC Workstation chạy mô hình AI DeepSeek R1 và LLM cục bộ tối ưu chi phí',
      slug: 'pc-workstation-deepseek-ai-local',
      excerpt: 'Lựa chọn dung lượng VRAM GPU, băng thông RAM DDR5 và cấu hình tản nhiệt duy trì hiệu suất train và inference AI 24/7.',
      content: '<p>Mô hình ngôn ngữ lớn nguồn mở như DeepSeek R1 và LLaMA 3 đòi hỏi bộ nhớ VRAM tối thiểu 16GB - 24GB để chạy quantization 4-bit mượt mà.</p>',
      thumbnailUrl: '/assets/images/posts/pc_workstation_ai_deepseek.jpg',
      category: 'AI & Copilot+',
      views: 9350,
    },
    {
      title: '10 mẹo tối ưu Windows 11 giúp tăng tốc máy tính và chơi game mượt hơn 2026',
      slug: '10-meo-toi-uu-windows-11-tang-toc-may-tinh-choi-game',
      excerpt: 'Bí quyết tinh chỉnh Game Mode, giải phóng RAM, tắt telemetry ngầm và tối ưu driver GPU để đạt FPS tối đa.',
      content: '<p>Bật Game Mode, cấu hình Hardware-Accelerated GPU Scheduling (HAGS) và tắt các ứng dụng khởi động cùng Windows sẽ giúp cải thiện 15-20% FPS tối thiểu.</p>',
      thumbnailUrl: '/assets/images/posts/windows11_gaming_opt.jpg',
      category: 'Thủ thuật',
      views: 6180,
    },
  ];

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  for (const post of newsList) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        category: post.category,
        views: post.views,
        isPublished: true,
        publishedAt: new Date(),
      },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        category: post.category,
        views: post.views,
        isPublished: true,
        publishedAt: new Date(),
        authorId: admin?.id,
      },
    });
  }
  console.log(`✅ Seeded ${newsList.length} distinct tech news articles.`);

  console.log('🎉 FULL IMPORT COMPLETED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('❌ Error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
