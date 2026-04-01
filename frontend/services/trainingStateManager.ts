import { useState, useEffect } from 'react';

// Define types
interface TrainingResults {
  val_accuracy: number;
  val_loss: number;
  precision: number;
  recall: number;
  f1: number;
  model_path: string;
}

// Global state
const globalState = {
  isTraining: false,
  isSaving: false,
  modelSaved: false,
  trainingResults: null as TrainingResults | null,
  error: null as string | null,
  datasetFile: null as File | null,
  expectedModelName: '',
};

// Event listeners
const listeners = new Set<() => void>();

// Notify all listeners of state changes
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// State setter functions
export const setTrainingState = (isTraining: boolean) => {
  globalState.isTraining = isTraining;
  notifyListeners();
};

export const setSavingState = (isSaving: boolean) => {
  globalState.isSaving = isSaving;
  notifyListeners();
};

export const setModelSaved = (modelSaved: boolean) => {
  globalState.modelSaved = modelSaved;
  notifyListeners();
};

export const setTrainingResults = (results: TrainingResults | null) => {
  globalState.trainingResults = results;
  notifyListeners();
};

export const setTrainingError = (error: string | null) => {
  globalState.error = error;
  notifyListeners();
};

export const setDatasetFile = (file: File | null) => {
  globalState.datasetFile = file;
  
  // If the file is changing, reset related training states
  if (file !== null) {
    globalState.modelSaved = false;
    globalState.trainingResults = null;
  }
  
  updateExpectedModelName(file);
  notifyListeners();
};

// Helper function to extract expected model name
const updateExpectedModelName = (file: File | null) => {
  if (!file) {
    globalState.expectedModelName = '';
    return;
  }

  const filename = file.name;
  let fileId = '';
  
  if (filename.includes('_')) {
    fileId = filename.split('_').pop()?.split('.')[0] || '';
  } else {
    const match = filename.match(/P\d+/);
    if (match) {
      fileId = match[0];
    }
  }
  
  globalState.expectedModelName = fileId 
    ? `LSTM_Model_${fileId}.h5`
    : 'LSTM_Model_[timestamp].h5';
};

// Hook to use the training state
export const useTrainingState = () => {
  const [state, setState] = useState({...globalState});

  useEffect(() => {
    const handleChange = () => {
      setState({...globalState});
    };
    
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return state;
};

// Reset state function (for cleanup if needed)
export const resetTrainingState = () => {
  globalState.isTraining = false;
  globalState.isSaving = false;
  globalState.modelSaved = false;
  globalState.trainingResults = null;
  globalState.error = null;
  globalState.datasetFile = null;
  globalState.expectedModelName = '';
  notifyListeners();
};