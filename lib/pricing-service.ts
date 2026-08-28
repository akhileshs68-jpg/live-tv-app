import { adminDb } from "@/lib/firebase-admin-db";
import { PRODUCTS_CATALOG } from "@/lib/products-catalog";
import type { ProductCatalogItem } from "@/lib/db-types";

export const TESTNET_PLAN_ID = "LIVE_TV_PREMIUM_MONTHLY";
export const DEFAULT_TESTNET_PRICE = 0.25; // 0.25 Test-Pi default

const CONFIG_COLLECTION = "system_config";
const PRICING_DOC = "testnet_pricing";

export interface TestnetPricingConfig {
  planId: string;
  pricePi: number;
  currency: string;
  billingDays: number;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Server-authoritative retrieval of the active Testnet subscription price.
 * Reads from Firestore system_config/testnet_pricing.
 * Falls back to DEFAULT_TESTNET_PRICE (0.25 Test-Pi) if not yet configured.
 */
export async function getTestnetSubscriptionPrice(): Promise<number> {
  try {
    const docRef = adminDb.collection(CONFIG_COLLECTION).doc(PRICING_DOC);
    const snap = await docRef.get();

    if (snap.exists) {
      const data = snap.data();
      if (
        data &&
        typeof data.pricePi === "number" &&
        !isNaN(data.pricePi) &&
        isFinite(data.pricePi) &&
        data.pricePi > 0
      ) {
        return Number(data.pricePi.toFixed(4));
      }
    }
  } catch (error) {
    console.warn("[PricingService] Notice reading testnet pricing config from Firestore:", error);
  }

  return DEFAULT_TESTNET_PRICE;
}

/**
 * Server-authoritative update of the Testnet subscription price.
 * Strictly verifies and validates the decimal price before persisting.
 */
export async function setTestnetSubscriptionPrice(
  newPrice: number,
  updatedBy: string = "admin"
): Promise<{ success: boolean; pricePi: number; updatedAt: string; error?: string }> {
  // 1. Strict server validation
  if (typeof newPrice !== "number" || isNaN(newPrice) || !isFinite(newPrice)) {
    return {
      success: false,
      pricePi: DEFAULT_TESTNET_PRICE,
      updatedAt: new Date().toISOString(),
      error: "Invalid price: Price must be a valid numeric decimal value.",
    };
  }

  if (newPrice <= 0) {
    return {
      success: false,
      pricePi: DEFAULT_TESTNET_PRICE,
      updatedAt: new Date().toISOString(),
      error: "Invalid price: Subscription price must be greater than 0 Test-Pi.",
    };
  }

  if (newPrice > 10000) {
    return {
      success: false,
      pricePi: DEFAULT_TESTNET_PRICE,
      updatedAt: new Date().toISOString(),
      error: "Invalid price: Subscription price exceeds the maximum permitted threshold (10,000 Test-Pi).",
    };
  }

  const sanitizedPrice = Number(newPrice.toFixed(4));
  const nowIso = new Date().toISOString();

  const configData: TestnetPricingConfig = {
    planId: TESTNET_PLAN_ID,
    pricePi: sanitizedPrice,
    currency: "Test-Pi",
    billingDays: 30,
    updatedAt: nowIso,
    updatedBy,
  };

  try {
    const docRef = adminDb.collection(CONFIG_COLLECTION).doc(PRICING_DOC);
    await docRef.set(configData, { merge: true });

    return {
      success: true,
      pricePi: sanitizedPrice,
      updatedAt: nowIso,
    };
  } catch (error: any) {
    console.error("[PricingService] Error saving testnet pricing config:", error);
    return {
      success: false,
      pricePi: DEFAULT_TESTNET_PRICE,
      updatedAt: nowIso,
      error: error?.message || "Failed to persist pricing update to database.",
    };
  }
}

/**
 * Returns dynamic product catalog with active server-configured testnet prices.
 */
export async function getActiveProductsCatalog(): Promise<ProductCatalogItem[]> {
  const dynamicTestnetPrice = await getTestnetSubscriptionPrice();

  const catalog = { ...PRODUCTS_CATALOG };

  // Dynamically update or insert the LIVE_TV_PREMIUM_MONTHLY plan
  catalog[TESTNET_PLAN_ID] = {
    productId: TESTNET_PLAN_ID,
    name: "Live TV Premium",
    description: "30 days of complete ad-free live streaming, priority Watch Points rewards, and unlocked premium channels.",
    pricePi: dynamicTestnetPrice,
    durationDays: 30,
    plan: "premium",
    active: true,
  };

  return Object.values(catalog);
}
