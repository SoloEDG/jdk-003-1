import { reactive, readonly } from "vue";
import type { JourneyContext } from "@/shared/domain";
import {
  relics,
  duplicateRelicGold,
  type RelicSpec,
} from "@/shared/relics";
import { pickRelic, pickRelicPair } from "../lib/offers";

export interface AltarState {
  nodeId: string;
  options: string[];
  chosen: string | null;
  skipped: boolean;
}
interface RelicCollectionState {
  owned: string[];
  // 曾经出售的遗物：此后任何来源都不再按首次获得结算。
  sold: string[];
  altar: AltarState | null;
}
const state = reactive<RelicCollectionState>({
  owned: [],
  sold: [],
  altar: null,
});
export const relicState = readonly(state);
export function ownedRelics(): string[] {
  return [...state.owned];
}
export function hasRelic(key: string) {
  return state.owned.includes(key);
}
// 已经拥有或曾经出售的遗物，都不能再作为“新遗物”出现。
export function isSeen(key: string) {
  return state.owned.includes(key) || state.sold.includes(key);
}
export type Acquisition =
  | { status: "gained"; key: string; gold: 0 }
  | { status: "duplicate"; key: string; gold: number };
// 统一获得入口：同名唯一，重复（含已出售）折算金币，绝不重复入藏。
export function acquireRelic(key: string): Acquisition | null {
  if (!relics[key]) return null;
  if (isSeen(key))
    return { status: "duplicate", key, gold: duplicateRelicGold };
  state.owned.push(key);
  return { status: "gained", key, gold: 0 };
}
export function sellRelic(key: string): number | null {
  const idx = state.owned.indexOf(key);
  if (idx < 0) return null;
  state.owned.splice(idx, 1);
  if (!state.sold.includes(key)) state.sold.push(key);
  return relicSellPrice(relics[key]!);
}
export function relicSellPrice(spec: RelicSpec) {
  return spec.rarity === "rare" ? 35 : 22;
}
// 战利品池：战斗胜利后按节点确定性地给出一件未拥有、未出售的遗物。
export function rewardRelic(context: JourneyContext): string {
  return pickRelic(context.nodeId, (key) => !isSeen(key));
}
export function openAltar(context: JourneyContext) {
  if (state.altar && state.altar.nodeId === context.nodeId) return;
  const options = pickRelicPair(context.nodeId, (key) => !isSeen(key));
  state.altar = { nodeId: context.nodeId, options, chosen: null, skipped: false };
}
export function altarOptions() {
  return state.altar?.options ?? [];
}
export function chooseAltar(key: string): Acquisition | null {
  const altar = state.altar;
  if (!altar || altar.chosen || altar.skipped) return null;
  if (!altar.options.includes(key)) return null;
  const result = acquireRelic(key);
  if (!result) return null;
  altar.chosen = result.status === "gained" ? key : null;
  return result;
}
export function skipAltar() {
  const altar = state.altar;
  if (!altar || altar.chosen || altar.skipped) return false;
  altar.skipped = true;
  return true;
}
export function closeAltar() {
  state.altar = null;
}
export function exportRelics() {
  return JSON.parse(JSON.stringify(state)) as RelicCollectionState;
}
export function restoreRelics(d: RelicCollectionState) {
  state.owned = Array.isArray(d.owned) ? d.owned : [];
  state.sold = Array.isArray(d.sold) ? d.sold : [];
  state.altar = d.altar ?? null;
}
export function resetRelics() {
  state.owned = [];
  state.sold = [];
  state.altar = null;
}
