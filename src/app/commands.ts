import { enterRoute, resolveRoute, resetRoute } from "@/features/route";
import {
  battleState,
  beginBattle,
  playCard,
  endTurn,
  resetBattle,
} from "@/features/battle";
import {
  deckState,
  deckCards,
  addCard,
  earnGold,
  spendGold,
  setHp,
  heal,
  upgradeCard,
  removeCard,
  openCamp,
  useCamp,
  resetDeck,
} from "@/features/deck";
import { openReward, claimReward, resetReward } from "@/features/reward";
import {
  openShop,
  preparePurchase,
  completePurchase,
  closeShop,
  resetShop,
} from "@/features/shop";
import {
  acquireRelic,
  sellRelic,
  openAltar,
  chooseAltar,
  skipAltar,
  closeAltar,
  resetRelics,
  ownedRelics,
} from "@/features/relics";
import { relicLabel, duplicateRelicGold } from "@/shared/relics";
import {
  session,
  switchTab,
  setContext,
  notify,
  finishRun,
  resetSession,
} from "./session";
import { save, clearSave } from "./persistence";
function persist() {
  if (!save()) notify("本地保存失败，请保留当前页面。");
}
export function navigate(id: string) {
  if (session.ended) return;
  const c = enterRoute(id);
  if (!c) return;
  setContext(c);
  if (c.kind === "shop") {
    openShop(c);
    switchTab("shop");
  } else if (c.kind === "camp") {
    openCamp();
    switchTab("deck");
  } else if (c.kind === "altar") {
    openAltar(c);
    switchTab("altar");
  } else {
    // 战斗只携带本场开始时的遗物快照，远征中的变化不影响进行中的战斗。
    beginBattle(
      c,
      deckCards(),
      deckState.hero.hp,
      deckState.hero.maxHp,
      ownedRelics(),
    );
    switchTab("battle");
  }
  notify(
    `进入 ${c.nodeId} · 威胁 ${c.influence.heat} / 好感 ${c.influence.favor}`,
  );
  persist();
}
export function play(id: string) {
  playCard(id);
  persist();
}
export function turn() {
  endTurn();
  persist();
}
export function settle() {
  const r = battleState.result;
  if (!r) return;
  if (!r.won) {
    setHp(r.hp);
    finishRun();
    notify("这次旅途已经结束。重新启程可保留你的经验。");
    persist();
    return;
  }
  if (openReward(JSON.parse(JSON.stringify(r)))) {
    setHp(r.hp);
    switchTab("reward");
    notify("胜利！选择一张牌或跳过卡牌，金币与遗物都会结算。");
  }
  persist();
}
// 统一的遗物入藏：重复（含曾出售）折算金币，绝不重复结算首次取得。
function collectRelic(key: string) {
  const result = acquireRelic(key);
  if (!result) return "";
  if (result.status === "duplicate") {
    earnGold(result.gold);
    return `遗物「${relicLabel(result.key)}」已持有或曾出售，折算 ${result.gold} 金币。`;
  }
  return `获得遗物「${relicLabel(result.key)}」。`;
}
export function claim(skip: boolean) {
  const grant = claimReward(skip);
  if (!grant) return;
  if (grant.card) addCard(grant.card);
  earnGold(grant.gold);
  heal(grant.heal);
  const relicMessage = grant.relic ? collectRelic(grant.relic) : "";
  resolveRoute();
  if (session.context?.kind === "boss") {
    finishRun();
    notify("裂隙已被封存。你把余烬带回了黎明。");
  } else notify(relicMessage || "奖励已结算，新的路线开放。");
  switchTab("route");
  persist();
}
export function buy(id: string) {
  const p = preparePurchase(id);
  if (!p || !spendGold(p.price)) {
    notify("无法购买：库存或金币不足。");
    return;
  }
  if (!completePurchase(p)) {
    earnGold(p.price);
    return;
  }
  if (p.relic) {
    if (p.duplicate) {
      // 陈列时已被入藏/售出的遗物：购买只兑现折算，不走首次取得。
      earnGold(duplicateRelicGold);
      notify(`该遗物已在收藏或曾出售，折算 ${duplicateRelicGold} 金币。`);
    } else notify(collectRelic(p.relic) || "交易完成。");
  } else {
    addCard(p.card);
    notify("交易完成，卡牌已收入牌组。");
  }
  persist();
}
export function leaveShop() {
  closeShop();
  resolveRoute();
  switchTab("route");
  persist();
}
export function altarPick(key: string) {
  const result = chooseAltar(key);
  if (!result) return;
  if (result.status === "duplicate") {
    earnGold(result.gold);
    notify(
      `遗物「${relicLabel(result.key)}」已持有或曾出售，折算 ${result.gold} 金币。`,
    );
  } else notify(`祭坛赐予遗物「${relicLabel(result.key)}」。`);
  persist();
}
export function altarSkip() {
  if (!skipAltar()) return;
  notify("你没有触碰祭坛，两件遗物重新沉入阴影。");
  persist();
}
export function leaveAltar() {
  closeAltar();
  resolveRoute();
  switchTab("route");
  persist();
}
export function sell(key: string) {
  if (battleState.phase === "playing") return;
  const gold = sellRelic(key);
  if (gold == null) return;
  earnGold(gold);
  notify(`遗物已出售，获得 ${gold} 金币；它不会再以首次取得结算。`);
  persist();
}
export function camp(action: "rest" | "upgrade") {
  if (
    !session.context ||
    session.context.kind !== "camp" ||
    !useCamp(action, session.context.influence.heat)
  )
    return;
  resolveRoute();
  notify("篝火逐渐熄灭，你准备好继续上路。");
  persist();
}
export function upgrade(id: string) {
  if (battleState.phase === "playing") return;
  notify(upgradeCard(id) ? "卡牌强化完成。" : "无法强化：金币不足或已经强化。");
  persist();
}
export function remove(id: string) {
  if (battleState.phase === "playing") return;
  notify(
    removeCard(id)
      ? "已移除卡牌。"
      : "无法移除：至少保留五张牌，且需要足够金币。",
  );
  persist();
}
export function restart() {
  resetRoute();
  resetBattle();
  resetDeck();
  resetReward();
  resetShop();
  resetRelics();
  resetSession();
  clearSave();
  persist();
}
