import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, ChevronUp, MoreHorizontal, Search, 
  Filter, Download, Trash2, Edit, Eye, ArrowUpDown
} from 'lucide-react';

export function DataTable({
  columns,
  data,
  isLoading,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  onExport,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  emptyState,
  searchPlaceholder = 'Search...',
  showSearch = true,
  showActions = true,
  pageSize = 20
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(0);

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery) return data;

    return data.filter(row => {
      return columns.some(col => {
        const value = row[col.accessorKey];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, columns]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? paginatedData.map(row => row.id) : []);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedRows, id]);
      } else {
        onSelectionChange(selectedRows.filter(rowId => rowId !== id));
      }
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showSearch && (
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
        )}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState || (
      <div className="text-center py-12 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(showSearch || selectedRows.length > 0) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            {showSearch && (
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>

          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {selectedRows.length} selected
              </span>
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600"
                  onClick={() => onDelete(selectedRows)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={() => onExport(selectedRows)}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedData.length > 0 && paginatedData.every(row => selectedRows.includes(row.id))}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead 
                  key={column.accessorKey}
                  className={column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}
                  onClick={() => column.sortable !== false && handleSort(column.accessorKey)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable !== false && <SortIcon columnKey={column.accessorKey} />}
                  </div>
                </TableHead>
              ))}
              {showActions && (onEdit || onDelete || onView) && (
                <TableHead className="w-12" />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow 
                key={row.id}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${
                  selectedRows.includes(row.id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRows.includes(row.id)}
                      onCheckedChange={(checked) => handleSelectRow(row.id, checked)}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.accessorKey}>
                    {column.cell 
                      ? column.cell({ row: { original: row }, getValue: () => row[column.accessorKey] })
                      : row[column.accessorKey]
                    }
                  </TableCell>
                ))}
                {showActions && (onEdit || onDelete || onView) && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(row)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(row)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {(onView || onEdit) && onDelete && <DropdownMenuSeparator />}
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDelete([row.id])}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, sortedData.length)} of {sortedData.length} results
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}