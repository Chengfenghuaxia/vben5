<script lang="ts" setup>
import type { ActingAgentAdConfigEntry, ActingAgentRow } from '../useApi';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { createActingAgentApi, updateActingAgentApi } from '../useApi';
import { useVbenForm } from '#/adapter/form';

import { useDrawerFormSchema } from '../data';

const AD_PLATFORMS = ['meta', 'tiktok', 'kwai'] as const;

const emits = defineEmits<{ success: [] }>();

const formData = ref<ActingAgentRow>();
const id = ref<number>();

const [Form, formApi] = useVbenForm({
  schema: useDrawerFormSchema(),
  showDefaultActions: false,
});

function adDefaults(): Record<string, string> {
  const o: Record<string, string> = { ad_platform: 'meta' };
  for (const p of AD_PLATFORMS) {
    o[`${p}_pixel_id`] = '';
    o[`${p}_secret_key`] = '';
    o[`${p}_test_code`] = '';
  }
  return o;
}

function rowAdFields(row: ActingAgentRow): Record<string, string> {
  const o = adDefaults();
  const cfg = row.ad_config;
  if (!cfg || typeof cfg !== 'object') {
    return o;
  }
  for (const p of AD_PLATFORMS) {
    const e = cfg[p] as ActingAgentAdConfigEntry | undefined;
    o[`${p}_pixel_id`] = e?.pixel_id ?? '';
    o[`${p}_secret_key`] = e?.secret_key ?? '';
    o[`${p}_test_code`] = e?.test_code ?? '';
  }
  const code = row.ad_codes;
  if (
    typeof code === 'string' &&
    AD_PLATFORMS.includes(code as (typeof AD_PLATFORMS)[number])
  ) {
    o.ad_platform = code;
  }
  return o;
}

function buildAdPayload(values: Record<string, unknown>): {
  ad_codes: string;
  ad_config: Partial<Record<string, ActingAgentAdConfigEntry>> | undefined;
} {
  const ad_config: Partial<Record<string, ActingAgentAdConfigEntry>> = {};
  for (const p of AD_PLATFORMS) {
    const pixel = String(values[`${p}_pixel_id`] ?? '').trim();
    const secret = String(values[`${p}_secret_key`] ?? '').trim();
    const test = String(values[`${p}_test_code`] ?? '').trim();
    if (pixel || secret || test) {
      ad_config[p] = {
        pixel_id: pixel,
        secret_key: secret,
        test_code: test,
      };
    }
  }
  const plat = String(values.ad_platform ?? 'meta');
  const ad_codes = AD_PLATFORMS.includes(plat as (typeof AD_PLATFORMS)[number])
    ? plat
    : 'meta';
  return {
    ad_codes,
    ad_config: Object.keys(ad_config).length > 0 ? ad_config : undefined,
  };
}

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values = await formApi.getValues<Record<string, unknown>>();
    const { ad_codes, ad_config } = buildAdPayload(values);
    const payload = {
      ad_codes,
      ad_config,
      agent_type: Number(values.agent_type),
      is_single: Number(values.is_single),
      name: String(values.name ?? '').trim(),
      pwa_type: Number(values.pwa_type),
      team_id: Number(values.team_id),
      url: String(values.url ?? '').trim() || undefined,
    };
    drawerApi.lock();
    try {
      if (id.value) {
        await updateActingAgentApi({ ...payload, id: id.value });
      } else {
        await createActingAgentApi(payload);
      }
      emits('success');
      drawerApi.close();
    } catch {
      // 请求层已提示或由拦截器处理
    } finally {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = drawerApi.getData<ActingAgentRow | Record<string, never>>();
    await formApi.resetForm();

    const editRow =
      data && 'id' in data && data.id != null
        ? (data as ActingAgentRow)
        : undefined;
    if (editRow) {
      formData.value = editRow;
      id.value = editRow.id;
    } else {
      formData.value = undefined;
      id.value = undefined;
    }

    await nextTick();
    const base = {
      agent_type: 1,
      is_single: 2,
      name: '',
      pwa_type: 1,
      url: '',
    };
    if (editRow) {
      await formApi.setValues({
        ...base,
        agent_type: editRow.agent_type ?? 1,
        is_single: editRow.is_single ?? 2,
        name: editRow.name ?? '',
        pwa_type: editRow.pwa_type ?? 1,
        team_id: editRow.team_id,
        url: editRow.url ?? '',
        ...rowAdFields(editRow),
      });
    } else {
      await formApi.setValues({
        ...base,
        ...adDefaults(),
      });
    }
  },
});

const drawerTitle = computed(() =>
  formData.value?.id != null ? '编辑渠道' : '新增渠道',
);
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form />
  </Drawer>
</template>
