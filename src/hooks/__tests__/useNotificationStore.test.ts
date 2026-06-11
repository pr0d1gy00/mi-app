import { useNotificationStore } from '../useNotificationStore';

beforeEach(() => {
  useNotificationStore.getState().clearAll();
});

describe('useNotificationStore', () => {
  test('1. initial: queue=[], current=null, isShowing=false', () => {
    const state = useNotificationStore.getState();
    expect(state.queue).toEqual([]);
    expect(state.current).toBeNull();
    expect(state.isShowing).toBe(false);
  });

  test('2. notify adds to queue when isShowing=false and sets current', () => {
    useNotificationStore.getState().notify({
      type: 'info',
      title: 'Hi',
      message: 'Hello',
    });
    const state = useNotificationStore.getState();
    expect(state.isShowing).toBe(true);
    expect(state.current).not.toBeNull();
    expect(state.current?.type).toBe('info');
    expect(state.current?.title).toBe('Hi');
    expect(state.current?.message).toBe('Hello');
    expect(state.queue).toEqual([]);
  });

  test('3. when isShowing=false, notify sets current + isShowing=true', () => {
    useNotificationStore.getState().notify({
      type: 'success',
      title: 'Done',
      message: 'Operation completed',
    });
    const state = useNotificationStore.getState();
    expect(state.isShowing).toBe(true);
    expect(state.current?.type).toBe('success');
  });

  test('4. when isShowing=true, same-priority notify queues', () => {
    const store = useNotificationStore.getState();
    store.notify({ type: 'info', title: 'First', message: 'A' });
    store.notify({ type: 'info', title: 'Second', message: 'B' });
    const state = useNotificationStore.getState();
    expect(state.isShowing).toBe(true);
    expect(state.current?.title).toBe('First');
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].title).toBe('Second');
  });

  test('5. error priority replaces current success immediately', () => {
    const store = useNotificationStore.getState();
    store.notify({ type: 'success', title: 'Success', message: 'OK' });
    store.notify({ type: 'error', title: 'Error', message: 'Fail' });
    const state = useNotificationStore.getState();
    expect(state.current?.type).toBe('error');
    expect(state.current?.title).toBe('Error');
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].type).toBe('success');
  });

  test('6. dismiss clears current and shows next queued', () => {
    const store = useNotificationStore.getState();
    store.notify({ type: 'info', title: 'First', message: 'A' });
    store.notify({ type: 'info', title: 'Second', message: 'B' });
    store.dismiss();
    const state = useNotificationStore.getState();
    expect(state.current?.title).toBe('Second');
    expect(state.queue).toEqual([]);
    expect(state.isShowing).toBe(true);
  });

  test('7. clearAll empties everything', () => {
    const store = useNotificationStore.getState();
    store.notify({ type: 'info', title: 'Test', message: 'X' });
    store.notify({ type: 'warning', title: 'Warn', message: 'Y' });
    store.clearAll();
    const state = useNotificationStore.getState();
    expect(state.queue).toEqual([]);
    expect(state.current).toBeNull();
    expect(state.isShowing).toBe(false);
  });

  test('8. duration defaults: error=5000, success=3000, info=2000, warning=4000', () => {
    let store = useNotificationStore.getState();
    store.notify({ type: 'error', title: 'E', message: 'e' });
    store = useNotificationStore.getState();
    expect(store.current?.duration).toBe(5000);
    store.dismiss();

    store = useNotificationStore.getState();
    store.notify({ type: 'success', title: 'S', message: 's' });
    store = useNotificationStore.getState();
    expect(store.current?.duration).toBe(3000);
    store.dismiss();

    store = useNotificationStore.getState();
    store.notify({ type: 'info', title: 'I', message: 'i' });
    store = useNotificationStore.getState();
    expect(store.current?.duration).toBe(2000);
    store.dismiss();

    store = useNotificationStore.getState();
    store.notify({ type: 'warning', title: 'W', message: 'w' });
    store = useNotificationStore.getState();
    expect(store.current?.duration).toBe(4000);
  });

  // TRIANGULATE: error replaces error only if no error already showing (queue it)
  test('triangulate: same-priority error queues instead of replacing', () => {
    const store = useNotificationStore.getState();
    store.notify({ type: 'error', title: 'First Error', message: 'A' });
    store.notify({ type: 'error', title: 'Second Error', message: 'B' });
    const state = useNotificationStore.getState();
    expect(state.current?.title).toBe('First Error');
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].title).toBe('Second Error');
  });

  // TRIANGULATE: warning replaces info but not error
  test('triangulate: warning replaces info but queues behind error', () => {
    const store = useNotificationStore.getState();
    store.notify({ type: 'info', title: 'Info', message: 'i' });
    store.notify({ type: 'warning', title: 'Warning', message: 'w' });
    let state = useNotificationStore.getState();
    expect(state.current?.type).toBe('warning');
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].type).toBe('info');

    store.notify({ type: 'error', title: 'Error', message: 'e' });
    state = useNotificationStore.getState();
    expect(state.current?.type).toBe('error');
    expect(state.queue).toHaveLength(2);
  });
});
