import type { OrderStatus, SiteConfig } from "@/types";

export type AppEnvironment = "development" | "test" | "production";

type RuntimeProperties = {
  appEnv: AppEnvironment;
  nodeEnv: string;
  adminUsername: string;
  adminPassword: string;
  readAdminUsername: string;
  readAdminPassword: string;
  adminSessionSecret: string;
  databaseHost: string;
  databasePort: number;
  databaseUser: string;
  databasePassword: string;
  databaseName: string;
  databaseConnectionLimit: number;
  databaseAutoSchema: boolean;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayPublicKeyId: string;
  integrationApiToken: string;
  googleAnalyticsMeasurementId: string;
  shiprocketEmail: string;
  shiprocketPassword: string;
  shiprocketPickupLocation: string;
  shiprocketChannelId: number;
  shiprocketDefaultWeightKg: number;
  shiprocketDefaultLengthCm: number;
  shiprocketDefaultBreadthCm: number;
  shiprocketDefaultHeightCm: number;
};

type AppProperties = {
  site: SiteConfig;
  admin: {
    cookieName: string;
    sessionSeconds: number;
    passwordMissingMessage: string;
    sessionSecretMissingMessage: string;
  };
  customer: {
    cookieName: string;
    sessionSeconds: number;
    passwordResetMinutes: number;
  };
  email: {
    provider: string;
    from: string;
    passwordResetSubject: string;
    missingConfigMessage: string;
  };
  database: {
    setupMessage: string;
  };
  payments: {
    razorpay: {
      currency: string;
      placeholderKeyToken: string;
      keysMissingMessage: string;
      secretMissingMessage: string;
      orderFailedMessage: string;
    };
  };
  integrations: {
    missingTokenMessage: string;
    unauthorizedMessage: string;
  };
  orderJourney: {
    activeStatuses: Array<{
      value: OrderStatus;
      label: string;
      description: string;
    }>;
    terminalStatuses: Array<{
      value: OrderStatus;
      label: string;
      description: string;
    }>;
  };
  paymentPage: {
    draftStorageKey: string;
    savedOrdersStorageKey: string;
    title: string;
    subtitle: string;
    missingDetailsTitle: string;
    backToCheckoutLabel: string;
    optionsTitle: string;
    orderSummaryTitle: string;
    processingLabel: string;
    confirmCodLabel: string;
    payWithPrefix: string;
    razorpayScriptUrl: string;
    options: Array<{
      id: "card" | "upi" | "netbanking" | "emi" | "cod";
      label: string;
      description: string;
      iconLabel: string;
    }>;
  };
  shippingIntegrations: {
    shiprocketMissingConfigMessage: string;
    baseUrl: string;
    defaultCustomerName: string;
    billingCountry: string;
    codPaymentMethod: string;
    prepaidPaymentMethod: string;
    requestFailedMessage: string;
    missingTokenMessage: string;
  };
  pincodeLookup: {
    cityLookupUrl: string;
    postalLookupUrl: string;
  };
  media: {
    remoteImageHost: string;
  };
};

export const appProperties: AppProperties = {
  site: {
    storeName: "ApnaMart",
    adminTitle: "ApnaMart Admin",
    metadataTitle: "ApnaMart",
    metadataDescription:
      "A lean multi-category storefront with catalog, cart, checkout, MariaDB, and Razorpay-ready payment hooks.",
    hero: {
      eyebrow: "Shop Love, Style & Happiness",
      title: "Kids, Ladies, Toys, Jewellery & Gifts",
      description:
        "Everything you love, all in one place. Stylish looks, fun toys, sparkling jewellery, and thoughtful gifts.",
      imageUrl: "/demo/photos/hero-shopping-natural.png",
      imageAlt: "Family shopping for gifts, toys, and jewellery",
      primaryCtaLabel: "Shop Now",
      primaryCtaHref: "/products",
      secondaryCtaLabel: "View Gifts",
      secondaryCtaHref: "/products?category=gifts",
    },
    heroBanners: [
      {
        eyebrow: "Shop Love, Style & Happiness",
        title: "Kids, Ladies, Toys, Jewellery & Gifts",
        description:
          "Everything you love, all in one place. Stylish looks, fun toys, sparkling jewellery, and thoughtful gifts.",
        imageUrl: "/demo/photos/hero-shopping-natural.png",
        imageAlt: "Family shopping for gifts, toys, and jewellery",
        primaryCtaLabel: "Shop Now",
        primaryCtaHref: "/products",
        secondaryCtaLabel: "Birthday Gifts",
        secondaryCtaHref: "/products?attribute_tag=birthday",
        href: "/products",
        discountBadgeText: "UP TO\n50%\nOFF",
        showDiscountBadge: true,
      },
      {
        eyebrow: "Fresh Styles",
        title: "Clothes and accessories for every occasion.",
        description:
          "Keep apparel collections easy to discover with category-led banners controlled from admin settings.",
        imageUrl: "/demo/photos/ladies-category.png",
        imageAlt: "Clothing racks with selected outfits",
        primaryCtaLabel: "Shop Clothes",
        primaryCtaHref: "/products?category=ladies",
        secondaryCtaLabel: "View Products",
        secondaryCtaHref: "/products",
        href: "/products?category=ladies",
        discountBadgeText: "",
        showDiscountBadge: false,
      },
      {
        eyebrow: "Baby, Toys & Gifts",
        title: "Thoughtful picks for little ones and celebrations.",
        description:
          "Highlight baby products, toys, gift sets, and birthday items with clickable banners that rotate automatically.",
        imageUrl: "/demo/photos/kids-category.png",
        imageAlt: "Baby products and soft toys arranged for gifting",
        primaryCtaLabel: "Shop Baby Products",
        primaryCtaHref: "/products?category=kids",
        secondaryCtaLabel: "Shop Gifts",
        secondaryCtaHref: "/products?category=gifts",
        href: "/products?category=kids",
        discountBadgeText: "",
        showDiscountBadge: false,
      },
    ],
    home: {
      valueProps: [
        { title: "Free shipping", text: "Orders above Rs. 5,000" },
        { title: "Multi-category", text: "Clothes, baby, toys, gifts, jewellery" },
        { title: "Easy checkout", text: "Fast login, cart, and order history" },
      ],
      offerCards: [
        {
          iconLabel: "truck",
          title: "Free Shipping",
          text: "On Orders Above Rs. 999",
          href: "/products",
          style: "shipping",
        },
        {
          iconLabel: "percent",
          title: "Special Offers",
          text: "Up to 50% Off",
          href: "/products?sort=price_asc",
          style: "offers",
        },
        {
          iconLabel: "gift",
          title: "Perfect Gifts",
          text: "For Every Occasion",
          href: "/products?category=gifts",
          style: "gifts",
        },
      ],
      serviceHighlights: [
        { iconLabel: "secure", title: "Secure Payments", text: "100% Safe & Secure" },
        { iconLabel: "returns", title: "Easy Returns", text: "7 Days Return Policy" },
        { iconLabel: "support", title: "24/7 Support", text: "We are here to help" },
        { iconLabel: "quality", title: "Quality Products", text: "Best quality guaranteed" },
      ],
      categoriesTitle: "Shop by Category",
      categoriesSubtitle: "Keep the first catalog tight and easy to manage.",
      categoriesCtaLabel: "View all products",
      categoryCardCta: "Shop Now",
      newArrivalsTitle: "New Arrivals",
      newArrivalsCtaLabel: "View All",
      bestSellersTitle: "Best Sellers",
      bestSellersCtaLabel: "View All",
      noProductsTitle: "No products found",
      noProductsText: "Clear filters or check again later.",
      featuredTitle: "Featured Products",
      featuredSubtitle: "Products you can start selling with today.",
      featuredCtaLabel: "View All",
      collectionFallbackTitle: "ApnaMart Collection",
    },
    navigation: {
      mainLinks: [
        { href: "/", label: "Home" },
        { href: "/products?category=kids", label: "Kids" },
        { href: "/products?category=ladies", label: "Ladies" },
        { href: "/products?category=toys", label: "Toys" },
        { href: "/products?category=jewellery", label: "Jewellery" },
        { href: "/products?category=gifts", label: "Gifts" },
        { href: "/products?sort=newest", label: "New Arrivals" },
        { href: "/products?sort=reviews_desc", label: "Best Sellers" },
        { href: "/products?sort=price_asc", label: "Deals" },
      ],
      footerShopLinks: [
        { href: "/products?category=kids", label: "Kids" },
        { href: "/products?category=ladies", label: "Ladies" },
        { href: "/products?category=toys", label: "Toys" },
        { href: "/products?category=jewellery", label: "Jewellery" },
        { href: "/products?category=gifts", label: "Gifts" },
        { href: "/products?sort=newest", label: "New Arrivals" },
      ],
      utilityLeftText: "Free Shipping on Orders Above Rs. 999 | Easy Returns",
      utilityLinks: [
        { href: "/download-app", label: "Download App" },
        { href: "/orders", label: "Track Order" },
        { href: "/help-support", label: "Help & Support" },
      ],
      categoryMenuLabel: "All Categories",
      logoTagline: "Kids · Ladies · Toys · Jewellery · Gifts",
      searchPlaceholder: "Search for products, brands and more...",
      mobileSearchPlaceholder: "Search products",
      wishlistLabel: "Wishlist",
      cartLabel: "Cart",
      loginLabel: "Login",
    },
    footer: {
      description:
        "Multi-category storefront for clothes, baby products, toys, gifts, jewellery, simple inventory control, and fast customer checkout.",
      shopHeading: "Shop",
      customerServiceHeading: "Customer Service",
      customerServiceLinks: [
        { href: "/orders", label: "Track Order" },
        { href: "/terms-and-conditions", label: "Returns & Refunds" },
        { href: "/cart", label: "Cart" },
        { href: "/checkout", label: "Checkout" },
      ],
      newsletterHeading: "Newsletter",
      newsletterText:
        "Subscribe to get special offers, free giveaways and once-in-a-lifetime deals.",
      newsletterPlaceholder: "Enter your email",
      newsletterButtonLabel: "Subscribe",
      paymentLabels: ["VISA", "MC", "PayPal", "UPI"],
      socialLinks: [
        { href: "https://facebook.com", label: "f" },
        { href: "https://instagram.com", label: "◎" },
        { href: "https://pinterest.com", label: "p" },
        { href: "https://youtube.com", label: "▶" },
      ],
      companyReviewsHeading: "Customer Love",
      supportEmail: "support@apnamart.com",
      supportPhoneLabel: "+91 8130312558",
      supportPhoneHref: "+918130312558",
      operationsText:
        "Secure checkout, order support, and clear customer policies.",
      adminLinkLabel: "Admin",
      copyrightName: "ApnaMart",
    },
    productDetail: {
      productTypeLabel: "Product Type",
      detailsLabel: "Details",
      fallbackDetailsText: "See product description",
      shippingLabel: "Shipping",
      shippingFreePrefix: "Free above",
      relatedProductsTitle: "Related Products",
      reviewCountPrefix: "Based on",
    },
    productListing: {
      filtersTitle: "Filters",
      allProductsLabel: "All Products",
      productTypeTitle: "Product Type",
      customerRatingTitle: "Customer Rating",
      productCountSingular: "product",
      productCountPlural: "products",
      sortedByLabel: "Sorted by",
    },
    cart: {
      title: "Shopping Cart",
      emptyStatusText: "Your cart is empty",
      emptyTitle: "Your cart is empty",
      emptyText: "Add a product to start checkout.",
      emptyCtaLabel: "Start Shopping",
      removeLabel: "Remove",
      orderSummaryTitle: "Order Summary",
      subtotalLabel: "Subtotal",
      shippingLabel: "Shipping",
      freeShippingLabel: "Free",
      totalLabel: "Total",
      checkoutLabel: "Checkout",
      continueShoppingLabel: "Continue Shopping",
    },
    wishlist: {
      eyebrow: "Wishlist",
      title: "Your Lovely Picks",
      description:
        "Save favourite products here and return whenever you are ready to shop.",
      ctaLabel: "Browse Products",
      loginTitle: "Login to view your wishlist",
      loginText:
        "Your wishlist is saved in your account, so it stays available across devices.",
      loginCtaLabel: "Login",
      emptyTitle: "Your wishlist is empty",
      emptyText: "Save products with the heart button and they will appear here.",
      emptyCtaLabel: "Start Shopping",
    },
    legal: {
      privacyPolicy: {
        title: "Privacy Policy",
        updatedLabel: "Last updated: 26 April 2026",
        sections: [
          {
            title: "Information we collect",
            text: "We collect account, contact, delivery, order, and payment-related information needed to provide shopping, checkout, delivery support, and customer service.",
          },
          {
            title: "How we use information",
            text: "We use customer information to manage accounts, process carts and orders, communicate order updates, prevent misuse, improve the storefront, and comply with applicable obligations.",
          },
          {
            title: "Sharing and security",
            text: "We share information only with service providers needed for operations such as payment, delivery, email, and hosting. We use reasonable technical and operational controls to protect customer data.",
          },
          {
            title: "Customer choices",
            text: "Customers can update profile details from their account page and contact support for privacy or account-related requests.",
          },
        ],
      },
      termsAndConditions: {
        title: "Terms and Conditions",
        updatedLabel: "Last updated: 26 April 2026",
        sections: [
          {
            title: "Using ApnaMart",
            text: "By using the storefront, customers agree to provide accurate account, contact, and delivery information and to use the service only for lawful purchases.",
          },
          {
            title: "Orders and payments",
            text: "Orders are subject to product availability, price confirmation, delivery feasibility, and payment validation. Cash on Delivery and online payment options may vary by configuration.",
          },
          {
            title: "Returns and support",
            text: "Return, replacement, cancellation, and refund handling depends on product condition, order status, and support review. Customers should contact support with order details.",
          },
          {
            title: "Changes",
            text: "Store content, pricing, product availability, policies, and terms may be updated from time to time. Continued use of the storefront means acceptance of the latest terms.",
          },
        ],
      },
    },
    shipping: {
      freeAbove: 5000,
      standardCharge: 299,
    },
    checkout: {
      title: "Checkout",
      subtitle: "Guest checkout keeps the MVP simple.",
      emptyCartTitle: "Your cart is empty",
      emptyCartCtaLabel: "Continue Shopping",
      customerDetailsTitle: "Customer Details",
      shippingAddressTitle: "Shipping Address",
      paymentTitle: "Payment",
      paymentDescription:
        "Payment options open on the next page. Your order number is generated after you confirm payment.",
      orderSummaryTitle: "Order Summary",
      subtotalLabel: "Subtotal",
      shippingLabel: "Shipping",
      freeShippingLabel: "Free",
      totalLabel: "Total",
      quantityLabel: "Qty",
      preparingPaymentLabel: "Preparing Payment...",
      continueToPaymentLabel: "Continue to Payment",
      submitLabel: "Place Order",
      submittingLabel: "Placing Order...",
      paymentMethods: [
        {
          id: "cod",
          label: "Cash on Delivery",
          description: "Best for validating demand with low setup work.",
          enabled: true,
        },
        {
          id: "razorpay",
          label: "Razorpay",
          description: "Use when Razorpay keys are configured.",
          enabled: true,
        },
      ],
    },
    reviews: {
      reviewWindowDays: 30,
      allowReviewEdits: true,
      reviewEditWindowDays: 7,
      footerMinRating: 4,
      footerLimit: 3,
    },
    productAttributes: [
      { value: "apparel", label: "Apparel" },
      { value: "baby", label: "Baby products" },
      { value: "toys", label: "Toys" },
      { value: "gifts", label: "Gifts" },
      { value: "birthday", label: "Birthday gifts" },
      { value: "jewellery", label: "Jewellery" },
    ],
    productSortOptions: [
      { value: "newest", label: "Newest" },
      { value: "rating_desc", label: "Top rated" },
      { value: "reviews_desc", label: "Most reviewed" },
      { value: "price_asc", label: "Price: Low to High" },
      { value: "price_desc", label: "Price: High to Low" },
      { value: "name", label: "Name" },
    ],
    productRatingFilters: [
      { value: 4, label: "4.0 and above" },
      { value: 3, label: "3.0 and above" },
      { value: 2, label: "2.0 and above" },
    ],
  },
  admin: {
    cookieName: "apnamart_admin",
    sessionSeconds: 60 * 60 * 12,
    passwordMissingMessage:
      "Admin password is not configured. Set ADMIN PASSWORD in the environment properties file.",
    sessionSecretMissingMessage:
      "Admin session secret is not configured. Set ADMIN_SESSION_SECRET in the environment properties file.",
  },
  customer: {
    cookieName: "apnamart_customer",
    sessionSeconds: 60 * 60 * 24 * 30,
    passwordResetMinutes: 30,
  },
  email: {
    provider: "resend",
    from: "ApnaMart <no-reply@apnamart.com>",
    passwordResetSubject: "Reset your ApnaMart password",
    missingConfigMessage:
      "Password reset email is not configured. Set EMAIL_PROVIDER=resend, EMAIL_FROM, and RESEND_API_KEY.",
  },
  database: {
    setupMessage:
      "MariaDB is not configured yet. Add real MARIADB_HOST, MARIADB_PORT, MARIADB_USER, MARIADB_PASSWORD, and MARIADB_DATABASE values to the active environment properties file.",
  },
  payments: {
    razorpay: {
      currency: "INR",
      placeholderKeyToken: "your_",
      keysMissingMessage: "Razorpay keys are not configured.",
      secretMissingMessage: "Razorpay secret is not configured.",
      orderFailedMessage: "Razorpay order failed.",
    },
  },
  integrations: {
    missingTokenMessage:
      "Integration API token is not configured. Set INTEGRATION_API_TOKEN before enabling partner APIs.",
    unauthorizedMessage: "Invalid or missing integration API token.",
  },
  orderJourney: {
    activeStatuses: [
      {
        value: "pending",
        label: "Pending",
        description: "Order placed",
      },
      {
        value: "confirmed",
        label: "Confirmed",
        description: "Seller confirmed",
      },
      {
        value: "packed",
        label: "Packed",
        description: "Packed and ready",
      },
      {
        value: "shipped",
        label: "Shipped",
        description: "Handed to delivery",
      },
      {
        value: "out_for_delivery",
        label: "Out for delivery",
        description: "Arriving soon",
      },
      {
        value: "delivered",
        label: "Delivered",
        description: "Delivered",
      },
    ],
    terminalStatuses: [
      {
        value: "cancelled",
        label: "Cancelled",
        description: "Order cancelled",
      },
      {
        value: "rejected",
        label: "Rejected",
        description: "Rejected by admin",
      },
      {
        value: "refund_requested",
        label: "Refund requested",
        description: "Customer requested refund",
      },
      {
        value: "refund_approved",
        label: "Refund approved",
        description: "Refund approved",
      },
      {
        value: "refund_rejected",
        label: "Refund rejected",
        description: "Refund not approved",
      },
      {
        value: "refunded",
        label: "Refunded",
        description: "Refund completed",
      },
    ],
  },
  paymentPage: {
    draftStorageKey: "apnamart_payment_draft",
    savedOrdersStorageKey: "apnamart_orders",
    title: "Choose payment option",
    subtitle:
      "Select how you want to pay. Your order number will be generated after confirmation.",
    missingDetailsTitle: "Payment details not found",
    backToCheckoutLabel: "Back to Checkout",
    optionsTitle: "Payment Options",
    orderSummaryTitle: "Order Summary",
    processingLabel: "Processing...",
    confirmCodLabel: "Confirm COD Order",
    payWithPrefix: "Pay with",
    razorpayScriptUrl: "https://checkout.razorpay.com/v1/checkout.js",
    options: [
      {
        id: "card",
        label: "Credit / Debit Card",
        description: "Pay securely with card through Razorpay.",
        iconLabel: "CARD",
      },
      {
        id: "upi",
        label: "UPI",
        description: "Pay with UPI apps through Razorpay.",
        iconLabel: "UPI",
      },
      {
        id: "netbanking",
        label: "Netbanking",
        description: "Use your bank account through Razorpay.",
        iconLabel: "₹",
      },
      {
        id: "emi",
        label: "EMI",
        description: "Pay in installments where eligible.",
        iconLabel: "%",
      },
      {
        id: "cod",
        label: "Cash on Delivery",
        description: "Pay when your order reaches you.",
        iconLabel: "COD",
      },
    ],
  },
  shippingIntegrations: {
    shiprocketMissingConfigMessage:
      "Shiprocket is not configured. Set SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, and SHIPROCKET_PICKUP_LOCATION.",
    baseUrl: "https://apiv2.shiprocket.in/v1/external",
    defaultCustomerName: "Customer",
    billingCountry: "India",
    codPaymentMethod: "COD",
    prepaidPaymentMethod: "Prepaid",
    requestFailedMessage: "Shiprocket request failed.",
    missingTokenMessage: "Shiprocket token was not returned.",
  },
  pincodeLookup: {
    cityLookupUrl: "https://www.postpincode.in/api/getCityName.php",
    postalLookupUrl: "https://api.postalpincode.in/pincode",
  },
  media: {
    remoteImageHost: "",
  },
};

export const defaultSiteConfig = appProperties.site;

export type SiteConfigRecord = {
  key: string;
  value: unknown;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const siteConfigRecordKeys = [
  "site.identity",
  "site.hero",
  "site.home",
  "site.navigation",
  "site.footer",
  "site.productDetail",
  "site.productListing",
  "site.cart",
  "site.wishlist",
  "site.legal",
  "site.shipping",
  "site.checkout",
  "site.reviews",
  "catalog",
] as const;

export function splitSiteConfigRecords(site: SiteConfig): SiteConfigRecord[] {
  return [
    {
      key: "site.identity",
      value: {
        storeName: site.storeName,
        adminTitle: site.adminTitle,
        metadataTitle: site.metadataTitle,
        metadataDescription: site.metadataDescription,
      },
    },
    { key: "site.hero", value: { hero: site.hero, heroBanners: site.heroBanners } },
    { key: "site.home", value: { home: site.home } },
    { key: "site.navigation", value: { navigation: site.navigation } },
    { key: "site.footer", value: { footer: site.footer } },
    { key: "site.productDetail", value: { productDetail: site.productDetail } },
    { key: "site.productListing", value: { productListing: site.productListing } },
    { key: "site.cart", value: { cart: site.cart } },
    { key: "site.wishlist", value: { wishlist: site.wishlist } },
    { key: "site.legal", value: { legal: site.legal } },
    { key: "site.shipping", value: { shipping: site.shipping } },
    { key: "site.checkout", value: { checkout: site.checkout } },
    { key: "site.reviews", value: { reviews: site.reviews } },
    {
      key: "catalog",
      value: {
        productAttributes: site.productAttributes,
        productSortOptions: site.productSortOptions,
        productRatingFilters: site.productRatingFilters,
      },
    },
  ];
}

export function mergeSiteConfigRecords(records: SiteConfigRecord[]) {
  return records.reduce<Record<string, unknown>>((merged, record) => {
    if (record.value && typeof record.value === "object" && !Array.isArray(record.value)) {
      return { ...merged, ...(record.value as Record<string, unknown>) };
    }
    return merged;
  }, {});
}

export function getRuntimeProperties(): RuntimeProperties {
  const nodeEnv = process.env.NODE_ENV || "development";
  const appEnv = resolveAppEnvironment(process.env.APP_ENV || nodeEnv);

  return {
    appEnv,
    nodeEnv,
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "",
    readAdminUsername: process.env.READ_ADMIN_USERNAME || process.env.ADMIN_READ_USERNAME || "",
    readAdminPassword: process.env.READ_ADMIN_PASSWORD || process.env.ADMIN_READ_PASSWORD || "",
    adminSessionSecret: process.env.ADMIN_SESSION_SECRET || "",
    databaseHost: process.env.MARIADB_HOST || "",
    databasePort: numberFromEnv(process.env.MARIADB_PORT, 3306),
    databaseUser: process.env.MARIADB_USER || "",
    databasePassword: process.env.MARIADB_PASSWORD || "",
    databaseName: process.env.MARIADB_DATABASE || "",
    databaseConnectionLimit: numberFromEnv(process.env.MARIADB_CONNECTION_LIMIT, 10),
    databaseAutoSchema: booleanFromEnv(process.env.MARIADB_AUTO_SCHEMA, true),
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
    razorpayPublicKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    integrationApiToken: process.env.INTEGRATION_API_TOKEN || "",
    googleAnalyticsMeasurementId:
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || "",
    shiprocketEmail: process.env.SHIPROCKET_EMAIL || "",
    shiprocketPassword: process.env.SHIPROCKET_PASSWORD || "",
    shiprocketPickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "",
    shiprocketChannelId: numberFromEnv(process.env.SHIPROCKET_CHANNEL_ID, 0),
    shiprocketDefaultWeightKg: numberFromEnv(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG, 0.5),
    shiprocketDefaultLengthCm: numberFromEnv(process.env.SHIPROCKET_DEFAULT_LENGTH_CM, 10),
    shiprocketDefaultBreadthCm: numberFromEnv(process.env.SHIPROCKET_DEFAULT_BREADTH_CM, 10),
    shiprocketDefaultHeightCm: numberFromEnv(process.env.SHIPROCKET_DEFAULT_HEIGHT_CM, 10),
  };
}

export function getAdminRuntimeProperties() {
  const runtime = getRuntimeProperties();
  return {
    username: runtime.adminUsername,
    password: runtime.adminPassword,
    readUsername: runtime.readAdminUsername,
    readPassword: runtime.readAdminPassword,
    sessionSecret: runtime.adminSessionSecret || runtime.adminPassword,
    secureCookie: runtime.nodeEnv === "production",
  };
}

export function getDatabaseRuntimeProperties() {
  const runtime = getRuntimeProperties();
  return {
    host: runtime.databaseHost,
    port: runtime.databasePort,
    user: runtime.databaseUser,
    password: runtime.databasePassword,
    database: runtime.databaseName,
    connectionLimit: runtime.databaseConnectionLimit,
    autoSchema: runtime.databaseAutoSchema,
  };
}

export function getRazorpayRuntimeProperties() {
  const runtime = getRuntimeProperties();
  return {
    keyId: runtime.razorpayKeyId || runtime.razorpayPublicKeyId,
    keySecret: runtime.razorpayKeySecret,
  };
}

export function getIntegrationRuntimeProperties() {
  const runtime = getRuntimeProperties();
  return {
    apiToken: runtime.integrationApiToken,
  };
}

export function getAnalyticsRuntimeProperties() {
  const runtime = getRuntimeProperties();
  return {
    googleAnalyticsMeasurementId: runtime.googleAnalyticsMeasurementId,
  };
}

export function getShiprocketRuntimeProperties() {
  const runtime = getRuntimeProperties();
  return {
    email: runtime.shiprocketEmail,
    password: runtime.shiprocketPassword,
    pickupLocation: runtime.shiprocketPickupLocation,
    channelId: runtime.shiprocketChannelId,
    defaultWeightKg: runtime.shiprocketDefaultWeightKg,
    defaultLengthCm: runtime.shiprocketDefaultLengthCm,
    defaultBreadthCm: runtime.shiprocketDefaultBreadthCm,
    defaultHeightCm: runtime.shiprocketDefaultHeightCm,
  };
}

function resolveAppEnvironment(value: string): AppEnvironment {
  if (value === "production" || value === "test") return value;
  return "development";
}

function numberFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function booleanFromEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
