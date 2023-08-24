import { EventType, EventListener } from './interface';

export default class EventDispatcher {
  listeners: Map<EventType, Set<EventListener>>;

  constructor() {
    this.listeners = new Map([
      ['drawStart', new Set()],
      ['drawUpdate', new Set()],
      ['drawEnd', new Set()],
      ['editStart', new Set()],
      ['editEnd', new Set()],
    ]);
  }

  on(event: EventType, listener: EventListener) {
    if (!this.listeners.has(event)) {
      console.warn("Event binding must be one of 'drawStart', 'drawUpdate', or 'drawEnd'.");
      return;
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: EventType, listener: EventListener) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener);
    }
  }

  dispatchEvent(event: EventType, eventData?: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((listener) => {
        listener(eventData);
      });
    }
  }
}