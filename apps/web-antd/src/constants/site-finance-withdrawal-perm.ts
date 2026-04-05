/**
 * 与 site_ui `views/finance/withdraworder/index.vue` 中 v-permission id 一致。
 */
export const SITE_FINANCE_WITHDRAWAL_PERM = {
  /** 通过、批量审核 — id 136 */
  APPROVE_LOCK: 136,
  /** 解锁订单、批量解锁 — id 138 */
  UNLOCK: 138,
  /** 拒绝、批量拒绝 — id 186 */
  REJECT: 186,
  /** 代付提现 — id 185 */
  PAY: 185,
  /** 重新下单 — id 137 */
  REORDER: 137,
  /** 批量拒绝成功订单 — id 2000492 */
  BATCH_REJECT_SUCCESS: 2000492,
  /** 置为成功 — id 2000490 */
  SET_SUCCESS: 2000490,
  /** 提现退款 — id 2000491 */
  REFUND: 2000491,
  /** 加入黑名单 — id 1000635 */
  BLACKLIST: 1000635,
} as const;
