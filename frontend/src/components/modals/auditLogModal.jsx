import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import api from '@/api/api';

const AuditLogModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({
    action_type: '',
    resource_type: '',
    start_date: '',
    end_date: '',
    search: '',
    per_page: 50
  });
  const [filterOptions, setFilterOptions] = useState({
    action_types: [],
    resource_types: []
  });

  // Fetch audit logs
  const fetchAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: filters.per_page,
        ...filters
      };
      
      const response = await api.get('/api/audit/logs', { params });
      
      if (response.data.success) {
        setLogs(response.data.data.data);
        setTotalPages(response.data.data.last_page);
        setCurrentPage(response.data.data.current_page);
        setTotalLogs(response.data.data.total);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await api.get('/api/audit/logs/statistics');
      
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/audit/logs/filter-options');
      
      if (response.data.success) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Export audit logs
  const exportAuditLogs = async () => {
    try {
      const params = { ...filters };
      const response = await api.get('/audit/logs/export', {
        params,
        responseType: 'blob'
      });
      
      if (response.data) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    fetchAuditLogs(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      action_type: '',
      resource_type: '',
      start_date: '',
      end_date: '',
      search: '',
      per_page: 50
    });
    setCurrentPage(1);
    fetchAuditLogs(1);
  };

  // Initialize data
  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
      fetchStatistics();
      fetchFilterOptions();
    }
  }, [isOpen]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value
    }));
  };

  // Format action type for display
  const formatActionType = (actionType) => {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Logs</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Statistics Section */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.total_logs}</div>
                <div className="text-sm text-gray-600">Total Logs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.action_statistics?.length || 0}</div>
                <div className="text-sm text-gray-600">Action Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.resource_statistics?.length || 0}</div>
                <div className="text-sm text-gray-600">Resource Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.top_users?.length || 0}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
            </div>
          )}
          
          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="action_type">Action Type</Label>
              <Select
                value={filters.action_type}
                onValueChange={(value) => handleFilterChange('action_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {filterOptions.action_types?.map(type => (
                    <SelectItem key={type} value={type}>
                      {formatActionType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="resource_type">Resource Type</Label>
              <Select
                value={filters.resource_type}
                onValueChange={(value) => handleFilterChange('resource_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All resources</SelectItem>
                  {filterOptions.resource_types?.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by username or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <div className="flex items-end space-x-2">
              <Button onClick={applyFilters} className="flex-1">
                Apply
              </Button>
              <Button onClick={resetFilters} variant="outline">
                Reset
              </Button>
            </div>
          </div>
          
          {/* Logs Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                        <div className="mt-2 text-sm text-gray-600">Loading logs...</div>
                      </TableCell>
                    </TableRow>
                  ) : logs.length > 0 ? (
                    logs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>{log.username}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {formatActionType(log.action_type)}
                          </span>
                        </TableCell>
                        <TableCell>{log.resource_type}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.resource_id}
                        </TableCell>
                        <TableCell>{log.ip_address}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-2 border-t">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * filters.per_page) + 1} to {Math.min(currentPage * filters.per_page, totalLogs)} of {totalLogs} logs
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => fetchAuditLogs(currentPage - 1)}
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            onClick={() => fetchAuditLogs(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => fetchAuditLogs(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
          
          {/* Export Button */}
          <div className="flex justify-end">
            <Button onClick={exportAuditLogs} variant="outline">
              Export to CSV
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogModal;