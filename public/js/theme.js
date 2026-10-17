import { findStore } from './state.js';

/** Aplikasikan warna toko ke seluruh UI lewat CSS variable. */
export function applyStoreTheme(storeId) {
  const store = findStore(storeId);
  const root = document.documentElement;
  if (store) {
    root.style.setProperty('--accent', store.accent);
    root.style.setProperty('--ink', store.ink);
    document.body.dataset.store = store.id;
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--ink');
    delete document.body.dataset.store;
  }
}
