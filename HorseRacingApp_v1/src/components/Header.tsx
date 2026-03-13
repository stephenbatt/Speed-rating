import React from 'react';
import { Activity, Settings, HelpCircle, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  RaceTrack<span className="text-amber-400">Pro</span>
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">Horse Racing Handicapping</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {['Dashboard', 'Races', 'Analysis', 'History'].map((item, index) => (
              <button
                key={item}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  index === 0
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-4 border-l border-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                U
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
