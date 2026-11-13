import type { JourneyContext } from "@/shared/domain";
import { shuffle, hash } from "@/shared/random";
import { isSeen, relicSellPrice } from "@/features/relics";
import { relics } from "@/shared/relics";
export interface StockItem {
  id: string;
  card: string;
  relic?: string;
  basePrice: number;
  sold: boolean;
}
export function makeStock(c: JourneyContext): StockItem[] {
  const cards: StockItem[] = shuffle(
    ["venom", "focus", "fury", "burst", "shelter", "guard"],
    hash(c.nodeId),
  )
    .slice(0, 3)
    .map((card, i) => ({
      id: `${c.nodeId}-stock-${i}`,
      card,
      basePrice: ["fury", "burst", "focus"].includes(card) ? 48 : 32,
      sold: false,
    }));
  // 商店额外陈列一件未入藏、未出售的遗物；售空时整件缺货。
  const relicKey = shuffle(
    Object.keys(relics),
    hash(`relic-${c.nodeId}`),
  ).find((key) => !isSeen(key));
  if (relicKey)
    cards.push({
      id: `${c.nodeId}-relic`,
      card: "",
      relic: relicKey,
      basePrice: relicSellPrice(relics[relicKey]!) + 20,
      sold: false,
    });
  return cards;
}
