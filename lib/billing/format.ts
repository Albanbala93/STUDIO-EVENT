import type { BillingCycle, Plan } from "./types";

/**
 * Formattage prix (FR, HT). Centralisé pour rester cohérent partout.
 * "Sur mesure" si le prix est null.
 */

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number | null): string {
  if (amount === null) return "Sur mesure";
  return EUR.format(amount);
}

/** Retourne le prix correspondant au cycle demandé. */
export function planPrice(plan: Plan, cycle: BillingCycle): number | null {
  return cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
}

/** Économie annuelle vs paiement mensuel — utile pour le badge "-2 mois". */
export function annualSavings(plan: Plan): number | null {
  if (plan.monthlyPrice === null || plan.annualPrice === null) return null;
  const yearlyIfMonthly = plan.monthlyPrice * 12;
  const saved = yearlyIfMonthly - plan.annualPrice;
  return saved > 0 ? saved : null;
}

export function formatCycle(cycle: BillingCycle): string {
  return cycle === "annual" ? "/ an" : "/ mois";
}
