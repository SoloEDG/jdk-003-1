<script setup lang="ts">
import { relicState, altarOptions, chooseAltar, skipAltar } from "../model/state";
import { relics, triggerLabels } from "@/shared/relics";
defineEmits<{ leave: [] }>();
const altar = relicState.altar;
function pick(key: string) {
  chooseAltar(key);
}
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">ALTAR / THE OFFERING</span><span>二选一</span>
    </div>
    <h2>无名祭坛</h2>
    <p class="muted">
      两件遗物之间只有一次取舍。同名遗物整次远征仅可拥有一件，重复取得会折算为
      18 金币；已经出售的遗物不会再次按首次取得结算。
    </p>
    <template v-if="altar && !altar.chosen && !altar.skipped">
      <div class="reward-options altar-options">
        <button
          v-for="key in altarOptions()"
          :key="key"
          :data-relic="key"
          @click="pick(key)"
        >
          <b><i class="relic-sigil">{{ relics[key]?.sigil }}</i>{{
            relics[key]?.name
          }}</b>
          <small>{{ relics[key]?.text }}</small>
          <em
            >触发 · {{ triggerLabels[relics[key]!.trigger] }} ·
            {{ relics[key]?.condition }}</em
          >
        </button>
      </div>
      <div class="toolbar">
        <button data-action="skip-altar" @click="skipAltar()">
          转身离开，不触碰祭坛
        </button>
      </div>
    </template>
    <div v-else class="empty-mini">
      祭坛已经给出回应。继续前进，让所选的遗物在远征中显形。
    </div>
    <div class="toolbar">
      <button data-action="leave-altar" @click="$emit('leave')">
        收好行囊，继续前进 →
      </button>
    </div>
  </section>
</template>
