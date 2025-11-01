
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Candidate, Row, ManualOverrides, EnrichedDetails, GooglePlaceCandidate } from './types';
import { extractCandidates } from './services/parsingService';
import { findPlaceCandidates, getEnrichedDetails } from './services/geminiService';
import { normaliseMapcode, validateMapcode } from './utils/mapcodeUtils';
import InputPanel from './components/InputPanel';
import ResultsTable from './components/ResultsTable';
import Toolbar from './components/Toolbar';
import { DEMO_TEXT } from './constants';

function App() {
  const [rawText, setRawText] = useState(DEMO_TEXT);
  const [rows, setRows] = useState<Row[]>(() => {
    try {
      const savedRows = localStorage.getItem('jp-place-extractor-rows');
      return savedRows ? JSON.parse(savedRows) : [];
    } catch (error) {
      console.error("Failed to load rows from localStorage", error);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastRemovedRow, setLastRemovedRow] = useState<{ row: Row; index: number } | null>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const enrichedDataCache = useRef(new Map<string, EnrichedDetails>());

  useEffect(() => {
    try {
      localStorage.setItem('jp-place-extractor-rows', JSON.stringify(rows));
    } catch (error) {
      console.error("Failed to save rows to localStorage", error);
    }
  }, [rows]);

  const updateRow = useCallback((id: string, newRowData: Partial<Row>) => {
    setRows(currentRows => currentRows.map(r => r.id === id ? { ...r, ...newRowData } : r));
  }, []);

  const enrichWithDetails = useCallback(async (id: string, place_id: string, candidate_name: string) => {
    if (enrichedDataCache.current.has(place_id)) {
      const cachedData = enrichedDataCache.current.get(place_id)!;
       updateRow(id, {
        status: 'complete',
        ...cachedData,
       });
      return;
    }

    try {
      const enrichedData = await getEnrichedDetails(place_id, candidate_name);
      if (enrichedData.error) throw new Error(enrichedData.error);
      
      const displayName = enrichedData.place_name_en && enrichedData.place_name_ja
        ? `${enrichedData.place_name_en} (${enrichedData.place_name_ja})`
        : enrichedData.place_name_en || enrichedData.place_name_ja || candidate_name;

      const normalizedMapcode = normaliseMapcode(enrichedData.mapcode || '');
      const finalData = {
          place_id: place_id,
          place_name_en: enrichedData.place_name_en,
          place_name_ja: enrichedData.place_name_ja,
          display_name: displayName,
          mapcode: normalizedMapcode,
          telephone: enrichedData.telephone,
          address: enrichedData.address,
      };

      enrichedDataCache.current.set(place_id, enrichedData);

      updateRow(id, {
        status: 'complete',
        ...finalData,
        isInvalidMapcode: !validateMapcode(normalizedMapcode)
      });
    } catch (e) {
      const error = e as Error;
      updateRow(id, { status: 'error', statusMessage: error.message });
    }
  }, [updateRow]);

  const processCandidate = useCallback(async (candidate: Candidate) => {
    const id = candidate.position.toString();
    try {
        updateRow(id, { status: 'enriching' });
        const result = await findPlaceCandidates(candidate);
        if (result.error) throw new Error(result.error);

        const placeCandidates = result.candidates || [];
        if (placeCandidates.length === 1) {
            await enrichWithDetails(id, placeCandidates[0].place_id, candidate.main_name);
        } else if (placeCandidates.length > 1) {
            updateRow(id, { status: 'disambiguation', googleCandidates: placeCandidates });
        } else {
            throw new Error("No potential places found.");
        }
    } catch (e) {
      const error = e as Error;
      updateRow(id, { status: 'error', statusMessage: error.message });
    }
  }, [updateRow, enrichWithDetails]);
  
  const handleExtractAndEnrich = useCallback(async () => {
    setIsLoading(true);
    setRows([]);
    setLastRemovedRow(null);
    rowRefs.current = {};

    const candidates = extractCandidates(rawText);
    const initialRows: Row[] = candidates.map(c => ({
      id: c.position.toString(),
      candidate: c,
      status: 'pending',
      manual_overrides: {},
    }));
    setRows(initialRows);

    const concurrency = 3;
    const queue = [...candidates];
    
    const worker = async () => {
        while(queue.length > 0) {
            const candidate = queue.shift();
            if (candidate) {
                await processCandidate(candidate);
            }
        }
    };
    
    await Promise.all(Array(concurrency).fill(null).map(worker));
    setIsLoading(false);
  }, [rawText, processCandidate]);
  
  const handleUpdateRow = (id: string, overrides: ManualOverrides) => {
    setRows(currentRows => currentRows.map(r => {
      if (r.id === id) {
        const newOverrides = { ...r.manual_overrides, ...overrides };
        const mapcodeToCheck = newOverrides.mapcode !== undefined ? newOverrides.mapcode : r.mapcode;
        return { ...r, manual_overrides: newOverrides, isInvalidMapcode: !validateMapcode(mapcodeToCheck) };
      }
      return r;
    }));
  };
  
  const handleSelectCandidate = (id: string, place_id: string) => {
    const row = rows.find(r => r.id === id);
    if(row && place_id) {
        updateRow(id, { status: 'enriching', googleCandidates: [] });
        enrichWithDetails(id, place_id, row.candidate.main_name);
    }
  };

  const handleRemoveRow = (id: string) => {
    const index = rows.findIndex(r => r.id === id);
    if (index !== -1) {
      const rowToRemove = rows[index];
      setLastRemovedRow({ row: rowToRemove, index });
      setRows(currentRows => currentRows.filter(r => r.id !== id));
    }
  };

  const handleRestoreRow = () => {
    if (lastRemovedRow) {
      const { row, index } = lastRemovedRow;
      setRows(currentRows => {
        const newRows = [...currentRows];
        newRows.splice(index, 0, row);
        return newRows;
      });
      setLastRemovedRow(null);
    }
  };

  const handleClear = () => {
    setRawText('');
    setRows([]);
    setLastRemovedRow(null);
  };
  
  const scrollToRow = (id: string) => {
    rowRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    rowRefs.current[id]?.classList.add('animate-pulse', 'bg-yellow-100');
    setTimeout(() => {
        rowRefs.current[id]?.classList.remove('animate-pulse', 'bg-yellow-100');
    }, 2000);
  };

  return (
    <div className="min-h-screen font-sans flex flex-col p-4 md:p-6 lg:p-8 bg-slate-100">
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-slate-800">Japan Place Name Extractor</h1>
        <p className="text-slate-600 mt-1">Extract, enrich, and validate Japanese place names with AI.</p>
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InputPanel
          rawText={rawText}
          setRawText={setRawText}
          onExtract={handleExtractAndEnrich}
          isLoading={isLoading}
        />
        <div className="flex flex-col min-h-0">
          <Toolbar
            rows={rows}
            onClear={handleClear}
            onRestore={handleRestoreRow}
            canRestore={!!lastRemovedRow}
            onJumpToInvalid={scrollToRow}
          />
          <ResultsTable
            rows={rows}
            onUpdateRow={handleUpdateRow}
            onRemoveRow={handleRemoveRow}
            onSelectCandidate={handleSelectCandidate}
            rowRefs={rowRefs}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
