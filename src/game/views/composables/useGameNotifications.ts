import { onUnmounted, ref } from 'vue';

export interface GameNotification {
  id: string;
  text: string;
  type?: 'neutral' | 'gain' | 'loss';
}

export interface PushGameNotificationInput {
  text: string;
  type?: GameNotification['type'];
  duration?: number;
}

const NOTIFICATION_DURATION = 3000;

export function useGameNotifications() {
  let notificationIdSeed = 0;

  const notifications = ref<GameNotification[]>([]);
  const notificationTimerMap = new Map<string, number>();

  const clearNotificationTimer = (notificationId: string) => {
    const timer = notificationTimerMap.get(notificationId);

    if (timer) {
      window.clearTimeout(timer);
      notificationTimerMap.delete(notificationId);
    }
  };

  const removeNotification = (notificationId: string) => {
    clearNotificationTimer(notificationId);
    notifications.value = notifications.value.filter((item) => item.id !== notificationId);
  };

  const pushNotification = ({
    text,
    type = 'neutral',
    duration = NOTIFICATION_DURATION
  }: PushGameNotificationInput) => {
    const notificationId = `map-notification-${notificationIdSeed += 1}`;

    notifications.value = [
      ...notifications.value,
      {
        id: notificationId,
        text,
        type
      }
    ];

    const timer = window.setTimeout(() => {
      removeNotification(notificationId);
    }, duration);

    notificationTimerMap.set(notificationId, timer);

    return notificationId;
  };

  const clearAllNotifications = () => {
    notificationTimerMap.forEach((timer) => {
      window.clearTimeout(timer);
    });

    notificationTimerMap.clear();

    notifications.value = [];
  };

  onUnmounted(() => {
    clearAllNotifications();
  });

  return {
    notifications,
    pushNotification,
    removeNotification,
    clearAllNotifications
  };
}