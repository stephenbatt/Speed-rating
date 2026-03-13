import React, { useState } from 'react';
import { HorseData, formatHorseOutput, formatRaceSummary, calculateRankings } from '@/utils/raceDataParser';
import { Copy, CheckCircle, FileText, Download, ChevronDown, ChevronUp, Trophy } from 'lucide-react';

interface ParsedOutputProps {
  horses: HorseData[];
}

const ParsedOutput: React.FC<ParsedOutputProps> = ({ horses }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedHorse, setExpandedHorse] = useState<number | null>(null);
  const [showAllOutput, setShowAllOutput] = useState(false);
  const [showRankings, setShowRankings] = useState(true);
  
  if (horses.length === 0) return null;
  
  const rankings = calculateRankings(horses);
  
  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const copyAllOutput = async () => {
    const rankingSummary = formatRaceSummary(horses);
    const allOutput = rankingSummary + '\n\n' + horses.map(h => formatHorseOutput(h)).join('\n\n');
    try {
      await navigator.clipboard.writeText(allOutput);
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const downloadOutput = () => {
    const rankingSummary = formatRaceSummary(horses);
    const allOutput = rankingSummary + '\n\n' + horses.map(h => formatHorseOutput(h)).join('\n\n');
    const blob = new Blob([allOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `race_data_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      {/* Rankings Summary Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 cursor-pointer"
          onClick={() => setShowRankings(!showRankings)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Final Rankings</h2>
                <p className="text-sm text-amber-100">
                  Based on Beyer speed figure analysis
                </p>
              </div>
            </div>
            {showRankings ? (
              <ChevronUp className="w-5 h-5 text-white" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
        
        {showRankings && rankings.length > 0 && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Post</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Horse</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Raw Score</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Adj</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Final</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Trust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rankings.map((r, i) => (
                    <tr key={r.postPosition} className={i === 0 ? 'bg-yellow-50' : i < 3 ? 'bg-green-50' : ''}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          i === 0 ? 'bg-yellow-400 text-yellow-900' :
                          i === 1 ? 'bg-gray-300 text-gray-800' :
                          i === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">{r.postPosition}</td>
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-right font-mono">{r.adjustedScore}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-600">{r.adjustment}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-lg">{r.finalScore}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          r.trustLevel === 'HIGH' ? 'bg-green-100 text-green-800' :
                          r.trustLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          r.trustLevel === 'LOW' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {r.trustLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Show excluded horses (first-time starters) */}
            {horses.filter(h => h.isFirstTimeStarter || h.lifeStarts === 0).length > 0 && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm font-semibold text-purple-800 mb-2">First-Time Starters (Excluded from Rankings):</div>
                <div className="flex flex-wrap gap-2">
                  {horses.filter(h => h.isFirstTimeStarter || h.lifeStarts === 0).map(h => (
                    <span key={h.postPosition} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                      #{h.postPosition} {h.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Calculation explanation */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>Score Calculation:</strong> (Best of Last 2 + 5) + Top 3 Beyer Sum
              <br />
              <strong>Adjustments:</strong> 1st: -5 | 2nd: -10 | 3rd: -15 | 4th+: -20
              <br />
              <strong>Trust Levels:</strong> HIGH (90+) | MEDIUM (80-89) | LOW (60-79) | EXCLUDE (&lt;60 or First-Time Starter)
            </div>
          </div>
        )}


      </div>
      
      {/* Parsed Output Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Parsed Output</h2>
                <p className="text-sm text-green-100">
                  {horses.length} horse{horses.length !== 1 ? 's' : ''} • Last 7 outs with Beyer speeds
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={copyAllOutput}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  copiedIndex === -1
                    ? 'bg-white text-green-700'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {copiedIndex === -1 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy All
                  </>
                )}
              </button>
              
              <button
                onClick={downloadOutput}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-white/20 text-white hover:bg-white/30 transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
        
        {/* Output Cards */}
        <div className="p-6 space-y-4">
          {horses.map((horse, index) => {
            const output = formatHorseOutput(horse);
            const isExpanded = expandedHorse === index;
            const ranking = rankings.find(r => r.postPosition === horse.postPosition);
            const rankPosition = rankings.findIndex(r => r.postPosition === horse.postPosition) + 1;
            
            return (
              <div 
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-green-300 transition-colors"
              >
                {/* Card Header */}
                <div 
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedHorse(isExpanded ? null : index)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      horse.color === 'Red' ? 'bg-red-600 text-white' :
                      horse.color === 'Blue' ? 'bg-blue-600 text-white' :
                      horse.color === 'Green' ? 'bg-green-600 text-white' :
                      horse.color === 'Yellow' ? 'bg-yellow-400 text-gray-900' :
                      horse.color === 'Black' ? 'bg-gray-900 text-white' :
                      horse.color === 'Orange' ? 'bg-orange-500 text-white' :
                      horse.color === 'Pink' ? 'bg-pink-400 text-white' :
                      horse.color === 'Turquoise' ? 'bg-teal-500 text-white' :
                      horse.color === 'Purple' ? 'bg-purple-600 text-white' :
                      'bg-white text-gray-900 border border-gray-300'
                    }`}>
                      {horse.postPosition}
                    </span>
                    <div>
                      <span className="font-semibold text-gray-900">
                        {horse.name || `Horse #${horse.postPosition}`}
                      </span>
                      <span className="ml-2 text-amber-600 font-bold">{horse.odds}</span>
                    </div>
                    
                    {/* Rank badge */}
                    {rankPosition > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${
                        rankPosition === 1 ? 'bg-yellow-400 text-yellow-900' :
                        rankPosition === 2 ? 'bg-gray-300 text-gray-800' :
                        rankPosition === 3 ? 'bg-amber-600 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        #{rankPosition}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {ranking && (
                      <span className="text-sm font-mono text-emerald-600 font-bold">
                        Score: {ranking.finalScore}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {horse.pastPerformances.length} races
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(output, index);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        copiedIndex === index
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {copiedIndex === index ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Expanded Output */}
                {isExpanded && (
                  <div className="p-4 bg-slate-900">
                    <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap overflow-x-auto">
                      {output}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Full Output Toggle */}
        <div className="px-6 pb-6">
          <button
            onClick={() => setShowAllOutput(!showAllOutput)}
            className="w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            {showAllOutput ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Full Output
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Full Output
              </>
            )}
          </button>
          
          {showAllOutput && (
            <div className="mt-4 p-4 bg-slate-900 rounded-xl">
              <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                {formatRaceSummary(horses)}
                {'\n\n'}
                {horses.map(h => formatHorseOutput(h)).join('\n\n')}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParsedOutput;
