/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Default bcrypt hash for 'password123'
const DEFAULT_PASSWORD_HASH = '$2b$10$BJs.vgkcjsVinzK0KVxgjez/H7WwawZeD5.22AOQW7DuExInaU2xW';

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
  console.log('--- BẮT ĐẦU ĐỒNG BỘ 100% CƠ SỞ DỮ LIỆU TỪ TECHPILOT SANG NEXORA (BATCHED) ---');
  let sql = fs.readFileSync(path.join(__dirname, '../TechPilot/database/seed_dev.sql'), 'utf8');
  sql = sql.replace(/NOW\(\)/gi, "'2026-08-01 00:00:00'");

  // 1. Clear tables
  console.log('1. Làm sạch dữ liệu cũ...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  await prisma.$executeRawUnsafe('DELETE FROM `cart_items`;');
  await prisma.$executeRawUnsafe('DELETE FROM `carts`;');
  await prisma.$executeRawUnsafe('DELETE FROM `wishlists`;');
  await prisma.$executeRawUnsafe('DELETE FROM `reviews`;');
  await prisma.$executeRawUnsafe('DELETE FROM `order_items`;');
  await prisma.$executeRawUnsafe('DELETE FROM `return_requests`;');
  await prisma.$executeRawUnsafe('DELETE FROM `orders`;');
  await prisma.$executeRawUnsafe('DELETE FROM `inventory_logs`;');
  await prisma.$executeRawUnsafe('DELETE FROM `flash_sale_items`;');
  await prisma.$executeRawUnsafe('DELETE FROM `flash_sales`;');
  await prisma.$executeRawUnsafe('DELETE FROM `coupons`;');
  await prisma.$executeRawUnsafe('DELETE FROM `product_ai_chat_histories`;');
  await prisma.$executeRawUnsafe('DELETE FROM `product_images`;');
  await prisma.$executeRawUnsafe('DELETE FROM `products`;');
  await prisma.$executeRawUnsafe('DELETE FROM `categories`;');
  await prisma.$executeRawUnsafe('DELETE FROM `brands`;');
  await prisma.$executeRawUnsafe('DELETE FROM `banners`;');
  await prisma.$executeRawUnsafe('DELETE FROM `posts`;');
  await prisma.$executeRawUnsafe('DELETE FROM `notifications`;');
  await prisma.$executeRawUnsafe('DELETE FROM `customer_addresses`;');
  await prisma.$executeRawUnsafe('DELETE FROM `users`;');

  // 2. Insert Users
  console.log('2. Đang nạp Người dùng từ TechPilot & tài khoản kiểm thử Nexora...');
  const userVal = extractTableValues(sql, 'users');
  if (userVal) {
    const userRows = parseSqlTuples(userVal);
    for (const u of userRows) {
      const id = Number(u[0]);
      if (!id || !u[1]) continue;
      const fullName = u[1];
      const email = u[2];
      const phone = u[3] && u[3] !== 'NULL' ? u[3] : null;
      const role = u[5] === 'admin' ? 'ADMIN' : 'CUSTOMER';
      const status = u[7] === 'active' ? 'ACTIVE' : 'INACTIVE';

      await prisma.$executeRawUnsafe(
        'INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`, `role`, `status`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW());',
        id,
        fullName,
        email,
        phone,
        DEFAULT_PASSWORD_HASH,
        role,
        status
      );
    }
  }

  // Ensure Nexora testing accounts exist
  const nexoraAccounts = [
    { id: 991, email: 'admin@nexora.local', fullName: 'Quản Trị Viên Nexora', role: 'ADMIN', phone: '0901234567' },
    { id: 992, email: 'staff@nexora.local', fullName: 'Kỹ Thuật Viên Nexora', role: 'STAFF', phone: '0902345678' },
    { id: 993, email: 'customer@nexora.local', fullName: 'Nguyễn Văn An', role: 'CUSTOMER', phone: '0903456789' },
  ];

  for (const acc of nexoraAccounts) {
    await prisma.$executeRawUnsafe(
      'INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`, `role`, `status`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, "ACTIVE", NOW(), NOW()) ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `role` = VALUES(`role`);',
      acc.id,
      acc.fullName,
      acc.email,
      acc.phone,
      DEFAULT_PASSWORD_HASH,
      acc.role
    );
  }
  console.log('Đã nạp Users thành công.');

  // 3. Insert Customer Addresses
  console.log('3. Đang nạp Địa chỉ khách hàng...');
  const addrVal = extractTableValues(sql, 'user_addresses');
  if (addrVal) {
    const addrRows = parseSqlTuples(addrVal);
    for (const a of addrRows) {
      const id = Number(a[0]);
      if (!id) continue;
      const userId = Number(a[1]);
      const recipientName = a[2];
      const phone = a[3];
      const streetAddress = a[4];
      const ward = a[5] && a[5] !== 'NULL' ? a[5] : null;
      const district = a[6] && a[6] !== 'NULL' ? a[6] : null;
      const province = a[7] && a[7] !== 'NULL' && a[7] !== '' ? a[7] : 'TP. Hồ Chí Minh';
      const isDefault = a[8] === '1' ? 1 : 0;

      await prisma.$executeRawUnsafe(
        'INSERT INTO `customer_addresses` (`id`, `user_id`, `recipient_name`, `phone`, `street_address`, `ward`, `district`, `province`, `is_default`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());',
        id,
        userId,
        recipientName,
        phone,
        streetAddress,
        ward,
        district,
        province,
        isDefault
      );
    }
  }
  await prisma.$executeRawUnsafe(
    'INSERT INTO `customer_addresses` (`id`, `user_id`, `recipient_name`, `phone`, `street_address`, `ward`, `district`, `province`, `is_default`, `created_at`, `updated_at`) VALUES (999, 993, "Nguyễn Văn An", "0903456789", "123 Đường Nguyễn Huệ", "Phường Bến Nghé", "Quận 1", "TP. Hồ Chí Minh", 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE `recipient_name` = VALUES(`recipient_name`);'
  );
  console.log('Đã nạp Addresses thành công.');

  // 4. Insert Categories
  console.log('4. Đang nạp Categories chính thức từ TechPilot...');
  const catVal = extractTableValues(sql, 'categories');
  if (catVal) {
    const catRows = parseSqlTuples(catVal);
    for (const c of catRows) {
      const id = Number(c[0]);
      if (!id) continue;
      const parentId = c[1] && c[1] !== 'NULL' ? Number(c[1]) : null;
      const name = c[2];
      const slug = c[3];
      const icon = c[4] && c[4] !== 'NULL' ? c[4] : 'fa-solid fa-folder';
      const description = c[6] && c[6] !== 'NULL' ? c[6] : null;
      const sortOrder = id;

      await prisma.$executeRawUnsafe(
        'INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `icon`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW());',
        id,
        parentId,
        name,
        slug,
        icon,
        description,
        sortOrder
      );
    }
    console.log(`Đã nạp ${catRows.length} Categories.`);
  }

  // 5. Insert Brands
  console.log('5. Đang nạp Brands chính thức từ TechPilot...');
  const brandVal = extractTableValues(sql, 'brands');
  if (brandVal) {
    const brandRows = parseSqlTuples(brandVal);
    for (const b of brandRows) {
      const id = Number(b[0]);
      if (!id) continue;
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
    console.log(`Đã nạp ${brandRows.length} Brands.`);
  }

  // 6. Insert Products (Chunked by 100 for fast execution)
  console.log('6. Đang nạp 651 Sản phẩm chi tiết từ TechPilot (Batching)...');
  const prodVal = extractTableValues(sql, 'products');
  if (prodVal) {
    const prodRows = parseSqlTuples(prodVal);
    const chunkSize = 100;
    for (let i = 0; i < prodRows.length; i += chunkSize) {
      const chunk = prodRows.slice(i, i + chunkSize);
      const placeholders = [];
      const values = [];

      for (const p of chunk) {
        const id = Number(p[0]);
        if (!id) continue;
        const sku = p[1];
        const categoryId = Number(p[4]);
        const brandId = p[5] && p[5] !== 'NULL' ? Number(p[5]) : null;
        const name = p[6];
        const slug = p[7];
        const shortDescription = p[8] && p[8] !== 'NULL' ? p[8] : null;
        const description = p[9] && p[9] !== 'NULL' ? p[9] : null;
        const price = Number(p[10]) || 0;
        const salePrice = p[12] && p[12] !== 'NULL' ? Number(p[12]) : null;
        const stockQuantity = Number(p[17]) || 15;
        const thumbnailUrl = p[14] && p[14] !== 'NULL' ? (p[14].startsWith('/') ? p[14] : `/${p[14]}`) : null;

        let specs = null;
        if (p[19] && p[19] !== 'NULL') {
          try {
            let raw = p[19];
            while (raw.includes('\\"')) {
              raw = raw.replace(/\\"/g, '"');
            }
            const parsed = JSON.parse(raw);
            specs = JSON.stringify(parsed);
          } catch {
            specs = null;
          }
        }

        const isFeatured = (p[26] === '1' || p[28] === '1') ? 1 : 0;
        const isHot = p[27] === '1' ? 1 : 0;

        placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "ACTIVE", NOW(), NOW())');
        values.push(id, sku, categoryId, brandId, name, slug, shortDescription, description, price, salePrice, stockQuantity, thumbnailUrl, specs, isFeatured, isHot);
      }

      if (placeholders.length > 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`products\` (\`id\`, \`sku\`, \`category_id\`, \`brand_id\`, \`name\`, \`slug\`, \`short_description\`, \`description\`, \`price\`, \`sale_price\`, \`stock_quantity\`, \`thumbnail_url\`, \`specs\`, \`is_featured\`, \`is_hot\`, \`status\`, \`created_at\`, \`updated_at\`) VALUES ${placeholders.join(', ')};`,
          ...values
        );
      }
    }
    console.log(`Đã nạp toàn bộ ${prodRows.length} Sản phẩm.`);
  }

  // 7. Insert Product Images (Chunked by 200 for lightning speed)
  console.log('7. Đang nạp 2,604 Product Images từ TechPilot (Batching)...');
  const imgVal = extractTableValues(sql, 'product_images');
  if (imgVal) {
    const imgRows = parseSqlTuples(imgVal);
    const chunkSize = 200;
    for (let i = 0; i < imgRows.length; i += chunkSize) {
      const chunk = imgRows.slice(i, i + chunkSize);
      const placeholders = [];
      const values = [];

      for (const im of chunk) {
        const id = Number(im[0]);
        if (!id) continue;
        const productId = Number(im[1]);
        const rawUrl = im[2];
        const imageUrl = rawUrl ? (rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`) : '/assets/images/products/placeholder.png';
        const altText = im[3] && im[3] !== 'NULL' ? im[3] : null;
        const sortOrder = Number(im[4]) || 0;

        placeholders.push('(?, ?, ?, ?, ?, NOW())');
        values.push(id, productId, imageUrl, altText, sortOrder);
      }

      if (placeholders.length > 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`product_images\` (\`id\`, \`product_id\`, \`image_url\`, \`alt_text\`, \`sort_order\`, \`created_at\`) VALUES ${placeholders.join(', ')};`,
          ...values
        );
      }
    }
    console.log(`Đã nạp ${imgRows.length} Product Images.`);
  }

  // 8. Insert Coupons
  console.log('8. Đang nạp Coupons từ TechPilot...');
  const couponVal = extractTableValues(sql, 'coupons');
  if (couponVal) {
    const couponRows = parseSqlTuples(couponVal);
    for (const cp of couponRows) {
      const id = Number(cp[0]);
      if (!id) continue;
      const code = cp[1];
      const discountVal = Number(cp[2]) || 0;
      const discountType = cp[3] === 'percent' ? 'PERCENTAGE' : 'FIXED';
      const maxDiscount = cp[4] && cp[4] !== 'NULL' ? Number(cp[4]) : null;
      const minOrderVal = code === 'TECHPILOT100' ? 500000 : (cp[5] && cp[5] !== 'NULL' ? Number(cp[5]) : 0);
      const usageLimit = cp[6] && cp[6] !== 'NULL' ? Number(cp[6]) : null;
      const usageCount = Number(cp[8]) || 0;
      const startsAt = cp[9] && cp[9] !== 'NULL' ? new Date(cp[9]) : new Date('2026-01-01 00:00:00');
      const expiresAt = new Date('2027-12-31 23:59:59');
      const description = cp[11] && cp[11] !== 'NULL' ? cp[11] : `Mã giảm giá ${code}`;
      const isActive = cp[12] === 'active' ? 1 : 0;

      await prisma.$executeRawUnsafe(
        'INSERT INTO `coupons` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_value`, `max_discount`, `usage_limit`, `usage_count`, `starts_at`, `expires_at`, `is_active`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());',
        id,
        code,
        description,
        discountType,
        discountVal,
        minOrderVal,
        maxDiscount,
        usageLimit,
        usageCount,
        startsAt,
        expiresAt,
        isActive
      );
    }
    console.log(`Đã nạp ${couponRows.length} Coupons.`);
  }

  // 9. Insert Flash Sales & Items
  console.log('9. Đang nạp Flash Sales từ TechPilot...');
  const fsVal = extractTableValues(sql, 'flash_sales');
  if (fsVal) {
    const fsRows = parseSqlTuples(fsVal);
    for (const fsItem of fsRows) {
      const id = Number(fsItem[0]);
      if (!id) continue;
      const name = fsItem[1];
      const startTime = fsItem[3] && fsItem[3] !== 'NULL' ? new Date(fsItem[3]) : new Date();
      const endTime = fsItem[4] && fsItem[4] !== 'NULL' ? new Date(fsItem[4]) : new Date(Date.now() + 30 * 86400000);
      const isActive = fsItem[5] === 'active' ? 1 : 0;

      await prisma.$executeRawUnsafe(
        'INSERT INTO `flash_sales` (`id`, `name`, `start_time`, `end_time`, `is_active`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, NOW(), NOW());',
        id,
        name,
        startTime,
        endTime,
        isActive
      );
    }
    console.log(`Đã nạp ${fsRows.length} Flash Sales.`);
  }

  const fsiVal = extractTableValues(sql, 'flash_sale_items');
  if (fsiVal) {
    const fsiRows = parseSqlTuples(fsiVal);
    for (const it of fsiRows) {
      const id = Number(it[0]);
      if (!id) continue;
      const flashSaleId = Number(it[1]);
      const productId = Number(it[2]);
      const price = Number(it[3]) || 0;
      const quantityLimit = Number(it[4]) || 10;
      const quantitySold = Number(it[5]) || 0;
      const sortOrder = Number(it[6]) || 0;

      await prisma.$executeRawUnsafe(
        'INSERT INTO `flash_sale_items` (`id`, `flash_sale_id`, `product_id`, `flash_sale_price`, `quantity_limit`, `quantity_sold`, `sort_order`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, NOW());',
        id,
        flashSaleId,
        productId,
        price,
        quantityLimit,
        quantitySold,
        sortOrder
      );
    }
    console.log(`Đã nạp ${fsiRows.length} Flash Sale Items.`);
  }

  // 10. Insert Banners
  console.log('10. Đang nạp Banners từ TechPilot...');
  const bannerVal = extractTableValues(sql, 'banners');
  if (bannerVal) {
    const bannerRows = parseSqlTuples(bannerVal);
    for (const bn of bannerRows) {
      const id = Number(bn[0]);
      if (!id) continue;
      const title = bn[1];
      const rawImg = bn[2];
      const imageUrl = rawImg ? (rawImg.startsWith('/') ? rawImg : `/assets/images/banners/${rawImg}`) : '/assets/images/banners/placeholder.png';
      const linkUrl = bn[3] && bn[3] !== 'NULL' ? bn[3] : '#';
      const placement = bn[4] && bn[4] !== 'NULL' ? bn[4] : 'hero';
      const sortOrder = Number(bn[5]) || 1;
      const isActive = bn[6] === 'active' ? 1 : 0;

      await prisma.$executeRawUnsafe(
        'INSERT INTO `banners` (`id`, `title`, `image_url`, `link_url`, `placement`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW());',
        id,
        title,
        imageUrl,
        linkUrl,
        placement,
        sortOrder,
        isActive
      );
    }

    // Nạp thêm Banner RTX 50 (ID 5) phục vụ Hero Showcase & Storefront Integration Test
    await prisma.$executeRawUnsafe(
      'INSERT INTO `banners` (`id`, `title`, `image_url`, `link_url`, `placement`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `placement` = VALUES(`placement`);',
      5,
      'GeForce RTX 50 Series: Kiến trúc Blackwell & DLSS 4',
      '/assets/images/banners/rtx50-banner.jpg',
      '/product/detail/asus-rog-strix-rtx5090',
      'hero',
      5,
      1
    );

    console.log(`Đã nạp ${bannerRows.length + 1} Banners.`);
  }

  // 11. Insert Posts
  console.log('11. Đang nạp Bài viết tin tức từ TechPilot...');
  const postVal = extractTableValues(sql, 'posts');
  if (postVal) {
    const postRows = parseSqlTuples(postVal);
    for (const po of postRows) {
      const id = Number(po[0]);
      if (!id) continue;
      const title = po[3];
      const slug = po[4];
      const excerpt = po[5] && po[5] !== 'NULL' ? po[5] : null;
      const content = po[6] && po[6] !== 'NULL' ? po[6] : '';
      const rawImg = po[7] && po[7] !== 'NULL' ? po[7] : null;
      const thumbnailUrl = rawImg ? (rawImg.startsWith('/') ? rawImg : `/assets/images/posts/${rawImg}`) : null;
      const category = po[9] && po[9] !== 'NULL' ? po[9] : 'Tin tức';
      const views = Number(po[8]) || 0;

      await prisma.$executeRawUnsafe(
        'INSERT INTO `posts` (`id`, `title`, `slug`, `excerpt`, `content`, `thumbnail_url`, `category`, `views`, `is_published`, `published_at`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW());',
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
    console.log(`Đã nạp ${postRows.length} Bài viết.`);
  }

  // 12. Insert Reviews
  console.log('12. Đang nạp Reviews từ TechPilot...');
  const revVal = extractTableValues(sql, 'reviews');
  if (revVal) {
    const revRows = parseSqlTuples(revVal);
    for (const r of revRows) {
      const id = Number(r[0]);
      if (!id) continue;
      const productId = Number(r[1]);
      const userId = r[2] && r[2] !== 'NULL' ? Number(r[2]) : 2;
      const rating = Math.round(Number(r[4])) || 5;
      const comment = r[5] && r[5] !== 'NULL' ? r[5] : '';

      await prisma.$executeRawUnsafe(
        'INSERT INTO `reviews` (`id`, `product_id`, `user_id`, `rating`, `comment`, `created_at`) VALUES (?, ?, ?, ?, ?, NOW());',
        id,
        productId,
        userId,
        rating,
        comment
      );
    }
    console.log(`Đã nạp ${revRows.length} Reviews.`);
  }

  // 13. Insert Orders & Order Items
  console.log('13. Đang nạp Orders & Order Items từ TechPilot...');
  const orderVal = extractTableValues(sql, 'orders');
  if (orderVal) {
    const orderRows = parseSqlTuples(orderVal);
    for (const o of orderRows) {
      const id = Number(o[0]);
      if (!id) continue;
      const orderCode = o[1];
      const userId = o[2] && o[2] !== 'NULL' ? Number(o[2]) : 2;
      const customerName = o[4] || 'Khách hàng TechPilot';
      const customerPhone = o[5] || '0900000000';
      const customerEmail = o[6] && o[6] !== 'NULL' ? o[6] : 'customer@techpilot.vn';
      const shippingAddress = o[7] || 'Địa chỉ khách hàng';
      const customerNotes = o[8] && o[8] !== 'NULL' ? o[8] : null;
      const paymentMethod = o[9] === 'VNPAY' ? 'VNPAY' : o[9] === 'VIETQR' ? 'VIETQR' : o[9] === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'COD';

      let paymentStatus = 'PENDING';
      if (o[10] === 'paid') paymentStatus = 'PAID';
      else if (o[10] === 'failed') paymentStatus = 'FAILED';
      else if (o[10] === 'refunded') paymentStatus = 'REFUNDED';

      let orderStatus = 'PENDING';
      if (o[17] === 'completed') orderStatus = 'DELIVERED';
      else if (o[17] === 'confirmed') orderStatus = 'CONFIRMED';
      else if (o[17] === 'processing') orderStatus = 'PROCESSING';
      else if (o[17] === 'shipping') orderStatus = 'SHIPPING';
      else if (o[17] === 'cancelled') orderStatus = 'CANCELLED';

      const shippingFee = Number(o[13]) || 0;
      const subtotal = Number(o[14]) || 0;
      const discountAmount = Number(o[15]) || 0;
      const totalAmount = Number(o[16]) || 0;
      const carrierName = o[11] && o[11] !== 'NULL' ? o[11] : null;
      const trackingNumber = o[12] && o[12] !== 'NULL' ? o[12] : null;

      await prisma.$executeRawUnsafe(
        'INSERT INTO `orders` (`id`, `order_code`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address`, `customer_notes`, `subtotal`, `shipping_fee`, `discount_amount`, `total_amount`, `payment_method`, `payment_status`, `order_status`, `carrier_name`, `tracking_number`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());',
        id,
        orderCode,
        userId,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        customerNotes,
        subtotal,
        shippingFee,
        discountAmount,
        totalAmount,
        paymentMethod,
        paymentStatus,
        orderStatus,
        carrierName,
        trackingNumber
      );
    }
    console.log(`Đã nạp ${orderRows.length} Orders.`);
  }

  const oiVal = extractTableValues(sql, 'order_items');
  if (oiVal) {
    const oiRows = parseSqlTuples(oiVal);
    const chunkSize = 200;
    for (let i = 0; i < oiRows.length; i += chunkSize) {
      const chunk = oiRows.slice(i, i + chunkSize);
      const placeholders = [];
      const values = [];

      for (const oi of chunk) {
        const id = Number(oi[0]);
        if (!id) continue;
        const orderId = Number(oi[1]);
        const productId = oi[2] && oi[2] !== 'NULL' ? Number(oi[2]) : null;
        const productName = oi[3];
        const unitPrice = Number(oi[4]) || 0;
        const quantity = Number(oi[5]) || 1;
        const subtotal = Number(oi[6]) || unitPrice * quantity;
        const productSku = `TP-PROD-${productId || id}`;

        placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, NOW())');
        values.push(id, orderId, productId, productName, productSku, unitPrice, quantity, subtotal);
      }

      if (placeholders.length > 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`order_items\` (\`id\`, \`order_id\`, \`product_id\`, \`product_name\`, \`product_sku\`, \`unit_price\`, \`quantity\`, \`subtotal\`, \`created_at\`) VALUES ${placeholders.join(', ')};`,
          ...values
        );
      }
    }
    console.log(`Đã nạp ${oiRows.length} Order Items.`);
  }

  // 14. Insert Inventory Logs
  console.log('14. Đang nạp Inventory Logs từ TechPilot (Batching)...');
  const invVal = extractTableValues(sql, 'inventory_logs');
  if (invVal) {
    const invRows = parseSqlTuples(invVal);
    const chunkSize = 200;
    for (let i = 0; i < invRows.length; i += chunkSize) {
      const chunk = invRows.slice(i, i + chunkSize);
      const placeholders = [];
      const values = [];

      for (const iv of chunk) {
        const id = Number(iv[0]);
        if (!id) continue;
        const productId = Number(iv[1]);
        const action = iv[3];
        let changeType = 'ADJUSTMENT';
        if (action === 'manual_import') changeType = 'IMPORT';
        else if (action === 'order_release') changeType = 'RETURN';
        else if (action === 'sale') changeType = 'SALE';

        const quantity = Number(iv[4]) || 0;
        const balanceBefore = Number(iv[5]) || 0;
        const balanceAfter = Number(iv[6]) || 0;
        const note = iv[8] && iv[8] !== 'NULL' ? iv[8] : null;
        const refType = iv[9] && iv[9] !== 'NULL' ? iv[9] : null;
        const refId = iv[10] && iv[10] !== 'NULL' ? iv[10] : null;
        const actorId = iv[11] && iv[11] !== 'NULL' ? Number(iv[11]) : 1;

        placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
        values.push(id, productId, changeType, quantity, balanceBefore, balanceAfter, refType, refId, note, actorId);
      }

      if (placeholders.length > 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`inventory_logs\` (\`id\`, \`product_id\`, \`change_type\`, \`quantity\`, \`balance_before\`, \`balance_after\`, \`reference_type\`, \`reference_id\`, \`note\`, \`actor_id\`, \`created_at\`) VALUES ${placeholders.join(', ')};`,
          ...values
        );
      }
    }
    console.log(`Đã nạp ${invRows.length} Inventory Logs.`);
  }

  // 15. Insert Notifications
  console.log('15. Đang nạp Notifications từ TechPilot...');
  const notifVal = extractTableValues(sql, 'notifications');
  if (notifVal) {
    const notifRows = parseSqlTuples(notifVal);
    for (const nf of notifRows) {
      const id = Number(nf[0]);
      if (!id) continue;
      const userId = Number(nf[1]);
      const title = nf[2];
      const message = nf[3];
      const isRead = nf[4] === '1';

      await prisma.$executeRawUnsafe(
        'INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (?, ?, ?, ?, "SYSTEM", ?, NOW());',
        id,
        userId,
        title,
        message,
        isRead ? 1 : 0
      );
    }
    console.log(`Đã nạp ${notifRows.length} Notifications.`);
  }

  // 16. Insert Wishlists
  console.log('16. Đang nạp Wishlists từ TechPilot...');
  const wishVal = extractTableValues(sql, 'wishlists');
  if (wishVal) {
    const wishRows = parseSqlTuples(wishVal);
    for (const w of wishRows) {
      const id = Number(w[0]);
      if (!id) continue;
      const userId = Number(w[1]);
      const productId = Number(w[2]);

      await prisma.$executeRawUnsafe(
        'INSERT INTO `wishlists` (`id`, `user_id`, `product_id`, `created_at`) VALUES (?, ?, ?, NOW());',
        id,
        userId,
        productId
      );
    }
    console.log(`Đã nạp ${wishRows.length} Wishlists.`);
  }

  // 17. Seed Store Settings
  console.log('17. Thiết lập Store Settings...');
  const defaultSettings = [
    { key: 'store.name', val: 'Nexora Tech Store', desc: 'Cửa hàng công nghệ TechPilot / Nexora' },
    { key: 'store.business_model', val: 'single-vendor', desc: 'Mô hình đơn cửa hàng (Single-Vendor)' },
    { key: 'store.currency', val: 'VND', desc: 'Đơn vị tiền tệ' },
    { key: 'store.hotline', val: '1800 2097', desc: 'Hotline bán hàng' },
    { key: 'store.support_email', val: 'support@techpilot.io.vn', desc: 'Email hỗ trợ kỹ thuật' },
  ];

  for (const s of defaultSettings) {
    await prisma.$executeRawUnsafe(
      'INSERT INTO `store_settings` (`setting_key`, `setting_value`, `description`, `updated_at`) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);',
      s.key,
      s.val,
      s.desc
    );
  }

  // 18. Ensure customer cart fixture
  console.log('18. Khởi tạo Giỏ hàng mẫu...');
  await prisma.$executeRawUnsafe('INSERT INTO `carts` (`id`, `user_id`, `created_at`, `updated_at`) VALUES (1, 993, NOW(), NOW()) ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`);');
  await prisma.$executeRawUnsafe('INSERT INTO `cart_items` (`id`, `cart_id`, `product_id`, `quantity`, `created_at`, `updated_at`) VALUES (1, 1, 1, 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE `quantity` = VALUES(`quantity`);');

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('=== HOÀN TẤT ĐỒNG BỘ 100% TOÀN BỘ CƠ SỞ DỮ LIỆU TECHPILOT VÀO NEXORA THÀNH CÔNG ===');
}

seedFull()
  .catch((e) => {
    console.error('Lỗi nạp seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
