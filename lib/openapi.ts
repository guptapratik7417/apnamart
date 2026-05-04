const jsonContent = (schema: Record<string, unknown>) => ({
  "application/json": { schema },
});

const ok = (description = "OK", schema: Record<string, unknown> = { type: "object" }) => ({
  description,
  content: jsonContent(schema),
});

const error = (description: string) => ({
  description,
  content: jsonContent({
    type: "object",
    properties: {
      error: { type: "string" },
    },
  }),
});

const productQuery = [
  { name: "category", in: "query", schema: { type: "string" } },
  { name: "attribute_tag", in: "query", schema: { type: "string" } },
  { name: "min_price", in: "query", schema: { type: "number" } },
  { name: "max_price", in: "query", schema: { type: "number" } },
  { name: "min_rating", in: "query", schema: { type: "number" } },
  { name: "q", in: "query", schema: { type: "string" } },
  {
    name: "sort",
    in: "query",
    schema: {
      type: "string",
      enum: [
        "price_asc",
        "price_desc",
        "newest",
        "featured",
        "name",
        "rating_desc",
        "reviews_desc",
      ],
    },
  },
  { name: "limit", in: "query", schema: { type: "integer", default: 48 } },
  { name: "ids", in: "query", schema: { type: "string" } },
];

const idPathParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "ApnaMart API",
    version: "0.1.0",
    description:
      "Internal storefront/admin APIs, external partner APIs, and provider adapter routes for ApnaMart.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Customer Auth" },
    { name: "Admin" },
    { name: "Catalog" },
    { name: "Cart" },
    { name: "Orders" },
    { name: "Payments" },
    { name: "Reviews" },
    { name: "Utilities" },
    { name: "External Integrations" },
    { name: "Provider Adapters" },
    { name: "Config" },
  ],
  components: {
    securitySchemes: {
      CustomerCookie: {
        type: "apiKey",
        in: "cookie",
        name: "apnamart_customer",
      },
      AdminCookie: {
        type: "apiKey",
        in: "cookie",
        name: "apnamart_admin",
      },
      IntegrationApiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
      IntegrationBearer: {
        type: "http",
        scheme: "bearer",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      ProductInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          original_price: { type: "number", nullable: true },
          category_id: { type: "string", nullable: true },
          stock_quantity: { type: "integer" },
          is_active: { type: "boolean" },
          is_featured: { type: "boolean" },
          rating_average: { type: "number" },
          review_count: { type: "integer" },
          attribute_tag: { type: "string", nullable: true },
          weight_grams: { type: "integer", nullable: true },
          images: { type: "array", items: { type: "string" } },
        },
      },
      CategoryInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string", nullable: true },
          image_url: { type: "string", nullable: true },
        },
      },
      OrderInput: {
        type: "object",
        required: [
          "customer_email",
          "shipping_name",
          "shipping_address",
          "shipping_city",
          "shipping_state",
          "shipping_pincode",
          "shipping_phone",
          "payment_method",
          "items",
        ],
        properties: {
          customer_email: { type: "string", format: "email" },
          shipping_name: { type: "string" },
          shipping_address: { type: "string" },
          shipping_city: { type: "string" },
          shipping_state: { type: "string" },
          shipping_pincode: { type: "string" },
          shipping_phone: { type: "string" },
          payment_method: { type: "string", enum: ["cod", "razorpay"] },
          notes: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["product_id", "quantity"],
              properties: {
                product_id: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/openapi": {
      get: {
        tags: ["Utilities"],
        summary: "OpenAPI JSON document",
        responses: { "200": ok("OpenAPI document") },
      },
    },
    "/api/docs": {
      get: {
        tags: ["Utilities"],
        summary: "Swagger UI",
        responses: { "200": { description: "Swagger UI HTML" } },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Customer Auth"],
        summary: "Register customer",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["email", "password", "full_name"],
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string" },
              full_name: { type: "string" },
              phone: { type: "string" },
            },
          }),
        },
        responses: { "201": ok("Customer created"), "400": error("Invalid input") },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Customer Auth"],
        summary: "Login customer",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string" },
            },
          }),
        },
        responses: { "200": ok("Logged in"), "401": error("Invalid credentials") },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Customer Auth"],
        summary: "Logout customer",
        responses: { "200": ok() },
      },
    },
    "/api/auth/session": {
      get: {
        tags: ["Customer Auth"],
        summary: "Current customer session",
        responses: { "200": ok() },
      },
    },
    "/api/auth/profile": {
      get: {
        tags: ["Customer Auth"],
        summary: "Get customer profile",
        security: [{ CustomerCookie: [] }],
        responses: { "200": ok(), "401": error("Unauthorized") },
      },
      put: {
        tags: ["Customer Auth"],
        summary: "Update customer profile",
        security: [{ CustomerCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              full_name: { type: "string" },
              phone: { type: "string" },
            },
          }),
        },
        responses: { "200": ok(), "401": error("Unauthorized") },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Customer Auth"],
        summary: "Send reset password email",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["email"],
            properties: { email: { type: "string", format: "email" } },
          }),
        },
        responses: { "200": ok() },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Customer Auth"],
        summary: "Reset password",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["token", "password"],
            properties: {
              token: { type: "string" },
              password: { type: "string" },
            },
          }),
        },
        responses: { "200": ok(), "400": error("Invalid token") },
      },
    },
    "/api/admin/login": {
      post: {
        tags: ["Admin"],
        summary: "Login admin",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["username", "password"],
            properties: {
              username: { type: "string" },
              password: { type: "string" },
            },
          }),
        },
        responses: { "200": ok(), "401": error("Invalid credentials") },
      },
    },
    "/api/admin/logout": {
      post: {
        tags: ["Admin"],
        summary: "Logout admin",
        security: [{ AdminCookie: [] }],
        responses: { "200": ok() },
      },
    },
    "/api/admin/session": {
      get: {
        tags: ["Admin"],
        summary: "Current admin session",
        security: [{ AdminCookie: [] }],
        responses: { "200": ok() },
      },
    },
    "/api/admin/database": {
      get: {
        tags: ["Admin"],
        summary: "Check database status",
        security: [{ AdminCookie: [] }],
        responses: { "200": ok(), "403": error("Access denied") },
      },
      post: {
        tags: ["Admin"],
        summary: "Initialize database schema",
        security: [{ AdminCookie: [] }],
        responses: { "200": ok(), "403": error("Access denied") },
      },
    },
    "/api/products": {
      get: {
        tags: ["Catalog"],
        summary: "List products",
        parameters: productQuery,
        responses: { "200": ok("Products list") },
      },
      post: {
        tags: ["Catalog"],
        summary: "Create product",
        security: [{ AdminCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/ProductInput" }),
        },
        responses: { "201": ok("Product created"), "403": error("Access denied") },
      },
    },
    "/api/products/{id}": {
      patch: {
        tags: ["Catalog"],
        summary: "Update product",
        security: [{ AdminCookie: [] }],
        parameters: [idPathParam],
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/ProductInput" }),
        },
        responses: { "200": ok(), "403": error("Access denied") },
      },
      delete: {
        tags: ["Catalog"],
        summary: "Delete product",
        security: [{ AdminCookie: [] }],
        parameters: [idPathParam],
        responses: { "200": ok(), "403": error("Access denied") },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Catalog"],
        summary: "List categories",
        responses: { "200": ok("Categories list") },
      },
      post: {
        tags: ["Catalog"],
        summary: "Create category",
        security: [{ AdminCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/CategoryInput" }),
        },
        responses: { "201": ok("Category created"), "403": error("Access denied") },
      },
    },
    "/api/categories/{id}": {
      patch: {
        tags: ["Catalog"],
        summary: "Update category",
        security: [{ AdminCookie: [] }],
        parameters: [idPathParam],
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/CategoryInput" }),
        },
        responses: { "200": ok(), "403": error("Access denied") },
      },
      delete: {
        tags: ["Catalog"],
        summary: "Delete category",
        security: [{ AdminCookie: [] }],
        parameters: [idPathParam],
        responses: { "200": ok(), "403": error("Access denied") },
      },
    },
    "/api/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get cart",
        security: [{ CustomerCookie: [] }],
        parameters: [{ name: "session_id", in: "query", schema: { type: "string" } }],
        responses: { "200": ok(), "401": error("Unauthorized") },
      },
      put: {
        tags: ["Cart"],
        summary: "Replace cart",
        security: [{ CustomerCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              session_id: { type: "string" },
              items: { type: "array", items: { type: "object" } },
            },
          }),
        },
        responses: { "200": ok(), "401": error("Unauthorized") },
      },
      delete: {
        tags: ["Cart"],
        summary: "Clear cart",
        security: [{ CustomerCookie: [] }],
        responses: { "200": ok(), "401": error("Unauthorized") },
      },
    },
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "List orders for admin",
        security: [{ AdminCookie: [] }],
        responses: { "200": ok(), "401": error("Unauthorized") },
      },
      post: {
        tags: ["Orders"],
        summary: "Create order",
        requestBody: {
          required: true,
          content: jsonContent({ $ref: "#/components/schemas/OrderInput" }),
        },
        responses: { "201": ok("Order created"), "400": error("Invalid input") },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order",
        parameters: [idPathParam],
        responses: { "200": ok(), "404": error("Order not found") },
      },
      patch: {
        tags: ["Orders"],
        summary: "Update order",
        security: [{ AdminCookie: [] }],
        parameters: [idPathParam],
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              status: { type: "string" },
              payment_status: { type: "string" },
              payment_method: { type: "string" },
            },
          }),
        },
        responses: { "200": ok(), "403": error("Access denied") },
      },
    },
    "/api/payments/cod": {
      post: {
        tags: ["Payments"],
        summary: "Confirm Cash on Delivery order",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["order_id"],
            properties: { order_id: { type: "string" } },
          }),
        },
        responses: { "200": ok(), "400": error("Missing order id") },
      },
    },
    "/api/payments/create-order": {
      post: {
        tags: ["Payments"],
        summary: "Create Razorpay order",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["order_id", "amount"],
            properties: {
              order_id: { type: "string" },
              amount: { type: "number" },
            },
          }),
        },
        responses: { "200": ok(), "400": error("Missing payment fields") },
      },
    },
    "/api/payments/verify": {
      post: {
        tags: ["Payments"],
        summary: "Verify Razorpay payment signature",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: [
              "order_id",
              "razorpay_order_id",
              "razorpay_payment_id",
              "razorpay_signature",
            ],
            properties: {
              order_id: { type: "string" },
              razorpay_order_id: { type: "string" },
              razorpay_payment_id: { type: "string" },
              razorpay_signature: { type: "string" },
            },
          }),
        },
        responses: { "200": ok(), "400": error("Invalid payment") },
      },
    },
    "/api/reviews": {
      post: {
        tags: ["Reviews"],
        summary: "Create product review",
        security: [{ CustomerCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating"],
                properties: {
                  review_target: { type: "string", enum: ["product", "company"], default: "product" },
                  product_id: { type: "string" },
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  review_text: { type: "string" },
                  media_urls: { type: "array", items: { type: "string" } },
                },
              },
            },
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["rating"],
                properties: {
                  review_target: { type: "string", enum: ["product", "company"], default: "product" },
                  product_id: { type: "string" },
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  review_text: { type: "string" },
                  media: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    maxItems: 3,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": ok("Review created"),
          "400": error("Not eligible to review"),
          "401": error("Unauthorized"),
        },
      },
      patch: {
        tags: ["Reviews"],
        summary: "Edit own review inside configured edit window",
        security: [{ CustomerCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["review_id", "rating"],
                properties: {
                  review_id: { type: "string" },
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  review_text: { type: "string" },
                },
              },
            },
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["review_id", "rating"],
                properties: {
                  review_id: { type: "string" },
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  review_text: { type: "string" },
                  media: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    maxItems: 3,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": ok("Review updated"),
          "400": error("Edit window closed or invalid input"),
          "401": error("Unauthorized"),
          "403": error("Access denied"),
          "404": error("Review not found"),
        },
      },
    },
    "/api/reviews/{productId}": {
      get: {
        tags: ["Reviews"],
        summary: "List product reviews",
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": ok() },
      },
    },
    "/api/pincode/{pincode}": {
      get: {
        tags: ["Utilities"],
        summary: "Resolve pincode city/state",
        parameters: [
          {
            name: "pincode",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": ok(), "404": error("Pincode not found") },
      },
    },
    "/api/site-config": {
      get: {
        tags: ["Config"],
        summary: "Get site config",
        responses: { "200": ok() },
      },
      put: {
        tags: ["Config"],
        summary: "Update site config",
        security: [{ AdminCookie: [] }],
        responses: { "200": ok(), "403": error("Access denied") },
      },
    },
    "/api/integrations/orders": {
      get: {
        tags: ["External Integrations"],
        summary: "List orders for partner sync",
        security: [{ IntegrationApiKey: [] }, { IntegrationBearer: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
        ],
        responses: { "200": ok(), "401": error("Unauthorized") },
      },
    },
    "/api/integrations/categories": {
      get: {
        tags: ["External Integrations"],
        summary: "List categories for partner sync",
        security: [{ IntegrationApiKey: [] }, { IntegrationBearer: [] }],
        responses: { "200": ok("Categories list"), "401": error("Unauthorized") },
      },
    },
    "/api/integrations/products": {
      get: {
        tags: ["External Integrations"],
        summary: "List products for partner sync",
        security: [{ IntegrationApiKey: [] }, { IntegrationBearer: [] }],
        parameters: productQuery,
        responses: { "200": ok("Products list"), "401": error("Unauthorized") },
      },
    },
    "/api/integrations/products/{id}": {
      get: {
        tags: ["External Integrations"],
        summary: "Get one partner-visible product",
        security: [{ IntegrationApiKey: [] }, { IntegrationBearer: [] }],
        parameters: [idPathParam],
        responses: { "200": ok("Product detail"), "404": error("Product not found") },
      },
    },
    "/api/integrations/orders/{id}": {
      get: {
        tags: ["External Integrations"],
        summary: "Get one partner-visible order",
        security: [{ IntegrationApiKey: [] }, { IntegrationBearer: [] }],
        parameters: [idPathParam],
        responses: { "200": ok(), "404": error("Order not found") },
      },
      patch: {
        tags: ["External Integrations"],
        summary: "Update partner order status",
        security: [{ IntegrationApiKey: [] }, { IntegrationBearer: [] }],
        parameters: [idPathParam],
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["status"],
            properties: { status: { type: "string" } },
          }),
        },
        responses: { "200": ok(), "400": error("Invalid status") },
      },
    },
    "/api/shiprocket/serviceability": {
      get: {
        tags: ["Provider Adapters"],
        summary: "Check Shiprocket serviceability",
        security: [{ AdminCookie: [] }],
        parameters: [
          { name: "delivery_postcode", in: "query", required: true, schema: { type: "string" } },
          { name: "pickup_postcode", in: "query", schema: { type: "string" } },
          { name: "weight", in: "query", schema: { type: "number" } },
          { name: "cod", in: "query", schema: { type: "string", enum: ["0", "1"] } },
        ],
        responses: { "200": ok(), "401": error("Unauthorized") },
      },
    },
    "/api/shiprocket/orders/{id}/create": {
      post: {
        tags: ["Provider Adapters"],
        summary: "Create Shiprocket shipment for order",
        security: [{ AdminCookie: [] }],
        parameters: [idPathParam],
        responses: { "200": ok(), "403": error("Access denied") },
      },
    },
    "/api/shiprocket/track/{awb}": {
      get: {
        tags: ["Provider Adapters"],
        summary: "Track Shiprocket AWB",
        security: [{ AdminCookie: [] }],
        parameters: [
          {
            name: "awb",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": ok(), "401": error("Unauthorized") },
      },
    },
  },
} as const;
