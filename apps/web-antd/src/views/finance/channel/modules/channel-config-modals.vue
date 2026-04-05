<script lang="ts" setup>
import type { FinChannelConfigCode } from './config/codes';

import AtmpayForm from './config/atmpay-form.vue';
import EpayTarspayForm from './config/epay-tarspay-form.vue';
import HypayForm from './config/hypay-form.vue';
import KilipayForm from './config/kilipay-form.vue';
import MkpayForm from './config/mkpay-form.vue';
import Pay4zForm from './config/pay4z-form.vue';
import QqpayForm from './config/qqpay-form.vue';
import SpayForm from './config/spay-form.vue';
import StarpagoForm from './config/starpago-form.vue';
import WinwinpayForm from './config/winwinpay-form.vue';

defineOptions({ name: 'FinanceChannelConfigModals' });

const open = defineModel<boolean>('open', { default: false });

defineProps<{
  rowCode: FinChannelConfigCode | null;
}>();

const emit = defineEmits<{ success: [] }>();
</script>

<template>
  <MkpayForm
    v-if="open && rowCode === 'mkpay'"
    v-model:open="open"
    row-code="mkpay"
    @success="emit('success')"
  />
  <EpayTarspayForm
    v-if="open && rowCode === 'epay'"
    v-model:open="open"
    row-code="epay"
    @success="emit('success')"
  />
  <EpayTarspayForm
    v-if="open && rowCode === 'tarspay'"
    v-model:open="open"
    row-code="tarspay"
    @success="emit('success')"
  />
  <AtmpayForm
    v-if="open && rowCode === 'atmpay'"
    v-model:open="open"
    row-code="atmpay"
    @success="emit('success')"
  />
  <QqpayForm
    v-if="open && rowCode === 'qqpay'"
    v-model:open="open"
    row-code="qqpay"
    @success="emit('success')"
  />
  <KilipayForm
    v-if="open && rowCode === 'kilipay'"
    v-model:open="open"
    row-code="kilipay"
    @success="emit('success')"
  />
  <StarpagoForm
    v-if="open && rowCode === 'starpago'"
    v-model:open="open"
    row-code="starpago"
    @success="emit('success')"
  />
  <HypayForm
    v-if="open && rowCode === 'hypay'"
    v-model:open="open"
    row-code="hypay"
    @success="emit('success')"
  />
  <WinwinpayForm
    v-if="open && rowCode === 'winwinpay'"
    v-model:open="open"
    row-code="winwinpay"
    @success="emit('success')"
  />
  <SpayForm
    v-if="open && rowCode === 'spay'"
    v-model:open="open"
    row-code="spay"
    @success="emit('success')"
  />
  <Pay4zForm
    v-if="open && rowCode === 'pay4z'"
    v-model:open="open"
    row-code="pay4z"
    @success="emit('success')"
  />
</template>
