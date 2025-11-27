import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, ReactNode } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/components/ui/table';

interface Column {
  header: string | ReactNode;
  className?: string;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column[];
  renderRow: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  maxHeight?: number;
  emptyMessage?: string;
  virtualizationThreshold?: number;
}

export function VirtualizedTable<T>({
  data,
  columns,
  renderRow,
  estimateSize = 52,
  maxHeight = 600,
  emptyMessage = "Nenhum item encontrado",
  virtualizationThreshold = 50,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 10,
  });

  if (data.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
              {emptyMessage}
            </td>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  // Se menos que o threshold, não virtualizar (overhead não compensa)
  if (data.length < virtualizationThreshold) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => renderRow(item, index))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div ref={parentRef} style={{ maxHeight, overflow: 'auto' }} className="border rounded-lg">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10 border-b">
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <tr style={{ height: virtualizer.getTotalSize() }}>
            <td colSpan={columns.length} style={{ padding: 0, position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <table className="w-full">
                    <tbody>
                      {renderRow(data[virtualRow.index], virtualRow.index)}
                    </tbody>
                  </table>
                </div>
              ))}
            </td>
          </tr>
        </TableBody>
      </Table>
    </div>
  );
}
