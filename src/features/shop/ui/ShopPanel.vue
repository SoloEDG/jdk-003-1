<script setup lang="ts">
import { shopState, itemPrice, duplicateGold } from "../model/state";
import { quoteMessage } from "../lib/pricing";
import { cards } from "@/shared/cards";
import { relics, triggerLabels } from "@/shared/relics";
defineProps<{ gold: number }>();
defineEmits<{ buy: [id: string]; leave: [] }>();
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">04 / THE TRADER</span><span>旅途补给</span>
    </div>
    <h2>路上的旧相识</h2>
    <template v-if="shopState.open"
      ><p class="muted">
        {{
          quoteMessage(
            shopState.context!.influence.favor,
            shopState.context!.influence.scarcity,
          )
        }}
      </p>
      <div class="stock">
        <div v-for="item in shopState.stock" :key="item.id">
          <div>
            <b v-if="item.card">{{ cards[item.card]?.name }}</b>
            <b v-else :data-relic="item.relic"
              ><i class="relic-sigil">{{ relics[item.relic!]?.sigil }}</i
              >{{ relics[item.relic!]?.name }}<em class="relic-tag">遗物</em></b
            >
            <small v-if="item.card">{{ cards[item.card]?.text }}</small>
            <small v-else
              >{{ relics[item.relic!]?.text }}<br />触发 ·
              {{ triggerLabels[relics[item.relic!]!.trigger] }}</small
            >
          </div>
          <button
            :disabled="item.sold || gold < itemPrice(item.id)"
            :data-stock="item.id"
            @click="$emit('buy', item.id)"
          >
            <template v-if="item.sold">已售出</template>
            <template v-else>{{ itemPrice(item.id) }} 金 · 购买</template>
          </button>
        </div>
        <p class="muted">
          重复的遗物无法再次入藏，购买后将折算为 {{ duplicateGold() }} 金币。
        </p>
      </div>
      <button data-action="leave-shop" @click="$emit('leave')">
        收好行囊，继续前进 →
      </button></template
    >
    <div v-else class="empty-mini">
      寻找路线上的天平标记。安路的好感让金币走得更远。
    </div>
  </section>
</template>
