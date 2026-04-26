import type { BillingCycle, PlanId, SubscriptionState } from "./types";

/**
 * Abonnement courant — mock localStorage en attendant Stripe.
 * Par défaut, tout nouveau visiteur démarre sur le plan Discovery.
 */

const STORAGE_KEY = "stratly_subscription_v1";

function defaultSubscription(): SubscriptionState {
  return {
    planId: "discovery",
    cycle: "monthly",
    startedAt: new Date().toISOString(),
  };
}

/** SSR-safe : si pas de window, retourne le plan par défaut. */
export function getSubscription(): SubscriptionState {
  if (typeof window === "undefined") return defaultSubscription();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = defaultSubscription();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw) as SubscriptionState;
  } catch {
    return defaultSubscription();
  }
}

/** Met à jour le plan + cycle. À appeler depuis la page pricing. */
export function setSubscription(
  planId: PlanId,
  cycle: BillingCycle,
): SubscriptionState {
  const next: SubscriptionState = {
    planId,
    cycle,
    startedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

/** Reset au plan Discovery — utile pour debug et "résilier" UI. */
export function resetSubscription(): SubscriptionState {
  const fresh = defaultSubscription();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }
  return fresh;
}
