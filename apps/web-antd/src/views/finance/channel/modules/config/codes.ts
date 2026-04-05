/**
 * site_ui `finance/channel/index.vue` changehandecpnfig 中已对接的通道 code
 */
export const FIN_CHANNEL_CONFIG_CODES = [
  'mkpay',
  'tarspay',
  'epay',
  'atmpay',
  'qqpay',
  'kilipay',
  'starpago',
  'hypay',
  'winwinpay',
  'spay',
  'pay4z',
] as const;

export type FinChannelConfigCode = (typeof FIN_CHANNEL_CONFIG_CODES)[number];

export function isFinChannelConfigCode(
  code: string,
): code is FinChannelConfigCode {
  return (FIN_CHANNEL_CONFIG_CODES as readonly string[]).includes(code);
}
