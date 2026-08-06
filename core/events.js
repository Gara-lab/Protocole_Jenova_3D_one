const listeners = new Map();

export const EventBus = {
  on(eventName, handler) {
    if (typeof eventName !== "string" || typeof handler !== "function") {
      return () => {};
    }

    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }

    listeners.get(eventName).add(handler);

    return () => {
      listeners.get(eventName)?.delete(handler);
    };
  },

  off(eventName, handler) {
    listeners.get(eventName)?.delete(handler);
  },

  emit(eventName, payload) {
    const handlers = listeners.get(eventName);

    if (!handlers) {
      return;
    }

    for (const handler of [...handlers]) {
      try {
        handler(payload);
      } catch (error) {
        console.error(error);
      }
    }
  },

  subscribe(eventName, handler) {
    return this.on(eventName, handler);
  },
};
