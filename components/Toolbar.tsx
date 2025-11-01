
import React, { useMemo } from 'react';
import { Row } from '../types';
import { generateTsv, exportCsv } from '../services/exportService';
import { CopyIcon, ExportIcon, TrashIcon, RestoreIcon } from './icons/ActionIcons';

interface ToolbarProps {
  rows: Row[];
  onClear: () => void;
  onRestore: () => void;
  canRestore: boolean;
  onJumpToInvalid: (id: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ rows, onClear, onRestore, canRestore, onJumpToInvalid }) => {
  const invalidMapcodeRows = useMemo(() => rows.filter(r => r.isInvalidMapcode), [rows]);

  const handleCopyTsv = () => {
    if (invalidMapcodeRows.length > 0) {
      alert(`Cannot copy. ${invalidMapcodeRows.length} row(s) have invalid Mapcodes.`);
      return;
    }
    const tsv = generateTsv(rows);
    navigator.clipboard.writeText(tsv);
  };

  const handleExportCsv = () => {
    if (invalidMapcodeRows.length > 0) {
      alert(`Cannot export. ${invalidMapcodeRows.length} row(s) have invalid Mapcodes.`);
      return;
    }
    exportCsv(rows);
  };
  
  const hasRows = rows.length > 0;

  return (
    <div className="bg-white p-3 rounded-t-xl shadow-md border-b border-slate-200 flex flex-wrap items-center gap-2 sm:gap-4">
      <div className="flex items-center gap-2">
        <button onClick={handleCopyTsv} disabled={!hasRows} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <CopyIcon /> Copy TSV
        </button>
        <button onClick={handleExportCsv} disabled={!hasRows} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <ExportIcon /> Export CSV
        </button>
      </div>
      <div className="flex-grow"></div>
      {invalidMapcodeRows.length > 0 && (
         <div className="text-sm text-red-600 flex items-center gap-2">
            <span>{invalidMapcodeRows.length} invalid Mapcode(s)</span>
            <button onClick={() => onJumpToInvalid(invalidMapcodeRows[0].id)} className="text-blue-600 underline text-xs">Jump to</button>
         </div>
      )}
      <div className="flex items-center gap-2">
        <button onClick={onRestore} disabled={!canRestore} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <RestoreIcon /> Restore
        </button>
        <button onClick={onClear} disabled={!hasRows} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-red-100 text-red-700 font-medium rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <TrashIcon /> Clear
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
