"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OfertaLocalPublicSearchItem } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import {
  addOfertaLocalShoppingListItem,
  clearOfertaLocalShoppingList,
  createEmptyOfertaLocalShoppingListState,
  createShoppingListItemFromPublicItem,
  getOfertaLocalShoppingListCounts,
  isOfertaLocalShoppingListItemAdded,
  OFERTAS_LOCALES_SHOPPING_LIST_STORAGE_KEY,
  parseOfertaLocalShoppingList,
  removeOfertaLocalShoppingListItem,
  serializeOfertaLocalShoppingList,
  updateOfertaLocalShoppingListItemNote,
  updateOfertaLocalShoppingListItemQuantity,
  type OfertaLocalShoppingListState,
} from "@/app/lib/ofertas-locales/ofertasLocalesShoppingList";

export function useOfertasLocalesShoppingList() {
  const [list, setList] = useState<OfertaLocalShoppingListState>(() =>
    createEmptyOfertaLocalShoppingListState()
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(OFERTAS_LOCALES_SHOPPING_LIST_STORAGE_KEY);
      setList(parseOfertaLocalShoppingList(raw));
    } catch {
      setList(createEmptyOfertaLocalShoppingListState());
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((next: OfertaLocalShoppingListState) => {
    setList(next);
    try {
      window.localStorage.setItem(OFERTAS_LOCALES_SHOPPING_LIST_STORAGE_KEY, serializeOfertaLocalShoppingList(next));
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const addFromPublicItem = useCallback(
    (item: OfertaLocalPublicSearchItem) => {
      const entry = createShoppingListItemFromPublicItem(item);
      persist(addOfertaLocalShoppingListItem(list, entry));
    },
    [list, persist]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      persist(removeOfertaLocalShoppingListItem(list, itemId));
    },
    [list, persist]
  );

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      persist(updateOfertaLocalShoppingListItemQuantity(list, itemId, quantity));
    },
    [list, persist]
  );

  const updateNote = useCallback(
    (itemId: string, note: string) => {
      persist(updateOfertaLocalShoppingListItemNote(list, itemId, note));
    },
    [list, persist]
  );

  const clearList = useCallback(() => {
    persist(clearOfertaLocalShoppingList(list));
  }, [list, persist]);

  const isAdded = useCallback(
    (itemId: string) => isOfertaLocalShoppingListItemAdded(list, itemId),
    [list]
  );

  const counts = useMemo(() => getOfertaLocalShoppingListCounts(list), [list]);

  return {
    list,
    hydrated,
    counts,
    addFromPublicItem,
    removeItem,
    updateQuantity,
    updateNote,
    clearList,
    isAdded,
  };
}
