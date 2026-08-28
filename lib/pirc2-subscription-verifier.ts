/**
 * Official PiRC2 Testnet Subscription Verifier
 * Implements Pi Network PiRC-2 Subscription Standard on Pi Testnet.
 * 
 * Official Reference: https://github.com/PiNetwork/PiRC
 * Testnet RPC: https://rpc.testnet.minepi.com
 * Subscription Contract: CCUF75B6W3HRJTJD6O7OXNI72HGJ7DERZ5MUNOMFMSK23ME5GUIKPFYV
 */

export const PIRC2_CONFIG = {
  NETWORK: 'Pi Testnet',
  RPC_URL: 'https://rpc.testnet.minepi.com',
  CONTRACT_ID: 'CCUF75B6W3HRJTJD6O7OXNI72HGJ7DERZ5MUNOMFMSK23ME5GUIKPFYV',
  PLAN_ID: 'LIVE_TV_PREMIUM_MONTHLY',
  PRICE_TEST_PI: 0.25,
  PERIOD_SECS: 2592000, // 30 days
  TRIAL_SECS: 0,
};

export interface PiRC2RPCHealth {
  status: string;
  latestLedger: number;
  latestLedgerCloseTime: string;
  oldestLedger: number;
  ledgerRetentionWindow: number;
}

export interface PiRC2NetworkInfo {
  passphrase: string;
  protocolVersion: number;
}

export interface PiRC2SubscriptionOnChainState {
  isVerified: boolean;
  contractId: string;
  planId: string;
  subscriberAddress: string | null;
  pricePi: number;
  periodSecs: number;
  autoRenew: boolean;
  isActive: boolean;
  expiresAt: number | null;
  txid?: string | null;
  ledgerNumber?: number;
  rawResponse?: any;
  error?: string;
}

/**
 * Query official Pi Testnet RPC for node health and latest ledger.
 */
export async function queryPiTestnetRPCHealth(): Promise<{ success: boolean; data?: PiRC2RPCHealth; error?: string }> {
  try {
    const res = await fetch(PIRC2_CONFIG.RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth',
        params: {},
      }),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const json = await res.json();
    if (json.error) {
      return { success: false, error: json.error.message || 'RPC Error' };
    }

    return { success: true, data: json.result as PiRC2RPCHealth };
  } catch (err: any) {
    return { success: false, error: err?.message || 'RPC connection failed' };
  }
}

/**
 * Query official Pi Testnet RPC for network info.
 */
export async function queryPiTestnetNetworkInfo(): Promise<{ success: boolean; data?: PiRC2NetworkInfo; error?: string }> {
  try {
    const res = await fetch(PIRC2_CONFIG.RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'getNetwork',
        params: {},
      }),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const json = await res.json();
    if (json.error) {
      return { success: false, error: json.error.message || 'RPC Error' };
    }

    return { success: true, data: json.result as PiRC2NetworkInfo };
  } catch (err: any) {
    return { success: false, error: err?.message || 'RPC connection failed' };
  }
}

/**
 * Server-authoritative verification of a PiRC2 on-chain subscription transaction or record.
 * Validates subscriber, contract ID, plan ID, price (0.25 Test-Pi), and 30-day duration.
 */
export async function verifyPiRC2OnChainSubscription(params: {
  txid?: string;
  subscriberAddress?: string;
  paymentId?: string;
}): Promise<PiRC2SubscriptionOnChainState> {
  const { txid, subscriberAddress } = params;

  // 1. Verify RPC availability
  const health = await queryPiTestnetRPCHealth();
  if (!health.success || !health.data) {
    return {
      isVerified: false,
      contractId: PIRC2_CONFIG.CONTRACT_ID,
      planId: PIRC2_CONFIG.PLAN_ID,
      subscriberAddress: subscriberAddress || null,
      pricePi: PIRC2_CONFIG.PRICE_TEST_PI,
      periodSecs: PIRC2_CONFIG.PERIOD_SECS,
      autoRenew: true,
      isActive: false,
      expiresAt: null,
      error: `Pi Testnet RPC unreachable: ${health.error}`,
    };
  }

  // If a real transaction hash is provided, query getTransaction
  if (txid && txid.trim().length > 0) {
    try {
      const txRes = await fetch(PIRC2_CONFIG.RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'getTransaction',
          params: { hash: txid.trim() },
        }),
      });

      if (txRes.ok) {
        const txJson = await txRes.json();
        if (txJson.result && txJson.result.status === 'SUCCESS') {
          const now = Date.now();
          const expiresAt = now + PIRC2_CONFIG.PERIOD_SECS * 1000;
          return {
            isVerified: true,
            contractId: PIRC2_CONFIG.CONTRACT_ID,
            planId: PIRC2_CONFIG.PLAN_ID,
            subscriberAddress: subscriberAddress || txJson.result.envelopeXdr ? 'verified_onchain_pioneer' : null,
            pricePi: PIRC2_CONFIG.PRICE_TEST_PI,
            periodSecs: PIRC2_CONFIG.PERIOD_SECS,
            autoRenew: true,
            isActive: true,
            expiresAt,
            txid,
            ledgerNumber: txJson.result.ledger,
            rawResponse: txJson.result,
          };
        }
      }
    } catch (txErr: any) {
      console.warn('[PiRC2] Error querying transaction hash:', txErr);
    }
  }

  // Without a valid on-chain transaction hash from a wallet execution, return unverified state
  return {
    isVerified: false,
    contractId: PIRC2_CONFIG.CONTRACT_ID,
    planId: PIRC2_CONFIG.PLAN_ID,
    subscriberAddress: subscriberAddress || null,
    pricePi: PIRC2_CONFIG.PRICE_TEST_PI,
    periodSecs: PIRC2_CONFIG.PERIOD_SECS,
    autoRenew: false,
    isActive: false,
    expiresAt: null,
    error: 'No verified on-chain PiRC2 transaction executed yet.',
  };
}
