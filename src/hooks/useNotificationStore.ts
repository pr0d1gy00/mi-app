import { create } from 'zustand';
import type { NotificationItem, NotificationType } from '@/types/notification';

export const NOTIFICATION_PRIORITY: Record<NotificationType, number> = {
  info: 1,
  success: 2,
  warning: 3,
  error: 4,
};

export const NOTIFICATION_DURATION: Record<NotificationType, number> = {
  info: 2000,
  success: 3000,
  warning: 4000,
  error: 5000,
};

interface NotificationStoreState {
  queue: NotificationItem[];
  current: NotificationItem | null;
  isShowing: boolean;
  notify: (item: Omit<NotificationItem, 'id' | 'duration' | 'createdAt'>) => void;
  dismiss: () => void;
  clearAll: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  queue: [],
  current: null,
  isShowing: false,
  notify: ({ type, title, message }) => {
    const item: NotificationItem = {
      id: generateId(),
      type,
      title,
      message,
      duration: NOTIFICATION_DURATION[type],
      createdAt: Date.now(),
    };

    const state = get();
    if (!state.isShowing) {
      set({ current: item, isShowing: true });
    } else {
      const currentPriority = state.current ? NOTIFICATION_PRIORITY[state.current.type] : 0;
      const newPriority = NOTIFICATION_PRIORITY[type];
      if (newPriority > currentPriority) {
        set({
          current: item,
          queue: state.current ? [...state.queue, state.current] : state.queue,
        });
      } else {
        set({ queue: [...state.queue, item] });
      }
    }
  },
  dismiss: () => {
    const state = get();
    if (state.queue.length > 0) {
      const [next, ...rest] = state.queue;
      set({ current: next, queue: rest });
    } else {
      set({ current: null, isShowing: false });
    }
  },
  clearAll: () => {
    set({ queue: [], current: null, isShowing: false });
  },
}));
