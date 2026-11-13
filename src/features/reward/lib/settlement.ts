import type { BattleResult, RewardOffer } from "@/shared/domain";
import { rewardPool } from "./pool";
import { rewardRelic } from "@/features/relics";
export function offerFrom(result: BattleResult): RewardOffer {
  const key = rewardRelic(result.context);
  return {
    id: `reward-${result.id}`,
    source: result.id,
    cards: rewardPool(result.context),
    // 空串表示可获得的新遗物已全部入藏或售出：不再按首次取得结算。
    relic: key,
    gold: result.gold + result.context.influence.favor * 2,
    heal: result.context.region === "forest" ? 3 : 0,
    claimed: false,
  };
}
export function validChoice(offer: RewardOffer | null, key: string | null) {
  return (
    !!offer && !offer.claimed && (key === null || offer.cards.includes(key))
  );
}
