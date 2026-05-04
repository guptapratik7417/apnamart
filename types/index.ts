export type UserRole = "customer" | "admin";
export type AdminRole = "super_admin" | "admin" | "client_admin" | "seller_admin";
export type ProductAttribute = string;
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "rejected"
  | "refund_requested"
  | "refund_approved"
  | "refund_rejected"
  | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cod" | "razorpay";
export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportReplyVisibility = "public" | "private";
export type ProductSortValue =
  | "price_asc"
  | "price_desc"
  | "newest"
  | "featured"
  | "name"
  | "rating_desc"
  | "reviews_desc";

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  display_order?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id?: string;
  product_id?: string;
  image_url: string;
  is_primary: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  category_id?: string | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  rating_average: number;
  review_count: number;
  attribute_tag?: ProductAttribute | null;
  weight_grams?: number | null;
  images: ProductImage[];
  created_at?: string;
  updated_at?: string;
}

export interface CartLine {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  original_price?: number | null;
  stock_quantity: number;
  image_url?: string | null;
  attribute_tag?: ProductAttribute | null;
  weight_grams?: number | null;
  quantity: number;
}

export interface WishlistLine {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  original_price?: number | null;
  stock_quantity: number;
  image_url?: string | null;
  attribute_tag?: ProductAttribute | null;
  weight_grams?: number | null;
  added_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string | null;
  product_name: string;
  product_image?: string | null;
  price: number;
  quantity: number;
  total: number;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  user_id?: string | null;
  order_number: string;
  customer_email?: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping_charge: number;
  total: number;
  shipping_name?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_pincode?: string | null;
  shipping_phone?: string | null;
  payment_method?: PaymentMethod | null;
  payment_status: PaymentStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  shiprocket_order_id?: string | null;
  shiprocket_shipment_id?: string | null;
  shiprocket_awb_code?: string | null;
  shiprocket_courier_name?: string | null;
  notes?: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  product_id?: string | null;
  review_target: "product" | "company";
  user_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  rating: number;
  review_text?: string | null;
  media_urls: string[];
  is_verified_purchase: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SupportTicket {
  id: string;
  user_id?: string | null;
  order_id?: string | null;
  customer_name: string;
  customer_email: string;
  phone?: string | null;
  order_number?: string | null;
  subject: string;
  message: string;
  media_urls?: string[];
  status: SupportTicketStatus;
  admin_notes?: string | null;
  replies?: SupportTicketReply[];
  created_at: string;
  updated_at?: string;
}

export interface SupportTicketReply {
  id: string;
  ticket_id: string;
  author_type: "customer" | "admin";
  author_name?: string | null;
  visibility: SupportReplyVisibility;
  message: string;
  media_urls?: string[];
  created_at: string;
  updated_at?: string;
}

export interface CreateSupportTicketInput {
  customer_name: string;
  customer_email: string;
  phone?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  subject: string;
  message: string;
  media_urls?: string[];
}

export interface ProductsQueryParams {
  category?: string | null;
  attribute_tag?: ProductAttribute | null;
  min_price?: number | null;
  max_price?: number | null;
  min_rating?: number | null;
  q?: string | null;
  sort?: ProductSortValue;
  page?: number;
  limit?: number;
  ids?: string[];
  includeInactive?: boolean;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number | null;
  category_id?: string | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  rating_average?: number;
  review_count?: number;
  attribute_tag?: ProductAttribute | null;
  weight_grams?: number | null;
  images?: string[];
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  display_order?: number | null;
}

export interface CreateOrderInput {
  user_id?: string | null;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  customer_email: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_phone: string;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  total_customers: number;
  recent_orders: Order[];
  low_stock_products: Product[];
}

export interface ConfigLink {
  label: string;
  href: string;
}

export interface ProductAttributeOption {
  value: string;
  label: string;
}

export interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  description: string;
  enabled: boolean;
}

export interface ProductSortOption {
  value: ProductSortValue;
  label: string;
}

export interface ProductRatingFilterOption {
  value: number;
  label: string;
}

export interface LegalPageConfig {
  title: string;
  updatedLabel: string;
  sections: Array<{
    title: string;
    text: string;
  }>;
}

export interface AdminAccountConfig {
  username: string;
  role: AdminRole;
  displayName: string;
}

export interface AdminUser {
  id: string;
  username: string;
  full_name?: string | null;
  role: AdminRole;
  created_at: string;
  updated_at?: string;
}

export interface CreateAdminUserInput {
  username: string;
  full_name?: string | null;
  password: string;
  role: AdminRole;
}

export interface HomeValueProp {
  title: string;
  text: string;
}

export interface HomeOfferCard {
  title: string;
  text: string;
  href: string;
  iconLabel: string;
  style: string;
}

export interface HomeServiceHighlight {
  title: string;
  text: string;
  iconLabel: string;
}

export interface HeroConfig {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export interface HeroBanner extends HeroConfig {
  href: string;
  discountBadgeText?: string;
  showDiscountBadge?: boolean;
}

export interface BannerImage extends HeroBanner {
  id: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBannerImageInput extends HeroBanner {
  display_order?: number;
  is_active?: boolean;
}

export interface ProductDetailConfig {
  productTypeLabel: string;
  detailsLabel: string;
  fallbackDetailsText: string;
  shippingLabel: string;
  shippingFreePrefix: string;
  relatedProductsTitle: string;
  reviewCountPrefix: string;
}

export interface CartConfig {
  title: string;
  emptyStatusText: string;
  emptyTitle: string;
  emptyText: string;
  emptyCtaLabel: string;
  removeLabel: string;
  orderSummaryTitle: string;
  subtotalLabel: string;
  shippingLabel: string;
  freeShippingLabel: string;
  totalLabel: string;
  checkoutLabel: string;
  continueShoppingLabel: string;
}

export interface ProductListingConfig {
  filtersTitle: string;
  allProductsLabel: string;
  productTypeTitle: string;
  customerRatingTitle: string;
  productCountSingular: string;
  productCountPlural: string;
  sortedByLabel: string;
}

export interface WishlistConfig {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  loginTitle: string;
  loginText: string;
  loginCtaLabel: string;
  emptyTitle: string;
  emptyText: string;
  emptyCtaLabel: string;
}

export interface SiteConfig {
  storeName: string;
  adminTitle: string;
  metadataTitle: string;
  metadataDescription: string;
  hero: HeroConfig;
  heroBanners: HeroBanner[];
  home: {
    valueProps: HomeValueProp[];
    offerCards: HomeOfferCard[];
    serviceHighlights: HomeServiceHighlight[];
    categoriesTitle: string;
    categoriesSubtitle: string;
    categoriesCtaLabel: string;
    categoryCardCta: string;
    newArrivalsTitle: string;
    newArrivalsCtaLabel: string;
    bestSellersTitle: string;
    bestSellersCtaLabel: string;
    noProductsTitle: string;
    noProductsText: string;
    featuredTitle: string;
    featuredSubtitle: string;
    featuredCtaLabel: string;
    collectionFallbackTitle: string;
  };
  navigation: {
    mainLinks: ConfigLink[];
    footerShopLinks: ConfigLink[];
    utilityLeftText: string;
    utilityLinks: ConfigLink[];
    categoryMenuLabel: string;
    logoTagline: string;
    searchPlaceholder: string;
    mobileSearchPlaceholder: string;
    wishlistLabel: string;
    cartLabel: string;
    loginLabel: string;
  };
  footer: {
    description: string;
    shopHeading: string;
    customerServiceHeading: string;
    customerServiceLinks: ConfigLink[];
    newsletterHeading: string;
    newsletterText: string;
    newsletterPlaceholder: string;
    newsletterButtonLabel: string;
    paymentLabels: string[];
    socialLinks: ConfigLink[];
    companyReviewsHeading: string;
    supportEmail: string;
    supportPhoneLabel: string;
    supportPhoneHref: string;
    operationsText: string;
    adminLinkLabel: string;
    copyrightName: string;
  };
  productDetail: ProductDetailConfig;
  productListing: ProductListingConfig;
  cart: CartConfig;
  wishlist: WishlistConfig;
  legal: {
    privacyPolicy: LegalPageConfig;
    termsAndConditions: LegalPageConfig;
  };
  shipping: {
    freeAbove: number;
    standardCharge: number;
  };
  checkout: {
    title: string;
    subtitle: string;
    emptyCartTitle: string;
    emptyCartCtaLabel: string;
    customerDetailsTitle: string;
    shippingAddressTitle: string;
    paymentTitle: string;
    paymentDescription: string;
    orderSummaryTitle: string;
    subtotalLabel: string;
    shippingLabel: string;
    freeShippingLabel: string;
    totalLabel: string;
    quantityLabel: string;
    preparingPaymentLabel: string;
    continueToPaymentLabel: string;
    paymentMethods: PaymentMethodConfig[];
    submitLabel: string;
    submittingLabel: string;
  };
  reviews: {
    reviewWindowDays: number;
    allowReviewEdits: boolean;
    reviewEditWindowDays: number;
    footerMinRating: number;
    footerLimit: number;
  };
  productAttributes: ProductAttributeOption[];
  productSortOptions: ProductSortOption[];
  productRatingFilters: ProductRatingFilterOption[];
}
