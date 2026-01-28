import type { SimEvent } from '../core/sim.js';

export type EventLogState = {
  lastEventId: number;
  maxItems: number;
};

export const createEventLogState = (maxItems = 30): EventLogState => ({
  lastEventId: -1,
  maxItems,
});

export const syncEventLog = (
  events: SimEvent[],
  list: HTMLOListElement,
  count: HTMLElement,
  state: EventLogState,
): void => {
  if (events.length === 0) {
    list.innerHTML = '';
    count.textContent = '0';
    state.lastEventId = -1;
    return;
  }

  for (const event of events) {
    if (event.id <= state.lastEventId) {
      continue;
    }
    const item = document.createElement('li');
    const header = document.createElement('div');
    header.className = 'event-title';
    header.textContent = `[${event.tick}] ${event.label}`;
    item.appendChild(header);
    if (event.detail) {
      const detail = document.createElement('pre');
      detail.textContent = event.detail;
      item.appendChild(detail);
    }
    list.insertBefore(item, list.firstChild);
    state.lastEventId = event.id;
  }

  while (list.children.length > state.maxItems) {
    list.removeChild(list.lastElementChild as HTMLElement);
  }

  count.textContent = String(events.length);
};
