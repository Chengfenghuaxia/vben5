<script lang="ts" setup>
/**
 * site_ui 常见 path：`/finance/withdraworder` → 组件 `/finance/withdraworder/index`。
 * 后端 prem 多仍下发此 component；此处仅转发到实际页面，避免动态路由落到占位页。
 */
import FinanceWithdrawalPage from '../withdrawal/index.vue';

defineOptions({ name: 'FinanceWithdrawOrder' });
</script>

<template>
  <FinanceWithdrawalPage />
</template>
