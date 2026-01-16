import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Analytics filter bar component for data filtering
 * Handles status, team member, and customer filtering
 */
export default function FilterBar({ 
  filters, 
  onFilterChange, 
  members = [], 
  customers = [] 
}) {
  return (
    <div className="flex gap-4 flex-wrap">
      <Select 
        value={filters.status} 
        onValueChange={(value) => onFilterChange({ ...filters, status: value })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.member} 
        onValueChange={(value) => onFilterChange({ ...filters, member: value })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Members" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Members</SelectItem>
          {members.map(m => (
            <SelectItem key={m.user_email} value={m.user_email}>
              {m.user_email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={filters.customer} 
        onValueChange={(value) => onFilterChange({ ...filters, customer: value })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Customers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Customers</SelectItem>
          {customers.map(c => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}