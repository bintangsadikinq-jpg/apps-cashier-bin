/** State global kecil dengan pola subscribe. */
const state = {
  stores: [],
  storage: null,
  storeId: null,     // toko terpilih di editor
};

const listeners = new Set();

export const getState = () => state;

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state, patch));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const findStore = (id) => state.stores.find((s) => s.id === id) || null;
