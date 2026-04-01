import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileUpload } from '../ui/FileUpload';
import { predictAksara, listModels } from '../../services/apiService';
import { Spinner } from '../Spinner';
import { Footer } from '../Footer';

// Import all Aksara images
import aksaraA from '../../assets/Aksara_a.png';
import aksaraI from '../../assets/Aksara_i.png';
import aksaraU from '../../assets/Aksara_u.png';
import aksaraE from '../../assets/Aksara_e.png';
import aksaraAE from '../../assets/Aksara_ae.png';
import aksaraO from '../../assets/Aksara_o.png';

interface ModelInfo {
  name: string;
  path: string;
  size_mb: number;
  created: string;
}

interface PredictionTabProps {
    selectedModelPath: string;
}

export default function PredictionTab({ selectedModelPath }: PredictionTabProps): React.ReactElement {
    const [predictionFile, setPredictionFile] = useState<File | null>(null);
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictionResults, setPredictionResults] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uniqueClassCount, setUniqueClassCount] = useState<number>(0);
    const [singleClass, setSingleClass] = useState<string | null>(null);
    const [defaultModelPath, setDefaultModelPath] = useState<string>("");
    const [isLoadingDefaultModel, setIsLoadingDefaultModel] = useState(false);
    
    // Add this new state to track if it's a single sample prediction
    const [isSingleSample, setIsSingleSample] = useState<boolean>(false);
    
    // Mapping of Aksara names to their image files
    const aksaraImages: Record<string, string> = {
        'Aksara A': aksaraA,
        'Aksara I': aksaraI,
        'Aksara U': aksaraU,
        'Aksara E': aksaraE,
        'Aksara AE': aksaraAE,
        'Aksara O': aksaraO
    };
    
    // Fetch the default model when component mounts
    useEffect(() => {
        async function fetchDefaultModel() {
            if (!defaultModelPath) {
                setIsLoadingDefaultModel(true);
                try {
                    const response = await listModels();
                    const defaultModel = response.models.find(m => m.name === response.default_model);
                    if (defaultModel) {
                        setDefaultModelPath(defaultModel.path);
                    } else if (response.models.length > 0) {
                        // If no default is specified, use the first model
                        setDefaultModelPath(response.models[0].path);
                    }
                } catch (err) {
                    console.error("Error loading default model:", err);
                } finally {
                    setIsLoadingDefaultModel(false);
                }
            }
        }
        
        fetchDefaultModel();
    }, [defaultModelPath]);
    
    const handlePredict = async () => {
        if (!predictionFile) return;
        
        // Use the selected model if available, otherwise use the default model
        const modelPathToUse = selectedModelPath || defaultModelPath;
        
        if (!modelPathToUse) {
            setError("No model available. Please wait for the model to load or select a model from the sidebar.");
            return;
        }
        
        setIsPredicting(true);
        setPredictionResults(null);
        setError(null);
        setUniqueClassCount(0);
        setSingleClass(null);
        setIsSingleSample(false);
        
        try {
            console.log("Starting prediction with model:", modelPathToUse);
            // Pass the model path to the prediction API
            const result = await predictAksara(predictionFile, modelPathToUse);
            console.log("Prediction result:", result);
            
            // Format the prediction results into an array of objects
            const formattedResults = [];
            
            // Check if we have prediction data
            if (result.predicted_labels && result.predicted_labels.length > 0) {
                for (let i = 0; i < result.predicted_labels.length; i++) {
                    formattedResults.push({
                        Trial: i + 1,
                        timeWindow: result.time_windows[i],
                        Aksara_Prediksi: result.predicted_labels[i],
                        Confidence: result.predicted_probs ? result.predicted_probs[i] : null,
                        Actual: result.actual_labels ? result.actual_labels[i] : "Unknown"
                    });
                }
                
                setPredictionResults(formattedResults);
                setIsSingleSample(result.isSingleSample || false);
                
                // Count unique classes in prediction results
                const uniquePredictions = new Set(
                    result.predicted_labels
                );
                setUniqueClassCount(uniquePredictions.size);
                
                // If only one class is predicted, store it for image display
                if (uniquePredictions.size === 1) {
                    setSingleClass(result.predicted_labels[0]);
                }
            } else {
                throw new Error("No prediction results returned from API");
            }
        } catch (err: any) {
            console.error('Error predicting:', err);
            setError(err.message || 'An error occurred while making the prediction. Please try again.');
        } finally {
            setIsPredicting(false);
        }
    };

    // Determine if we should show the Aksara image
    const shouldShowAksaraImage = uniqueClassCount === 1 && singleClass && aksaraImages[singleClass];

    // Adding trial-based Aksara mapping and visualization
    const getExpectedAksaraForTrial = (trialNumber: number): string => {
      if (trialNumber <= 2) return 'Aksara A';
      if (trialNumber <= 4) return 'Aksara I';
      if (trialNumber <= 6) return 'Aksara U';
      if (trialNumber <= 8) return 'Aksara E';
      if (trialNumber <= 10) return 'Aksara AE';
      if (trialNumber <= 12) return 'Aksara O';
      return 'Unknown';
    };

    // Check if any model is available (selected or default)
    const isModelAvailable = Boolean(selectedModelPath || defaultModelPath);

    // Debug logs for troubleshooting
    console.log("isPredicting:", isPredicting);
    console.log("predictionResults:", predictionResults);
    console.log("selectedModelPath:", selectedModelPath);
    console.log("defaultModelPath:", defaultModelPath);

    return (
        <div className="space-y-6 flex flex-col min-h-[calc(100vh-200px)]">
            <h2 className="text-xl font-bold">Balinese Script Prediction</h2>
            <Card>
                <h3 className="text-lg font-bold mb-4">Upload Data for Prediction</h3>
                <FileUpload
                    label=""
                    description="Select EEG file (.mat) for prediction:"
                    file={predictionFile}
                    onFileChange={setPredictionFile}
                    accept=".mat"
                />
                
                <div className="mt-6">
                    <Button 
                        onClick={handlePredict} 
                        disabled={!predictionFile || (!isModelAvailable && !isLoadingDefaultModel) || isPredicting} 
                        isLoading={isPredicting || isLoadingDefaultModel}
                    >
                        {isPredicting ? 'Processing...' : isLoadingDefaultModel ? 'Loading Model...' : 'Start Prediction'}
                    </Button>                    
                </div>
            </Card>

            {/* Prediction Results */}
            {predictionResults && predictionResults.length > 0 ? (
                <Card>
                    <h3 className="text-lg font-bold mb-4">Prediction Results</h3>
                    {/* Prediction table */}
                    <div className="mt-4 bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Trial
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Time Window
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Predicted Balinese Script
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {predictionResults.map((result, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            T{result.Trial}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                                                {result.timeWindow ? result.timeWindow.label : `${index * 5}-${(index * 5) + 5} seconds`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 mr-2">
                                                    <img 
                                                        src={aksaraImages[result.Aksara_Prediksi] || ''} 
                                                        alt={result.Aksara_Prediksi}
                                                        className="h-8 w-8"
                                                    />
                                                </div>
                                                {result.Aksara_Prediksi}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Aksara Visualization */}
                    {shouldShowAksaraImage && singleClass && (
                        <div className="mt-8">
                            <h4 className="text-md font-semibold mb-4">Visualization of Aksara {singleClass.split(' ')[1]}</h4>
                            <div className="border rounded-md overflow-hidden bg-white p-6 flex justify-center">
                                <img 
                                    src={aksaraImages[singleClass]}
                                    alt={singleClass}
                                    className="h-64 object-contain"
                                />
                            </div>
                        </div>
                    )}
                    {/* Single sample comparison */}
                    {isSingleSample && predictionResults.length === 1 && !shouldShowAksaraImage && (
                        <div className="mt-8">
                            <h4 className="text-md font-semibold mb-4">Balinese Script Comparison</h4>
                            <div className="grid grid-cols-2 gap-6">
                                {/* Expected Aksara based on trial number */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-3">Expected Balinese Script (Trial {predictionResults[0].Trial})</p>
                                    <div className="border rounded-md overflow-hidden bg-white p-4 flex justify-center">
                                        <img 
                                            src={aksaraImages[getExpectedAksaraForTrial(predictionResults[0].Trial)]}
                                            alt={getExpectedAksaraForTrial(predictionResults[0].Trial)}
                                            className="h-48 object-contain"
                                        />
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-2">
                                        {getExpectedAksaraForTrial(predictionResults[0].Trial)}
                                    </p>
                                </div>
                                
                                {/* Predicted Aksara */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-3">Predicted Aksara</p>
                                    <div className="border rounded-md overflow-hidden bg-white p-4 flex justify-center">
                                        <img 
                                            src={aksaraImages[predictionResults[0].Aksara_Prediksi]}
                                            alt={predictionResults[0].Aksara_Prediksi}
                                            className="h-48 object-contain"
                                        />
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-2">
                                        {predictionResults[0].Aksara_Prediksi}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            ) : null} {/* Remove the loading card entirely by changing this to just null */}
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                    <p className="font-medium">Error:</p>
                    <p>{error}</p>
                </div>
            )}
            <Footer />
        </div>
    );
}