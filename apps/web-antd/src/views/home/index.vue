<script lang="ts" setup>
import type {
  SiteHomeFinData,
  SiteHomeHourRow,
  SiteHomeHistoryRow,
} from '#/api/core/site-home';

import { onMounted, ref } from 'vue';

import { useSessionStorage } from '@vueuse/core';
import { Col, Row, Space } from 'ant-design-vue';

import {
  fetchSiteActivityListApi,
  fetchSiteHomeFinApi,
  fetchSiteHomeOperationApi,
} from '#/api/core/site-home';
import { SITE_HOME_PERM } from '#/constants/site-home-perm';
import { router } from '#/router';
import { getMergedRouteApis } from '#/utils/site-permission';

import HomeCardData from './modules/card-data.vue';
import HomeHeaderBanner from './modules/header-banner.vue';
import HomeLineChart from './modules/home-line-chart.vue';
import HomeMetricsChart from './modules/home-metrics-chart.vue';
import HomePieChart from './modules/home-pie-chart.vue';

defineOptions({ name: 'SiteHome' });

const bannerData = ref<SiteHomeFinData>({
  balance: 0,
  withdrawal_audit: 0,
  withdrawal_processed: 0,
  withdrawal_total: 0,
  withdrawal_unprocessed: 0,
});

const version = ref('');
const cardData = ref<Record<string, number>>({});
const pieData = ref<Record<string, unknown>>({});
const chartData = ref<SiteHomeHourRow[]>([]);
const historyList = ref<SiteHomeHistoryRow[]>([]);
const apkDownloadToday = ref(0);
const apkDownloadYesterday = ref(0);

const activityCodeStorage = useSessionStorage('site-active-activity-code', '');

function allowHomeApi(permId: number) {
  const ids = getMergedRouteApis(router);
  if (import.meta.env.DEV && ids.length === 0) {
    return true;
  }
  return ids.includes(permId);
}

const showOperationBlock = () => allowHomeApi(SITE_HOME_PERM.OPERATION);

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateRangeLast7Days() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    start_date: formatDate(start),
    end_date: formatDate(end),
  };
}

async function loadFin() {
  try {
    const data = await fetchSiteHomeFinApi();
    bannerData.value = {
      balance: Number(data.balance) || 0,
      withdrawal_audit: Number(data.withdrawal_audit) || 0,
      withdrawal_processed: Number(data.withdrawal_processed) || 0,
      withdrawal_total: Number(data.withdrawal_total) || 0,
      withdrawal_unprocessed: Number(data.withdrawal_unprocessed) || 0,
    };
  } catch {
    /* request 拦截器已提示 */
  }
}

async function loadOperation() {
  const { start_date, end_date } = getDateRangeLast7Days();
  try {
    const data = await fetchSiteHomeOperationApi({ start_date, end_date });
    const {
      ip,
      register,
      pwa,
      fission,
      first_deposit,
      one_first_deposit,
      new_deposit,
      one_new_deposit,
      list,
      online,
      version: ver,
      history_list,
      apk_download_today,
      apk_download_yesterday,
    } = data;

    cardData.value = {
      ip: Number(ip) || 0,
      register: Number(register) || 0,
      pwa: Number(pwa) || 0,
      fission: Number(fission) || 0,
      online: Number(online) || 0,
    };
    version.value = typeof ver === 'string' ? ver : '';
    pieData.value = {
      first_deposit: Number(first_deposit) || 0,
      one_first_deposit: Number(one_first_deposit) || 0,
      new_deposit: Number(new_deposit) || 0,
      one_new_deposit: Number(one_new_deposit) || 0,
    };
    chartData.value = Array.isArray(list) ? list : [];
    historyList.value = Array.isArray(history_list) ? history_list : [];
    apkDownloadToday.value = Number(apk_download_today) || 0;
    apkDownloadYesterday.value = Number(apk_download_yesterday) || 0;
  } catch {
    /* request 拦截器已提示 */
  }
}

/** 与 site_ui 一致：未缓存过活动 code 时拉首条写入 session，便于活动页首次体验 */
async function prefetchActivityCode() {
  if (activityCodeStorage.value) {
    return;
  }
  try {
    const list = await fetchSiteActivityListApi();
    const code = list[0]?.code;
    if (code) {
      activityCodeStorage.value = code;
    }
  } catch {
    /* 忽略 */
  }
}

onMounted(() => {
  if (allowHomeApi(SITE_HOME_PERM.FIN)) {
    void loadFin();
  }
  if (allowHomeApi(SITE_HOME_PERM.OPERATION)) {
    void loadOperation();
  }
  void prefetchActivityCode();
});
</script>

<template>
  <div class="p-4">
    <Space class="w-full" direction="vertical" :size="16">
      <HomeHeaderBanner
        :banner-data="bannerData"
        :version="version"
        @update="loadOperation"
      />
      <HomeCardData :data="cardData" :show-numbers="showOperationBlock()" />
      <div v-site-permission="SITE_HOME_PERM.OPERATION">
        <Row :gutter="[16, 16]">
          <Col :lg="14" :span="24">
            <HomeLineChart :data="chartData" />
          </Col>
          <Col :lg="10" :span="24">
            <HomePieChart :data="pieData" />
          </Col>
        </Row>
      </div>
      <div v-site-permission="SITE_HOME_PERM.OPERATION">
        <HomeMetricsChart
          :apk-download-today="apkDownloadToday"
          :apk-download-yesterday="apkDownloadYesterday"
          :history-list="historyList"
        />
      </div>
    </Space>
  </div>
</template>
