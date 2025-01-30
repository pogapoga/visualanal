import { writable } from 'svelte/store';

// Create a writable store to hold the FEN data
export const fenStore = writable(null);