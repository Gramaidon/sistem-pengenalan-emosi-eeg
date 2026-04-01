import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileUpload } from '../ui/FileUpload';
import {
    processEEGData,
    trainModel,
    downloadModel,
    listModels,
    saveTrainedModel,
    getTrainingConfusionMatrix
} from '../../services/apiService';
import { Footer } from '../Footer';
import {
    useTrainingState,
    setDatasetFile,
    setTrainingState,
    setSavingState,
    setModelSaved,
    setTrainingResults,
    setTrainingError
} from '../../services/trainingStateManager';

// Add this line to define API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Define interfaces for API responses
interface ModelInfo {
    name: string;
    path: string;
    size_mb: number;
    created: string;
}

interface ProcessedDataResponse {
    trial_features_shape: [number, number];
    base_features_shape: [number, number];
    total_timesteps: number;
    best_second: number;
    stability_score: number;
}

export default function PreprocessingTab(): React.ReactElement {
    // Preprocessing states
    const [baselineFile, setBaselineFile] = useState<File | null>(null);
    const [trainingFile, setTrainingFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedData, setProcessedData] = useState<ProcessedDataResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [outputFilename, setOutputFilename] = useState<string>("");
    const [processingStatus, setProcessingStatus] = useState<string>("");

    // Training states from global state manager
    const { isTraining, isSaving, modelSaved, trainingResults, error: trainingError } = useTrainingState();

    // Training specific states
    const [confusionMatrixUrl, setConfusionMatrixUrl] = useState<string>('');
    const [matrixTimestamp, setMatrixTimestamp] = useState<number>(Date.now());
    const [modelsList, setModelsList] = useState<ModelInfo[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [processedDataForTraining, setProcessedDataForTraining] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState<'upload' | 'preprocessing' | 'training'>('upload');

    const loadModelsList = useCallback(async () => {
        // Don't reload if we're already loading
        if (isLoadingModels) return;

        setIsLoadingModels(true);
        try {
            const response = await listModels();
            setModelsList(response.models);
        } catch (err) {
            console.error('Error loading models:', err);
            setTrainingError(err.message || 'Failed to load model list');
        } finally {
            setIsLoadingModels(false);
        }
    }, [isLoadingModels]);

    // Only load models when component mounts
    useEffect(() => {
        loadModelsList();
    }, []); // Empty dependency array

    // Refresh confusion matrix when training results change
    useEffect(() => {
        if (trainingResults) {
            refreshConfusionMatrix();
        }
    }, [trainingResults]);

    const refreshConfusionMatrix = async () => {
        try {
            const newUrl = await getTrainingConfusionMatrix();
            setConfusionMatrixUrl(newUrl);
            setMatrixTimestamp(Date.now());
        } catch (error) {
            console.error('Error refreshing confusion matrix:', error);
            setConfusionMatrixUrl(''); // Clear the URL on error
        }
    };

    const extractParticipantId = (filename: string): string => {
        if (!filename) return "";

        // Try to extract patterns like P1, P2, etc.
        const pMatch = /P(\d+)/i.exec(filename);
        if (pMatch) {
            return `P${pMatch[1]}`;
        }

        // If no P pattern, try to get ID after last underscore
        if (filename.includes('_')) {
            const parts = filename.split('_');
            const lastPart = parts[parts.length - 1].split('.')[0];
            return lastPart;
        }

        // Fall back to timestamp
        return new Date().toISOString().slice(0, 10).replace(/-/g, '');
    };

    const getParticipantId = (): string => {
        // Prefer to get ID from training file if available
        if (trainingFile) {
            return extractParticipantId(trainingFile.name);
        }

        // Fall back to baseline file
        if (baselineFile) {
            return extractParticipantId(baselineFile.name);
        }

        // Last resort - generate a timestamp-based ID
        return new Date().toISOString().slice(0, 10).replace(/-/g, '');
    };

    const handleProcess = async () => {
        if (!baselineFile || !trainingFile) return;

        setIsProcessing(true);
        setProcessedData(null);
        setError(null);
        setProcessingStatus("Processing EEG data...");
        setCurrentStep('preprocessing');

        try {
            // Get participant ID from file names
            const participantId = getParticipantId();

            // Process the data
            const result = await processEEGData(baselineFile, trainingFile);
            setProcessedData(result);

            // Set filename for reference
            const filename = `DE_${participantId}.mat`;
            setOutputFilename(filename);

            setProcessingStatus("Data processed successfully. Starting model training...");

            // Store processed data info for training
            setProcessedDataForTraining(result);

            // Move to training step directly without downloading
            setCurrentStep('training');

            // Automatically start training after preprocessing
            setTimeout(() => {
                handleStartTraining();
            }, 1000);

        } catch (err: any) {
            console.error("Error preprocessing data:", err);
            setError(err.message || "An error occurred during data preprocessing");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartTraining = async () => {
        if (!baselineFile || !trainingFile) return;

        setTrainingState(true);
        setTrainingResults(null);
        setTrainingError(null);
        setModelSaved(false);
        setConfusionMatrixUrl('');

        try {
            // Get dataset file from the preprocessed data first
            try {
                // Create a form with the dataset file from the preprocess API
                const formData = new FormData();

                // Use the downloadProcessedData function to get the processed MAT file
                const processedData = await axios.post(`${API_URL}/preprocess/download`, {}, {
                    responseType: 'blob'
                });

                // Create a File from the Blob
                const processedFile = new File(
                    [processedData.data],
                    outputFilename || `DE_${getParticipantId()}.mat`,
                    { type: 'application/octet-stream' }
                );

                // Append to form data with correct parameter name
                formData.append('dataset_file', processedFile);

                // Now train with this dataset
                const metrics = await trainModel(formData);
                setTrainingResults(metrics);

                // Fetch confusion matrix after successful training
                await refreshConfusionMatrix();

                // Set processing status after model training is complete
                setProcessingStatus("Model trained successfully. Saving and downloading model...");

                // Refresh models list
                loadModelsList();

                // Automatically save the model after training
                await saveTrainedModel();
                setModelSaved(true);
                setProcessingStatus("Model successfully saved and downloaded.");

                // Automatically download the model after saving
                if (metrics.model_path) {
                    // Extract just the filename from model_path
                    let modelFilename = '';
                    if (metrics.model_path.includes('/')) {
                        modelFilename = metrics.model_path.split('/').pop() || '';
                    } else if (metrics.model_path.includes('\\')) {
                        modelFilename = metrics.model_path.split('\\').pop() || '';
                    } else {
                        modelFilename = metrics.model_path;
                    }

                    await downloadModel(modelFilename);  // Pass just the filename
                }
            } catch (downloadErr: any) {
                console.error("Error getting processed data:", downloadErr);
                // Extract and show the actual API error message
                const errorMessage = downloadErr.response?.data?.detail || downloadErr.message || "Failed to retrieve processed data for training. Please try again.";
                throw new Error(errorMessage);
            }
        } catch (err: any) {
            console.error('Error training model:', err);
            setTrainingError(err.message || 'An error occurred while training the model. Please try again.');
        } finally {
            setTrainingState(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col min-h-[calc(100vh-200px)]">
            <h2 className="text-xl font-bold">EEG Data Preprocessing &amp; Training</h2>

            {/* Step 1: Upload Files */}
            <Card>
                <div className="grid md:grid-cols-2 gap-6">
                    <FileUpload
                        label="Baseline Data"
                        description="Select raw baseline file (.mat):"
                        file={baselineFile}
                        onFileChange={setBaselineFile}
                        accept=".mat"
                    />
                    <FileUpload
                        label="Trial Data"
                        description="Select raw training file (.mat):"
                        file={trainingFile}
                        onFileChange={setTrainingFile}
                        accept=".mat"
                    />
                </div>
                <div className="mt-6">
                    <Button
                        onClick={handleProcess}
                        disabled={!baselineFile || !trainingFile || isProcessing || isTraining}
                        isLoading={isProcessing || isTraining}
                    >
                        {isProcessing
                            ? "Processing Data..."
                            : isTraining
                                ? "Training Model..."
                                : "Start Training Model"}
                    </Button>
                </div>
            </Card>

            {/* Step 2: Preprocessing Results */}
            {processedData && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Data Processing Results</h3> {/* Changed to English */}
                    <div className="space-y-2 text-sm">
                        <p><strong>Trial Features Shape:</strong> <code>{processedData.trial_features_shape[0]} × {processedData.trial_features_shape[1]}</code> (total_timesteps, 64)</p>
                        <p><strong>Baseline Features Shape:</strong> <code>{processedData.base_features_shape[0]} × {processedData.base_features_shape[1]}</code> (12 trials, 64 features)</p>
                        <p><strong>Total Timesteps/Seconds:</strong> <code>{processedData.total_timesteps}</code></p>
                        <p><strong>Most Stable Baseline Second:</strong> Second <code>{processedData.best_second}</code> with variance score <code>{processedData.stability_score.toFixed(4)}</code></p>
                    </div>

                    {processingStatus && (
                        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-green-700 font-medium">{processingStatus}</p>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Step 3: Training Results */}
            {trainingResults && (
                <>
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Training Results</h3> {/* Changed to English */}

                        {/* Metrics display */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Accuracy</p>
                                <p className="text-xl font-bold text-blue-700">{(trainingResults.val_accuracy * 100).toFixed(2)}%</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Loss</p>
                                <p className="text-xl font-bold text-blue-700">{trainingResults.val_loss.toFixed(4)}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Precision</p>
                                <p className="text-xl font-bold text-blue-700">{(trainingResults.precision * 100).toFixed(2)}%</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Recall</p>
                                <p className="text-xl font-bold text-blue-700">{(trainingResults.recall * 100).toFixed(2)}%</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">F1 Score</p>
                                <p className="text-xl font-bold text-blue-700">{(trainingResults.f1 * 100).toFixed(2)}%</p>
                            </div>
                        </div>
                    </Card>

                    {/* Confusion Matrix Display */}
                    <Card>
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2">Confusion Matrix</h3>
                            <div className="bg-white p-4 rounded-lg shadow flex justify-center">
                                {confusionMatrixUrl ? (
                                    <img
                                        src={confusionMatrixUrl}
                                        alt="Confusion Matrix"
                                        className="max-w-full h-auto"
                                        style={{ maxHeight: '500px' }}
                                        key={matrixTimestamp}
                                    />
                                ) : (
                                    <p>Confusion matrix not available</p>
                                )}
                            </div>

                            {/* Add processing status message for model saving and downloading */}
                            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-green-700 font-medium">
                                        {modelSaved
                                            ? "Model successfully saved and downloaded."
                                            : "Saving and downloading model..."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </>
            )}

            {/* Error Display */}
            {(error || trainingError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                    <p className="font-medium">Error:</p>
                    <p>{error || trainingError}</p>
                </div>
            )}

            {/* Training status indicator with progress bar */}
            {currentStep === 'training' && !trainingResults && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Model Training Process</h3> {/* Changed to English */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center mb-3">
                            <svg className="animate-spin w-5 h-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm font-medium text-blue-700">Training model with 10-fold cross-validation</p> {/* Changed to English */}
                        </div>

                        {/* Simplified progress bar for 10-fold */}
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                                    style={{
                                        width: '100%',
                                        animationName: 'progressAnimation',
                                        animationDuration: '70s',
                                        animationTimingFunction: 'steps(10, end)'
                                    }}
                                ></div>
                            </div>
                            <style jsx>{`
                                @keyframes progressAnimation {
                                    0% { width: 0%; }
                                    10% { width: 10%; }
                                    20% { width: 20%; }
                                    30% { width: 30%; }
                                    40% { width: 40%; }
                                    50% { width: 50%; }
                                    60% { width: 60%; }
                                    70% { width: 70%; }
                                    80% { width: 80%; }
                                    90% { width: 90%; }
                                    100% { width: 100%; }
                                }
                            `}</style>
                            <div className="flex justify-between mt-2">
                                <p className="text-xs text-gray-600">Progress: 10-fold cross-validation</p>
                                <p className="text-xs text-gray-600">Estimate: ~3-5 minutes</p> {/* Changed to English */}
                            </div>
                        </div>
                    </div>
                </Card>
            )}
            <Footer />
        </div>
    );
}
