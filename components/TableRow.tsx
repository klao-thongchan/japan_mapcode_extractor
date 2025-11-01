
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Row, ManualOverrides, GooglePlaceCandidate } from '../types';
import { normaliseMapcode, validateMapcode } from '../utils/mapcodeUtils';
import { CopyIcon, TrashIcon, EditIcon, CheckIcon, CancelIcon } from './icons/ActionIcons';

interface TableRowProps {
  row: Row;
  onUpdateRow: (id: string, overrides: ManualOverrides) => void;
  onRemoveRow: (id: string) => void;
  onSelectCandidate: (id: string, placeId: string) => void;
}

const DisambiguationSelector: React.FC<{ candidates: GooglePlaceCandidate[], onSelect: (placeId: string) => void }> = ({ candidates, onSelect }) => (
    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md animate-pulse-fast">
      <p className="text-xs font-semibold text-yellow-800 mb-2">Multiple matches found. Please select one:</p>
      <select 
        onChange={e => onSelect(e.target.value)} 
        className="w-full p-2 border border-yellow-400 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        defaultValue=""
      >
        <option value="" disabled>-- Select a place --</option>
        {candidates.map(c => (
          <option key={c.place_id} value={c.place_id}>
            {c.name} - {c.address}
          </option>
        ))}
      </select>
    </div>
);


const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(({ row, onUpdateRow, onRemoveRow, onSelectCandidate }, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ManualOverrides>({});
  const [isMapcodeValid, setIsMapcodeValid] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditedData(row.manual_overrides);
      inputRef.current?.focus();
    }
  }, [isEditing, row.manual_overrides]);

  const handleEditChange = (field: keyof ManualOverrides, value: string) => {
    let newEditedData = { ...editedData, [field]: value };
    if (field === 'mapcode') {
        const normalized = normaliseMapcode(value);
        setIsMapcodeValid(validateMapcode(normalized) || normalized === '');
        newEditedData = {...newEditedData, mapcode: value}; // Keep user input, but validation is on normalized
    }
    setEditedData(newEditedData);
  };
  
  const handleSave = () => {
    const finalOverrides = {...editedData};
    if (finalOverrides.mapcode !== undefined) {
        const normalized = normaliseMapcode(finalOverrides.mapcode);
        if (!validateMapcode(normalized) && normalized !== '') {
            return; // Block save if invalid
        }
        finalOverrides.mapcode = normalized;
    }

    onUpdateRow(row.id, finalOverrides);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
    setIsMapcodeValid(true);
  };

  const hasOverride = (field: keyof ManualOverrides) => field in row.manual_overrides;

  const renderField = (field: keyof ManualOverrides, placeholder: string, originalValue?: string | null) => {
    const isOverridden = hasOverride(field);
    const displayValue = isOverridden ? row.manual_overrides[field] : originalValue;
    
    if (isEditing) {
        const editValue = (field in editedData) ? editedData[field] : displayValue;
        const isCurrentFieldMapcode = field === 'mapcode';
        const isCurrentFieldInvalid = isCurrentFieldMapcode && !isMapcodeValid;

        return (
          <div className="relative">
            <input
              ref={isCurrentFieldMapcode ? inputRef : null}
              type="text"
              value={editValue || ''}
              onChange={(e) => handleEditChange(field, e.target.value)}
              placeholder={placeholder}
              className={`w-full bg-slate-100 border rounded-md p-1 text-sm ${isCurrentFieldInvalid ? 'border-red-500 ring-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
            />
            {isCurrentFieldInvalid && <div className="text-xs text-red-600 mt-1">Invalid format</div>}
          </div>
        )
    }

    return (
      <span className="flex items-center">
        {displayValue || <span className="text-slate-400">Not found</span>}
        {isOverridden && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" title="Manually edited"></span>}
      </span>
    );
  };
  
  const handleCopyRow = () => {
     const header = 'place_name\tmapcode\ttelephone\taddress';
     const values = [
         row.display_name || '',
         row.manual_overrides.mapcode ?? row.mapcode ?? '',
         row.manual_overrides.telephone ?? row.telephone ?? '',
         row.manual_overrides.address ?? row.address ?? '',
     ].join('\t');
     navigator.clipboard.writeText(`${header}\n${values}`);
  }

  return (
    <tr ref={ref} className={`border-b transition-colors duration-300 ${row.status === 'enriching' ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}>
      <td className="px-6 py-4 font-medium text-slate-900 align-top">
        {row.status === 'disambiguation' && row.googleCandidates ? (
            <DisambiguationSelector candidates={row.googleCandidates} onSelect={(placeId) => onSelectCandidate(row.id, placeId)} />
        ) : (
            <div className="flex flex-col">
                <span title={row.candidate.raw}>{row.display_name || row.candidate.main_name}</span>
                {row.status === 'enriching' && <span className="text-xs text-blue-600">Enriching...</span>}
                {row.status === 'error' && <span className="text-xs text-red-600" title={row.statusMessage}>Error: {row.statusMessage?.split('.')[0]}</span>}
            </div>
        )}
      </td>
      <td className={`px-6 py-4 align-top ${row.isInvalidMapcode ? 'text-red-600' : ''}`}>{renderField('mapcode', 'e.g., 12 345 678*90', row.mapcode)}</td>
      <td className="px-6 py-4 align-top">{renderField('telephone', 'e.g., +81 90-...', row.telephone)}</td>
      <td className="px-6 py-4 align-top">{renderField('address', 'Full address', row.address)}</td>
      <td className="px-6 py-4 align-top">
        <div className="flex items-center justify-end space-x-2">
            {isEditing ? (
                <>
                    <button onClick={handleSave} disabled={!isMapcodeValid} className="p-1 text-green-600 hover:text-green-800 disabled:text-slate-300" title="Save changes"><CheckIcon /></button>
                    <button onClick={handleCancel} className="p-1 text-slate-600 hover:text-slate-800" title="Cancel editing"><CancelIcon /></button>
                </>
            ) : (
                <>
                    <button onClick={handleCopyRow} className="p-1 text-slate-500 hover:text-blue-600" title="Copy Row (TSV)"><CopyIcon /></button>
                    <button onClick={() => setIsEditing(true)} className="p-1 text-slate-500 hover:text-blue-600" title="Edit row"><EditIcon /></button>
                    <button onClick={() => onRemoveRow(row.id)} className="p-1 text-slate-500 hover:text-red-600" title="Remove row"><TrashIcon /></button>
                </>
            )}
        </div>
      </td>
    </tr>
  );
});

export default TableRow;
