import { shuffle, hash } from "@/shared/random";
import { relicKeys } from "@/shared/relics";
// 所有遗物产出都由节点 id 确定性播种，保证读档后同一节点结果一致。
export function pickRelic(
  seed: string,
  eligible: (key: string) => boolean,
): string {
  return shuffle(relicKeys, hash(seed)).find(eligible) ?? "";
}
export function pickRelicPair(
  seed: string,
  eligible: (key: string) => boolean,
): string[] {
  return shuffle(relicKeys, hash(`altar-${seed}`)).filter(eligible).slice(0, 2);
}
