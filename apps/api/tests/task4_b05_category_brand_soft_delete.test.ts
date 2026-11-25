import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';

const prisma = new PrismaClient();

describe('TASK 4 (B-05): Category & Brand Soft Delete, Descendant Cascade & Historical Preservation', () => {
  let app: Express;
  let adminToken: string;
  let customerToken: string;
  let customerId: number;

  let emptyCatId: number;
  let parentCatId: number;
  let childCatId: number;
  let grandchildCatId: number;
  let catWithProdsId: number;

  let emptyBrandId: number;
  let brandWithProdsId: number;
  let activeBrandForCatTestId: number;

  let catActiveProdId: number;
  let catActiveProdSlug: string;
  let catInactiveProdId: number;

  let brandActiveProdId: number;
  let brandActiveProdSlug: string;
  let brandInactiveProdId: number;

  let historicalOrderId: bigint;
  let historicalOrderCode: string;
  let historicalOrderItemId: bigint;
  let historicalReturnId: number | null = null;

  const createdUserIds: number[] = [];
  const createdCategoryIds: number[] = [];
  const createdBrandIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdGuestSessions: string[] = [];

  beforeAll(async () => {
    app = createApp({
      rateLimitOverrides: {
        globalApi: { limit: 500 },
        commerceWrite: { limit: 200 },
        orderLookup: { limit: 200 },
      },
    });
    const env = getEnv();
    const ts = Date.now();
    const pw = await bcrypt.hash('Password123!', 10);

    const admin = await prisma.user.create({
      data: {
        email: `t4-admin-${ts}@nexora.local`,
        fullName: 'Task4 Admin',
        passwordHash: pw,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    createdUserIds.push(admin.id);
    adminToken = jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role },
      env.AUTH_SECRET,
      {
        expiresIn: '1h',
      },
    );

    const customer = await prisma.user.create({
      data: {
        email: `t4-cust-${ts}@nexora.local`,
        fullName: 'Task4 Customer',
        phone: '0922333444',
        passwordHash: pw,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customerId = customer.id;
    createdUserIds.push(customer.id);
    customerToken = jwt.sign(
      { sub: customer.id, email: customer.email, role: customer.role },
      env.AUTH_SECRET,
      { expiresIn: '1h' },
    );

    // Categories: empty + multi-level hierarchy + category with products
    emptyCatId = (
      await prisma.category.create({
        data: { name: `T4 Empty Cat ${ts}`, slug: `t4-empty-cat-${ts}`, isActive: true },
      })
    ).id;
    createdCategoryIds.push(emptyCatId);

    parentCatId = (
      await prisma.category.create({
        data: { name: `T4 Parent Cat ${ts}`, slug: `t4-parent-cat-${ts}`, isActive: true },
      })
    ).id;
    createdCategoryIds.push(parentCatId);

    childCatId = (
      await prisma.category.create({
        data: {
          parentId: parentCatId,
          name: `T4 Child Cat ${ts}`,
          slug: `t4-child-cat-${ts}`,
          isActive: true,
        },
      })
    ).id;
    createdCategoryIds.push(childCatId);

    grandchildCatId = (
      await prisma.category.create({
        data: {
          parentId: childCatId,
          name: `T4 Grandchild Cat ${ts}`,
          slug: `t4-grandchild-cat-${ts}`,
          isActive: true,
        },
      })
    ).id;
    createdCategoryIds.push(grandchildCatId);

    catWithProdsId = (
      await prisma.category.create({
        data: { name: `T4 Prods Cat ${ts}`, slug: `t4-prods-cat-${ts}`, isActive: true },
      })
    ).id;
    createdCategoryIds.push(catWithProdsId);

    // Brands: empty + brandWithProds + active helper brand
    emptyBrandId = (
      await prisma.brand.create({
        data: { name: `T4 Empty Brand ${ts}`, slug: `t4-empty-brand-${ts}`, isActive: true },
      })
    ).id;
    createdBrandIds.push(emptyBrandId);

    brandWithProdsId = (
      await prisma.brand.create({
        data: { name: `T4 Prods Brand ${ts}`, slug: `t4-prods-brand-${ts}`, isActive: true },
      })
    ).id;
    createdBrandIds.push(brandWithProdsId);

    activeBrandForCatTestId = (
      await prisma.brand.create({
        data: { name: `T4 Helper Brand ${ts}`, slug: `t4-helper-brand-${ts}`, isActive: true },
      })
    ).id;
    createdBrandIds.push(activeBrandForCatTestId);

    // Products under catWithProdsId
    catActiveProdSlug = `t4-cat-act-${ts}`;
    catActiveProdId = (
      await prisma.product.create({
        data: {
          categoryId: catWithProdsId,
          brandId: activeBrandForCatTestId,
          name: `T4 Cat Active Prod ${ts}`,
          slug: catActiveProdSlug,
          sku: `T4-CA-${ts}`,
          price: 2500000,
          stockQuantity: 10,
          status: 'ACTIVE',
        },
      })
    ).id;
    createdProductIds.push(catActiveProdId);

    catInactiveProdId = (
      await prisma.product.create({
        data: {
          categoryId: catWithProdsId,
          brandId: activeBrandForCatTestId,
          name: `T4 Cat Originally Inactive Prod ${ts}`,
          slug: `t4-cat-inact-${ts}`,
          sku: `T4-CI-${ts}`,
          price: 1500000,
          stockQuantity: 10,
          status: 'INACTIVE',
        },
      })
    ).id;
    createdProductIds.push(catInactiveProdId);

    // Products under brandWithProdsId (category remains active)
    brandActiveProdSlug = `t4-brd-act-${ts}`;
    brandActiveProdId = (
      await prisma.product.create({
        data: {
          categoryId: emptyCatId, // We keep a separate active category below if needed — let's use helper active category!
          brandId: brandWithProdsId,
          name: `T4 Brand Active Prod ${ts}`,
          slug: brandActiveProdSlug,
          sku: `T4-BA-${ts}`,
          price: 3500000,
          stockQuantity: 12,
          status: 'ACTIVE',
        },
      })
    ).id;
    createdProductIds.push(brandActiveProdId);

    const activeHelperCat = await prisma.category.create({
      data: { name: `T4 Brand Helper Cat ${ts}`, slug: `t4-brd-helper-cat-${ts}`, isActive: true },
    });
    createdCategoryIds.push(activeHelperCat.id);
    await prisma.product.update({
      where: { id: brandActiveProdId },
      data: { categoryId: activeHelperCat.id },
    });

    brandInactiveProdId = (
      await prisma.product.create({
        data: {
          categoryId: activeHelperCat.id,
          brandId: brandWithProdsId,
          name: `T4 Brand Originally Inactive Prod ${ts}`,
          slug: `t4-brd-inact-${ts}`,
          sku: `T4-BI-${ts}`,
          price: 2200000,
          stockQuantity: 8,
          status: 'INACTIVE',
        },
      })
    ).id;
    createdProductIds.push(brandInactiveProdId);

    // Also place a product in grandchildCatId to prove category status hides tree cleanly without mutating Product.status
    const grandProd = await prisma.product.create({
      data: {
        categoryId: grandchildCatId,
        brandId: activeBrandForCatTestId,
        name: `T4 Grandchild Tree Prod ${ts}`,
        slug: `t4-grand-prod-${ts}`,
        sku: `T4-GP-${ts}`,
        price: 1900000,
        stockQuantity: 6,
        status: 'ACTIVE',
      },
    });
    createdProductIds.push(grandProd.id);

    // Historical DELIVERED order containing catActiveProdId + brandActiveProdId BEFORE soft delete
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    historicalOrderCode = `NX-T4HIST-${ts}`;
    const order = await prisma.order.create({
      data: {
        orderCode: historicalOrderCode,
        userId: customerId,
        customerName: 'Task4 Customer',
        customerEmail: customer.email,
        customerPhone: '0922333444',
        shippingAddress: '789 Pasteur, Q3, TP.HCM',
        subtotal: 6000000,
        totalAmount: 6000000,
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        paidAt: twoDaysAgo,
        deliveredAt: twoDaysAgo,
      },
    });
    historicalOrderId = order.id;

    const oi1 = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: catActiveProdId,
        productName: `T4 Cat Active Prod ${ts}`,
        productSku: `T4-CA-${ts}`,
        unitPrice: 2500000,
        quantity: 1,
        subtotal: 2500000,
      },
    });
    historicalOrderItemId = oi1.id;

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: brandActiveProdId,
        productName: `T4 Brand Active Prod ${ts}`,
        productSku: `T4-BA-${ts}`,
        unitPrice: 3500000,
        quantity: 1,
        subtotal: 3500000,
      },
    });
  });

  afterAll(async () => {
    try {
      if (historicalReturnId) {
        await prisma.returnAuditLog.deleteMany({ where: { returnRequestId: historicalReturnId } });
        await prisma.returnItem.deleteMany({ where: { returnRequestId: historicalReturnId } });
        await prisma.returnRequest.deleteMany({ where: { id: historicalReturnId } });
      }
      if (historicalOrderId) {
        await prisma.orderItem.deleteMany({ where: { orderId: historicalOrderId } });
        await prisma.order.deleteMany({ where: { id: historicalOrderId } });
      }
      if (createdGuestSessions.length > 0) {
        await prisma.cartItem.deleteMany({
          where: { cart: { guestSessionId: { in: createdGuestSessions } } },
        });
        await prisma.cart.deleteMany({ where: { guestSessionId: { in: createdGuestSessions } } });
      }
      if (createdProductIds.length > 0) {
        await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
      }
      // Delete categories deepest first
      for (const cid of [grandchildCatId, childCatId, parentCatId, emptyCatId, catWithProdsId]) {
        await prisma.category.deleteMany({ where: { id: cid } });
      }
      if (createdCategoryIds.length > 0) {
        await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
      }
      if (createdBrandIds.length > 0) {
        await prisma.brand.deleteMany({ where: { id: { in: createdBrandIds } } });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it('Cases 1-4: Category soft delete preserves empty/populated rows and multi-level hierarchy, cascades isActive=false downwards, and preserves Product statuses', async () => {
    // Authorization guard: Customer cannot delete categories or brands -> 403
    const custCatDel = await request(app)
      .delete(`/api/v1/admin/categories/${emptyCatId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(custCatDel.status).toBe(403);

    const custBrandDel = await request(app)
      .delete(`/api/v1/admin/brands/${emptyBrandId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(custBrandDel.status).toBe(403);

    // 1. Delete empty category -> row retained, isActive = false
    const delEmpty = await request(app)
      .delete(`/api/v1/admin/categories/${emptyCatId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delEmpty.status).toBe(200);
    expect(delEmpty.body.success).toBe(true);
    const dbEmptyCat = await prisma.category.findUnique({ where: { id: emptyCatId } });
    expect(dbEmptyCat).not.toBeNull();
    expect(dbEmptyCat?.isActive).toBe(false);

    // 2. Delete category with products (ACTIVE + INACTIVE) -> row & products preserved, Product.status untouched
    const delWithProds = await request(app)
      .delete(`/api/v1/admin/categories/${catWithProdsId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delWithProds.status).toBe(200);
    const dbCatWithProds = await prisma.category.findUnique({ where: { id: catWithProdsId } });
    expect(dbCatWithProds).not.toBeNull();
    expect(dbCatWithProds?.isActive).toBe(false);

    const pActAfter = await prisma.product.findUniqueOrThrow({ where: { id: catActiveProdId } });
    const pInactAfter = await prisma.product.findUniqueOrThrow({
      where: { id: catInactiveProdId },
    });
    expect(pActAfter.categoryId).toBe(catWithProdsId);
    expect(pActAfter.status).toBe('ACTIVE'); // Product.status NOT forcibly changed!
    expect(pInactAfter.status).toBe('INACTIVE');

    // 3. Delete parent category -> parent, child, and grandchild synced to isActive = false without physical deletion
    const delParent = await request(app)
      .delete(`/api/v1/admin/categories/${parentCatId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delParent.status).toBe(200);

    const [pRow, cRow, gRow] = await Promise.all([
      prisma.category.findUnique({ where: { id: parentCatId } }),
      prisma.category.findUnique({ where: { id: childCatId } }),
      prisma.category.findUnique({ where: { id: grandchildCatId } }),
    ]);
    expect(pRow).not.toBeNull();
    expect(cRow).not.toBeNull();
    expect(gRow).not.toBeNull();
    expect(pRow?.isActive).toBe(false);
    expect(cRow?.isActive).toBe(false);
    expect(gRow?.isActive).toBe(false);
    expect(cRow?.parentId).toBe(parentCatId);
    expect(gRow?.parentId).toBe(childCatId);
  });

  it('Cases 5-7: Brand soft delete sets isActive=false, preserves brand row and Product.brandId & Product.status', async () => {
    // 5. Empty brand soft delete
    const delEmptyBrand = await request(app)
      .delete(`/api/v1/admin/brands/${emptyBrandId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delEmptyBrand.status).toBe(200);
    const dbEmptyBrand = await prisma.brand.findUnique({ where: { id: emptyBrandId } });
    expect(dbEmptyBrand).not.toBeNull();
    expect(dbEmptyBrand?.isActive).toBe(false);

    // 6-7. Brand with products soft delete -> brand row kept, Product.brandId NOT nulled, Product.status untouched
    const delBrandProds = await request(app)
      .delete(`/api/v1/admin/brands/${brandWithProdsId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delBrandProds.status).toBe(200);
    const dbBrandProds = await prisma.brand.findUnique({ where: { id: brandWithProdsId } });
    expect(dbBrandProds).not.toBeNull();
    expect(dbBrandProds?.isActive).toBe(false);

    const pbActAfter = await prisma.product.findUniqueOrThrow({ where: { id: brandActiveProdId } });
    const pbInactAfter = await prisma.product.findUniqueOrThrow({
      where: { id: brandInactiveProdId },
    });
    expect(pbActAfter.brandId).toBe(brandWithProdsId); // MUST NOT become null!
    expect(pbActAfter.status).toBe('ACTIVE');
    expect(pbInactAfter.brandId).toBe(brandWithProdsId);
    expect(pbInactAfter.status).toBe('INACTIVE');

    // Non-existent brand -> 404 BRAND_NOT_FOUND
    const missingBrand = await request(app)
      .delete('/api/v1/admin/brands/999999999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(missingBrand.status).toBe(404);
    expect(missingBrand.body.error.code).toBe('BRAND_NOT_FOUND');
  });

  it('Cases 8, 9, 12, 13, 14: Products of soft-deleted Brand/Category cannot be purchased, while historical order snapshots & returns remain intact', async () => {
    const guestSess = `t4-cart-${Date.now()}`;
    createdGuestSessions.push(guestSess);

    // Case 8 & 9: Cannot add to cart or create order for soft-deleted Category or Brand products
    for (const hiddenProdId of [catActiveProdId, brandActiveProdId]) {
      const cartRes = await request(app)
        .post('/api/v1/cart/items')
        .set('x-guest-session-id', guestSess)
        .send({ productId: hiddenProdId, quantity: 1 });
      expect(cartRes.status).toBe(400);
      expect(cartRes.body.error.code).toBe('PRODUCT_UNAVAILABLE');

      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          customerName: 'Task4 Customer',
          customerEmail: 't4-cust@nexora.local',
          customerPhone: '0922333444',
          shippingAddress: '789 Pasteur, Q3, TP.HCM',
          paymentMethod: 'COD',
          items: [{ productId: hiddenProdId, quantity: 1 }],
        });
      expect(orderRes.status).toBe(400);
      expect(orderRes.body.error.code).toBe('PRODUCT_UNAVAILABLE');
    }

    // Detail endpoint exposes unavailable state cleanly
    const catProdDetail = await request(app).get(`/api/v1/catalog/products/${catActiveProdSlug}`);
    expect(catProdDetail.status).toBe(200);
    expect(catProdDetail.body.data.isPurchasable).toBe(false);
    expect(catProdDetail.body.data.unavailableReason).toBe('CATEGORY_INACTIVE');

    const brdProdDetail = await request(app).get(`/api/v1/catalog/products/${brandActiveProdSlug}`);
    expect(brdProdDetail.status).toBe(200);
    expect(brdProdDetail.body.data.isPurchasable).toBe(false);
    expect(brdProdDetail.body.data.unavailableReason).toBe('BRAND_INACTIVE');

    // Cases 12 & 13: OrderItem snapshots and order lookup remain intact
    const detailOrder = await request(app)
      .get(`/api/v1/orders/detail/${historicalOrderCode}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(detailOrder.status).toBe(200);
    expect(detailOrder.body.data.items).toHaveLength(2);
    expect(detailOrder.body.data.items[0].productSku).toMatch(/^T4-CA-/);
    expect(detailOrder.body.data.items[1].productSku).toMatch(/^T4-BA-/);

    const trackOrder = await request(app).get(
      `/api/v1/orders/track?code=${historicalOrderCode}&phone=0922333444`,
    );
    expect(trackOrder.status).toBe(200);

    // Case 14: Historical Return / Warranty request still succeeds (`201`)
    const returnRes = await request(app)
      .post('/api/v1/profile/returns')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: historicalOrderId.toString(),
        reason: 'Bảo hành sản phẩm sau khi danh mục đã bị ẩn',
        notes: 'Khách hàng cũ yêu cầu kiểm tra bảo hành',
        items: [
          {
            orderItemId: historicalOrderItemId.toString(),
            quantity: 1,
            resolution: 'REPAIR',
          },
        ],
      });
    expect(returnRes.status).toBe(201);
    historicalReturnId = returnRes.body.data.id;
  });

  it('Cases 10, 11: Restoring Category or Brand (isActive=true) keeps INACTIVE products INACTIVE while allowing eligible ACTIVE products back', async () => {
    const guestSess = `t4-restore-${Date.now()}`;
    createdGuestSessions.push(guestSess);

    // Case 10: Restore Category (catWithProdsId) via PUT /admin/categories/:id
    const restoreCatRes = await request(app)
      .put(`/api/v1/admin/categories/${catWithProdsId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });
    expect(restoreCatRes.status).toBe(200);
    expect(restoreCatRes.body.data.isActive).toBe(true);

    // Originally INACTIVE product stays INACTIVE!
    const pInactCheck = await prisma.product.findUniqueOrThrow({
      where: { id: catInactiveProdId },
    });
    expect(pInactCheck.status).toBe('INACTIVE');

    // Originally ACTIVE product becomes purchasable again; INACTIVE product stays blocked!
    const cartCatOk = await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', guestSess)
      .send({ productId: catActiveProdId, quantity: 1 });
    expect(cartCatOk.status).toBe(200);

    const cartCatInact = await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', guestSess)
      .send({ productId: catInactiveProdId, quantity: 1 });
    expect(cartCatInact.status).toBe(400);
    expect(cartCatInact.body.error.code).toBe('PRODUCT_UNAVAILABLE');

    // Case 11: Restore Brand (brandWithProdsId) via PUT /admin/brands/:id
    const restoreBrandRes = await request(app)
      .put(`/api/v1/admin/brands/${brandWithProdsId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });
    expect(restoreBrandRes.status).toBe(200);
    expect(restoreBrandRes.body.data.isActive).toBe(true);

    // Originally INACTIVE product under restored Brand MUST remain INACTIVE!
    const pbInactCheck = await prisma.product.findUniqueOrThrow({
      where: { id: brandInactiveProdId },
    });
    expect(pbInactCheck.status).toBe('INACTIVE');

    const cartBrandOk = await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', guestSess)
      .send({ productId: brandActiveProdId, quantity: 1 });
    expect(cartBrandOk.status).toBe(200);

    const cartBrandInact = await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', guestSess)
      .send({ productId: brandInactiveProdId, quantity: 1 });
    expect(cartBrandInact.status).toBe(400);
    expect(cartBrandInact.body.error.code).toBe('PRODUCT_UNAVAILABLE');
  });
});
