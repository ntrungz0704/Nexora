/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function extractTableValues(sql, tableName) {
  const marker = 'INSERT INTO `' + tableName + '` VALUES';
  const startIdx = sql.indexOf(marker);
  if (startIdx === -1) return null;
  const valIdx = startIdx + marker.length;
  let inString = false;
  let escape = false;
  let endIdx = -1;
  for (let i = valIdx; i < sql.length; i++) {
    const ch = sql[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === "'") {
      inString = !inString;
      continue;
    }
    if (!inString && ch === ';') {
      endIdx = i;
      break;
    }
  }
  return sql.slice(valIdx, endIdx);
}

function parseSqlTuples(sqlValuesString) {
  const rows = [];
  let inString = false;
  let escape = false;
  let currentVal = '';
  let currentRow = [];
  let inTuple = false;

  for (let i = 0; i < sqlValuesString.length; i++) {
    const ch = sqlValuesString[i];

    if (!inTuple) {
      if (ch === '(') {
        inTuple = true;
        currentRow = [];
        currentVal = '';
        inString = false;
        escape = false;
      }
      continue;
    }

    if (escape) {
      currentVal += ch;
      escape = false;
      continue;
    }

    if (ch === '\\') {
      escape = true;
      continue;
    }

    if (ch === "'") {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (ch === ',') {
        const v = currentVal.trim();
        currentRow.push(v === 'NULL' ? null : v);
        currentVal = '';
        continue;
      }
      if (ch === ')') {
        const v = currentVal.trim();
        currentRow.push(v === 'NULL' ? null : v);
        rows.push(currentRow);
        inTuple = false;
        currentRow = [];
        currentVal = '';
        continue;
      }
    }

    currentVal += ch;
  }

  return rows;
}

async function seedFull() {
  console.log('--- BẮT ĐẦU ĐỒNG BỘ 100% CƠ SỞ DỮ LIỆU TỪ TECHPILOT SANG NEXORA ---');
  const sql = fs.readFileSync(path.join(__dirname, '../TechPilot/database/seed_dev.sql'), 'utf8');

  // 1. Clear child tables referencing products
  console.log('1. Xóa các bảng phụ thuộc...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `cart_items`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `wishlists`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `reviews`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `order_items`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `inventory_logs`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `flash_sale_items`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `product_ai_chat_histories`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `product_images`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `products`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `categories`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `brands`;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE `posts`;');

  // 2. Insert Categories
  console.log('2. Đang nạp 21 Categories chính thức từ TechPilot...');
  const catVal = extractTableValues(sql, 'categories');
  const catRows = parseSqlTuples(catVal);

  for (const c of catRows) {
    const id = Number(c[0]);
    const parentId = c[1] && c[1] !== 'NULL' ? Number(c[1]) : null;
    const name = c[2];
    const slug = c[3];
    const icon = c[4] && c[4] !== 'NULL' ? c[4] : 'fa-solid fa-folder';
    const description = c[6] && c[6] !== 'NULL' ? c[6] : null;
    const sortOrder = id;
    const isActive = 1;

    await prisma.$executeRawUnsafe(
      'INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `icon`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());',
      id,
      parentId,
      name,
      slug,
      icon,
      description,
      sortOrder,
      isActive
    );
  }
  console.log(`Đã nạp thành công ${catRows.length} Categories.`);

  // 3. Insert Brands
  console.log('3. Đang nạp 30 Brands chính thức từ TechPilot...');
  const brandVal = extractTableValues(sql, 'brands');
  const brandRows = parseSqlTuples(brandVal);

  for (const b of brandRows) {
    const id = Number(b[0]);
    const name = b[1];
    const slug = b[2];
    const logoUrl = b[3] && b[3] !== 'NULL' ? b[3] : null;
    const description = b[4] && b[4] !== 'NULL' ? b[4] : null;
    const isActive = b[5] === 'active' ? 1 : 0;

    await prisma.$executeRawUnsafe(
      'INSERT INTO `brands` (`id`, `name`, `slug`, `logo_url`, `description`, `is_active`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW());',
      id,
      name,
      slug,
      logoUrl,
      description,
      isActive
    );
  }
  console.log(`Đã nạp thành công ${brandRows.length} Brands.`);

  // 4. Insert Products
  console.log('4. Đang nạp 651 Sản phẩm chi tiết từ TechPilot...');
  const prodVal = extractTableValues(sql, 'products');
  const prodRows = parseSqlTuples(prodVal);

  const brandIds = new Set(brandRows.map((b) => Number(b[0])));
  const catIds = new Set(catRows.map((c) => Number(c[0])));

  let count = 0;
  for (const p of prodRows) {
    const id = Number(p[0]);
    const sku = p[1];
    const categoryId = Number(p[4]);
    const brandId = p[5] && brandIds.has(Number(p[5])) ? Number(p[5]) : null;
    const name = p[6];
    const slug = p[7];
    const shortDescription = p[8] && p[8] !== 'NULL' ? p[8] : null;
    const description = p[9] && p[9] !== 'NULL' ? p[9] : null;
    const price = Number(p[10]) || 0;
    const salePrice = p[12] && p[12] !== 'NULL' ? Number(p[12]) : null;
    const stockQuantity = Number(p[17]) || 10;
    const thumbnailUrl = p[14] && p[14] !== 'NULL' ? (p[14].startsWith('/') ? p[14] : `/${p[14]}`) : null;

    let specs = null;
    if (p[19] && p[19] !== 'NULL') {
      try {
        JSON.parse(p[19]);
        specs = p[19];
      } catch {
        specs = null;
      }
    }

    const isFeatured = (p[26] === '1' || p[28] === '1') ? 1 : 0;
    const isHot = p[27] === '1' ? 1 : 0;

    if (!catIds.has(categoryId)) {
      continue;
    }

    await prisma.$executeRawUnsafe(
      'INSERT INTO `products` (`id`, `sku`, `category_id`, `brand_id`, `name`, `slug`, `short_description`, `description`, `price`, `sale_price`, `stock_quantity`, `thumbnail_url`, `specs`, `is_featured`, `is_hot`, `status`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "ACTIVE", NOW(), NOW());',
      id,
      sku,
      categoryId,
      brandId,
      name,
      slug,
      shortDescription,
      description,
      price,
      salePrice,
      stockQuantity,
      thumbnailUrl,
      specs,
      isFeatured,
      isHot
    );

    count++;
    if (count % 100 === 0) {
      console.log(`Đã nạp ${count}/${prodRows.length} sản phẩm...`);
    }
  }
  console.log(`Đã nạp thành công ${count} Sản phẩm vào cơ sở dữ liệu.`);

  // 5. Insert Posts
  console.log('5. Đang nạp Bài viết tin tức từ TechPilot...');
  const postVal = extractTableValues(sql, 'posts');
  if (postVal) {
    const postRows = parseSqlTuples(postVal);
    for (const po of postRows) {
      const id = Number(po[0]);
      const title = po[3];
      const slug = po[4];
      const excerpt = po[5] && po[5] !== 'NULL' ? po[5] : null;
      const content = po[6] && po[6] !== 'NULL' ? po[6] : '';
      const rawImg = po[7] && po[7] !== 'NULL' ? po[7] : null;
      const thumbnailUrl = rawImg ? (rawImg.startsWith('/') ? rawImg : `/assets/images/posts/${rawImg}`) : null;
      const category = po[9] && po[9] !== 'NULL' ? po[9] : 'Tin tức';
      const views = Number(po[8]) || 0;

      await prisma.$executeRawUnsafe(
        'INSERT INTO `posts` (`id`, `title`, `slug`, `excerpt`, `content`, `thumbnail_url`, `category`, `views`, `is_published`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW());',
        id,
        title,
        slug,
        excerpt,
        content,
        thumbnailUrl,
        category,
        views
      );
    }
    console.log(`Đã nạp thành công ${postRows.length} Bài viết tin tức.`);
  }

  // 6. Ensure customer cart fixture for testing
  console.log('6. Tạo dữ liệu mẫu giỏ hàng cho khách hàng...');
  const customer = await prisma.user.findFirst({ where: { email: 'customer@nexora.local' } });
  if (customer) {
    let cart = await prisma.cart.findUnique({ where: { userId: customer.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: customer.id } });
    }
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: 1,
        quantity: 1,
      },
    });
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('--- HOÀN TẤT ĐỒNG BỘ 100% CƠ SỞ DỮ LIỆU TECHPILOT CHO NEXORA ---');
}

seedFull()
  .catch((e) => {
    console.error('Lỗi nạp seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
