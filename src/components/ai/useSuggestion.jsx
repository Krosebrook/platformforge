import { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// ─── Module-level client-side suggestion cache ────────────────────────────
// Maps cacheKey → { suggestions[], currentIndex, fetchedAt }
// This persists across re-renders and component remounts for the session.
const CLIENT_CACHE = new Map();
const CLIENT_CACHE_TTL = 5 * 60 * 1000; // 5 min

function buildCacheKey(promptTemplate, context) {
  const { current_value, ...stable } = context;
  return `${promptTemplate}::${JSON.stringify(stable)}`;
}

/**
 * useSuggestion — Core hook for AI-assisted field suggestions.
 *
 * Implements CLIENT-SIDE ROTATION as primary strategy:
 *   1. Fetch a batch of N suggestions from the backend once.
 *   2. Rotate through them locally on each "refresh" call.
 *   3. When the batch is exhausted, trigger a server re-fetch.
 *
 * vs. SERVER-SIDE ROTATION:
 *   - Server-side: Every refresh → new API call → fresher but slower + quota heavy.
 *   - Client-side: One API call per context change → faster rotations, less quota usage.
 *   - Trade-off: Client-side suggestions are from a single LLM call so may be similar;
 *     server-side gives true variety but costs N× more credits.
 *
 * We default to client-side with server fallback after batch exhaustion.
 *
 * @param {object} aiConfig
 * @param {string}  aiConfig.promptTemplate  - Key from PROMPT_TEMPLATES
 * @param {object}  aiConfig.context         - Dynamic context passed to prompt
 * @param {number}  [aiConfig.batchSize=5]   - How many suggestions to prefetch
 * @param {boolean} [aiConfig.prefetch]      - Fetch on mount / focus, before user requests
 */
export function useSuggestion(aiConfig) {
  const {
    promptTemplate,
    context = {},
    batchSize = 5,
    prefetch = false,
  } = aiConfig || {};

  const [state, setState] = useState({
    suggestions: [],   // current batch
    currentIndex: 0,   // index within current batch
    history: [],       // previously accepted suggestions (for undo / compare)
    isLoading: false,
    error: null,
    fromCache: false,
    quotaRemaining: null,
  });

  const abortRef = useRef(null);

  // ── Helpers ───────────────────────────────────────────────────────────
  const currentSuggestion = state.suggestions[state.currentIndex] ?? null;
  const cacheKey = buildCacheKey(promptTemplate, context);

  const hydrateFromCache = useCallback(() => {
    const cached = CLIENT_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CLIENT_CACHE_TTL) {
      setState(prev => ({
        ...prev,
        suggestions: cached.suggestions,
        currentIndex: cached.currentIndex,
        fromCache: true,
        error: null,
      }));
      return true;
    }
    return false;
  }, [cacheKey]);

  // ── Fetch a fresh batch from the server ───────────────────────────────
  const fetchSuggestions = useCallback(async ({ forceRefresh = false } = {}) => {
    if (!promptTemplate) return;

    // Try client cache first (unless forced)
    if (!forceRefresh && hydrateFromCache()) return;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await base44.functions.invoke('aiSuggestions', {
        promptTemplate,
        context,
        count: batchSize,
        forceRefresh,
      });

      if (controller.signal.aborted) return;

      const { suggestions = [], fromCache, quotaRemaining } = response.data;

      // Update module-level cache
      CLIENT_CACHE.set(cacheKey, {
        suggestions,
        currentIndex: 0,
        fetchedAt: Date.now(),
      });

      setState(prev => ({
        ...prev,
        suggestions,
        currentIndex: 0,
        isLoading: false,
        fromCache: fromCache ?? false,
        quotaRemaining,
      }));
    } catch (err) {
      if (controller.signal.aborted) return;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.response?.data?.error || err.message || 'Failed to fetch suggestions',
      }));
    }
  }, [promptTemplate, context, batchSize, cacheKey, hydrateFromCache]);

  // ── Rotate to next suggestion ─────────────────────────────────────────
  // CLIENT-SIDE: just increment index. If we've hit the end, re-fetch.
  const nextSuggestion = useCallback(async () => {
    const next = state.currentIndex + 1;

    if (next < state.suggestions.length) {
      // Still have suggestions in batch → pure client-side rotation
      CLIENT_CACHE.set(cacheKey, {
        ...(CLIENT_CACHE.get(cacheKey) || {}),
        currentIndex: next,
      });
      setState(prev => ({ ...prev, currentIndex: next }));
    } else {
      // Batch exhausted → server re-fetch
      await fetchSuggestions({ forceRefresh: true });
    }
  }, [state.currentIndex, state.suggestions.length, cacheKey, fetchSuggestions]);

  // ── Accept current suggestion ─────────────────────────────────────────
  const acceptSuggestion = useCallback(() => {
    if (!currentSuggestion) return null;
    setState(prev => ({
      ...prev,
      history: [
        { suggestion: currentSuggestion, acceptedAt: Date.now() },
        ...prev.history.slice(0, 9), // keep last 10
      ],
    }));
    return currentSuggestion;
  }, [currentSuggestion]);

  // ── Dismiss / reject ──────────────────────────────────────────────────
  const dismissSuggestion = useCallback(() => {
    setState(prev => ({ ...prev, suggestions: [], currentIndex: 0, error: null }));
    CLIENT_CACHE.delete(cacheKey);
  }, [cacheKey]);

  return {
    currentSuggestion,
    suggestions: state.suggestions,
    history: state.history,
    isLoading: state.isLoading,
    error: state.error,
    fromCache: state.fromCache,
    quotaRemaining: state.quotaRemaining,
    hasSuggestion: !!currentSuggestion,
    batchIndex: state.currentIndex,
    batchTotal: state.suggestions.length,
    fetchSuggestions,
    nextSuggestion,
    acceptSuggestion,
    dismissSuggestion,
  };
}