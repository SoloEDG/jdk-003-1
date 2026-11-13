// 遗物贯穿整次远征：同名仅可拥有一件，重复获得折算金币。
// 触发时机只有三类：出牌、失去生命、回合结束，均进入战斗效果队列。
export type RelicTrigger = "onPlay" | "onHurt" | "onTurnEnd";
export interface RelicSpec {
  key: string;
  name: string;
  sigil: string;
  trigger: RelicTrigger;
  rarity: "common" | "rare";
  text: string;
  condition: string;
}
export const relics: Record<string, RelicSpec> = {
  emberCore: {
    key: "emberCore",
    name: "余烬核心",
    sigil: "✺",
    trigger: "onPlay",
    rarity: "common",
    text: "每打出一张牌，获得 1 能量。",
    condition: "出牌时触发，每张牌至多一次。",
  },
  thornedCrown: {
    key: "thornedCrown",
    name: "荆棘王冠",
    sigil: "♛",
    trigger: "onHurt",
    rarity: "common",
    text: "受到伤害后，对敌人造成 5 点伤害。",
    condition: "失去生命时触发；每次伤害事件至多一次。",
  },
  bloodVow: {
    key: "bloodVow",
    name: "血誓石",
    sigil: "❦",
    trigger: "onHurt",
    rarity: "rare",
    text: "受到伤害后，获得 6 点格挡。",
    condition: "失去生命时触发；每次伤害事件至多一次。",
  },
  phoenixFeather: {
    key: "phoenixFeather",
    name: "凤凰羽",
    sigil: "🜂",
    trigger: "onTurnEnd",
    rarity: "common",
    text: "回合结束时回复 2 点生命。",
    condition: "回合结束时触发，每回合至多一次。",
  },
  hourglass: {
    key: "hourglass",
    name: "碎时沙漏",
    sigil: "⧖",
    trigger: "onTurnEnd",
    rarity: "common",
    text: "回合结束时抽 1 张牌。",
    condition: "回合结束时触发，每回合至多一次。",
  },
  mirrorShard: {
    key: "mirrorShard",
    name: "镜裂碎片",
    sigil: "◈",
    trigger: "onHurt",
    rarity: "rare",
    text: "受到伤害后，对敌人造成 3 点伤害并获得 3 点格挡。",
    condition: "失去生命时触发；每次伤害事件至多一次。",
  },
};
export const relicKeys = Object.keys(relics);
export function relicLabel(key: string) {
  return relics[key]?.name ?? key;
}
export const triggerLabels: Record<RelicTrigger, string> = {
  onPlay: "出牌",
  onHurt: "失去生命",
  onTurnEnd: "回合结束",
};
// 重复获得遗物时的折算金币：已经拥有或曾经出售，都按此价结算。
export const duplicateRelicGold = 18;
