import React from 'react';
import { Card } from './ui/Card';
import { ArrowLeftIcon, CheckCircleIcon } from './ui/icons';
import { Footer } from './Footer';

const HomeImage = () => (
    <div className="rounded-2xl overflow-hidden flex justify-center items-center">
        <img
            src="/Home.png"
            alt="EEG Signal Analysis"
            className="w-full h-auto"
            style={{ maxHeight: 300, objectFit: 'cover' }}
        />
    </div>
);

interface StepCardProps {
    step: number;
    iconSrc: string;
    title: string;
    items: string[];
    alt?: string;
}

const StepCard = ({ step, iconSrc, title, items, alt }: StepCardProps) => (
    <div className="group relative flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-xl hover:shadow-blue-200/50 hover:scale-[1.03] transform hover:border-blue-400 overflow-hidden">
        {/* Step number in the upper left corner, but not offside */}
        <div className="absolute top-4 left-4 flex items-center justify-center w-10 h-10 bg-blue-600 text-white font-bold text-lg rounded-full shadow-lg border-4 border-white group-hover:bg-blue-700 transition-colors z-10">
            {step}
        </div>
        <div className="mt-8 mb-4">
            <img src={iconSrc} alt={alt || title} className="w-12 h-12 object-contain mx-auto" />
        </div>
        <h3 className="font-bold mb-3 text-gray-800 text-lg">{title}</h3>
        <ul className="space-y-2 text-sm text-gray-600 text-left w-full">
            {items.map((item, index) => (
                <li key={index} className="flex items-start">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    </div>
);

interface AboutPageProps {
  onNavigate: () => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps): React.ReactNode {
    return (
        <div className="min-h-screen bg-gray-100 p-6 sm:p-8 md:p-10 flex flex-col">
            {/* Title at the top, same style and spacing as App.tsx */}
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <h1 className="ml-4 text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                        Imagined Aksara Bali Recognition
                    </h1>
                </div>
                <button
                    onClick={onNavigate}
                    className="flex items-center gap-2 text-blue-600 font-normal hover:text-blue-700 hover:font-bold transition-all duration-200"
                    aria-label="Go back to landing page"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back to Home
                </button>
            </div>
            <main className="max-w-7xl mx-auto space-y-8 flex-1">
                 <Card>
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <HomeImage />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Balinese Script Imagination Classification Dashboard</h1>
                            <p className="mt-2 text-gray-600">
                                Electroencephalogram signal analysis of Balinese Script imagery using the Long Short-Term Memory method.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="transition-shadow duration-300 hover:shadow-lg">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-black">
                        System Workflow
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <StepCard 
                            step={1}
                            iconSrc="/Preprocessing.png"
                            alt="Preprocessing"
                            title="EEG Data Preprocessing"
                            items={[
                                'Upload baseline file (.mat)',
                                'Upload training file (.mat)',
                                'Baseline reduction & DE extraction',
                                'Output format (60, 64) for LSTM'
                            ]}
                        />
                        <StepCard 
                            step={2}
                            iconSrc="/Training.png"
                            alt="Training"
                            title="LSTM Model Training"
                            items={[
                                'Automatic LSTM training after preprocessing',
                                'Cross-validation with 10-fold evaluation',
                                'Model saving and downloading capabilities'
                            ]}
                        />
                        <StepCard 
                            step={3}
                            iconSrc="/Prediction.png"
                            alt="Prediction"
                            title="Prediction"
                            items={[
                                'Load trained model on Sidebar',
                                'Upload EEG data for prediction',
                                'Predict Balinese script with LSTM',
                            ]}
                        />
                    </div>
                </Card>
            </main>
            <Footer />
        </div>
    );
}