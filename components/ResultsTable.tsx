
import React from 'react';
import { Row, ManualOverrides } from '../types';
import TableRow from './TableRow';

interface ResultsTableProps {
  rows: Row[];
  onUpdateRow: (id: string, overrides: ManualOverrides) => void;
  onRemoveRow: (id: string) => void;
  onSelectCandidate: (id: string, placeId: string) => void;
  rowRefs: React.MutableRefObject<Record<string, HTMLTableRowElement | null>>;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ rows, onUpdateRow, onRemoveRow, onSelectCandidate, rowRefs }) => {
  if (rows.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center bg-white p-6 rounded-b-xl shadow-md border-t border-slate-200">
        <div className="text-center text-slate-500">
          <p className="text-lg font-medium">No results to display</p>
          <p className="mt-1">Enter some text and click "Extract & Enrich" to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-white rounded-b-xl shadow-md overflow-hidden min-h-0 border-t border-slate-200">
      <div className="overflow-auto h-full">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 w-2/5">Place Name</th>
              <th scope="col" className="px-6 py-3 w-1/5">Mapcode</th>
              <th scope="col" className="px-6 py-3 w-1/5">Telephone</th>
              <th scope="col" className="px-6 py-3 w-1/5">Address</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                row={row}
                onUpdateRow={onUpdateRow}
                onRemoveRow={onRemoveRow}
                onSelectCandidate={onSelectCandidate}
                ref={el => rowRefs.current[row.id] = el}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
