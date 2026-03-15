import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Trash2, Tag, RefreshCw, X } from 'lucide-react';

/**
 * BulkActionsBar
 * 
 * Props:
 *   selectedCount    - number of selected rows
 *   onClearSelection - fn to deselect all
 *   onDelete         - fn(ids) → called with selectedIds
 *   onStatusUpdate   - fn(ids, status) — optional
 *   onTagUpdate      - fn(ids, tag) — optional
 *   selectedIds      - array of selected record IDs
 *   statusOptions    - [{ value, label }] for status dropdown
 *   tagOptions       - string[] for tag picker
 */
export default function BulkActionsBar({
  selectedCount = 0,
  selectedIds = [],
  onClearSelection,
  onDelete,
  onStatusUpdate,
  onTagUpdate,
  statusOptions = [],
  tagOptions = [],
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 bg-gray-900 text-white rounded-xl shadow-lg">
        <Badge className="bg-white text-gray-900 hover:bg-white font-bold text-xs">
          {selectedCount} selected
        </Badge>

        {onStatusUpdate && statusOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="h-7 text-xs gap-1">
                <RefreshCw className="w-3 h-3" />
                Update Status
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Set Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusOptions.map(opt => (
                <DropdownMenuItem key={opt.value} onClick={() => onStatusUpdate(selectedIds, opt.value)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onTagUpdate && tagOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="h-7 text-xs gap-1">
                <Tag className="w-3 h-3" />
                Add Tag
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Apply Tag</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tagOptions.map(tag => (
                <DropdownMenuItem key={tag} onClick={() => onTagUpdate(selectedIds, tag)}>
                  <Tag className="w-3 h-3 mr-2 text-gray-400" />
                  {tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onDelete && (
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs gap-1"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-white hover:text-white hover:bg-white/10 ml-auto gap-1"
          onClick={onClearSelection}
        >
          <X className="w-3 h-3" />
          Clear
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} item{selectedCount > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All selected records will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { onDelete(selectedIds); setConfirmDelete(false); }}
            >
              Delete {selectedCount} item{selectedCount > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}