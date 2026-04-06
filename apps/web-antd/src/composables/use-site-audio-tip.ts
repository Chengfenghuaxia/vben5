import type { Ref } from 'vue';
import { onBeforeUnmount, onMounted, unref } from 'vue';

/** 与 site_ui `sessionStore` + `useFirstTimeInit` 一致：key 为 `isTipClosed`，值为 JSON boolean */
const TIP_CLOSED_KEY = 'isTipClosed';

function getIsTipClosed(): boolean | undefined {
  try {
    const value = sessionStorage.getItem(TIP_CLOSED_KEY);
    return value ? (JSON.parse(value) as boolean) : undefined;
  } catch {
    return undefined;
  }
}

let registeredTipsRef: Ref<HTMLAudioElement | null> | null = null;

/**
 * MQTT 回调里播放提示音 — 与 site_ui `useMqttNotification` 一致：先 play，再按 isTipClosed 设 volume
 */
export function playSiteMqttTipSound() {
  const el = registeredTipsRef ? unref(registeredTipsRef) : null;
  if (!el) {
    return;
  }
  const isTipClosed = getIsTipClosed();
  el.play().catch(() => {
    /* 未解锁或策略限制 */
  });
  el.volume = isTipClosed ? 0 : 1;
}

/** 与 site_ui 通知 onClose 里 `tipsRef.pause()` 一致 */
export function pauseSiteTipAudio() {
  const el = registeredTipsRef ? unref(registeredTipsRef) : null;
  el?.pause();
}

/**
 * 浏览器需用户手势解锁音频；首次点击页面后尝试静音播放以解锁（对齐 site_ui useAudioTips）
 */
export function useSiteAudioTip(tipsRef: Ref<HTMLAudioElement | null>) {
  registeredTipsRef = tipsRef;
  let unlocked = false;

  function applyVolume() {
    const el = unref(tipsRef);
    if (!el) {
      return;
    }
    const isTipClosed = getIsTipClosed();
    el.volume = isTipClosed ? 0 : 1;
  }

  function unlockOnce() {
    if (unlocked) {
      return;
    }
    const el = unref(tipsRef);
    if (!el) {
      return;
    }
    unlocked = true;
    el.volume = 0;
    el.play().catch(() => {
      /* 仍可能被策略拦截 */
    });
    applyVolume();
    document.removeEventListener('click', unlockOnce);
  }

  onMounted(() => {
    try {
      if (sessionStorage.getItem(TIP_CLOSED_KEY) === null) {
        sessionStorage.setItem(TIP_CLOSED_KEY, JSON.stringify(false));
      }
    } catch {
      /* ignore */
    }
    applyVolume();
    document.addEventListener('click', unlockOnce, { passive: true });
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', unlockOnce);
    if (registeredTipsRef === tipsRef) {
      registeredTipsRef = null;
    }
  });

  return { applyVolume };
}

/** 与 site_ui `sessionStore.setBoolean('isTipClosed', …)` 一致（供顶部静音开关等调用） */
export function setSiteTipClosed(closed: boolean) {
  try {
    sessionStorage.setItem(TIP_CLOSED_KEY, JSON.stringify(closed));
  } catch {
    /* ignore */
  }
}
