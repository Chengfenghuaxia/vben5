import type { BasicUserInfo } from '@vben-core/typings';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户描述
   */
  desc: string;
  /**
   * 首页地址
   */
  homePath: string;

  /**
   * site 后台 `/site/v1/admin/info` 的 `load_location`：IANA 时区，用于列表/报表时间展示
   */
  loadLocation?: string;

  /**
   * accessToken
   */
  token: string;
}

export type { UserInfo };
