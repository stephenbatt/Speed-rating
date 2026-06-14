import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Trophy,
  Medal,
  Award,
  DollarSign,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Hash,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { HorseData, calculateRankings } from '@/utils/raceDataParser';
import { saveRaceResult, getRaceResult, RaceResult } from '@/lib/resultsStorage';

interface RaceResultsEntryProps {
  raceId: string;
  horses: HorseData[];
  trackName: string;
  raceNumber: string;
  raceDate: string;
  onResultSaved?: () => void;
}

const RaceResultsEntry: React.FC<RaceResultsEntryProps> = ({
  raceId,
  horses,
  trackName,
  raceNumber,
  raceDate,
  onResultSaved
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingResult, setExistingResult] = useState<RaceResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [firstPlace, setFirstPlace] = useState<string>('');
  const [firstPlaceOdds, setFirstPlaceOdds] = useState<string>('');
  const [secondPlace, setSecondPlace] = useState<string>('');
  const [secondPlaceOdds, setSecondPlaceOdds] = useState<string>('');
  const [thirdPlace, setThirdPlace] = useState<string>('');
  const [thirdPlaceOdds, setThirdPlaceOdds] = useState<string>('');
  const [winBetAmount, setWinBetAmount] = useState<string>('2');
  const [placeBetAmount, setPlaceBetAmount] = useState<string>('');
  const [showBetAmount, setShowBetAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Get predicted winner from rankings
  const rankings = calculateRankings(horses);
  const predictedWinner = rankings.length > 0 ? rankings[0] : null;

  // Check for existing result
  useEffect(() => {
    const checkExisting = async () => {
      const result = await getRaceResult(raceId);
      if (result) {
        setExistingResult(result);
        setFirstPlace(result.firstPlacePost.toString());
        setFirstPlaceOdds(result.firstPlaceOdds?.toString() || '');
        setSecondPlace(result.secondPlacePost?.toString() || '');
        setSecondPlaceOdds(result.secondPlaceOdds?.toString() || '');
        setThirdPlace(result.thirdPlacePost?.toString() || '');
        setThirdPlaceOdds(result.thirdPlaceOdds?.toString() || '');
        setWinBetAmount(result.winBetAmount?.toString() || '2');
        setPlaceBetAmount(result.placeBetAmount?.toString() || '');
        setShowBetAmount(result.showBetAmount?.toString() || '');
        setNotes(result.notes || '');
      }
    };
    if (isOpen) {
      checkExisting();
    }
  }, [raceId, isOpen]);

  const getHorseByPost = (post: number): HorseData | undefined => {
    return horses.find(h => h.postPosition === post);
  };

  const handleSave = async () => {
    if (!firstPlace) {
      setErrorMessage('Please select the winning horse');
      setSaveStatus('error');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    const firstPlacePost = parseInt(firstPlace, 10);
    const firstPlaceHorse = getHorseByPost(firstPlacePost);

    const result: RaceResult = {
      raceId,
      firstPlacePost,
      firstPlaceName: firstPlaceHorse?.name || `Horse #${firstPlacePost}`,
      firstPlaceOdds: parseFloat(firstPlaceOdds) || 0,
      secondPlacePost: secondPlace && secondPlace !== 'none' ? parseInt(secondPlace, 10) : undefined,
      secondPlaceName: secondPlace && secondPlace !== 'none' ? getHorseByPost(parseInt(secondPlace, 10))?.name : undefined,
      secondPlaceOdds: secondPlaceOdds ? parseFloat(secondPlaceOdds) : undefined,
      thirdPlacePost: thirdPlace && thirdPlace !== 'none' ? parseInt(thirdPlace, 10) : undefined,
      thirdPlaceName: thirdPlace && thirdPlace !== 'none' ? getHorseByPost(parseInt(thirdPlace, 10))?.name : undefined,
      thirdPlaceOdds: thirdPlaceOdds ? parseFloat(thirdPlaceOdds) : undefined,
      predictedWinnerPost: predictedWinner?.postPosition || 0,
      predictedWinnerName: predictedWinner?.name || '',
      winBetAmount: parseFloat(winBetAmount) || 2,
      placeBetAmount: placeBetAmount ? parseFloat(placeBetAmount) : undefined,
      showBetAmount: showBetAmount ? parseFloat(showBetAmount) : undefined,
      notes
    };


    const { error } = await saveRaceResult(result);

    if (error) {
      setSaveStatus('error');
      setErrorMessage(error.message);
    } else {
      setSaveStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        onResultSaved?.();
      }, 1500);
    }

    setIsSaving(false);
  };

  const wasCorrect = firstPlace && predictedWinner && parseInt(firstPlace, 10) === predictedWinner.postPosition;
  const wasPlace = secondPlace && predictedWinner && (wasCorrect || parseInt(secondPlace, 10) === predictedWinner.postPosition);
  const wasShow = thirdPlace && predictedWinner && (wasPlace || parseInt(thirdPlace, 10) === predictedWinner.postPosition);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={existingResult ? "outline" : "default"}
          size="sm"
          className={existingResult ? "border-green-500 text-green-600" : "bg-amber-500 hover:bg-amber-600"}
        >
          {existingResult ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Result Recorded
            </>
          ) : (
            <>
              <Trophy className="w-4 h-4 mr-2" />
              Enter Result
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Record Race Result
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Race Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="font-medium">{trackName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-500" />
                <span>Race {raceNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>{raceDate}</span>
              </div>
            </div>
            
            {predictedWinner && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-slate-600">Predicted Winner:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    #{predictedWinner.postPosition} {predictedWinner.name}
                  </Badge>
                  <span className="text-xs text-slate-500">Score: {predictedWinner.finalScore}</span>
                </div>
              </div>
            )}
          </div>

          {/* Finishing Order */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-500" />
              Finishing Order
            </h3>

            {/* 1st Place */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center text-xs font-bold">1</span>
                  First Place (Win)
                </Label>
                <Select value={firstPlace} onValueChange={setFirstPlace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select winner" />
                  </SelectTrigger>
                  <SelectContent>
                    {horses.map(horse => (
                      <SelectItem key={horse.postPosition} value={horse.postPosition.toString()}>
                        #{horse.postPosition} - {horse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Win Odds (e.g., 5.40)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="5.40"
                  value={firstPlaceOdds}
                  onChange={(e) => setFirstPlaceOdds(e.target.value)}
                />
              </div>
            </div>

            {/* 2nd Place */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold">2</span>
                  Second Place
                </Label>
                <Select value={secondPlace} onValueChange={setSecondPlace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select 2nd place" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not recorded --</SelectItem>
                    {horses.filter(h => h.postPosition.toString() !== firstPlace).map(horse => (
                      <SelectItem key={horse.postPosition} value={horse.postPosition.toString()}>
                        #{horse.postPosition} - {horse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>
              <div className="space-y-2">
                <Label>Place Odds</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="3.20"
                  value={secondPlaceOdds}
                  onChange={(e) => setSecondPlaceOdds(e.target.value)}
                />
              </div>
            </div>

            {/* 3rd Place */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                  Third Place
                </Label>
                <Select value={thirdPlace} onValueChange={setThirdPlace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select 3rd place" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not recorded --</SelectItem>
                    {horses.filter(h => 
                      h.postPosition.toString() !== firstPlace && 
                      h.postPosition.toString() !== secondPlace
                    ).map(horse => (
                      <SelectItem key={horse.postPosition} value={horse.postPosition.toString()}>
                        #{horse.postPosition} - {horse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>
              <div className="space-y-2">
                <Label>Show Odds</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="2.40"
                  value={thirdPlaceOdds}
                  onChange={(e) => setThirdPlaceOdds(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Prediction Result Preview */}
          {firstPlace && predictedWinner && (
            <div className={`rounded-lg p-4 ${wasCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2">
                {wasCorrect ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700">Prediction Correct!</span>
                  </>
                ) : wasPlace ? (
                  <>
                    <Medal className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-700">Prediction Placed (2nd)</span>
                  </>
                ) : wasShow ? (
                  <>
                    <Award className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-orange-700">Prediction Showed (3rd)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-700">Prediction Incorrect</span>
                  </>
                )}
              </div>
              <p className="text-sm mt-1 text-slate-600">
                Predicted: #{predictedWinner.postPosition} {predictedWinner.name}
                {' | '}
                Actual: #{firstPlace} {getHorseByPost(parseInt(firstPlace, 10))?.name}
              </p>
            </div>
          )}

          {/* Bet Amounts */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Bet Amounts (Optional)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Win Bet ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="2.00"
                  value={winBetAmount}
                  onChange={(e) => setWinBetAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Place Bet ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={placeBetAmount}
                  onChange={(e) => setPlaceBetAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Show Bet ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={showBetAmount}
                  onChange={(e) => setShowBetAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any observations about the race..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {saveStatus === 'error' && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {saveStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Result saved successfully!</span>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !firstPlace}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Result
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RaceResultsEntry;
