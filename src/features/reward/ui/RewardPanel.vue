<script setup lang="ts">
import { rewardState, chooseReward } from "../model/state";
import { cards } from "@/shared/cards";
import { relics, triggerLabels, duplicateRelicGold } from "@/shared/relics";
defineEmits<{ claim: [skip: boolean] }>();
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">03 / THE SPOILS</span><span>三选一 · 附遗物</span>
    </div>
    <h2>把胜利带进下一场</h2>
    <p class="muted">
      战斗结束后结算金币，并选择一张新牌。同名遗物仅可拥有一件，重复获得折算
      {{ duplicateRelicGold }} 金币；已出售的遗物不会再次按首次取得结算。
    </p>
    <div v-if="rewardState.offer && !rewardState.offer.claimed">
      <div class="notice">
        ✦ {{ rewardState.offer.gold }} 金币 · 回复
        {{ rewardState.offer.heal }} 生命
      </div>
      <div
        v-if="rewardState.offer.relic"
        class="relic-loot"
        :data-relic="rewardState.offer.relic"
      >
        <b
          ><i class="relic-sigil">{{
            relics[rewardState.offer.relic]?.sigil
          }}</i
          >{{ relics[rewardState.offer.relic]?.name }}</b
        >
        <small>{{ relics[rewardState.offer.relic]?.text }}</small>
        <em
          >触发 ·
          {{
            triggerLabels[relics[rewardState.offer.relic]!.trigger]
          }}
          · 随战利品一并收入</em
        >
      </div>
      <div v-else class="relic-loot relic-loot-empty">
        可获得的遗物都已入藏或售出，本次不再结算遗物。
      </div>
      <div class="reward-options">
        <button
          v-for="key in rewardState.offer.cards"
          :key="key"
          :class="{ selected: rewardState.selected === key }"
          @click="chooseReward(key)"
        >
          <b>{{ cards[key]?.name }}</b
          ><small>{{ cards[key]?.text }}</small
          ><em>{{ cards[key]?.rarity }}</em>
        </button>
      </div>
      <div class="toolbar">
        <button
          :disabled="!rewardState.selected"
          data-action="claim"
          @click="$emit('claim', false)"
        >
          收下选中牌与战利品</button
        ><button data-action="skip-reward" @click="$emit('claim', true)">
          仅收取金币与遗物
        </button>
      </div>
    </div>
    <div v-else class="empty-mini">
      {{
        rewardState.offer?.claimed
          ? "战利品已收入行囊。下一段路线已开放。"
          : "战胜敌人，发现下一张关键卡牌。"
      }}
    </div>
  </section>
</template>
