import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// MODEL MANAGEMENT FUNCTIONS

export async function listModels(): Promise<any> {
    try {
        // Change from /models to /models/list to match the FastAPI endpoint
        const response = await axios.get(`${API_URL}/models/list`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.detail || 'Error listing models');
        }
        throw error;
    }
}

export async function deleteModel(modelName: string): Promise<any> {
    try {
        // Change from /models/{modelName} to /models/delete/{modelName} to match FastAPI endpoint
        const response = await axios.delete(`${API_URL}/models/delete/${encodeURIComponent(modelName)}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.detail || 'Error deleting model');
        }
        throw error;
    }
}

// PROCESSING FUNCTIONS

export async function processEEGData(
    baselineFile: File,
    trainingFile: File
): Promise<any> {
    try {
        const formData = new FormData();
        formData.append('baseline_file', baselineFile);
        formData.append('training_file', trainingFile);

        const response = await axios.post(`${API_URL}/preprocess`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.detail || 'Error processing data');
        }
        throw error;
    }
}

export async function downloadProcessedData(filename: string): Promise<Blob> {
    try {
        // Change from /download/${filename} to /preprocess/download
        const response = await axios.post(`${API_URL}/preprocess/download`, {}, {
            responseType: 'blob'
        });
        
        // Trigger the download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Return the blob for possible further use in app
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.detail || 'Error downloading processed data');
        }
        throw error;
    }
}

// TRAINING FUNCTIONS

export async function trainModel(formData: FormData): Promise<any> {
    try {
        // Ensure formData has the correct parameter name that the API expects
        const response = await axios.post(`${API_URL}/train`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.detail || 'Error training model');
        }
        throw error;
    }
}

// Fix for "POST /save-model HTTP/1.1" 404 Not Found
export async function saveTrainedModel(): Promise<any> {
    try {
        // Change from /save-model to /train/save to match FastAPI endpoint
        const response = await axios.post(`${API_URL}/train/save`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.detail || 'Error saving model');
        }
        throw error;
    }
}

// Modify downloadModel function to use only filenames
export async function downloadModel(modelPath: string): Promise<void> {
    try {
        // Extract just the filename without path
        let filename = '';
        
        // Handle both slash types in path
        if (modelPath.includes('/')) {
            filename = modelPath.split('/').pop() || 'model.h5';
        } else if (modelPath.includes('\\')) {
            filename = modelPath.split('\\').pop() || 'model.h5';
        } else {
            filename = modelPath;
        }
        
        // Make sure the filename is clean (no path components)
        filename = filename.replace(/^.*[\\\/]/, '');
        
        const response = await axios.get(`${API_URL}/train/download`, {
            params: {
                model_name: filename  // Send only filename, not full path
            },
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.detail || 'Error downloading model');
        }
        throw error;
    }
}

// PREDICTION FUNCTIONS
export async function predictAksara(file: File, modelPath: string = ''): Promise<any> {
    try {
        const formData = new FormData();
        formData.append('dataset_file', file);
        
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            params: {} as { model_name?: string }
        };
        
        // Only use the model filename instead of full path
        if (modelPath) {
            // Extract just the filename without path
            let modelName = '';
            
            // Handle both slash types in path
            if (modelPath.includes('/')) {
                modelName = modelPath.split('/').pop() || '';
            } else if (modelPath.includes('\\')) {
                modelName = modelPath.split('\\').pop() || '';
            } else {
                modelName = modelPath;
            }
            
            // Remove file extension if needed
            if (modelName.endsWith('.h5')) {
                modelName = modelName.slice(0, -3);
            }
            
            config.params = { model_name: modelName };
        }

        console.log(`Sending prediction request with model: ${modelPath ? (config.params.model_name || '') : 'default'}`);
        const response = await axios.post(`${API_URL}/predict`, formData, config);

        // Validate response data structure
        if (!response.data || !response.data.predicted_labels) {
            console.error("Invalid prediction response:", response.data);
            throw new Error("Invalid response from prediction API");
        }
        
        return response.data;
    } catch (error) {
        console.error("Prediction error:", error);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.detail || 'Error making prediction');
        }
        throw error;
    }
}

// VISUALIZATION FUNCTIONS

export async function getTrainingConfusionMatrix(): Promise<string> {
    try {
        // Change from /training/plot/confusion-matrix to /train/plot/confusion-matrix to match FastAPI endpoint
        const response = await axios.get(`${API_URL}/train/plot/confusion-matrix`, {
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        return url;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.detail || 'Error getting confusion matrix');
        }
        throw error;
    }
}

export async function getConfidenceScoresPlot(): Promise<string> {
    try {
        const response = await axios.get(`${API_URL}/predict/plot/confidence`, {
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        return url;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.detail || 'Error getting confidence scores plot');
        }
        throw error;
    }
}


