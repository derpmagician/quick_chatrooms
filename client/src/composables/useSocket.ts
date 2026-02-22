import { ref, onUnmounted } from 'vue';

interface WSMessage {
  event: string;
  data: unknown;
}

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const listeners = new Map<string, ((data: unknown) => void)[]>();

  function connect(url: string) {
    ws.value = new WebSocket(url);

    ws.value.onopen = () => {
      isConnected.value = true;
      console.log('WebSocket connected');
    };

    ws.value.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        const callbacks = listeners.get(message.event);
        if (callbacks) {
          callbacks.forEach((cb) => cb(message.data));
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.value.onclose = () => {
      isConnected.value = false;
      console.log('WebSocket disconnected');
    };

    ws.value.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  function send(event: string, data: unknown) {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ event, data }));
    }
  }

  function on(event: string, callback: (data: unknown) => void) {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event)!.push(callback);
  }

  function off(event: string, callback: (data: unknown) => void) {
    const callbacks = listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  function disconnect() {
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
    isConnected.value = false;
    listeners.clear();
  }

  onUnmounted(() => {
    disconnect();
  });

  return {
    ws,
    isConnected,
    connect,
    send,
    on,
    off,
    disconnect,
  };
}
