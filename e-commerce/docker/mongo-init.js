// MongoDB initialization script
// Creates collections and indexes for the e-commerce application

db = db.getSiblingDB('ecommerce');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'name', 'role'],
      properties: {
        email: { bsonType: 'string', pattern: '^.+@.+$' },
        name: { bsonType: 'string' },
        role: { enum: ['customer', 'admin'] },
        avatarHue: { bsonType: 'int', minimum: 0, maximum: 360 },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('admins', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'username', 'passwordHash', 'role'],
      properties: {
        email: { bsonType: 'string', pattern: '^.+@.+$' },
        username: { bsonType: 'string', minLength: 3, maxLength: 30 },
        passwordHash: { bsonType: 'string' },
        role: { enum: ['superadmin', 'admin', 'moderator'] },
        permissions: { bsonType: 'array' },
        lastLoginAt: { bsonType: 'date' },
        isActive: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'slug', 'category', 'brand', 'basePrice', 'variants'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        slug: { bsonType: 'string' },
        category: { bsonType: 'string' },
        brand: { bsonType: 'string' },
        basePrice: { bsonType: 'long', minimum: 0 },
        compareAtPrice: { bsonType: 'long', minimum: 0 },
        description: { bsonType: 'string' },
        specs: { bsonType: 'object' },
        badges: { bsonType: 'array' },
        variants: { bsonType: 'array' },
        images: { bsonType: 'array' },
        rating: { bsonType: 'double', minimum: 0, maximum: 5 },
        reviewCount: { bsonType: 'int', minimum: 0 },
        isActive: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'userId', 'items', 'totals', 'status', 'shippingAddress', 'billingAddress', 'payment'],
      properties: {
        id: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        items: { bsonType: 'array' },
        totals: { bsonType: 'object' },
        status: { enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'] },
        shippingAddress: { bsonType: 'object' },
        billingAddress: { bsonType: 'object' },
        payment: { bsonType: 'object' },
        timeline: { bsonType: 'array' },
        notes: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('addresses', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'label', 'name', 'phone', 'line1', 'city', 'state', 'postalCode', 'country'],
      properties: {
        userId: { bsonType: 'string' },
        label: { bsonType: 'string' },
        name: { bsonType: 'string' },
        phone: { bsonType: 'string' },
        line1: { bsonType: 'string' },
        line2: { bsonType: 'string' },
        city: { bsonType: 'string' },
        state: { bsonType: 'string' },
        postalCode: { bsonType: 'string' },
        country: { bsonType: 'string' },
        isDefault: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('reviews', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['productId', 'userId', 'rating', 'title', 'body'],
      properties: {
        productId: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        rating: { bsonType: 'int', minimum: 1, maximum: 5 },
        title: { bsonType: 'string' },
        body: { bsonType: 'string' },
        helpful: { bsonType: 'int', minimum: 0 },
        verified: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('carts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'items', 'updatedAt'],
      properties: {
        userId: { bsonType: 'string' },
        sessionId: { bsonType: 'string' },
        items: { bsonType: 'array' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('wishlists', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'items', 'updatedAt'],
      properties: {
        userId: { bsonType: 'string' },
        items: { bsonType: 'array' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.admins.createIndex({ email: 1 }, { unique: true });
db.admins.createIndex({ username: 1 }, { unique: true });
db.admins.createIndex({ role: 1 });
db.admins.createIndex({ isActive: 1 });

db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ category: 1, isActive: 1 });
db.products.createIndex({ brand: 1 });
db.products.createIndex({ 'variants.sku': 1 }, { unique: true, sparse: true });
db.products.createIndex({ basePrice: 1 });
db.products.createIndex({ rating: -1 });
db.products.createIndex({ createdAt: -1 });
db.products.createIndex({ name: 'text', description: 'text', brand: 'text' });

db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ 'items.productId': 1 });
db.orders.createIndex({ createdAt: -1 });

db.addresses.createIndex({ userId: 1 });
db.addresses.createIndex({ userId: 1, isDefault: 1 });

db.reviews.createIndex({ productId: 1, createdAt: -1 });
db.reviews.createIndex({ userId: 1 });
db.reviews.createIndex({ productId: 1, userId: 1 }, { unique: true });

db.carts.createIndex({ userId: 1 }, { unique: true, sparse: true });
db.carts.createIndex({ sessionId: 1 }, { unique: true, sparse: true });

db.wishlists.createIndex({ userId: 1 }, { unique: true });

print('MongoDB initialization complete - collections and indexes created');