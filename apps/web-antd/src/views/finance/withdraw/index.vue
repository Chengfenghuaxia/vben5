<script lang="ts" setup>
/**
 * 与 site_ui 常见约定一致：菜单 path 多为 `/finance/withdraw`，component 为 `/finance/withdraw/index`。
 * 实际页面逻辑在 `../withdrawal/index.vue`，此处仅作路由入口，避免动态路由落到「即将推出」占位页。
 */
import FinanceWithdrawalPage from '../withdrawal/index.vue';

defineOptions({ name: 'FinanceWithdraw' });
</script>

<template>
  <FinanceWithdrawalPage />
</template>
