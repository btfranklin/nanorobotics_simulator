// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createEventLogState, syncEventLog } from '../src/ui/eventLog.js';
import type { SimEvent } from '../src/core/sim.js';

const makeEvent = (id: number, tick = id): SimEvent => ({
  id,
  tick,
  label: `Event ${id}`,
});

const readTitles = (list: HTMLOListElement): string[] =>
  Array.from(list.querySelectorAll('.event-title')).map((node) => node.textContent ?? '');

describe('event log', () => {
  it('prepends newest events and trims from the bottom', () => {
    const list = document.createElement('ol');
    const count = document.createElement('span');
    const state = createEventLogState(3);

    const events = [makeEvent(0), makeEvent(1), makeEvent(2)];
    syncEventLog(events, list, count, state);

    expect(list.children.length).toBe(3);
    expect(readTitles(list)[0]).toContain('[2]');

    const moreEvents = [...events, makeEvent(3), makeEvent(4)];
    syncEventLog(moreEvents, list, count, state);

    expect(list.children.length).toBe(3);
    const titles = readTitles(list);
    expect(titles[0]).toContain('[4]');
    expect(titles[1]).toContain('[3]');
    expect(titles[2]).toContain('[2]');
  });

  it('clears the log when there are no events', () => {
    const list = document.createElement('ol');
    const count = document.createElement('span');
    const state = createEventLogState(3);

    syncEventLog([makeEvent(0), makeEvent(1)], list, count, state);
    expect(list.children.length).toBe(2);

    syncEventLog([], list, count, state);
    expect(list.children.length).toBe(0);
    expect(count.textContent).toBe('0');
    expect(state.lastEventId).toBe(-1);
  });

  it('does not duplicate events on repeated sync', () => {
    const list = document.createElement('ol');
    const count = document.createElement('span');
    const state = createEventLogState(5);

    const events = [makeEvent(0), makeEvent(1), makeEvent(2)];
    syncEventLog(events, list, count, state);
    syncEventLog(events, list, count, state);

    expect(list.children.length).toBe(3);
    expect(readTitles(list)[0]).toContain('[2]');
  });
});
