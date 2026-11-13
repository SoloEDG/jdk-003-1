import { reactive, readonly } from "vue";
import type { JourneyContext, Purchase } from "@/shared/domain";
import { makeStock, type StockItem } from "../lib/stock";
import { priceFor } from "../lib/pricing";
import { isSeen } from "@/features/relics";
import { duplicateRelicGold } from "@/shared/relics";
const state = reactive({
  context: null as JourneyContext | null,
  stock: [] as StockItem[],
  purchases: [] as Purchase[],
  open: false,
});
export const shopState = readonly(state);
export function openShop(c: JourneyContext) {
  if (state.context?.nodeId !== c.nodeId) {
    state.context = c;
    state.stock = makeStock(c);
  }
  state.open = true;
}
export function itemPrice(id: string) {
  const item = state.stock.find((s) => s.id === id);
  return item && state.context
    ? priceFor(item.basePrice, state.context.influence)
    : Infinity;
}
export interface PreparedPurchase {
  id: string;
  card: string;
  relic?: string;
  price: number;
  // 遗物已被入藏或曾售出时，购买直接折算金币。
  duplicate: boolean;
}
export function preparePurchase(id: string): PreparedPurchase | null {
  const item = state.stock.find((s) => s.id === id);
  if (!state.open || !item || item.sold) return null;
  return {
    id: item.id,
    card: item.card,
    relic: item.relic,
    price: itemPrice(id),
    duplicate: !!item.relic && isSeen(item.relic),
  };
}
export function completePurchase(p: PreparedPurchase) {
  const item = state.stock.find((s) => s.id === p.id);
  if (!item || item.sold) return false;
  item.sold = true;
  if (item.card)
    state.purchases.push({ id: item.id, card: item.card, price: p.price });
  return true;
}
export function duplicateGold() {
  return duplicateRelicGold;
}
export function closeShop() {
  state.open = false;
}
export function exportShop() {
  return JSON.parse(JSON.stringify(state));
}
export function restoreShop(d: ReturnType<typeof exportShop>) {
  Object.assign(state, d);
}
export function resetShop() {
  state.context = null;
  state.stock = [];
  state.purchases = [];
  state.open = false;
}
