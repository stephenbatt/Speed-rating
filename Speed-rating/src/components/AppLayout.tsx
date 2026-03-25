import React, { useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import Header from './Header';
import DataInput from './DataInput';
import RaceView from './RaceView';
import ParsedOutput from './ParsedOutput';
import SpeedFigureChart from './SpeedFigureChart';
import QuickStats from './QuickStats';
import ComparisonTable from './ComparisonTable';
import SavedRaces from './SavedRaces';
import PatternAnalysis from './PatternAnalysis';
import StatisticsDashboard from './StatisticsDashboard';
import ResultsStatsDashboard from './ResultsStatsDashboard';
import JockeyTrainerLeaderboard from './JockeyTrainerLeaderboard';
import { parseSimpleFormat, HorseData } from '@/utils/raceDataParser';
import { saveRace } from '@/lib/raceStorage';
import { saveRaceParticipants } from '@/lib/statisticsStorage';
import { BarChart3, FileText, Eye, Layers, Table2, Activity, Database, Save, CheckCircle, AlertCircle, Loader2, TrendingUp, PieChart, Trophy, Users } from 'lucide-react';

type TabType = 'input' | 'cards' | 'compare' | 'patterns' | 'analysis' | 'output' | 'saved' | 'stats' | 'results' | 'leaderboard';

const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();
  
  const [horses, setHorses] = useState<HorseData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const [trackName, setTrackName] = useState('');
  const [raceNumber, setRaceNumber] = useState('');
  const [raceDate, setRaceDate] = useState('');
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  
  const handleDataParsed = useCallback((rawData: string) => {
    setIsProcessing(true);
    setSaveStatus('idle');
    
    setTimeout(() => {
      try {
        const parsedHorses = parseSimpleFormat(rawData);
        setHorses(parsedHorses);
        
        // Try to extract track info from parsed PP lines first
        let foundTrack = '';
        for (const horse of parsedHorses) {
          for (const pp of horse.pastPerformances) {
            if (pp.track && pp.track.length >= 2) {
              foundTrack = pp.track;
              break;
            }
          }
          if (foundTrack) break;
        }
        
        // Map track codes to full names
        const trackCodeMap: Record<string, string> = {
          'Dmr': 'Del Mar',
          'SA': 'Santa Anita',
          'GP': 'Gulfstream Park',
          'CD': 'Churchill Downs',
          'BEL': 'Belmont Park',
          'SAR': 'Saratoga',
          'KEE': 'Keeneland',
          'Tam': 'Tampa Bay Downs',
          'AQU': 'Aqueduct',
          'LRL': 'Laurel Park',
          'OP': 'Oaklawn Park',
          'FG': 'Fair Grounds',
          'GG': 'Golden Gate',
          'MVR': 'Mahoning Valley',
          'TDN': 'Thistledown',
          'BTN': 'Belterra',
          'PIM': 'Pimlico',
          'WO': 'Woodbine',
          'HOL': 'Hollywood Park',
          'EMD': 'Emerald Downs',
          'PRM': 'Prairie Meadows',
          'IND': 'Indiana Grand',
          'CT': 'Charles Town',
          'PRX': 'Parx Racing',
          'MTH': 'Monmouth Park',
        };
        
        if (foundTrack && trackCodeMap[foundTrack]) {
          setTrackName(trackCodeMap[foundTrack]);
        } else if (foundTrack) {
          setTrackName(foundTrack); // Use code if no mapping
        } else {
          // Fallback: try to extract from raw text
          const trackMatch = rawData.match(/Gulfstream|Santa Anita|Del Mar|Churchill|Belmont|Saratoga|Keeneland|Tampa|Aqueduct|Laurel|Hollywood/i);
          if (trackMatch) {
            setTrackName(trackMatch[0]);
          } else {
            setTrackName('Unknown Track');
          }
        }
        
        const raceMatch = rawData.match(/RACE\s+(\d+)/i);
        if (raceMatch) {
          setRaceNumber(raceMatch[1]);
        }
        
        // Set current date as race date
        setRaceDate(new Date().toLocaleDateString());
        
        if (parsedHorses.length > 0) {
          setActiveTab('cards');
        }
      } catch (error) {
        console.error('Error parsing data:', error);
      }
      
      setIsProcessing(false);
    }, 500);
  }, []);

  
  const handleSaveRace = async () => {
    if (horses.length === 0) {
      setSaveStatus('error');
      setSaveMessage('No horses to save. Parse race data first.');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }
    
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      const { data, error } = await saveRace({
        trackName: trackName || 'Unknown Track',
        raceNumber: raceNumber || undefined,
        raceDate: raceDate || new Date().toLocaleDateString(),
        horses,
      });
      
      if (error) {
        setSaveStatus('error');
        setSaveMessage(error.message);
      } else if (data) {
        // Save race participants for jockey/trainer tracking
        const participants = horses.map(horse => {
          // Get jockey from most recent PP if available
          const recentPP = horse.pastPerformances[0];
          const jockeyFromPP = recentPP?.jockey || '';
          
          // Get best Beyer speed figure
          const validSpeeds = horse.pastPerformances
            .map(pp => parseInt(pp.speed, 10))
            .filter(s => !isNaN(s) && s > 0);
          const bestBeyer = validSpeeds.length > 0 ? Math.max(...validSpeeds) : undefined;
          
          return {
            horseName: horse.name,
            postPosition: horse.postPosition,
            jockeyName: jockeyFromPP || horse.jockey || undefined,
            trainerName: horse.trainer || undefined,
            track: trackName || undefined,
            distance: recentPP?.distance || undefined,
            surface: recentPP?.surface || undefined,
            raceDate: raceDate || undefined,
            beyerSpeed: bestBeyer,
          };
        });
        
        await saveRaceParticipants(data.id, participants);
        
        setSaveStatus('success');
        setSaveMessage('Race saved successfully!');
      }
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage('Failed to save race');
    }
    
    setIsSaving(false);
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  
  const handleLoadSavedRace = (loadedHorses: HorseData[], loadedTrack: string, loadedRaceNum: string, loadedDate: string) => {
    setHorses(loadedHorses);
    setTrackName(loadedTrack);
    setRaceNumber(loadedRaceNum);
    setRaceDate(loadedDate);
    setActiveTab('cards');
    setSaveStatus('idle');
  };
  
  const tabs = [
    { id: 'input' as TabType, label: 'Data Input', icon: FileText },
    { id: 'cards' as TabType, label: 'Race Cards', icon: Layers, count: horses.length },
    { id: 'patterns' as TabType, label: 'Patterns', icon: TrendingUp, count: horses.length },
    { id: 'compare' as TabType, label: 'Compare', icon: Table2, count: horses.length },
    { id: 'analysis' as TabType, label: 'Charts', icon: BarChart3 },
    { id: 'output' as TabType, label: 'Raw Output', icon: Eye },
    { id: 'saved' as TabType, label: 'Saved Races', icon: Database },
    { id: 'results' as TabType, label: 'Results & ROI', icon: Trophy },
    { id: 'leaderboard' as TabType, label: 'Leaderboard', icon: Users },
    { id: 'stats' as TabType, label: 'Statistics', icon: PieChart },
  ];



  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200">
      <Header onMenuClick={toggleSidebar} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>
            
            {/* Racing silhouette decoration */}
            <div className="absolute right-8 bottom-0 opacity-5">
              <svg width="200" height="150" viewBox="0 0 200 150" fill="currentColor">
                <path d="M180 120c-10-20-30-40-50-45-15-4-25 5-40 10-20 7-35 5-50-10-10-10-15-25-20-40 0 0 10 20 30 25 15 4 30-5 45-15 20-13 40-10 55 5 20 20 35 50 30 70z" />
                <ellipse cx="160" cy="130" rx="30" ry="10" />
                <ellipse cx="60" cy="130" rx="25" ry="8" />
              </svg>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-8 h-8 text-amber-400" />
                <span className="text-amber-400 font-semibold tracking-wider uppercase text-sm">Handicapping Tools</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Horse Racing <span className="text-amber-400">Handicapper</span>
              </h1>
              <p className="text-slate-300 text-lg max-w-2xl">
                Parse Equibase past performance data, analyze speed figures, compare horses, and save your analysis history.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                  <div className="text-2xl font-bold text-amber-400">{horses.length}</div>
                  <div className="text-xs text-slate-300">Horses Loaded</div>
                </div>
                {trackName && (
                  <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                    <div className="text-lg font-bold">{trackName}</div>
                    <div className="text-xs text-slate-300">Track</div>
                  </div>
                )}
                {raceNumber && (
                  <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                    <div className="text-lg font-bold">Race {raceNumber}</div>
                    <div className="text-xs text-slate-300">Current Race</div>
                  </div>
                )}
                {horses.length > 0 && (
                  <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                    <div className="text-lg font-bold">
                      {horses.reduce((sum, h) => sum + h.pastPerformances.length, 0)}
                    </div>
                    <div className="text-xs text-slate-300">Past Performances</div>
                  </div>
                )}
                
                {/* Save Button */}
                {horses.length > 0 && (
                  <button
                    onClick={handleSaveRace}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      saveStatus === 'success'
                        ? 'bg-green-500 text-white'
                        : saveStatus === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : saveStatus === 'success' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Saved!
                      </>
                    ) : saveStatus === 'error' ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        Error
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Race
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {/* Save Status Message */}
              {saveStatus !== 'idle' && saveMessage && (
                <div className={`mt-4 px-4 py-2 rounded-lg text-sm ${
                  saveStatus === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
                }`}>
                  {saveMessage}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        {horses.length > 0 && (
          <div className="mb-8">
            <QuickStats horses={horses} />
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-2 inline-flex flex-wrap gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'input' && (
            <DataInput 
              onDataParsed={handleDataParsed}
              isProcessing={isProcessing}
            />
          )}
          
          {activeTab === 'cards' && (
            <RaceView 
              horses={horses}
              trackName={trackName || 'Race Track'}
              raceNumber={raceNumber || '1'}
              raceDate={raceDate || new Date().toLocaleDateString()}
            />
          )}
          
          {activeTab === 'compare' && (
            <>
              {horses.length > 0 ? (
                <ComparisonTable horses={horses} />
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                  <Table2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Horses to Compare</h3>
                  <p className="text-gray-500 mb-4">
                    Paste race data in the Data Input tab to compare horses.
                  </p>
                  <button
                    onClick={() => setActiveTab('input')}
                    className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                  >
                    Go to Data Input
                  </button>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'patterns' && (
            <>
              {horses.length > 0 ? (
                <PatternAnalysis 
                  horses={horses}
                  trackName={trackName}
                  raceNumber={raceNumber}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Patterns to Analyze</h3>
                  <p className="text-gray-500 mb-4">
                    Paste race data in the Data Input tab to see hit/miss patterns and rankings.
                  </p>
                  <button
                    onClick={() => setActiveTab('input')}
                    className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                  >
                    Go to Data Input
                  </button>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'output' && (
            <ParsedOutput horses={horses} />
          )}
          
          {activeTab === 'analysis' && (
            <div className="space-y-8">
              <SpeedFigureChart horses={horses} />
              
              {horses.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data to Analyze</h3>
                  <p className="text-gray-500 mb-4">
                    Paste race data in the Data Input tab to see speed figure analysis.
                  </p>
                  <button
                    onClick={() => setActiveTab('input')}
                    className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                  >
                    Go to Data Input
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'saved' && (
            <SavedRaces onLoadRace={handleLoadSavedRace} />
          )}
          
          {activeTab === 'results' && (
            <ResultsStatsDashboard />
          )}
          
          {activeTab === 'leaderboard' && (
            <JockeyTrainerLeaderboard />
          )}
          
          {activeTab === 'stats' && (
            <StatisticsDashboard />
          )}
        </div>



        
        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">RaceTrackPro</span>
              </div>
              <p className="text-sm text-gray-500">
                Professional horse racing handicapping tools for serious bettors.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Speed Figure Analysis</li>
                <li>Past Performance Parsing</li>
                <li>Horse Comparison Tables</li>
                <li>Save & Load Race History</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Supported Tracks</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Santa Anita</li>
                <li>Gulfstream Park</li>
                <li>Del Mar</li>
                <li>Churchill Downs</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Data Sources</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Equibase PP Data</li>
                <li>Daily Racing Form</li>
                <li>Track Master</li>
                <li>Brisnet</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2026 RaceTrackPro. For entertainment purposes only.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AppLayout;
