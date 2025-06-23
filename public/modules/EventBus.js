/**
 * EventBus - Simple event system for inter-module communication
 * Prevents tight coupling between modules
 */
export class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event, data) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      });
    }
  }

  off(event, callback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  once(event, callback) {
    const onceWrapper = (data) => {
      callback(data);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  clear(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  // Debug helper
  getEventNames() {
    return Array.from(this.events.keys());
  }

  getListenerCount(event) {
    const callbacks = this.events.get(event);
    return callbacks ? callbacks.length : 0;
  }
}
