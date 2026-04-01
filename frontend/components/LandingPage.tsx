import React from 'react';
import { InfoIcon } from './ui/icons';

interface LandingPageProps {
  onNavigate: (page: 'training' | 'prediction' | 'about' | 'realtime') => void;
}

const ActionCard = ({
  iconSrc,
  title,
  description,
  onClick,
  alt,
}: {
  iconSrc: string;
  title: string;
  description: string;
  onClick: () => void;
  alt?: string;
}) => (
  <div
    onClick={onClick}
    className="bg-white rounded-xl shadow-lg p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:-translate-y-2 transform h-full"
    role="button"
    tabIndex={0}
    onKeyPress={(e) => e.key === 'Enter' && onClick()}
    aria-label={`${title}: ${description}`}
  >
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 sm:mb-4">
        <img src={iconSrc} alt={alt || title} className="w-12 h-12 sm:w-16 sm:h-16 object-contain mx-auto" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600">{description}</p>
    </div>
  </div>
);

export default function LandingPage({ onNavigate }: LandingPageProps): React.ReactNode {
  // Function to handle external links
  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center p-4 relative">
      {/* Header section with logos and about button */}
      <div className="w-full absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
        {/* Logos container */}
        <div className="flex items-center gap-4">
          <img 
            src="/LogoSI.png" 
            alt="SI Logo" 
            className="h-8 sm:h-12 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => openExternalLink('https://is.undiksha.ac.id/')}
            role="link"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && openExternalLink('https://is.undiksha.ac.id/')}
          />
          <img 
            src="/LogoKampus.png" 
            alt="Campus Logo" 
            className="h-8 sm:h-12 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => openExternalLink('https://undiksha.ac.id/')}
            role="link"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && openExternalLink('https://undiksha.ac.id/')}
          />
        </div>

        {/* About button */}
        <button
          onClick={() => onNavigate('about')}
          className="p-2 sm:p-3 rounded-full text-black hover:bg-gray-200 hover:text-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="About The Project"
        >
          <InfoIcon className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2]" />
        </button>
      </div>

      {/* Main content with proper spacing for mobile */}
      <div className="text-center w-full max-w-4xl mx-auto mt-16 sm:mt-0">
        <header className="mb-8 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight px-2">
            Prediction of Balinese Script Characters Using LSTM
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-2">
            This project uses Long Short-Term Memory to predict Balinese script characters based on EEG signals, combining brain activity with deep learning for character recognition.
          </p>
        </header>

        <main className="w-full px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <ActionCard
              iconSrc="/Start.png"
              alt="Build Model"
              title="Build Model"
              description="Preprocess EEG data and train a new model for Balinese script classification."
              onClick={() => onNavigate('training')}
            />
            <ActionCard
              iconSrc="/Prediction.png"
              alt="Predict Balinese Script"
              title="Predict Balinese Script"
              description="Use a trained model to predict Balinese script from new EEG data."
              onClick={() => onNavigate('prediction')}
            />
            <ActionCard
              iconSrc="/real_time.png"
              title="Real-Time BCI"
              description="Live streaming klasifikasi emosi dari Lab Streaming Layer (LSL) via WebSocket."
              onClick={() => onNavigate('realtime')}
            />
          </div>
        </main>
      </div>
    </div>
  );
}