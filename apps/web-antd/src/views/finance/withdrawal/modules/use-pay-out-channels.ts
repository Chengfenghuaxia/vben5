import { ref } from 'vue';

import { fetchFinChannelAllListApi } from '#/views/finance/deposit/useApi';

/** 出款通道下拉（pay_out_status === 1），与 site_ui withdraworder 弹窗一致 */
export function usePayOutChannels() {
  const channelOptions = ref<{ label: string; value: string }[]>([]);

  async function ensureChannels(status?: number) {
    const list = await fetchFinChannelAllListApi(
      status != null ? { status } : {},
    );
    const filtered = list.filter((item) => item.pay_out_status === 1);
    channelOptions.value = filtered.map((item) => ({
      label: item.name,
      value: item.code,
    }));
    return filtered.length > 0 ? filtered[0]!.code : undefined;
  }

  return { channelOptions, ensureChannels };
}
