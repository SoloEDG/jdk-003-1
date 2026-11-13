import type { Effect } from "@/shared/domain";
import { relics, type RelicTrigger } from "@/shared/relics";
import type { EffectEvent } from "./effects";
// 本场战斗中，每个事件已经触发过的遗物。随战斗存档保存，读档后继续生效。
export type FiredMap = Record<RelicTrigger, string[]>;
export function emptyFired(): FiredMap {
  return { onPlay: [], onHurt: [], onTurnEnd: [] };
}
function relicEvent(key: string, effect: Effect): EffectEvent {
  return {
    effect,
    source: "hero",
    label: `遗物·${relics[key]!.name}`,
    fromRelic: true,
  };
}
function effectsFor(key: string): EffectEvent[] {
  switch (key) {
    case "emberCore":
      return [relicEvent(key, { type: "energy", amount: 1, target: "hero" })];
    case "thornedCrown":
      return [relicEvent(key, { type: "damage", amount: 5, target: "enemy" })];
    case "bloodVow":
      return [relicEvent(key, { type: "block", amount: 6, target: "hero" })];
    case "phoenixFeather":
      return [relicEvent(key, { type: "heal", amount: 2, target: "hero" })];
    case "hourglass":
      return [relicEvent(key, { type: "draw", amount: 1, target: "hero" })];
    case "mirrorShard":
      return [
        relicEvent(key, { type: "damage", amount: 3, target: "enemy" }),
        relicEvent(key, { type: "block", amount: 3, target: "hero" }),
      ];
    default:
      return [];
  }
}
// 一次事件的结算：每件遗物在该事件中至多触发一次。
// fired 记录本次结算结果，由调用方持久化；fromRelic 连锁事件不会再进入这里。
export function triggerRelics(
  trigger: RelicTrigger,
  owned: string[],
  fired: FiredMap,
): EffectEvent[] {
  fired[trigger] = [];
  const out: EffectEvent[] = [];
  for (const key of owned) {
    const spec = relics[key];
    if (!spec || spec.trigger !== trigger || fired[trigger].includes(key))
      continue;
    fired[trigger].push(key);
    out.push(...effectsFor(key));
  }
  return out;
}
