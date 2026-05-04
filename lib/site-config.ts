import {
  defaultSiteConfig,
  mergeSiteConfigRecords,
  siteConfigRecordKeys,
  splitSiteConfigRecords,
  type SiteConfigRecord,
} from "@/config/app-properties";
import type { RowDataPacket } from "mysql2/promise";
import {
  executeQuery,
  getDatabasePool,
  getDatabaseSetupMessage,
  queryRows,
} from "@/lib/mariadb";
import type {
  ConfigLink,
  HeroBanner,
  HeroConfig,
  HomeValueProp,
  HomeOfferCard,
  HomeServiceHighlight,
  LegalPageConfig,
  PaymentMethodConfig,
  PaymentMethod,
  ProductAttributeOption,
  ProductRatingFilterOption,
  ProductSortOption,
  ProductSortValue,
  SiteConfig,
} from "@/types";

const LEGACY_CONFIG_KEY = "site";

type DbAppConfig = RowDataPacket & {
  key: string;
  value: unknown;
  is_active?: number | boolean;
  created_at?: string;
  updated_at?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function links(value: unknown, fallback: ConfigLink[]) {
  if (!Array.isArray(value)) return fallback;

  const result = value
    .filter(isRecord)
    .map((item) => ({
      label: text(item.label, ""),
      href: text(item.href, ""),
    }))
    .filter((item) => item.label && item.href);

  return result.length ? result : fallback;
}

function valueProps(value: unknown, fallback: HomeValueProp[]) {
  if (!Array.isArray(value)) return fallback;

  const result = value
    .filter(isRecord)
    .map((item) => ({
      title: text(item.title, ""),
      text: text(item.text, ""),
    }))
    .filter((item) => item.title && item.text);

  return result.length ? result : fallback;
}

function offerCards(value: unknown, fallback: HomeOfferCard[]) {
  if (!Array.isArray(value)) return fallback;

  const result = value
    .filter(isRecord)
    .map((item) => ({
      title: text(item.title, ""),
      text: text(item.text, ""),
      href: text(item.href, ""),
      iconLabel: text(item.iconLabel, ""),
      style: text(item.style, ""),
    }))
    .filter((item) => item.title && item.text && item.href);

  return result.length ? result : fallback;
}

function serviceHighlights(value: unknown, fallback: HomeServiceHighlight[]) {
  if (!Array.isArray(value)) return fallback;

  const result = value
    .filter(isRecord)
    .map((item) => ({
      title: text(item.title, ""),
      text: text(item.text, ""),
      iconLabel: text(item.iconLabel, ""),
    }))
    .filter((item) => item.title && item.text);

  return result.length ? result : fallback;
}

function stringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const result = value
    .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .map((item) => item.trim());

  return result.length ? result : fallback;
}

function productAttributes(
  value: unknown,
  fallback: ProductAttributeOption[]
) {
  if (!Array.isArray(value)) return fallback;

  const result = value
    .filter(isRecord)
    .map((item) => ({
      value: text(item.value, ""),
      label: text(item.label, ""),
    }))
    .filter((item) => item.value && item.label);

  return result.length ? result : fallback;
}

const validProductSortValues: ProductSortValue[] = [
  "newest",
  "featured",
  "rating_desc",
  "reviews_desc",
  "price_asc",
  "price_desc",
  "name",
];

function productSortOptions(value: unknown, fallback: ProductSortOption[]) {
  if (!Array.isArray(value)) return fallback;

  const result = value
    .filter(isRecord)
    .map((item) => {
      const candidate = text(item.value, "");
      if (!validProductSortValues.includes(candidate as ProductSortValue)) {
        return null;
      }

      return {
        value: candidate as ProductSortValue,
        label: text(item.label, candidate),
      };
    })
    .filter((item): item is ProductSortOption => Boolean(item));

  return result.length ? result : fallback;
}

function productRatingFilters(
  value: unknown,
  fallback: ProductRatingFilterOption[]
) {
  if (!Array.isArray(value)) return fallback;

  const result = value
    .filter(isRecord)
    .map((item) => ({
      value: numberValue(item.value, 0),
      label: text(item.label, ""),
    }))
    .filter((item) => item.value > 0 && item.value <= 5 && item.label);

  return result.length ? result : fallback;
}

function paymentMethods(value: unknown, fallback: PaymentMethodConfig[]) {
  if (!Array.isArray(value)) return fallback;

  const result = value
    .filter(isRecord)
    .map((item) => {
      const id: PaymentMethod = item.id === "razorpay" ? "razorpay" : "cod";
      return {
        id,
        label: text(item.label, id),
        description: text(item.description, ""),
        enabled: typeof item.enabled === "boolean" ? item.enabled : true,
      };
    });

  return result.length ? result : fallback;
}

function legalPage(value: unknown, fallback: LegalPageConfig): LegalPageConfig {
  const source = isRecord(value) ? value : {};
  const sections = Array.isArray(source.sections)
    ? source.sections
        .filter(isRecord)
        .map((section) => ({
          title: text(section.title, ""),
          text: text(section.text, ""),
        }))
        .filter((section) => section.title && section.text)
    : fallback.sections;

  return {
    title: text(source.title, fallback.title),
    updatedLabel: text(source.updatedLabel, fallback.updatedLabel),
    sections: sections.length ? sections : fallback.sections,
  };
}

function heroConfig(value: unknown, fallback: HeroConfig): HeroConfig {
  const source = isRecord(value) ? value : {};

  return {
    eyebrow: text(source.eyebrow, fallback.eyebrow),
    title: text(source.title, fallback.title),
    description: text(source.description, fallback.description),
    imageUrl: text(source.imageUrl, fallback.imageUrl),
    imageAlt: text(source.imageAlt, fallback.imageAlt),
    primaryCtaLabel: text(source.primaryCtaLabel, fallback.primaryCtaLabel),
    primaryCtaHref: text(source.primaryCtaHref, fallback.primaryCtaHref),
    secondaryCtaLabel: text(source.secondaryCtaLabel, fallback.secondaryCtaLabel),
    secondaryCtaHref: text(source.secondaryCtaHref, fallback.secondaryCtaHref),
  };
}

function heroBanner(value: unknown, fallback: HeroBanner): HeroBanner {
  const source = isRecord(value) ? value : {};
  const base = heroConfig(source, fallback);

  return {
    ...base,
    href: text(source.href, fallback.href || base.primaryCtaHref),
    discountBadgeText: text(
      source.discountBadgeText,
      fallback.discountBadgeText || ""
    ),
    showDiscountBadge: booleanValue(
      source.showDiscountBadge,
      Boolean(fallback.showDiscountBadge && fallback.discountBadgeText)
    ),
  };
}

function heroBanners(
  value: unknown,
  fallback: HeroBanner[],
  legacyHero: HeroConfig
) {
  const legacyBanner: HeroBanner = {
    ...legacyHero,
    href: legacyHero.primaryCtaHref,
  };
  const fallbackBanners = fallback.length ? fallback : [legacyBanner];

  if (!Array.isArray(value)) return fallbackBanners;

  const result = value
    .filter(isRecord)
    .map((item, index) => heroBanner(item, fallbackBanners[index] || legacyBanner))
    .filter((item) => item.title && item.imageUrl && item.href);

  return result.length ? result : fallbackBanners;
}

export function normalizeSiteConfig(value: unknown): SiteConfig {
  const source = isRecord(value) ? value : {};
  const hero = isRecord(source.hero) ? source.hero : {};
  const home = isRecord(source.home) ? source.home : {};
  const navigation = isRecord(source.navigation) ? source.navigation : {};
  const footer = isRecord(source.footer) ? source.footer : {};
  const productDetail = isRecord(source.productDetail) ? source.productDetail : {};
  const productListing = isRecord(source.productListing) ? source.productListing : {};
  const cart = isRecord(source.cart) ? source.cart : {};
  const wishlist = isRecord(source.wishlist) ? source.wishlist : {};
  const legal = isRecord(source.legal) ? source.legal : {};
  const shipping = isRecord(source.shipping) ? source.shipping : {};
  const checkout = isRecord(source.checkout) ? source.checkout : {};
  const reviews = isRecord(source.reviews) ? source.reviews : {};
  const normalizedHero = heroConfig(hero, defaultSiteConfig.hero);

  return {
    storeName: text(source.storeName, defaultSiteConfig.storeName),
    adminTitle: text(source.adminTitle, defaultSiteConfig.adminTitle),
    metadataTitle: text(source.metadataTitle, defaultSiteConfig.metadataTitle),
    metadataDescription: text(
      source.metadataDescription,
      defaultSiteConfig.metadataDescription
    ),
    hero: normalizedHero,
    heroBanners: heroBanners(
      source.heroBanners,
      defaultSiteConfig.heroBanners,
      normalizedHero
    ),
    home: {
      valueProps: valueProps(home.valueProps, defaultSiteConfig.home.valueProps),
      offerCards: offerCards(home.offerCards, defaultSiteConfig.home.offerCards),
      serviceHighlights: serviceHighlights(
        home.serviceHighlights,
        defaultSiteConfig.home.serviceHighlights
      ),
      categoriesTitle: text(
        home.categoriesTitle,
        defaultSiteConfig.home.categoriesTitle
      ),
      categoriesSubtitle: text(
        home.categoriesSubtitle,
        defaultSiteConfig.home.categoriesSubtitle
      ),
      categoriesCtaLabel: text(
        home.categoriesCtaLabel,
        defaultSiteConfig.home.categoriesCtaLabel
      ),
      categoryCardCta: text(
        home.categoryCardCta,
        defaultSiteConfig.home.categoryCardCta
      ),
      newArrivalsTitle: text(
        home.newArrivalsTitle,
        defaultSiteConfig.home.newArrivalsTitle
      ),
      newArrivalsCtaLabel: text(
        home.newArrivalsCtaLabel,
        defaultSiteConfig.home.newArrivalsCtaLabel
      ),
      bestSellersTitle: text(
        home.bestSellersTitle,
        defaultSiteConfig.home.bestSellersTitle
      ),
      bestSellersCtaLabel: text(
        home.bestSellersCtaLabel,
        defaultSiteConfig.home.bestSellersCtaLabel
      ),
      noProductsTitle: text(
        home.noProductsTitle,
        defaultSiteConfig.home.noProductsTitle
      ),
      noProductsText: text(
        home.noProductsText,
        defaultSiteConfig.home.noProductsText
      ),
      featuredTitle: text(home.featuredTitle, defaultSiteConfig.home.featuredTitle),
      featuredSubtitle: text(
        home.featuredSubtitle,
        defaultSiteConfig.home.featuredSubtitle
      ),
      featuredCtaLabel: text(
        home.featuredCtaLabel,
        defaultSiteConfig.home.featuredCtaLabel
      ),
      collectionFallbackTitle: text(
        home.collectionFallbackTitle,
        defaultSiteConfig.home.collectionFallbackTitle
      ),
    },
    navigation: {
      mainLinks: links(navigation.mainLinks, defaultSiteConfig.navigation.mainLinks),
      footerShopLinks: links(
        navigation.footerShopLinks,
        defaultSiteConfig.navigation.footerShopLinks
      ),
      utilityLeftText: text(
        navigation.utilityLeftText,
        defaultSiteConfig.navigation.utilityLeftText
      ),
      utilityLinks: links(
        navigation.utilityLinks,
        defaultSiteConfig.navigation.utilityLinks
      ),
      categoryMenuLabel: text(
        navigation.categoryMenuLabel,
        defaultSiteConfig.navigation.categoryMenuLabel
      ),
      logoTagline: text(
        navigation.logoTagline,
        defaultSiteConfig.navigation.logoTagline
      ),
      searchPlaceholder: text(
        navigation.searchPlaceholder,
        defaultSiteConfig.navigation.searchPlaceholder
      ),
      mobileSearchPlaceholder: text(
        navigation.mobileSearchPlaceholder,
        defaultSiteConfig.navigation.mobileSearchPlaceholder
      ),
      wishlistLabel: text(
        navigation.wishlistLabel,
        defaultSiteConfig.navigation.wishlistLabel
      ),
      cartLabel: text(navigation.cartLabel, defaultSiteConfig.navigation.cartLabel),
      loginLabel: text(
        navigation.loginLabel,
        defaultSiteConfig.navigation.loginLabel
      ),
    },
    footer: {
      description: text(footer.description, defaultSiteConfig.footer.description),
      shopHeading: text(footer.shopHeading, defaultSiteConfig.footer.shopHeading),
      customerServiceHeading: text(
        footer.customerServiceHeading,
        defaultSiteConfig.footer.customerServiceHeading
      ),
      customerServiceLinks: links(
        footer.customerServiceLinks,
        defaultSiteConfig.footer.customerServiceLinks
      ),
      newsletterHeading: text(
        footer.newsletterHeading,
        defaultSiteConfig.footer.newsletterHeading
      ),
      newsletterText: text(
        footer.newsletterText,
        defaultSiteConfig.footer.newsletterText
      ),
      newsletterPlaceholder: text(
        footer.newsletterPlaceholder,
        defaultSiteConfig.footer.newsletterPlaceholder
      ),
      newsletterButtonLabel: text(
        footer.newsletterButtonLabel,
        defaultSiteConfig.footer.newsletterButtonLabel
      ),
      paymentLabels: stringList(
        footer.paymentLabels,
        defaultSiteConfig.footer.paymentLabels
      ),
      socialLinks: links(footer.socialLinks, defaultSiteConfig.footer.socialLinks),
      companyReviewsHeading: text(
        footer.companyReviewsHeading,
        defaultSiteConfig.footer.companyReviewsHeading
      ),
      supportEmail: text(footer.supportEmail, defaultSiteConfig.footer.supportEmail),
      supportPhoneLabel: text(
        footer.supportPhoneLabel,
        defaultSiteConfig.footer.supportPhoneLabel
      ),
      supportPhoneHref: text(
        footer.supportPhoneHref,
        defaultSiteConfig.footer.supportPhoneHref
      ),
      operationsText: text(
        footer.operationsText,
        defaultSiteConfig.footer.operationsText
      ),
      adminLinkLabel: text(
        footer.adminLinkLabel,
        defaultSiteConfig.footer.adminLinkLabel
      ),
      copyrightName: text(footer.copyrightName, defaultSiteConfig.footer.copyrightName),
    },
    productDetail: {
      productTypeLabel: text(
        productDetail.productTypeLabel,
        defaultSiteConfig.productDetail.productTypeLabel
      ),
      detailsLabel: text(
        productDetail.detailsLabel,
        defaultSiteConfig.productDetail.detailsLabel
      ),
      fallbackDetailsText: text(
        productDetail.fallbackDetailsText,
        defaultSiteConfig.productDetail.fallbackDetailsText
      ),
      shippingLabel: text(
        productDetail.shippingLabel,
        defaultSiteConfig.productDetail.shippingLabel
      ),
      shippingFreePrefix: text(
        productDetail.shippingFreePrefix,
        defaultSiteConfig.productDetail.shippingFreePrefix
      ),
      relatedProductsTitle: text(
        productDetail.relatedProductsTitle,
        defaultSiteConfig.productDetail.relatedProductsTitle
      ),
      reviewCountPrefix: text(
        productDetail.reviewCountPrefix,
        defaultSiteConfig.productDetail.reviewCountPrefix
      ),
    },
    productListing: {
      filtersTitle: text(
        productListing.filtersTitle,
        defaultSiteConfig.productListing.filtersTitle
      ),
      allProductsLabel: text(
        productListing.allProductsLabel,
        defaultSiteConfig.productListing.allProductsLabel
      ),
      productTypeTitle: text(
        productListing.productTypeTitle,
        defaultSiteConfig.productListing.productTypeTitle
      ),
      customerRatingTitle: text(
        productListing.customerRatingTitle,
        defaultSiteConfig.productListing.customerRatingTitle
      ),
      productCountSingular: text(
        productListing.productCountSingular,
        defaultSiteConfig.productListing.productCountSingular
      ),
      productCountPlural: text(
        productListing.productCountPlural,
        defaultSiteConfig.productListing.productCountPlural
      ),
      sortedByLabel: text(
        productListing.sortedByLabel,
        defaultSiteConfig.productListing.sortedByLabel
      ),
    },
    cart: {
      title: text(cart.title, defaultSiteConfig.cart.title),
      emptyStatusText: text(
        cart.emptyStatusText,
        defaultSiteConfig.cart.emptyStatusText
      ),
      emptyTitle: text(cart.emptyTitle, defaultSiteConfig.cart.emptyTitle),
      emptyText: text(cart.emptyText, defaultSiteConfig.cart.emptyText),
      emptyCtaLabel: text(
        cart.emptyCtaLabel,
        defaultSiteConfig.cart.emptyCtaLabel
      ),
      removeLabel: text(cart.removeLabel, defaultSiteConfig.cart.removeLabel),
      orderSummaryTitle: text(
        cart.orderSummaryTitle,
        defaultSiteConfig.cart.orderSummaryTitle
      ),
      subtotalLabel: text(
        cart.subtotalLabel,
        defaultSiteConfig.cart.subtotalLabel
      ),
      shippingLabel: text(
        cart.shippingLabel,
        defaultSiteConfig.cart.shippingLabel
      ),
      freeShippingLabel: text(
        cart.freeShippingLabel,
        defaultSiteConfig.cart.freeShippingLabel
      ),
      totalLabel: text(cart.totalLabel, defaultSiteConfig.cart.totalLabel),
      checkoutLabel: text(
        cart.checkoutLabel,
        defaultSiteConfig.cart.checkoutLabel
      ),
      continueShoppingLabel: text(
        cart.continueShoppingLabel,
        defaultSiteConfig.cart.continueShoppingLabel
      ),
    },
    wishlist: {
      eyebrow: text(wishlist.eyebrow, defaultSiteConfig.wishlist.eyebrow),
      title: text(wishlist.title, defaultSiteConfig.wishlist.title),
      description: text(
        wishlist.description,
        defaultSiteConfig.wishlist.description
      ),
      ctaLabel: text(wishlist.ctaLabel, defaultSiteConfig.wishlist.ctaLabel),
      loginTitle: text(
        wishlist.loginTitle,
        defaultSiteConfig.wishlist.loginTitle
      ),
      loginText: text(wishlist.loginText, defaultSiteConfig.wishlist.loginText),
      loginCtaLabel: text(
        wishlist.loginCtaLabel,
        defaultSiteConfig.wishlist.loginCtaLabel
      ),
      emptyTitle: text(
        wishlist.emptyTitle,
        defaultSiteConfig.wishlist.emptyTitle
      ),
      emptyText: text(wishlist.emptyText, defaultSiteConfig.wishlist.emptyText),
      emptyCtaLabel: text(
        wishlist.emptyCtaLabel,
        defaultSiteConfig.wishlist.emptyCtaLabel
      ),
    },
    legal: {
      privacyPolicy: legalPage(
        legal.privacyPolicy,
        defaultSiteConfig.legal.privacyPolicy
      ),
      termsAndConditions: legalPage(
        legal.termsAndConditions,
        defaultSiteConfig.legal.termsAndConditions
      ),
    },
    shipping: {
      freeAbove: numberValue(
        shipping.freeAbove,
        defaultSiteConfig.shipping.freeAbove
      ),
      standardCharge: numberValue(
        shipping.standardCharge,
        defaultSiteConfig.shipping.standardCharge
      ),
    },
    checkout: {
      title: text(checkout.title, defaultSiteConfig.checkout.title),
      subtitle: text(checkout.subtitle, defaultSiteConfig.checkout.subtitle),
      emptyCartTitle: text(
        checkout.emptyCartTitle,
        defaultSiteConfig.checkout.emptyCartTitle
      ),
      emptyCartCtaLabel: text(
        checkout.emptyCartCtaLabel,
        defaultSiteConfig.checkout.emptyCartCtaLabel
      ),
      customerDetailsTitle: text(
        checkout.customerDetailsTitle,
        defaultSiteConfig.checkout.customerDetailsTitle
      ),
      shippingAddressTitle: text(
        checkout.shippingAddressTitle,
        defaultSiteConfig.checkout.shippingAddressTitle
      ),
      paymentTitle: text(
        checkout.paymentTitle,
        defaultSiteConfig.checkout.paymentTitle
      ),
      paymentDescription: text(
        checkout.paymentDescription,
        defaultSiteConfig.checkout.paymentDescription
      ),
      orderSummaryTitle: text(
        checkout.orderSummaryTitle,
        defaultSiteConfig.checkout.orderSummaryTitle
      ),
      subtotalLabel: text(
        checkout.subtotalLabel,
        defaultSiteConfig.checkout.subtotalLabel
      ),
      shippingLabel: text(
        checkout.shippingLabel,
        defaultSiteConfig.checkout.shippingLabel
      ),
      freeShippingLabel: text(
        checkout.freeShippingLabel,
        defaultSiteConfig.checkout.freeShippingLabel
      ),
      totalLabel: text(checkout.totalLabel, defaultSiteConfig.checkout.totalLabel),
      quantityLabel: text(
        checkout.quantityLabel,
        defaultSiteConfig.checkout.quantityLabel
      ),
      preparingPaymentLabel: text(
        checkout.preparingPaymentLabel,
        defaultSiteConfig.checkout.preparingPaymentLabel
      ),
      continueToPaymentLabel: text(
        checkout.continueToPaymentLabel,
        defaultSiteConfig.checkout.continueToPaymentLabel
      ),
      submitLabel: text(checkout.submitLabel, defaultSiteConfig.checkout.submitLabel),
      submittingLabel: text(
        checkout.submittingLabel,
        defaultSiteConfig.checkout.submittingLabel
      ),
      paymentMethods: paymentMethods(
        checkout.paymentMethods,
        defaultSiteConfig.checkout.paymentMethods
      ),
    },
    reviews: {
      reviewWindowDays: Math.max(
        1,
        Math.floor(
          numberValue(
            reviews.reviewWindowDays,
            defaultSiteConfig.reviews.reviewWindowDays
          )
        )
      ),
      allowReviewEdits: booleanValue(
        reviews.allowReviewEdits,
        defaultSiteConfig.reviews.allowReviewEdits
      ),
      reviewEditWindowDays: Math.max(
        1,
        Math.floor(
          numberValue(
            reviews.reviewEditWindowDays,
            defaultSiteConfig.reviews.reviewEditWindowDays
          )
        )
      ),
      footerMinRating: Math.min(
        5,
        Math.max(
          1,
          numberValue(
            reviews.footerMinRating,
            defaultSiteConfig.reviews.footerMinRating
          )
        )
      ),
      footerLimit: Math.max(
        1,
        Math.floor(
          numberValue(reviews.footerLimit, defaultSiteConfig.reviews.footerLimit)
        )
      ),
    },
    productAttributes: productAttributes(
      source.productAttributes,
      defaultSiteConfig.productAttributes
    ),
    productSortOptions: productSortOptions(
      source.productSortOptions,
      defaultSiteConfig.productSortOptions
    ),
    productRatingFilters: productRatingFilters(
      source.productRatingFilters,
      defaultSiteConfig.productRatingFilters
    ),
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  if (!getDatabasePool()) return defaultSiteConfig;

  try {
    const rows = await queryRows<DbAppConfig[]>(
      `SELECT \`key\`, \`value\`, is_active
       FROM app_config
       WHERE \`key\` IN (${siteConfigRecordKeys.map(() => "?").join(", ")})
          OR \`key\` = ?`,
      [...siteConfigRecordKeys, LEGACY_CONFIG_KEY]
    );

    if (!rows.length) return defaultSiteConfig;

    const featureRows = rows.filter(
      (row) =>
        (siteConfigRecordKeys as readonly string[]).includes(row.key) &&
        row.is_active !== 0
    );
    if (featureRows.length) {
      return normalizeSiteConfig(
        mergeSiteConfigRecords(
          featureRows.map((row) => ({
            key: row.key,
            value: parseConfigValue(row.value),
          }))
        )
      );
    }

    const legacy = rows.find((row) => row.key === LEGACY_CONFIG_KEY);
    return normalizeSiteConfig(parseConfigValue(legacy?.value));
  } catch {
    return defaultSiteConfig;
  }
}

export async function updateSiteConfig(input: SiteConfig) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const config = normalizeSiteConfig(input);
  await updateSiteConfigRecords(splitSiteConfigRecords(config));

  return config;
}

export async function getSiteConfigRecords(): Promise<SiteConfigRecord[]> {
  const config = await getSiteConfig();
  const fallbackRecords = splitSiteConfigRecords(config);
  if (!getDatabasePool()) return fallbackRecords;

  try {
    const rows = await queryRows<DbAppConfig[]>(
      `SELECT \`key\`, \`value\`, is_active, created_at, updated_at
       FROM app_config
       WHERE \`key\` IN (${siteConfigRecordKeys.map(() => "?").join(", ")})
       ORDER BY FIELD(\`key\`, ${siteConfigRecordKeys.map(() => "?").join(", ")})`,
      [...siteConfigRecordKeys, ...siteConfigRecordKeys]
    );
    const rowByKey = new Map(rows.map((row) => [row.key, row]));

    return fallbackRecords.map((record) => {
      const row = rowByKey.get(record.key);
      return {
        ...record,
        value: row ? parseConfigValue(row.value) : record.value,
        isActive: row ? row.is_active !== 0 : true,
        createdAt: row?.created_at,
        updatedAt: row?.updated_at,
      };
    });
  } catch {
    return fallbackRecords;
  }
}

export async function updateSiteConfigRecords(records: SiteConfigRecord[]) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const recordMap = new Map(records.map((record) => [record.key, record.value]));
  const activeMap = new Map(
    records.map((record) => [record.key, record.isActive !== false])
  );
  const normalizedConfig = normalizeSiteConfig(mergeSiteConfigRecords(records));
  const normalizedRecords = splitSiteConfigRecords(normalizedConfig).map((record) => ({
    ...record,
    value: recordMap.has(record.key) ? record.value : record.value,
    isActive: activeMap.get(record.key) ?? true,
  }));

  for (const record of normalizedRecords) {
    await executeQuery(
      `INSERT INTO app_config (\`key\`, \`value\`, is_active, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         \`value\` = VALUES(\`value\`),
         is_active = VALUES(is_active),
         updated_at = VALUES(updated_at)`,
      [record.key, JSON.stringify(record.value), record.isActive === false ? 0 : 1]
    );
  }

  await executeQuery("DELETE FROM app_config WHERE `key` = ?", [LEGACY_CONFIG_KEY]);

  return normalizedConfig;
}

function parseConfigValue(value: unknown) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
