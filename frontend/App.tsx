import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import PreprocessingTab from './components/tabs/BuildmodelTab';
import PredictionTab from './components/tabs/PredictionTab';
import RealTimeTab from './components/tabs/RealTimeTab';
import { MenuIcon, ArrowLeftIcon } from './components/ui/icons';
import LandingPage from './components/LandingPage';
import AboutPage from './components/AboutPage';

interface PageProps {
  onNavigateHome: () => void;
  selectedModelPath: string;
  setSelectedModelPath: (path: string) => void;
  sidebarInitiallyOpen?: boolean;
}

// Each page is now a standalone component without tabs
function PreprocessingPage({ onNavigateHome, selectedModelPath, setSelectedModelPath, sidebarInitiallyOpen = false }: PageProps): React.ReactNode {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(sidebarInitiallyOpen);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        selectedModelPath={selectedModelPath}
        setSelectedModelPath={setSelectedModelPath}
      />
      <main className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
        <div className="p-6 sm:p-8 md:p-10">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Toggle sidebar"
                  aria-expanded={isSidebarOpen}
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
              </div>
              <button 
                onClick={onNavigateHome} 
                className="flex items-center gap-2 text-blue-600 font-normal hover:text-blue-700 hover:font-bold transition-all duration-200"
                aria-label="Go back to landing page"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Home
              </button>
            </div>
            
            <div className="transition-opacity duration-300 ease-in-out">
              <PreprocessingTab />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PredictionPage({ onNavigateHome, selectedModelPath, setSelectedModelPath, sidebarInitiallyOpen = false }: PageProps): React.ReactNode {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(sidebarInitiallyOpen);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        selectedModelPath={selectedModelPath}
        setSelectedModelPath={setSelectedModelPath}
      />
      <main className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
        <div className="p-6 sm:p-8 md:p-10">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Toggle sidebar"
                  aria-expanded={isSidebarOpen}
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
              </div>
              <button 
                onClick={onNavigateHome} 
                className="flex items-center gap-2 text-blue-600 font-normal hover:text-blue-700 hover:font-bold transition-all duration-200"
                aria-label="Go back to landing page"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Home
              </button>
            </div>
            
            <div className="transition-opacity duration-300 ease-in-out">
              <PredictionTab selectedModelPath={selectedModelPath} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function RealTimePage({ onNavigateHome, selectedModelPath, setSelectedModelPath, sidebarInitiallyOpen = false }: PageProps): React.ReactNode {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(sidebarInitiallyOpen);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        selectedModelPath={selectedModelPath}
        setSelectedModelPath={setSelectedModelPath}
      />
      <main className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
        <div className="p-6 sm:p-8 md:p-10">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Toggle sidebar"
                  aria-expanded={isSidebarOpen}
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
              </div>
              <button 
                onClick={onNavigateHome} 
                className="flex items-center gap-2 text-blue-600 font-normal hover:text-blue-700 hover:font-bold transition-all duration-200"
                aria-label="Go back to landing page"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Home
              </button>
            </div>
            
            <div className="transition-opacity duration-300 ease-in-out">
              <RealTimeTab/>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App(): React.ReactNode {
    const [page, setPage] = useState<'landing' | 'about' | 'training' | 'prediction'>('landing');
    const [selectedModelPath, setSelectedModelPath] = useState<string>("");
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<React.ReactNode | null>(null);

    // Handler for navigation from LandingPage
    const navigate = (targetPage: 'about' | 'training' | 'prediction' | 'realtime') => {
        setIsTransitioning(true);
        setTimeout(() => {
            setPage(targetPage);
            setIsTransitioning(false);
        }, 300); // Transition duration
    };

    const navigateHome = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setPage('landing');
            setIsTransitioning(false);
        }, 300); // Transition duration
    };

    // Render the current page content
    useEffect(() => {
        let content;
        
        switch (page) {
            case 'about':
                content = <AboutPage onNavigate={navigateHome} />;
                break;
            case 'realtime':
                content = (
                  <RealTimePage
                    onNavigateHome={navigateHome}
                    selectedModelPath={selectedModelPath}
                    setSelectedModelPath={setSelectedModelPath}
                    sidebarInitiallyOpen={false}
                  />
                );
                break;
            case 'training':
                content = (
                  <PreprocessingPage
                    onNavigateHome={navigateHome}
                    selectedModelPath={selectedModelPath}
                    setSelectedModelPath={setSelectedModelPath}
                    sidebarInitiallyOpen={false}
                  />
                );
                break;
            case 'prediction':
                content = (
                  <PredictionPage
                    onNavigateHome={navigateHome}
                    selectedModelPath={selectedModelPath}
                    setSelectedModelPath={setSelectedModelPath}
                    sidebarInitiallyOpen={false}
                  />
                );
                break;
            case 'landing':
            default:
                content = <LandingPage onNavigate={navigate} />;
                break;
        }
        
        setCurrentPage(content);
    }, [page, selectedModelPath]);

    return (
        <div className="app-container relative">
            <div 
                className={`transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            >
                {currentPage}
            </div>
        </div>
    );
}