export const requiredInput = {
  required: true,
  message: '请输入',
  trigger: 'blur',
} as const;

export const requiredNumber = {
  required: true,
  message: '请输入',
  trigger: 'change',
} as const;

/** Ant Design Vue InputNumber 需内联 width 才能与文本框一致撑满表单项 */
export const finChannelConfigInputNumberStyle = {
  width: '100%',
} as const;
