<script lang="ts" setup>
/**
 * 单条排序 — site_ui `sortgame.vue`（普通：/site/v1/game/update/sort，热门：/site/v1/game/update/hot/sort）
 */
import type { GameListRow } from '../useApi';

import { updateGameHotSortApi, updateGameSortApi } from '../useApi';
import { Form, FormItem, InputNumber, Modal, message } from 'ant-design-vue';
import { reactive, ref, watch } from 'vue';

defineOptions({ name: 'GameListSortModal' });

const emit = defineEmits<{ success: [] }>();

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  isHotGame?: boolean;
  row: GameListRow | null;
}>();

const loading = ref(false);
const form = reactive<{ game_code: string; sort: number | undefined }>({
  game_code: '',
  sort: undefined,
});

watch(open, (v) => {
  if (v && props.row) {
    form.game_code = String(props.row.game_code ?? '');
    const s = props.row.sort;
    form.sort = s === null || s === undefined ? undefined : Number(s);
  }
});

async function onOk() {
  if (form.sort === undefined || Number.isNaN(form.sort)) {
    message.warning('请输入排序');
    return;
  }
  loading.value = true;
  try {
    const body = { game_code: form.game_code, sort: form.sort };
    if (props.isHotGame) {
      await updateGameHotSortApi(body);
    } else {
      await updateGameSortApi(body);
    }
    message.success('修改成功');
    open.value = false;
    emit('success');
  } catch {
    /* 拦截器 */
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="loading"
    destroy-on-close
    title="排序"
    width="400px"
    @ok="onOk"
  >
    <Form layout="vertical" class="pt-2">
      <FormItem label="排序" required>
        <InputNumber
          v-model:value="form.sort"
          class="w-full"
          placeholder="请输入排序"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
