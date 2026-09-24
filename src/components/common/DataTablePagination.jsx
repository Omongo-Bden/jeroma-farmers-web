import React from 'react';

/**
 * Enterprise Data Table Pagination Component
 * Prevents DOM bloat and enhances responsiveness on low-end mobile devices and field tablets.
 */
export default function DataTablePagination({
  currentPage = 1,
  pageSize = 15,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50]
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 16px',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        borderRadius: '0 0 12px 12px',
        fontSize: '0.82rem',
        color: '#475569'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> records
        </span>
        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
            <span>per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: currentPage === 1 ? '#f1f5f9' : '#fff',
            color: currentPage === 1 ? '#94a3b8' : '#0f172a',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontWeight: 600
          }}
          title="First Page"
        >
          «
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: currentPage === 1 ? '#f1f5f9' : '#fff',
            color: currentPage === 1 ? '#94a3b8' : '#0f172a',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontWeight: 600
          }}
        >
          Previous
        </button>
        <span style={{ padding: '0 8px', fontWeight: 700, color: '#1b4332' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: currentPage >= totalPages ? '#f1f5f9' : '#fff',
            color: currentPage >= totalPages ? '#94a3b8' : '#0f172a',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontWeight: 600
          }}
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: currentPage >= totalPages ? '#f1f5f9' : '#fff',
            color: currentPage >= totalPages ? '#94a3b8' : '#0f172a',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontWeight: 600
          }}
          title="Last Page"
        >
          »
        </button>
      </div>
    </div>
  );
}
