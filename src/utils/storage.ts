import { HistoryEntry } from '../types/history';

export const addToHistory = (entry: Omit<HistoryEntry, 'id' | 'date'>) => {
  try {
    const stored = localStorage.getItem('clientHistory');
    const history: HistoryEntry[] = stored ? JSON.parse(stored) : [];
    
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    
    const updatedHistory = [newEntry, ...history].slice(0, 50);
    localStorage.setItem('clientHistory', JSON.stringify(updatedHistory));
    
    return newEntry;
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
};

export const getHistory = (): HistoryEntry[] => {
  try {
    const stored = localStorage.getItem('clientHistory');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
};