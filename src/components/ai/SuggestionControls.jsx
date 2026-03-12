import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCw, History, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Renders the Accept / Skip / Refresh bar shown below an AI-assisted field.
 * Stateless — all logic is driven by props from SuggestionContainer.
 */
export function SuggestionBar({
  suggestion,
  isLoading,
  error,
  batchIndex,
  batchTotal,
  fromCache,
  onAccept,
  onNext,
  onRefresh,
  onDismiss,
  className,
}) {
  if (isLoading) {
    return (
      <div className={cn('mt-1.5 flex items-center gap-2 text-xs text-gray-500', className)}>
        <RefreshCw className="w-3 h-3 animate-spin text-purple-500" />
        <span className="animate-pulse">Generating suggestions…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('mt-1.5 flex items-center justify-between gap-2', className)}>
        <span className="text-xs text-red-500 flex-1 truncate">{error}</span>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onRefresh}>
          <RefreshCw className="w-3 h-3 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  if (!suggestion) return null;

  return (
    <div
      className={cn(
        'mt-1.5 flex items-start gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2',
        className
      )}
    >
      <Sparkles className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />

      <p className="flex-1 text-sm text-gray-800 leading-snug line-clamp-2">
        {suggestion}
      </p>

      <div className="flex items-center gap-1 flex-shrink-0">
        {batchTotal > 1 && (
          <span className="text-xs text-gray-400 mr-1">
            {batchIndex + 1}/{batchTotal}
          </span>
        )}

        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-green-600 hover:bg-green-100"
          title="Accept (Tab)"
          onClick={onAccept}
        >
          <Check className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-gray-500 hover:bg-gray-100"
          title="Next suggestion"
          onClick={onNext}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-purple-500 hover:bg-purple-100"
          title="Refresh from server (⌘↵)"
          onClick={onRefresh}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-gray-400 hover:bg-gray-100"
          title="Dismiss"
          onClick={onDismiss}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Compact trigger button — rendered next to a field label or inside an input adornment.
 * Shows a glowing ✨ that activates suggestion fetch on click.
 */
export function SuggestionTrigger({ isLoading, hasSuggestion, onClick, className }) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn(
        'h-7 w-7 rounded-full transition-all',
        hasSuggestion
          ? 'text-purple-600 bg-purple-100 hover:bg-purple-200'
          : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50',
        className
      )}
      title="AI suggestions"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading
        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        : <Sparkles className="w-3.5 h-3.5" />
      }
    </Button>
  );
}

/**
 * Mini history list — shown in a dropdown when user wants to review past accepted suggestions.
 */
export function SuggestionHistory({ history, onReuse, className }) {
  if (!history?.length) return null;
  return (
    <div className={cn('mt-1 rounded-lg border bg-white shadow-sm text-sm', className)}>
      <p className="px-3 py-2 text-xs font-medium text-gray-500 border-b flex items-center gap-1">
        <History className="w-3 h-3" /> Previously accepted
      </p>
      <ul>
        {history.map((h, i) => (
          <li key={i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer group" onClick={() => onReuse(h.suggestion)}>
            <span className="flex-1 truncate text-gray-700">{h.suggestion}</span>
            <span className="text-xs text-gray-400 group-hover:hidden">
              {new Date(h.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs text-purple-600 hidden group-hover:block">Reuse</span>
          </li>
        ))}
      </ul>
    </div>
  );
}