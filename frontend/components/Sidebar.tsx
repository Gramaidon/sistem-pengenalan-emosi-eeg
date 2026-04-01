import React, { useEffect, useState } from 'react';
import { XIcon } from './ui/icons';
import LogoSIImage from '../public/LogoSI.png';
import LogoKampusImage from '../public/LogoKampus.png';
import { listModels, deleteModel } from '../services/apiService';
import { Spinner } from './Spinner';

// Add interface for model info
interface ModelInfo {
    name: string;
    path: string;
    size_mb: number;
    created: string;
}

const LogoSI = () => (
    <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md border border-gray-200 flex items-center justify-center">
        <img 
            src={LogoSIImage} 
            alt="Logo SI" 
            className="w-full h-full object-contain" 
        />
    </div>
);

const LogoKampus = () => (
    <div className="w-24 h-24 flex items-center justify-center">
        <img 
            src={LogoKampusImage} 
            alt="Logo Kampus" 
            className="w-[95%] h-[95%] object-contain" 
        />
    </div>
);

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    selectedModelPath: string;
    setSelectedModelPath: (path: string) => void;
}

export function Sidebar({ isOpen, setIsOpen, selectedModelPath, setSelectedModelPath }: SidebarProps): React.ReactNode {
    // Add state for models list
    const [modelsList, setModelsList] = useState<ModelInfo[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [defaultModelName, setDefaultModelName] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isDeletingModel, setIsDeletingModel] = useState<string | null>(null);

    // Load models when component mounts
    useEffect(() => {
        loadModelsList();
    }, []);
    
    const loadModelsList = async () => {
        setIsLoadingModels(true);
        try {
            const response = await listModels();
            setModelsList(response.models);
            setDefaultModelName(response.default_model);
            
            // If there's a last trained model, select it by default
            if (response.last_trained_model) {
                const lastModel = response.models.find(m => m.name === response.last_trained_model);
                if (lastModel) {
                    setSelectedModelPath(lastModel.path);
                }
            } else if (response.models.length > 0) {
                // Otherwise select the default model
                const defaultModel = response.models.find(m => m.name === response.default_model);
                if (defaultModel) {
                    setSelectedModelPath(defaultModel.path);
                } else {
                    // Or just the first model in the list
                    setSelectedModelPath(response.models[0].path);
                }
            }
        } catch (err: any) {
            console.error('Error loading models:', err);
            setError(err.message || 'Failed to load model list'); 
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleDeleteModel = async (modelName: string) => {
        if (window.confirm(`Are you sure you want to delete model "${modelName}"?`)) { 
            setIsDeletingModel(modelName);
            try {
                await deleteModel(modelName);
                // Reload the models list
                await loadModelsList();
                // If the deleted model was selected, select another model
                if (selectedModelPath.includes(modelName)) {
                    if (modelsList.length > 1) {
                        // Find another model to select
                        const anotherModel = modelsList.find(m => m.name !== modelName);
                        if (anotherModel) {
                            setSelectedModelPath(anotherModel.path);
                        }
                    } else {
                        // No models left
                        setSelectedModelPath('');
                    }
                }
            } catch (err: any) {
                console.error('Error deleting model:', err);
                setError(err.message || 'Failed to delete model'); 
            } finally {
                setIsDeletingModel(null);
            }
        }
    };

    return (
        <>
            {/* Overlay for mobile view, shown when sidebar is open */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            ></div>

            <aside className={`
                fixed inset-y-0 left-0 z-40 w-80 bg-white shadow-lg
                p-6 flex flex-col overflow-y-auto
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="absolute top-4 right-4 lg:hidden">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                        aria-label="Close sidebar"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex items-center justify-center gap-4 mb-6">
                    <LogoSI />
                    <LogoKampus />
                </div>

                <hr className="my-6 border-gray-300" />

                {/* Add Model Selection Dropdown here */}
                <div className="mb-3">
                    <h2 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">Choose Model</h2>
                    
                    {isLoadingModels ? (
                        <div className="flex items-center py-2">
                            <Spinner /> <span className="ml-2 text-sm text-gray-500">Load model list...</span> {/* Already in English */}
                        </div>
                    ) : modelsList.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-md text-sm">
                            There is no model available. Please train the model first in the Training tab. {/* Already in English */}
                        </div>
                    ) : (
                        <>
                            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md bg-white">
                                {modelsList.map((model) => (
                                    <div 
                                        key={model.path} 
                                        className={`flex items-center justify-between p-2 border-b border-gray-200 hover:bg-gray-50 ${
                                            model.path === selectedModelPath ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div 
                                            className={`flex-1 cursor-pointer ${model.path === selectedModelPath ? 'font-bold text-blue-600' : ''}`}
                                            onClick={() => setSelectedModelPath(model.path)}
                                        >
                                            <div className="text-sm truncate group flex items-center">
                                                <span className="transition-all duration-200 ease-in-out group-hover:font-bold">
                                                    {model.name}
                                                </span>
                                                {model.name === defaultModelName && (
                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">{model.size_mb.toFixed(2)} MB</div>
                                        </div>
                                        {model.name !== defaultModelName && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteModel(model.name);
                                                }}
                                                disabled={isDeletingModel === model.name}
                                                className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                                                title="Delete model" 
                                            >
                                                {isDeletingModel === model.name ? (
                                                    <span className="flex items-center justify-center h-4 w-4">
                                                        <Spinner />
                                                    </span>
                                                ) : (
                                                    <span className="text-lg">×</span>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {error && (
                                <div className="mt-2 text-red-500 text-sm">{error}</div>
                            )}
                        </>
                    )}
                </div>

                <div className="mb-3">
                    <button 
                        onClick={loadModelsList}
                        disabled={isLoadingModels}
                        className="mt-1 w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded transition-colors"
                    >
                        {isLoadingModels ? 'Loading...' : 'Refresh Model List'} {/* Changed to English */}
                    </button>
                </div>

            </aside>
        </>
    );
}