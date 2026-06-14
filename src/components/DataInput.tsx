import React, { useState } from 'react';
import { Upload, FileText, Clipboard, X, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface DataInputProps {
  onDataParsed: (data: string) => void;
  isProcessing?: boolean;
}

// Sample race data based on user's provided format
const SAMPLE_RACE_DATA = `1
Red
6-1
Clm Prc
$12,500
Owner: David S. Romanik 42
Silks: Red, Blue Hoops, Red Sleeves, Red Cap
Trainer:Dalton Lawrence ( 0-0-0-0 ) 0% Micah J Husbands
( 21-5-4-5 ) 24%
2025: 4 0 0 0 66 $1,900 Dirt: 4 0 0 0 66 $1,900
2024: 0 0 0 0 na $0 Turf: 0 0 0 0 na $0
Life: 4 0 0 0 66 $1,900 AllWeather: 2 0 0 0 66 $1,440
Goldinthesky (L) 121 Dist: 1 0 0 0 66 $240 GP: 2 0 0 0 66 $1,440
Ch.g.3 Goldencents ($10,000) - City in the Sky by Sky Classic - Bred in New York by Robert Clements
A15Nov25 GP3 ft 1 7 :24 :49 1:13 1:41 3 Mcl 17500 57 66 4 2 3 5 6 5 Husbands M J 120 bL 51.20
A08Nov25 GP2 ft 5 267 :22 :46 :59 1:05 3 Mcl 12500 12 40 7 7 9 9 9 9 Husbands M J 121 bL 54.80
A14Feb25 GP4 ft 5f 40 :21 :45 :57 3 Mcl 17500 33 32 6 6 5 5 5 5 Reyes L 118 bL 46.60
A05Jan25 GP3 ft 5 -- :22 :45 :58 1:05 3 Mcl 12500 -- 13 8 7 8 8 8 8 Perez E 118 L 31.50
2
White
8-1
Clm Prc
$12,500
Owner: R. T. Racing Stable (Ramon Tallaj) 46
Silks: Royal Blue, Lime Green Cross of Lorraine on Green Ball
Trainer: Leandro Moreno-Barban ( 1-0-0-1 ) 0% David Egan
( 16-3-2-3 ) 19%
2025: 7 0 0 0 56 $6,215 Dirt: 10 0 0 0 56 $10,986
2024: 4 0 0 0 50 $4,961 Turf: 1 0 0 0 52 $190
Life: 11 0 0 0 56 $11,176 AllWeather: 0 0 0 0 na $0
Dominican Thunder (L) 121 Dist: 1 0 0 0 56 $652 GP: 0 0 0 0 na $0
B.g.3 Improbable ($15,000) - Sassy Sienna by Midshipman - Bred in New York
A03Dec25 Tam5 fm 1 54 :22 :47 1:13 1:44 3 Mcl 16000 61 52 2 2 2 3 4 5 Santos A 121 bL 31.40
A10Oct25 Baq3 ft 6 19 :22 :45 1:10 1:17 3 Mcl 30000 40 41 2 7 7 7 7 6 Franco M 121 bL 23.37
A21Sep25 Baq2 ft 1m 27 :23 :46 1:11 1:37 3 Mcl 30000 72 52 3 2 3 3 6 5 Davis K 120 bL 5.35
A25Aug25 FL6 ft 1 38 :24 :49 1:13 1:46 3 Msw 32600 48 56 8 7 6 5 5 5 Elliott C 120 bL 6.10
A18Jul25 Mth4 ft 6f 34 :22 :46 :58 1:12 3 Msw 52500 62 55 1 5 1 3 3 4 Barbosa J 119 bL 23.00
A14Jun25 Baq10 sys 6f 126 :22 :46 :58 1:10 3 Mcl 50000 12 29 6 6 9 9 10 10 Hernandez O 118 bL 62.75
A08Feb25 Aqu9 ft 6f 83 :22 :46 :59 1:12 3 Msw 74000 43 42 3 6 8 11 11 11 Cedeno C 120 bL 59.75
A17Nov24 Aqu9 ft 1m 71 :22 :46 1:11 1:36 2 Msw 75000 36 17 6 9 9 9 9 9 Davis K 119 b 35.00
A07Sep24 Mth8 ft 6f 44 :22 :46 :58 1:11 2 Stk - SmkGlckenB 7 38 5 7 8 8 8 7 Castillo I 116 b 59.80
A25Jul24 Sar6 ft 6f 49 :22 :46 :58 1:12 2 Msw 90000 67 50 1 4 4 4 4 6 Castellano J 119 b 5.10
3
Blue
50-1
Clm Prc
$12,500
Owner: Amanda Harris 30
Silks: Black, White Gulfstream Park Emblem
Trainer:Debra Donaldson ( 0-0-0-0 ) 0% Johanis Aranguren
( 0-0-0-0 ) 0%
2025: 7 0 0 0 59 $3,350 Dirt: 5 0 0 0 44 $1,070
2024: 1 0 0 0 44 $190 Turf: 3 0 0 0 59 $2,470
Life: 8 0 0 0 59 $3,540 AllWeather: 3 0 0 0 10 $690
El de Tocho (L) 111 Dist: 1 0 0 0 10 $230 GP: 3 0 0 0 10 $690
B.g.3 King for a Day ($5,000) - Adopted Family by Not Bourbon - Bred in New York
A26Jul25 GP2 ft 1 41 :23 :48 1:12 1:43 3 Mcl 12500 52 9 5 6 8 11 11 11 Greenidge E 111 bfL 85.80
A15Jun25 GP9 ft 1 21 :24 :48 1:12 1:41 3 Mcl 12500 53 10 11 6 8 10 11 11 Boraco D 118 bL 78.30
A25May25 GP2 ft 1 51 :24 :48 1:13 1:45 3 Mcl 12500 72 0 10 1 1 6 -- -- Almedina M 111 bL 64.60
A04Apr25 Tam9 fm 1m 48 :22 :45 1:10 1:36 3 Mcl 16000 87 59 6 5 6 2 4 4 Hess S 113 bL 78.70
A15Feb25 Tam4 fm 1 17 :23 :47 1:12 1:44 3 Mcl 16000 65 19 10 2 2 3 9 10 Maldonado G 120 bL 13.80
A29Jan25 Tam6 ft 1 19 :23 :48 1:14 1:42 3 Mcl 16000 59 41 2 2 1 1 5 7 Batista J A 120 bL 4.60
A10Jan25 Tam7 fm 1 21 :23 :48 1:13 1:46 3 Mcl 16000 31 51 6 7 8 5 5 4 Batista J A 120 bL 8.50
A20Dec24 Tam4 ft 6 -- :23 :48 1:12 1:19 2 Mcl 16000 20 44 4 6 6 5 4 7 Rodriguez A 119 62.20
4
Yellow
7-2
Clm Prc
$12,500
Owner: Lynne M. Boutte and Ellen Epstein 63
Silks: Purple, White Peace Sign Emblem, Purple Cap
Trainer:Kathleen O'Connell ( 5-0-1-0 ) 0% Luca Panici
( 14-1-3-0 ) 7%
2025: 4 0 1 3 73 $14,140 Dirt: 7 0 2 4 73 $24,390
2024: 3 0 1 1 63 $10,250 Turf: 0 0 0 0 na $0
Life: 7 0 2 4 73 $24,390 AllWeather: 7 0 2 4 73 $24,390
Leroy Brown (L) 121 Dist: 5 0 2 2 73 $18,750 GP: 7 0 2 4 73 $24,390
Dk B/ Br.g.3 Take Charge Indy ($7,500) - Mixed Up Kid by Lemon Drop Kid
A23Nov25 GP2 ft 1 21 :23 :47 1:11 1:43 3 Mcl 12500 76 60 5 5 7 5 4 3 Panici L 120 bL 10.50
A02Nov25 GP11 ft 1 23 :24 :49 1:13 1:41 3 Mcl 12500 48 73 3 5 6 6 3 2 Panici L 120 bL 9.20
A10Oct25 GP1 ft 1 20 :23 :46 1:11 1:42 3 Mcl 12500 109 64 2 2 3 4 4 3 Fuenmayor L 113 bL 2.10
A20Sep25 GP2 ft 1 343 :23 :47 1:12 1:43 3 Mcl 12500 91 63 7 5 4 1 3 3 Panici L 120 bL 6.70
A12Oct24 GP5 ft 1 27 :23 :47 1:12 1:43 2 Mcl 16000 90 57 1 1 2 2 3 5 Panici L 118 b *1.80
A15Sep24 GP2 ft 1 23 :23 :48 1:13 1:43 2 Mcl 16000 81 63 2 6 5 3 2 2 Panici L 118 b *2.00
A23Aug24 GP3 ft 1 -- :24 :48 1:13 1:43 2 Mcl 35000 69 55 4 5 4 2 3 3 Panici L 118 b 10.20
5
Green
5-2
Clm Prc
$12,500
Owner: JC Racing Stable (Jose M. Castro) 56
Silks: Turquoise, Red Sash, Red Stripe on Black Sleeves
Trainer: Jose M Castro ( 9-0-0-3 ) 0% Wesley Henry
( 2-1-0-0 ) 50%
2025: 2 0 0 0 57 $860 Dirt: 2 0 0 0 62 $2,430
2024: 1 0 0 0 62 $2,000 Turf: 1 0 0 0 49 $430
Life: 3 0 0 0 62 $2,860 AllWeather: 0 0 0 0 na $0
Sea God (L) 121 Dist: 0 0 0 0 na $0 GP: 0 0 0 0 na $0
B.g.3 Good Magic ($125,000) - Waltzingintherain by Tizway - Bred in Kentucky
A10Aug25 GP7 sy 7f 43 :22 :46 1:12 1:25 3 Msw 56000 43 57 4 3 5 6 5 5 Jaramillo E 119 L 8.00
A28Jun25 GP11 fm 1 238 :24 :48 1:11 1:41 3 Msw 56000 87 49 3 3 2 8 9 9 Jaramillo E 118 L 6.50
A02Nov24 GP6 ft 6 -- :22 :46 1:12 1:18 2 Msw 65000 63 62 6 2 3 6 5 4 Jaramillo E 118 5.30
6
Black
12-1
Clm Prc
$12,500
Owner: Rafael Gonzalez and Just For Fun Stable 45
Silks: Royal Blue, Green Star, Green Band on Sleeves
Trainer:Ruben Sierra ( 5-0-1-1 ) 0% Carlos Martinez
( 12-1-0-2 ) 8%
2025: 4 0 0 0 49 $1,050 Dirt: 2 0 0 0 49 $640
2024: 0 0 0 0 na $0 Turf: 2 0 0 0 49 $410
Life: 4 0 0 0 49 $1,050 AllWeather: 0 0 0 0 na $0
El Rabano (L) 111 Dist: 0 0 0 0 na $0 GP: 0 0 0 0 na $0
B.c.3 Twirling Candy ($75,000) - Tapit Queen by Tapit - Bred in Kentucky
A04Apr25 Tam9 fm 1m 12 :22 :45 1:10 1:36 3 Mcl 16000 108 47 3 2 2 3 5 8 Almedina M 113 bL 9.30
A23Mar25 Tam9 fm 1m 15 :23 :47 1:12 1:37 3 Mcl 32000 57 49 3 6 5 4 5 9 Meneses M 120 bL 6.90
A08Mar25 Tam6 ft 7f 27 :21 :45 1:09 1:21 3 Msw 53000 86 38 9 2 3 2 10 11 Vargas J E 110 bL 81.00
A09Feb25 Tam6 ft 5 -- :21 :45 :57 1:03 3 Msw 53000 83 49 2 1 1 1 4 8 Gil C 120 bL 62.60`;

const DataInput: React.FC<DataInputProps> = ({ onDataParsed, isProcessing = false }) => {
  const [inputText, setInputText] = useState('');
  const [pasteStatus, setPasteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showInput, setShowInput] = useState(true);
  
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      setPasteStatus('success');
      setTimeout(() => setPasteStatus('idle'), 2000);
    } catch (err) {
      setPasteStatus('error');
      setTimeout(() => setPasteStatus('idle'), 2000);
    }
  };
  
  const handleSubmit = () => {
    if (inputText.trim()) {
      onDataParsed(inputText);
    }
  };
  
  const handleClear = () => {
    setInputText('');
    setPasteStatus('idle');
  };
  
  const handleLoadSample = () => {
    setInputText(SAMPLE_RACE_DATA);
    setPasteStatus('success');
    setTimeout(() => setPasteStatus('idle'), 2000);
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Race Data Input</h2>
              <p className="text-sm text-slate-300">Paste your Equibase PP data below</p>
            </div>
          </div>
          <button
            onClick={() => setShowInput(!showInput)}
            className="text-slate-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-slate-700"
          >
            {showInput ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      
      {showInput && (
        <div className="p-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={handlePaste}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                pasteStatus === 'success'
                  ? 'bg-green-100 text-green-700'
                  : pasteStatus === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {pasteStatus === 'success' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Pasted!
                </>
              ) : pasteStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Failed
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4" />
                  Paste from Clipboard
                </>
              )}
            </button>
            
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Load Sample Race
            </button>
            
            {inputText && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
          
          {/* Text Area */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Paste your race data here...

Example format:
1
Red
7-2
Owner: Example Owner
...
Life: 10 2 1 1 99 $40,129
Horse Name (L) 124 Dist: ...
A24Nov25 Dmr5 gd 1m 45 :23 :48 1:12 1:37 3 Str 50000 95 99 ...

Or click "Load Sample Race" to see an example!`}
              className="w-full h-64 p-4 border border-gray-300 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              spellCheck={false}
            />
            
            {/* Character Count */}
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {inputText.length.toLocaleString()} characters
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Supports Equibase past performance data format
            </p>
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isProcessing}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                inputText.trim() && !isProcessing
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Parse Race Data
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="px-6 py-4 bg-slate-50 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">How to use:</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Copy the race data from your Equibase PDF or text source</li>
          <li>Paste it into the text area above (or use the Paste button)</li>
          <li>Click "Parse Race Data" to extract horse information</li>
          <li>View parsed horses with their past performances and speed figures</li>
        </ol>
        
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Tip:</strong> The parser looks for post position numbers (1-20), followed by color (Red, White, Blue, etc.), 
            then odds (like 7-2). Horse names are found near the "Life:" stats line.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataInput;
