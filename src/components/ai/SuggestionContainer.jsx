import React, { useCallback, useRef, useState, useEffect, cloneElement, Children } from 'react';
import { useSuggestion } from './useSuggestion';
import { SuggestionBar, SuggestionTrigger, SuggestionHistory } from './SuggestionControls';
import { cn } from '@/lib/utils';

/**
 * SuggestionContainer — Non-invasive AI suggestion wrapper.
 *
 * Wraps any input / textarea / select / custom component and adds:
 *   - ✨ trigger button (inline or via label)
 *   - Suggestion bar with Accept / Skip / Refresh / Dismiss
 *   - Tab   → accept current suggestion
 *   - Esc   → dismiss
 *   - ⌘↵    → force server refresh
 *   - Suggestion history (last 10 accepted)
 *
 * Usage:
 *   <SuggestionContainer
 *     aiConfig={{ promptTemplate: 'job_title', context: { category: 'software' } }}
 *     onAccept={(val) => form.setValue('title', val)}
 *   >
 *     <Input placeholder="Job title" {...field} />
 *   </SuggestionContainer>
 *
 * @param {object}   props
 * @param {object}   props.aiConfig        - See useSuggestion for schema
 * @param {function} props.onAccept        - Called with the accepted string
 * @param {string}   [props.label]         - Optional label shown above the field
 * @param {boolean}  [props.showHistory]   - Show/hide history panel
 * @param {string}   [props.className]
 * @param {ReactNode} props.children       - The actual form control(s)
 */
export default function SuggestionContainer({
  aiConfig,
  onAccept,
  label,
  showHistory = false,
  className,
  children,
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const containerRef = useRef(null);

  const {
    currentSuggestion,
    history,
    isLoading,
    error,
    fromCache,
    batchIndex,
    batchTotal,
    hasSuggestion,
    fetchSuggestions,
    nextSuggestion,
    acceptSuggestion,
    dismissSuggestion,
  } = useSuggestion(aiConfig);

  // ── Prefetch on mount if configured ──────────────────────────────────
  useEffect(() => {
    if (aiConfig?.prefetch) {
      fetchSuggestions();
    }
  }, []); // intentionally only on mount

  // ── Keyboard shortcut handler ─────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    // Tab → accept
    if (e.key === 'Tab' && hasSuggestion && !e.shiftKey) {
      e.preventDefault();
      const accepted = acceptSuggestion();
      if (accepted) onAccept(accepted);
      return;
    }

    // Escape → dismiss
    if (e.key === 'Escape' && hasSuggestion) {
      e.stopPropagation();
      dismissSuggestion();
      return;
    }

    // Cmd/Ctrl + Enter → force refresh from server
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      fetchSuggestions({ forceRefresh: true });
    }
  }, [hasSuggestion, acceptSuggestion, dismissSuggestion, fetchSuggestions, onAccept]);

  // ── Accept handler ────────────────────────────────────────────────────
  const handleAccept = useCallback(() => {
    const accepted = acceptSuggestion();
    if (accepted) onAccept(accepted);
  }, [acceptSuggestion, onAccept]);

  // ── Reuse from history ─────────────────────────────────────────────────
  const handleReuse = useCallback((val) => {
    onAccept(val);
    setHistoryOpen(false);
  }, [onAccept]);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)} onKeyDown={handleKeyDown}>
      {/* Label row with trigger */}
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <div className="flex items-center gap-1">
            {showHistory && history.length > 0 && (
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-purple-600 underline"
                onClick={() => setHistoryOpen(v => !v)}
              >
                History ({history.length})
              </button>
            )}
            <SuggestionTrigger
              isLoading={isLoading}
              hasSuggestion={hasSuggestion}
              onClick={() => {
                if (hasSuggestion) {
                  dismissSuggestion();
                } else {
                  fetchSuggestions();
                }
              }}
            />
          </div>
        </div>
      )}

      {/* The wrapped field + inline trigger when no label */}
      <div className="relative flex items-center gap-1">
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {!label && (
          <SuggestionTrigger
            isLoading={isLoading}
            hasSuggestion={hasSuggestion}
            onClick={() => {
              if (hasSuggestion) {
                dismissSuggestion();
              } else {
                fetchSuggestions();
              }
            }}
          />
        )}
      </div>

      {/* Suggestion bar */}
      <SuggestionBar
        suggestion={currentSuggestion}
        isLoading={isLoading}
        error={error}
        batchIndex={batchIndex}
        batchTotal={batchTotal}
        fromCache={fromCache}
        onAccept={handleAccept}
        onNext={nextSuggestion}
        onRefresh={() => fetchSuggestions({ forceRefresh: true })}
        onDismiss={dismissSuggestion}
      />

      {/* History panel */}
      {historyOpen && (
        <SuggestionHistory
          history={history}
          onReuse={handleReuse}
        />
      )}

      {/* Keyboard shortcut hint — shows only when suggestion is active */}
      {hasSuggestion && !isLoading && (
        <p className="mt-1 text-xs text-gray-400">
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Tab</kbd> accept
          {' '}·{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Esc</kbd> dismiss
          {' '}·{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">⌘↵</kbd> new batch
        </p>
      )}
    </div>
  );
}