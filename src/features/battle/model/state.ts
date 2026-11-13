import { reactive, readonly } from "vue";
import type {
  Actor,
  BattleResult,
  CardInstance,
  JourneyContext,
} from "@/shared/domain";
import { cards } from "@/shared/cards";
import { uid } from "@/shared/random";
import { spawnEnemy, enemyIntent, type Enemy } from "../lib/enemies";
import { makePiles, drawCards, discardHand, type Piles } from "../lib/piles";
import {
  resolveEffect,
  poisonTick,
  damage,
  type EffectEvent,
} from "../lib/effects";
import {
  triggerRelics,
  emptyFired,
  type FiredMap,
} from "../lib/relicEngine";
interface BattleState {
  id: string;
  context: JourneyContext | null;
  hero: Actor;
  enemy: Enemy | null;
  piles: Piles;
  energy: number;
  turn: number;
  phase: "idle" | "playing" | "won" | "lost";
  queue: EffectEvent[];
  log: string[];
  result: BattleResult | null;
  // 本场携带的遗物（远征收藏的快照）与各事件的已触发记录。
  relics: string[];
  relicFired: FiredMap;
}
const emptyHero = (): Actor => ({
  hp: 72,
  maxHp: 72,
  block: 0,
  strength: 0,
  poison: 0,
  thorns: 0,
});
const state = reactive<BattleState>({
  id: "",
  context: null,
  hero: emptyHero(),
  enemy: null,
  piles: makePiles([], ""),
  energy: 3,
  turn: 1,
  phase: "idle",
  queue: [],
  log: [],
  result: null,
  relics: [],
  relicFired: emptyFired(),
});
export const battleState = readonly(state);
export function beginBattle(
  context: JourneyContext,
  deck: CardInstance[],
  hp: number,
  maxHp: number,
  relicsOwned: string[] = [],
) {
  state.id = uid("battle");
  state.context = context;
  state.hero = { ...emptyHero(), hp, maxHp };
  state.enemy = spawnEnemy(context);
  state.piles = makePiles(deck, context.nodeId);
  state.energy = 3;
  state.turn = 1;
  state.phase = "playing";
  state.queue = [];
  state.result = null;
  state.relics = [...relicsOwned];
  state.relicFired = emptyFired();
  state.log = ["战斗开始。状态和牌堆仅属于本场遭遇。"];
  drawCards(state.piles, 5, 1);
}
function finish() {
  if (!state.enemy || !state.context) return;
  if (state.hero.hp <= 0 || state.enemy.hp <= 0) {
    state.phase = state.hero.hp <= 0 ? "lost" : "won";
    state.result = {
      id: state.id,
      nodeId: state.context.nodeId,
      won: state.phase === "won",
      hp: state.hero.hp,
      gold: state.enemy.reward,
      context: JSON.parse(JSON.stringify(state.context)),
    };
    // 胜负已定：清空待处理事件，已完成的事件不会再触发遗物。
    state.queue = [];
  }
}
// 失去生命事件：每个事件每件遗物至多触发一次；遗物造成的连锁伤害不递归。
function fireHurtRelics() {
  if (state.phase !== "playing") return;
  const events = triggerRelics("onHurt", state.relics, state.relicFired);
  if (events.length) state.queue.unshift(...events);
}
function drain() {
  while (state.queue.length && state.phase === "playing") {
    const event = state.queue.shift()!;
    if (event.effect.type === "draw") {
      drawCards(state.piles, event.effect.amount, state.turn);
      state.log.unshift(`${event.label}：抽取 ${event.effect.amount} 张牌`);
    } else if (event.effect.type === "energy") {
      state.energy += event.effect.amount;
      state.log.unshift(`${event.label}：能量 +${event.effect.amount}`);
    } else if (state.enemy) {
      state.log.unshift(
        resolveEffect(event, state.hero, state.enemy, (target) => {
          // 只处理旅人的失去生命；敌人受伤不触发旅人的遗物。
          // 每个伤害事件回调一次，triggerRelics 保证每件遗物在该事件中至多一次。
          if (target === state.hero && !event.fromRelic) fireHurtRelics();
        }),
      );
    }
    finish();
  }
  state.log = state.log.slice(0, 18);
}
export function playCard(id: string) {
  if (state.phase !== "playing") return false;
  const card = state.piles.hand.find((c) => c.id === id);
  if (!card) return false;
  const spec = cards[card.key]!;
  if (state.energy < spec.cost) return false;
  state.energy -= spec.cost;
  state.piles.hand = state.piles.hand.filter((c) => c.id !== id);
  (spec.kind === "power" ? state.piles.exhaust : state.piles.discard).push(
    card,
  );
  state.queue.push(
    ...spec.effects.map((e) => ({
      effect: {
        ...e,
        amount: e.amount + (card.upgraded && e.type !== "energy" ? 2 : 0),
      },
      source: "hero" as const,
      label: spec.name,
    })),
  );
  drain();
  // 出牌事件：每张牌结算一次，每件遗物至多触发一次。
  if (state.phase === "playing") {
    state.queue.unshift(
      ...triggerRelics("onPlay", state.relics, state.relicFired),
    );
    drain();
  }
  return true;
}
export function endTurn() {
  if (state.phase !== "playing" || !state.enemy) return;
  const poison = poisonTick(state.enemy);
  if (poison) state.log.unshift(`敌人中毒失去 ${poison} 生命`);
  finish();
  if (state.phase !== "playing") return;
  const hpBefore = state.hero.hp;
  const amount = enemyIntent(state.enemy, state.turn);
  damage(state.hero, amount);
  state.log.unshift(`敌人攻击 ${amount}`);
  if (hpBefore > state.hero.hp) fireHurtRelics();
  drain();
  finish();
  if (state.phase !== "playing") return;
  const heroPoison = poisonTick(state.hero);
  if (heroPoison) {
    state.log.unshift(`中毒失去 ${heroPoison} 生命`);
    fireHurtRelics();
    drain();
  }
  finish();
  if (state.phase !== "playing") return;
  discardHand(state.piles);
  // 回合结束事件：每回合每件遗物至多触发一次，先结算遗物再进入新回合。
  state.queue.unshift(
    ...triggerRelics("onTurnEnd", state.relics, state.relicFired),
  );
  drain();
  finish();
  if (state.phase !== "playing") return;
  state.turn++;
  state.energy = 3;
  state.hero.block = 0;
  state.enemy.block = state.turn % 3 === 0 ? 5 : 0;
  drawCards(state.piles, 5, state.turn);
}
export function currentIntent() {
  return state.enemy ? enemyIntent(state.enemy, state.turn) : 0;
}
export function exportBattle() {
  return JSON.parse(JSON.stringify(state)) as BattleState;
}
export function restoreBattle(d: BattleState) {
  Object.assign(state, d);
  if (!state.relicFired) state.relicFired = emptyFired();
  if (!Array.isArray(state.relics)) state.relics = [];
}
export function resetBattle() {
  state.phase = "idle";
  state.context = null;
  state.enemy = null;
  state.result = null;
  state.piles = makePiles([], "");
  state.log = [];
  state.relics = [];
  state.relicFired = emptyFired();
}
