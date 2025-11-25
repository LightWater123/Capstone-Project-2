import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useAuditLogs, updateAuditLogsStorage } from '@/hooks/useAuditLogs';

const AuditLogModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    per_page: 10
  });

  // Use TanStack Query for fetching audit logs
  const { data, isLoading, refetch, isFetching } = useAuditLogs(currentPage, filters.per_page);

  // Extract data from query response
  const logs = data?.data || [];
  const totalPages = data?.lastPage || 1;
  const totalLogs = data?.total || 0;

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      refetch();
      // resetAuditLogsCounter();
      // Update storage with current audit log data
      updateAuditLogsStorage();
    }
  }, [isOpen, refetch]);

  // Refetch data when currentPage changes
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [currentPage, refetch, isOpen]);


  // Format action type for display
  const formatActionType = (actionType) => {
    if (!actionType) return '';
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Logs</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          
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
                  {isLoading || isFetching ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                        <div className="mt-2 text-sm text-gray-600">Loading logs...</div>
                      </TableCell>
                    </TableRow>
                  ) : logs.length > 0 ? (
                    logs.map((log, k) => (
                      <TableRow key={log.id ?? k}>
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
              <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-2 border-t space-y-2 sm:space-y-0">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * filters.per_page) + 1} to {Math.min(currentPage * filters.per_page, totalLogs)} of {totalLogs} logs
                </div>
                <div className="flex items-center space-x-1">
                  <Pagination>
                    <PaginationContent>
                      {/* First Page Button */}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                        >
                          First
                        </PaginationLink>
                      </PaginationItem>
                      
                      {/* Previous Page Button */}
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                        />
                      </PaginationItem>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {/* Next Page Button */}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                        />
                      </PaginationItem>
                      
                      {/* Last Page Button */}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                        >
                          Last
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  {/* Page Number Display */}
                  <div className="ml-4 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogModal;