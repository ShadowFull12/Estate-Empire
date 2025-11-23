
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  GameState, DistrictName, Property, BuildingType, RentMode, 
  Notification, RandomEvent
} from './types';
import { 
  DISTRICTS, INITIAL_MONEY, generateDistrictPlots, TENANT_NAMES, 
  MAX_CONDITION, XP_PER_RENT, XP_PER_BUY, REPAIR_COST_PER_UNIT, TICK_RATE_MS,
  AUDIO_URLS, XP_PER_REPAIR, XP_PER_UPGRADE_MULTIPLIER, PASSIVE_XP_HIGH_REP,
  getGlobalEvents, getLocalEvents, PROPERTY_TIER_COST, MAX_AMENITY_LEVEL_TIER_1
} from './constants';
import IsometricMap from './components/IsometricMap';
import PropertyModal from './components/PropertyModal';
import { 
  Play, Pause, Sun, Moon, Map, TrendingUp, Star, Zap, AlertTriangle,
  FastForward, Volume2, VolumeX, TrendingDown, Save, LogOut, BookOpen, RotateCcw, Settings, ArrowLeft, PlusCircle, Trash2
} from 'lucide-react';

// --- AUDIO MANAGER HOOK ---
const useAudio = (isMuted: boolean) => {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const audioContextReady = useRef(false);

  // Initialize BGM
  useEffect(() => {
    bgmRef.current = new Audio(AUDIO_URLS.bgm);
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.15; 
    
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  // Handle Mute
  useEffect(() => {
    if (bgmRef.current) {
      if (isMuted) bgmRef.current.pause();
      else if (audioContextReady.current) bgmRef.current.play().catch(e => console.log("Audio play blocked", e));
    }
  }, [isMuted]);

  // Unlock Audio Context on User Interaction
  const unlockAudio = useCallback(() => {
    if (!audioContextReady.current && bgmRef.current && !isMuted) {
      bgmRef.current.play().then(() => {
        audioContextReady.current = true;
      }).catch(e => console.error("Audio unlock failed", e));
    }
  }, [isMuted]);

  const playSfx = useCallback((type: keyof typeof AUDIO_URLS) => {
    if (isMuted || type === 'bgm') return;
    const audio = new Audio(AUDIO_URLS[type]);
    audio.volume = type === 'tense' ? 0.6 : 0.4;
    audio.play().catch(() => {});
  }, [isMuted]);

  return { playSfx, unlockAudio };
};

// --- COMPONENT: Event Modal ---
const EventModal = ({ event, onOptionSelect }: { event: RandomEvent, onOptionSelect: (action: any) => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border-t-8 ${event.type === 'GLOBAL' ? 'border-yellow-500' : 'border-red-500'}`}>
      <div className="p-8 text-center">
        <div className={`w-16 h-16 ${event.type === 'GLOBAL' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce`}>
           <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2 dark:text-white">{event.title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{event.description}</p>
        
        <div className="grid gap-3">
          {event.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onOptionSelect(opt.action)}
              className="w-full p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-left transition-colors relative group border border-transparent hover:border-slate-400"
            >
              <div className="flex justify-between items-center mb-1">
                 <span className="font-bold dark:text-white">{opt.label}</span>
                 {opt.cost && <span className="text-red-500 font-bold text-sm">-${opt.cost}</span>}
              </div>
              {opt.description && <p className="text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>}
              {opt.risk && <p className="text-xs text-red-500 font-bold mt-1">⚠️ {opt.risk}</p>}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENT: Pause Menu ---
const PauseMenu = ({ onResume, onSaveClick, onQuit, slotName }: { onResume: () => void, onSaveClick: () => void, onQuit: () => void, slotName: string }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
    <div className="bg-white/10 border border-white/20 text-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center backdrop-blur-xl">
      <h2 className="text-4xl font-black mb-2 tracking-wider">PAUSED</h2>
      <p className="text-slate-400 mb-8 text-sm uppercase tracking-widest">Playing on {slotName}</p>
      
      <div className="space-y-4">
        <button onClick={onResume} className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
          <Play size={20} fill="currentColor"/> RESUME
        </button>
        <button onClick={onSaveClick} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
          <Save size={20} /> SAVE GAME
        </button>
        <button onClick={onQuit} className="w-full py-4 bg-transparent border-2 border-white/20 hover:bg-white/10 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
          <LogOut size={20} /> QUIT TO MENU
        </button>
      </div>
    </div>
  </div>
);

// --- COMPONENT: Instructions ---
const InstructionsModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4 animate-in slide-in-from-bottom-10 duration-300">
    <div className="bg-white dark:bg-slate-800 max-w-4xl w-full h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
      <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
        <h2 className="text-2xl font-black uppercase tracking-wide dark:text-white flex items-center gap-2">
          <BookOpen className="text-blue-500"/> How to Play
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition">
          <LogOut size={24} className="dark:text-white"/>
        </button>
      </div>
      <div className="p-8 overflow-y-auto flex-1 dark:text-slate-300 space-y-8">
        <section>
          <h3 className="text-xl font-bold text-blue-500 mb-2">1. The Goal</h3>
          <p>Build a real estate empire. Buy plots, build houses, manage tenants, and maintain high reputation. Reach Level 20 to dominate the Financial District.</p>
        </section>
        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-green-500 mb-2">2. Making Money</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Rentals:</strong> Steady weekly income. Low maintenance.</li>
              <li><strong>Hotels:</strong> High daily income but erratic. High upkeep.</li>
              <li><strong>Commercial:</strong> Massive income, requires Level 5+.</li>
            </ul>
          </div>
          <div>
             <h3 className="text-xl font-bold text-yellow-500 mb-2">3. Reputation & Tiers</h3>
             <p>Reputation is everything. Upgrade buildings to Tier 2 to unlock premium amenities.</p>
             <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
               <li>Fix broken items immediately.</li>
               <li>Respond to events wisely.</li>
               <li>Tier 1 maxes at Lvl 5 amenities. Tier 2 goes to Lvl 10.</li>
             </ul>
          </div>
        </section>
        <section>
          <h3 className="text-xl font-bold text-red-500 mb-2">4. Controls</h3>
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl grid grid-cols-2 gap-4">
             <div><span className="font-bold">Click Plot:</span> Manage Property</div>
             <div><span className="font-bold">ESC:</span> Pause Menu</div>
             <div><span className="font-bold">Speed Buttons:</span> Control Time</div>
          </div>
        </section>
      </div>
    </div>
  </div>
);

// --- COMPONENT: Level Up Modal ---
const LevelUpModal = ({ level, rewards, onClose }: { level: number, rewards: string[], onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in zoom-in-50 duration-500">
    <div className="text-center">
      <div className="text-6xl mb-4 animate-bounce">🎉</div>
      <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 filter drop-shadow-lg">
        LEVEL {level} REACHED!
      </h2>
      <p className="text-xl text-white mb-8">Your empire grows stronger.</p>
      
      <div className="bg-white/10 p-6 rounded-2xl border border-white/20 max-w-md mx-auto mb-8 backdrop-blur-xl">
        <h3 className="text-white font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Unlocked Bonuses</h3>
        <ul className="space-y-2 text-left">
          {rewards.map((r, i) => (
             <li key={i} className="text-green-400 font-bold flex items-center gap-2">
               <Star size={16} fill="currentColor" /> {r}
             </li>
          ))}
        </ul>
      </div>

      <button 
        onClick={onClose}
        className="px-12 py-4 bg-white text-slate-900 font-black text-xl rounded-full hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.5)]"
      >
        CONTINUE
      </button>
    </div>
  </div>
);

type ViewState = 'menu' | 'game' | 'instructions' | 'slots_new' | 'slots_load' | 'slots_save';

const App: React.FC = () => {
  // --- STATE ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [view, setView] = useState<ViewState>('menu');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictName>(DistrictName.SUBURBS);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number>(1);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    money: INITIAL_MONEY,
    reputation: 100,
    day: 1,
    level: 1,
    xp: 0,
    xpToNextLevel: 1000,
    properties: generateDistrictPlots(DistrictName.SUBURBS),
    unlockedDistricts: [DistrictName.SUBURBS],
    notifications: [],
    timeScale: 1,
    gameSpeed: TICK_RATE_MS,
    isMuted: false,
    activeEvent: null,
    showLevelUpModal: false
  });

  const { playSfx, unlockAudio } = useAudio(gameState.isMuted);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived State
  const selectedProperty = useMemo(() => 
    gameState.properties.find(p => p.id === selectedPropertyId) || null,
    [gameState.properties, selectedPropertyId]
  );
  
  const isTimeStopped = showPauseMenu || gameState.timeScale === 0 || !!selectedPropertyId || !!gameState.activeEvent || gameState.showLevelUpModal;

  // --- KEYBOARD LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'game') {
          setShowPauseMenu(prev => !prev);
        } else if (selectedPropertyId) {
          setSelectedPropertyId(null);
        } else if (view.startsWith('slots_')) {
            if (view === 'slots_save') {
                setView('game');
                setShowPauseMenu(true);
            } else {
                setView('menu');
            }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, selectedPropertyId]);

  // --- SAVE / LOAD SYSTEM ---
  const saveGame = (slot: number) => {
    const data = { ...gameState, activeEvent: null, showLevelUpModal: false, timeScale: 0 };
    localStorage.setItem(`estateEmpire_slot_${slot}`, JSON.stringify(data));
    localStorage.setItem(`estateEmpire_slot_${slot}_meta`, JSON.stringify({
      day: gameState.day,
      money: gameState.money,
      level: gameState.level,
      timestamp: Date.now()
    }));
  };

  const loadGame = (slot: number) => {
    const saved = localStorage.getItem(`estateEmpire_slot_${slot}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameState({ ...parsed, timeScale: 0 }); // Load paused
        setActiveSlot(slot);
        setView('game');
        playSfx('success');
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
  };

  const getSlotMeta = (slot: number) => {
    const meta = localStorage.getItem(`estateEmpire_slot_${slot}_meta`);
    return meta ? JSON.parse(meta) : null;
  };

  const deleteSlot = (slot: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("Are you sure you want to delete this save file?")) {
          localStorage.removeItem(`estateEmpire_slot_${slot}`);
          localStorage.removeItem(`estateEmpire_slot_${slot}_meta`);
          setView(prev => prev); 
          playSfx('click');
      }
  }

  const handleSlotAction = (slot: number) => {
      playSfx('click');
      
      if (view === 'slots_new') {
          const meta = getSlotMeta(slot);
          if (meta && !window.confirm("This slot is already used. Overwrite it?")) return;
          
          setActiveSlot(slot);
          setGameState({
            money: INITIAL_MONEY,
            reputation: 100,
            day: 1,
            level: 1,
            xp: 0,
            xpToNextLevel: 1000,
            properties: generateDistrictPlots(DistrictName.SUBURBS),
            unlockedDistricts: [DistrictName.SUBURBS],
            notifications: [],
            timeScale: 1,
            gameSpeed: TICK_RATE_MS,
            isMuted: false,
            activeEvent: null,
            showLevelUpModal: false
          });
          setView('game');
      } 
      else if (view === 'slots_load') {
          if (!getSlotMeta(slot)) return; 
          loadGame(slot);
      }
      else if (view === 'slots_save') {
          const meta = getSlotMeta(slot);
          if (meta && !window.confirm("Overwrite this save slot?")) return;
          saveGame(slot);
          addNotification("Game Saved", `Saved to Slot ${slot}`, "success");
          setView('game');
          setShowPauseMenu(true);
      }
  };

  // Auto-Save
  useEffect(() => {
    if (view === 'game') {
      const saveTimer = setInterval(() => {
        saveGame(activeSlot);
      }, 5000);
      return () => clearInterval(saveTimer);
    }
  }, [gameState, activeSlot, view]);

  // --- CALCULATE NET CASH FLOW ---
  const cashFlow = useMemo(() => {
    let dailyIncome = 0;
    let dailyExpense = 0;

    gameState.properties.forEach(p => {
      if (!p.isOwned) return;
      p.furnitures.forEach(f => dailyExpense += (f.level * f.baseUpkeep));
      if (p.activeLocalEventId) return; 

      const comfort = p.furnitures.reduce((acc, f) => acc + (f.level * f.baseComfort), 0);
      if (p.rentMode === RentMode.LONG_TERM) {
        dailyIncome += (200 + (comfort * 5)) / 7;
      } else if (p.rentMode === RentMode.HOTEL) {
        dailyIncome += (50 + (comfort * 2)) * 0.5;
      } else if (p.rentMode === RentMode.COMMERCIAL) {
         dailyIncome += (600 + (comfort * 15)) / 7;
      }
    });

    return Math.floor(dailyIncome - dailyExpense);
  }, [gameState.properties, gameState.money]);

  // --- EFFECT: Dark Mode ---
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- NOTIFICATIONS ---
  const addNotification = useCallback((title: string, message: string, type: Notification['type'] = 'info') => {
    const id = Date.now().toString();
    if (type === 'success') playSfx('success');
    else if (type === 'error') playSfx('error');
    else playSfx('notification');

    setGameState(prev => ({
      ...prev,
      notifications: [...prev.notifications.slice(-4), { id, title, message, type, timestamp: Date.now() }]
    }));
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id)
      }));
    }, 6000);
  }, [playSfx]);

  // --- GAME LOOP ---
  const tick = useCallback(() => {
    setGameState(prev => {
      if (isTimeStopped) return prev;

      let newMoney = prev.money;
      let newXp = prev.xp;
      let newReputation = prev.reputation;
      const currentDay = prev.day + 1;
      let gainedIncome = false;
      
      if (prev.reputation >= 90) newXp += PASSIVE_XP_HIGH_REP;

      const updatedProperties = prev.properties.map(prop => {
        if (!prop.isOwned) return prop;
        
        let updatedProp = { ...prop };
        const upkeep = prop.furnitures.reduce((acc, f) => acc + (f.level * f.baseUpkeep), 0);
        newMoney -= upkeep;
        
        if (updatedProp.activeLocalEventId) return updatedProp; 

        if (Math.random() < 0.05) {
           updatedProp.condition = Math.max(0, updatedProp.condition - 1);
        }

        if (updatedProp.rentMode !== RentMode.NONE) {
          const comfort = prop.furnitures.reduce((acc, f) => acc + (f.level * f.baseComfort), 0);

          if (updatedProp.rentMode === RentMode.HOTEL) {
             const baseRate = 50;
             const rate = (baseRate + (comfort * 2)) * (prop.condition / 100);
             const occupancyChance = (prev.reputation / 100) * (0.4 + (comfort / 200));
             
             if (Math.random() < occupancyChance) {
               newMoney += rate;
               updatedProp.tenantName = TENANT_NAMES[Math.floor(Math.random() * TENANT_NAMES.length)];
               updatedProp.tenantStayDuration = 1;
               gainedIncome = true;
             } else {
               updatedProp.tenantName = undefined;
             }
          } 
          else {
             if (!updatedProp.tenantName) {
                const findTenantChance = (prev.reputation / 100) * 0.3;
                if (Math.random() < findTenantChance) {
                   updatedProp.tenantName = TENANT_NAMES[Math.floor(Math.random() * TENANT_NAMES.length)];
                   updatedProp.tenantStayDuration = 0;
                   updatedProp.lastRentPaidDay = currentDay;
                }
             } else {
                updatedProp.tenantStayDuration += 1;
                
                if ((currentDay - updatedProp.lastRentPaidDay) >= 7) {
                   const base = prop.rentMode === RentMode.COMMERCIAL ? 600 : 200;
                   const multiplier = prop.rentMode === RentMode.COMMERCIAL ? 15 : 5;
                   
                   let income = (base + (comfort * multiplier)) * (prop.condition / 100);
                   if (prop.condition < 40) {
                     income *= 0.2; 
                     newReputation -= 2;
                   }

                   newMoney += income;
                   gainedIncome = true;
                   updatedProp.lastRentPaidDay = currentDay;
                   newXp += XP_PER_RENT;
                }
                
                const leaveChance = prop.condition < 40 ? 0.2 : 0.01;
                if (Math.random() < leaveChance) {
                   updatedProp.tenantName = undefined;
                   updatedProp.tenantStayDuration = 0;
                   newReputation -= 5;
                }
             }
          }
        }

        return updatedProp;
      });

      if (gainedIncome && prev.timeScale === 1) playSfx('cash');

      const ownedProps = updatedProperties.filter(p => p.isOwned);
      if (ownedProps.length > 0) {
        const avgCondition = ownedProps.reduce((a, b) => a + b.condition, 0) / ownedProps.length;
        if (avgCondition > 80 && newReputation < 100) newReputation += 0.2;
        if (avgCondition < 50) newReputation -= 1.5; 
      }

      let newLevel = prev.level;
      let newXpToNext = prev.xpToNextLevel;
      let leveledUp = false;
      
      if (newXp >= prev.xpToNextLevel) {
        newLevel += 1;
        newXp = newXp - prev.xpToNextLevel;
        newXpToNext = Math.floor(prev.xpToNextLevel * 1.5);
        leveledUp = true;
        playSfx('levelup');
        
        const newUnlocked = [...prev.unlockedDistricts];
        Object.values(DISTRICTS).forEach(d => {
           if (newLevel >= d.unlockLevel && !newUnlocked.includes(d.name)) {
             newUnlocked.push(d.name);
           }
        });
        prev.unlockedDistricts = newUnlocked;
      }

      let activeEvent = null;
      let updatedPropsWithEvents = updatedProperties;
      
      if (Math.random() < 0.03 && !prev.activeEvent && currentDay > 5) {
         const globals = getGlobalEvents();
         activeEvent = globals[Math.floor(Math.random() * globals.length)];
         playSfx('tense');
      } 
      else if (!prev.activeEvent) {
         updatedPropsWithEvents = updatedProperties.map(p => {
            if (p.isOwned && !p.activeLocalEventId && p.tenantName && Math.random() < 0.005) {
               const localEvents = getLocalEvents(p);
               const event = localEvents[Math.floor(Math.random() * localEvents.length)];
               activeEvent = event; 
               playSfx('tense');
               return { ...p, activeLocalEventId: event.id };
            }
            return p;
         });
      }

      return {
        ...prev,
        day: currentDay,
        money: newMoney,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNext,
        reputation: Math.max(0, Math.min(100, newReputation)),
        properties: updatedPropsWithEvents,
        showLevelUpModal: leveledUp,
        activeEvent: activeEvent || prev.activeEvent 
      };
    });
  }, [isTimeStopped, playSfx]);

  // --- INTERVAL ---
  useEffect(() => {
    if (view === 'game' && gameState.timeScale > 0 && !isTimeStopped) {
      const intervalMs = gameState.gameSpeed / gameState.timeScale;
      gameLoopRef.current = setInterval(tick, intervalMs);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [view, gameState.timeScale, gameState.gameSpeed, tick, isTimeStopped]);

  // --- ACTIONS ---

  const handleBuyProperty = (id: string) => {
    const prop = gameState.properties.find(p => p.id === id);
    if (!prop || gameState.money < prop.purchaseCost) return;

    playSfx('cash');
    setGameState(prev => ({
      ...prev,
      money: prev.money - prop.purchaseCost,
      xp: prev.xp + XP_PER_BUY,
      reputation: prev.reputation + 2,
      properties: prev.properties.map(p => 
        p.id === id ? { ...p, isOwned: true, type: BuildingType.RESIDENTIAL_SMALL } : p
      )
    }));
    addNotification("Property Acquired", `You bought ${prop.name}`, "success");
    setSelectedPropertyId(null);
  };

  const handleTierUpgrade = (id: string) => {
     setGameState(prev => {
        const prop = prev.properties.find(p => p.id === id);
        if (!prop || prev.money < PROPERTY_TIER_COST) return prev;
        
        playSfx('levelup');
        return {
           ...prev,
           money: prev.money - PROPERTY_TIER_COST,
           xp: prev.xp + 500,
           properties: prev.properties.map(p => p.id === id ? { ...p, tier: p.tier + 1 } : p)
        }
     });
     addNotification("Property Upgraded", "Renovation Complete! Tier 2 Unlocked.", "success");
  }

  const handleSetRentMode = (id: string, mode: RentMode) => {
    playSfx('click');
    setGameState(prev => ({
      ...prev,
      properties: prev.properties.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          rentMode: mode,
          tenantName: undefined,
          tenantStayDuration: 0,
          type: mode === RentMode.COMMERCIAL ? BuildingType.COMMERCIAL_OFFICE : BuildingType.RESIDENTIAL_SMALL
        };
      })
    }));
    addNotification("Business Plan Updated", `Property is now set to ${mode}`);
  };

  const handleUpgrade = (id: string, furnitureId: string) => {
    setGameState(prev => {
      const prop = prev.properties.find(p => p.id === id);
      const furn = prop?.furnitures.find(f => f.id === furnitureId);
      if (!prop || !furn) return prev;
      
      // Max Level Check based on Tier
      const maxLevel = prop.tier === 1 ? MAX_AMENITY_LEVEL_TIER_1 : 10;
      if (furn.level >= maxLevel) return prev;

      const cost = Math.floor(furn.baseCost * Math.pow(1.5, furn.level));
      if (prev.money < cost) return prev;

      playSfx('cash');
      const xpReward = Math.floor(cost * XP_PER_UPGRADE_MULTIPLIER);
      
      return {
        ...prev,
        money: prev.money - cost,
        reputation: Math.min(100, prev.reputation + 1),
        xp: prev.xp + xpReward,
        properties: prev.properties.map(p => 
          p.id === id ? { 
            ...p, 
            furnitures: p.furnitures.map(f => f.id === furnitureId ? { ...f, level: f.level + 1 } : f)
          } : p
        )
      };
    });
    addNotification("Upgraded", "Amenities improved!");
  };

  const handleRepair = (id: string) => {
    setGameState(prev => {
      const prop = prev.properties.find(p => p.id === id);
      if(!prop) return prev;
      
      const cost = Math.floor((MAX_CONDITION - prop.condition) * REPAIR_COST_PER_UNIT);
      if (prev.money < cost) return prev;

      playSfx('click');

      return {
        ...prev,
        money: prev.money - cost,
        xp: prev.xp + XP_PER_REPAIR, 
        properties: prev.properties.map(p => p.id === id ? { ...p, condition: 100 } : p)
      };
    });
    addNotification("Repaired", "Property condition restored.", "success");
  };

  const handleEventAction = (action: (state: GameState, pid?: string) => Partial<GameState>) => {
    setGameState(prev => {
      const targetId = prev.activeEvent?.targetPropertyId;
      const changes = action(prev, targetId);
      return {
        ...prev,
        ...changes,
        activeEvent: null
      };
    });
    playSfx('click');
  };

  // --- RENDER ---
  const visibleProperties = gameState.properties.filter(p => p.districtId === selectedDistrict);

  // --- SLOT SELECTION SCREEN ---
  if (view.startsWith('slots_')) {
      const mode = view.replace('slots_', '') as 'new' | 'load' | 'save';
      const title = mode === 'new' ? 'Start New Game' : mode === 'load' ? 'Load Game' : 'Save Game';
      const subtext = mode === 'new' ? 'Select a slot to start a new journey. Warning: Overwrites existing data.' :
                      mode === 'load' ? 'Select a slot to resume.' : 'Select a slot to save your progress.';

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white relative">
           <button 
             onClick={() => {
                 if (mode === 'save') {
                     setView('game');
                     setShowPauseMenu(true);
                 } else {
                     setView('menu');
                 }
                 playSfx('click');
             }}
             className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition"
           >
               <ArrowLeft size={24} /> Back
           </button>

           <h1 className="text-4xl font-black mb-2">{title}</h1>
           <p className="text-slate-400 mb-12">{subtext}</p>

           <div className="grid gap-4 w-full max-w-lg px-4">
            {[1, 2, 3].map(slot => {
              const meta = getSlotMeta(slot);
              return (
                <div 
                  key={slot} 
                  onClick={() => handleSlotAction(slot)}
                  className={`
                    relative group p-6 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center
                    ${meta 
                       ? 'bg-slate-800 border-slate-700 hover:border-blue-500' 
                       : 'bg-slate-800/50 border-dashed border-slate-700 hover:border-green-500 hover:bg-slate-800'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl
                        ${meta ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-500 group-hover:bg-green-600 group-hover:text-white'}
                    `}>
                        {slot}
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 font-bold uppercase tracking-wider">Slot {slot}</div>
                      {meta ? (
                        <div className="text-white font-mono">Day {meta.day} • Lvl {meta.level} • ${meta.money.toLocaleString()}</div>
                      ) : (
                        <div className="text-gray-500 italic">Empty Slot</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                      {mode === 'new' && !meta && <PlusCircle className="text-green-500" />}
                      {mode === 'save' && <Save className="text-blue-500" />}
                      {mode === 'load' && meta && <Play className="text-green-500 fill-current" />}
                      
                      {meta && (
                          <button 
                            onClick={(e) => deleteSlot(slot, e)}
                            className="p-2 hover:bg-red-500/20 text-red-500 rounded-full transition"
                            title="Delete Save"
                          >
                              <Trash2 size={18} />
                          </button>
                      )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
  }

  if (view === 'menu') {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white relative overflow-hidden"
        onClick={unlockAudio} 
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        
        <div className="z-10 text-center animate-float mb-16">
          <h1 className="text-7xl md:text-9xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 drop-shadow-2xl filter">
            ESTATE EMPIRE
          </h1>
          <div className="h-2 w-32 bg-cyan-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl md:text-3xl text-slate-300 font-light tracking-widest uppercase">The Ultimate Tycoon</p>
        </div>

        <div className="z-10 w-full max-w-md px-6 space-y-4">
          
          <button 
             onClick={() => { playSfx('click'); setView('slots_new'); unlockAudio(); }}
             className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white text-xl font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-600/20 transform hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
             <Play fill="currentColor" /> Start Game
          </button>

          <button 
             onClick={() => { playSfx('click'); setView('slots_load'); unlockAudio(); }}
             className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white text-xl font-black uppercase tracking-widest rounded-xl shadow-lg border border-slate-600 transform hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
             <RotateCcw /> Load Game
          </button>

          <button 
            onClick={() => { playSfx('click'); setView('instructions'); unlockAudio(); }}
            className="w-full py-5 bg-transparent border-2 border-white/20 hover:bg-white/10 text-white text-xl font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <BookOpen /> Instructions
          </button>
        </div>
      </div>
    );
  }

  if (view === 'instructions') return <InstructionsModal onClose={() => setView('menu')} />;

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden bg-gray-100 dark:bg-gray-950">
      
      {/* --- HUD --- */}
      <header className="h-24 bg-white dark:bg-slate-900 shadow-xl z-30 flex items-center justify-between px-4 md:px-8 shrink-0 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-4 md:gap-8">
          
          {/* Money & Rep */}
          <div className="flex gap-4 md:gap-6">
            <div className="flex items-center gap-3">
              <div className="hidden md:block bg-green-100 dark:bg-green-900/30 text-green-600 p-2.5 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Funds</p>
                  <div className={`flex items-center text-xs font-bold px-1.5 rounded animate-pulse ${cashFlow >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-500 text-white'}`}>
                    {cashFlow >= 0 ? '+' : ''}{cashFlow}/day {cashFlow < 0 && <TrendingDown size={12} className="ml-1"/>}
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-black font-mono dark:text-white leading-none mt-0.5">${Math.floor(gameState.money).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 p-2.5 rounded-xl">
                <Star size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider flex justify-between">
                  Reputation 
                  {gameState.properties.some(p => p.isOwned && p.condition < 50) && (
                    <span className="text-red-500 animate-pulse flex items-center gap-1 ml-2"><TrendingDown size={10}/></span>
                  )}
                </p>
                <div className="w-24 h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full ${gameState.reputation > 70 ? 'bg-green-500' : gameState.reputation > 30 ? 'bg-yellow-500' : 'bg-red-500'} transition-all duration-500`} 
                    style={{ width: `${gameState.reputation}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="hidden lg:flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-slate-800">
             <div className="relative">
               <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg ring-4 ring-blue-100 dark:ring-blue-900">
                 {gameState.level}
               </div>
             </div>
             <div>
               <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">XP {gameState.xp}/{gameState.xpToNextLevel}</p>
               <div className="w-24 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                 <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(gameState.xp / gameState.xpToNextLevel) * 100}%`}}></div>
               </div>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="text-right hidden md:block">
             <div className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center justify-end gap-1">
               <Save size={10} /> Slot {activeSlot}
             </div>
             <div className="text-2xl font-mono font-bold dark:text-white">Day {gameState.day}</div>
          </div>
          
          <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 hidden md:block"></div>

          {/* Time Controls */}
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
             <button 
               onClick={() => { playSfx('click'); setGameState(p => ({...p, timeScale: 0})); }}
               className={`p-2 rounded-lg transition-colors ${gameState.timeScale === 0 ? 'bg-white dark:bg-slate-600 shadow-sm text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
               title="Pause"
             >
               <Pause size={18} fill="currentColor" />
             </button>
             <button 
               onClick={() => { playSfx('click'); setGameState(p => ({...p, timeScale: 1})); }}
               className={`p-2 rounded-lg transition-colors ${gameState.timeScale === 1 ? 'bg-white dark:bg-slate-600 shadow-sm text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
               title="Normal Speed"
             >
               <Play size={18} fill="currentColor" />
             </button>
             <button 
               onClick={() => { playSfx('click'); setGameState(p => ({...p, timeScale: 2})); }}
               className={`p-2 rounded-lg transition-colors ${gameState.timeScale === 2 ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
               title="2x Speed"
             >
               <FastForward size={18} fill="currentColor" />
             </button>
             <button 
               onClick={() => { playSfx('click'); setGameState(p => ({...p, timeScale: 4})); }}
               className={`p-2 rounded-lg transition-colors ${gameState.timeScale === 4 ? 'bg-white dark:bg-slate-600 shadow-sm text-purple-500' : 'text-gray-400 hover:text-gray-600'}`}
               title="4x Speed"
             >
               <div className="flex -space-x-1"><FastForward size={18} fill="currentColor" /></div>
             </button>
          </div>

          {/* Settings Controls */}
          <div className="flex gap-2">
             <button 
               onClick={() => setShowPauseMenu(true)}
               className="md:hidden p-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl"
             >
               <Settings size={20} />
             </button>

             <button 
               onClick={() => setGameState(p => ({ ...p, isMuted: !p.isMuted }))}
               className="hidden md:block p-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition"
             >
               {gameState.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>

            <button 
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="hidden md:block p-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* --- DISTRICT TABS --- */}
      <div className="bg-white dark:bg-slate-950 p-3 flex justify-center gap-4 shrink-0 z-20 border-b border-gray-200 dark:border-slate-800 shadow-sm">
        {Object.values(DISTRICTS).map(dist => {
           const isUnlocked = gameState.unlockedDistricts.includes(dist.name);
           return (
             <button
              key={dist.name}
              disabled={!isUnlocked}
              onClick={() => { playSfx('click'); setSelectedDistrict(dist.name); }}
              className={`
                px-6 py-2.5 rounded-full font-bold whitespace-nowrap flex items-center gap-2 transition-all border-2
                ${selectedDistrict === dist.name 
                   ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' 
                   : isUnlocked 
                      ? 'bg-transparent border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-700' 
                      : 'bg-gray-100 dark:bg-slate-900 border-transparent text-gray-400 dark:text-slate-700 cursor-not-allowed'}
              `}
             >
               <Map size={16} />
               {dist.name} 
               {!isUnlocked && <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 rounded ml-1">Lvl {dist.unlockLevel}</span>}
             </button>
           )
        })}
      </div>

      {/* --- MAIN GAME VIEW --- */}
      <main className="flex-1 overflow-auto relative bg-slate-200 dark:bg-black">
        <IsometricMap 
          properties={visibleProperties} 
          timeScale={gameState.timeScale}
          onSelectProperty={(id) => { 
            // If local event, open event modal via state logic, otherwise standard property modal
            const prop = gameState.properties.find(p => p.id === id);
            if (prop?.activeLocalEventId) {
              const event = getLocalEvents(prop).find(e => e.id === prop.activeLocalEventId);
              if (event) setGameState(prev => ({...prev, activeEvent: event}));
              playSfx('tense');
            } else {
              playSfx('click'); 
              setSelectedPropertyId(id); 
            }
          }}
        />
        
        {/* Game Paused Overlay */}
        {isTimeStopped && !selectedPropertyId && !gameState.activeEvent && !gameState.showLevelUpModal && !showPauseMenu && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-10">
            <div className="bg-black/50 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest backdrop-blur-md border border-white/10 animate-pulse">
              Game Paused
            </div>
          </div>
        )}

        {/* Notifications Toast */}
        <div className="absolute bottom-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none">
          {gameState.notifications.map(n => (
            <div key={n.id} className={`
              p-4 rounded-xl shadow-2xl border-l-8 animate-in slide-in-from-right-10 duration-300 w-80 pointer-events-auto backdrop-blur-md
              ${n.type === 'error' ? 'bg-white/90 dark:bg-slate-800/90 border-red-500 text-red-900 dark:text-red-100' : 
                n.type === 'success' ? 'bg-white/90 dark:bg-slate-800/90 border-green-500 text-slate-800 dark:text-white' : 
                'bg-white/90 dark:bg-slate-800/90 border-blue-500 text-slate-800 dark:text-white'}
            `}>
               <div className="flex items-start gap-3">
                 {n.type === 'error' ? <AlertTriangle size={20} className="text-red-500 shrink-0"/> : 
                  n.type === 'success' ? <Zap size={20} className="text-green-500 shrink-0"/> : 
                  <Star size={20} className="text-blue-500 shrink-0"/>}
                 <div>
                   <h4 className="font-bold text-sm leading-tight mb-1">{n.title}</h4>
                   <p className="text-xs opacity-80 leading-snug">{n.message}</p>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- MODALS --- */}

      {showPauseMenu && (
        <PauseMenu 
          onResume={() => setShowPauseMenu(false)}
          onSaveClick={() => { playSfx('click'); setShowPauseMenu(false); setView('slots_save'); }}
          onQuit={() => setView('menu')}
          slotName={`Slot ${activeSlot}`}
        />
      )}
      
      {/* Property Management */}
      <PropertyModal 
        property={selectedProperty}
        gameState={gameState}
        onClose={() => { playSfx('click'); setSelectedPropertyId(null); }}
        onBuy={handleBuyProperty}
        onUpgrade={handleUpgrade}
        onTierUpgrade={handleTierUpgrade}
        onSetRentMode={handleSetRentMode}
        onRepair={handleRepair}
      />

      {/* Random Events */}
      {gameState.activeEvent && (
        <EventModal 
          event={gameState.activeEvent} 
          onOptionSelect={handleEventAction} 
        />
      )}

      {/* Level Up */}
      {gameState.showLevelUpModal && (
        <LevelUpModal 
          level={gameState.level}
          rewards={['New District Access Check', 'Max Furniture Level +', 'Reputation Cap Boost']}
          onClose={() => { playSfx('click'); setGameState(p => ({ ...p, showLevelUpModal: false })); }}
        />
      )}
    </div>
  );
};

export default App;
