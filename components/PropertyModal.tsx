
import React from 'react';
import { Property, RentMode, Furniture, GameState } from '../types';
import { AVAILABLE_FURNITURE, MAX_CONDITION, REPAIR_COST_PER_UNIT, PROPERTY_TIER_COST, MAX_AMENITY_LEVEL_TIER_1 } from '../constants';
import { X, Wrench, Hammer, Briefcase, TrendingDown, Star, Lock, AlertTriangle, ArrowUpCircle, Castle } from 'lucide-react';

interface Props {
  property: Property | null;
  gameState: GameState;
  onClose: () => void;
  onBuy: (id: string) => void;
  onUpgrade: (propertyId: string, furnitureId: string) => void;
  onTierUpgrade: (propertyId: string) => void;
  onSetRentMode: (propertyId: string, mode: RentMode) => void;
  onRepair: (propertyId: string) => void;
}

const PropertyModal: React.FC<Props> = ({ 
  property, gameState, onClose, onBuy, onUpgrade, onTierUpgrade, onSetRentMode, onRepair 
}) => {
  if (!property) return null;

  const { money, level } = gameState;
  const repairCost = Math.floor((MAX_CONDITION - property.condition) * REPAIR_COST_PER_UNIT);
  const canRepair = property.condition < 100 && money >= repairCost;

  // Calculate dynamic stats based on levels
  const comfortScore = property.furnitures.reduce((acc, f) => acc + (f.level * f.baseComfort), 0);
  const totalUpkeep = property.furnitures.reduce((acc, f) => acc + (f.level * f.baseUpkeep), 0);
  
  // Weekly Rent Calcs
  const baseRent = property.rentMode === RentMode.COMMERCIAL ? 600 : 200;
  const multiplier = property.rentMode === RentMode.COMMERCIAL ? 15 : 5;
  const weeklyRent = baseRent + (comfortScore * multiplier);
  const nightlyRate = 50 + (comfortScore * 2);

  // Tier Logic
  const maxAmenityLevel = property.tier === 1 ? MAX_AMENITY_LEVEL_TIER_1 : 10;
  const canUpgradeTier = property.tier === 1 && money >= PROPERTY_TIER_COST;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight">{property.name}</h2>
              <span className="bg-yellow-500 text-black px-2 py-0.5 rounded font-bold text-xs uppercase">Tier {property.tier}</span>
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
              {property.districtId} • {property.isOwned ? (property.rentMode === RentMode.NONE ? 'Not Rented' : property.rentMode) : 'For Sale'}
            </p>
          </div>
          <button onClick={onClose} className="hover:bg-slate-700 p-2 rounded-full transition-colors">
            <X size={28} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {property.activeLocalEventId && (
            <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded animate-pulse" role="alert">
              <p className="font-bold flex items-center gap-2"><AlertTriangle/> Critical Issue!</p>
              <p>This property has an active problem. Check your events to resolve it before collecting rent.</p>
            </div>
          )}

          {!property.isOwned ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="text-7xl mb-6 animate-bounce">🏗️</div>
              <h3 className="text-2xl font-bold dark:text-white mb-2">Prime Real Estate</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                Located in the {property.districtId}, this plot is ready for development.
              </p>
              
              <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-xl mb-8 border border-slate-200 dark:border-slate-700">
                <span className="text-gray-500 text-sm uppercase font-bold">Price</span>
                <div className="text-4xl font-black text-green-600 dark:text-green-500">
                  ${property.purchaseCost.toLocaleString()}
                </div>
              </div>

              <button 
                onClick={() => onBuy(property.id)}
                disabled={money < property.purchaseCost}
                className={`w-full max-w-sm py-4 rounded-xl font-bold text-xl shadow-lg transform transition hover:-translate-y-1 ${
                  money >= property.purchaseCost 
                  ? 'bg-green-600 text-white hover:bg-green-500 shadow-green-600/30' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {money >= property.purchaseCost ? 'Purchase Property' : 'Insufficient Funds'}
              </button>
            </div>
          ) : (
            // MANAGE SCREEN
            <div className="space-y-8">
              
              {/* Stats Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border dark:border-slate-600">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Condition</span>
                  <div className={`font-black text-2xl mt-1 ${property.condition < 50 ? 'text-red-500' : 'text-green-500'}`}>
                    {property.condition}%
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border dark:border-slate-600">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Comfort</span>
                  <div className="font-black text-2xl mt-1 text-purple-500">{comfortScore}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border dark:border-slate-600">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Weekly Upkeep</span>
                  <div className="font-black text-2xl mt-1 text-red-400">-${totalUpkeep * 7}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border dark:border-slate-600">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Tenant</span>
                  <div className="font-bold text-lg mt-1 truncate dark:text-white">
                    {property.tenantName || 'Vacant'}
                  </div>
                </div>
              </div>

              {/* Main Actions Grid */}
              <div className="grid lg:grid-cols-2 gap-8">
                
                {/* Business Model Column */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xl dark:text-white flex items-center gap-2 border-b dark:border-slate-700 pb-2">
                    <Briefcase size={22} className="text-blue-500" /> Rental Strategy
                  </h4>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => onSetRentMode(property.id, RentMode.LONG_TERM)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden group ${
                        property.rentMode === RentMode.LONG_TERM 
                        ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400' 
                        : 'bg-white border-gray-200 dark:bg-slate-700 dark:border-slate-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="relative z-10 flex justify-between items-center">
                         <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100">Weekly Rental</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Stable income, low maintenance.</div>
                         </div>
                         <div className="text-right">
                           <div className="text-green-600 font-bold">~${Math.floor(weeklyRent)}</div>
                           <div className="text-[10px] text-gray-400 uppercase">Per Week</div>
                         </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => onSetRentMode(property.id, RentMode.HOTEL)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden group ${
                        property.rentMode === RentMode.HOTEL 
                        ? 'bg-orange-50 border-orange-500 dark:bg-orange-900/30 dark:border-orange-400' 
                        : 'bg-white border-gray-200 dark:bg-slate-700 dark:border-slate-600 hover:border-orange-300'
                      }`}
                    >
                       <div className="relative z-10 flex justify-between items-center">
                         <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100">Hotel (Short Term)</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily income, high wear & tear.</div>
                         </div>
                         <div className="text-right">
                           <div className="text-green-600 font-bold">~${Math.floor(nightlyRate)}</div>
                           <div className="text-[10px] text-gray-400 uppercase">Per Night</div>
                         </div>
                      </div>
                    </button>

                     <button 
                       disabled={level < 5}
                       onClick={() => onSetRentMode(property.id, RentMode.COMMERCIAL)}
                       className={`w-full p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                         property.rentMode === RentMode.COMMERCIAL
                         ? 'bg-purple-50 border-purple-500 dark:bg-purple-900/30 dark:border-purple-400' 
                         : level < 5 
                            ? 'bg-gray-100 border-gray-200 dark:bg-slate-800 dark:border-slate-700 opacity-60 cursor-not-allowed' 
                            : 'bg-white border-gray-200 dark:bg-slate-700 dark:border-slate-600 hover:border-purple-300'
                       }`}
                     >
                       <div className="relative z-10 flex justify-between items-center">
                         <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                              Commercial {level < 5 && <Lock size={14} />}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Requires Lvl 5. High Yield.</div>
                         </div>
                         <div className="text-right">
                           <div className="text-green-600 font-bold">~${Math.floor(weeklyRent * 3)}</div>
                           <div className="text-[10px] text-gray-400 uppercase">Per Week</div>
                         </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Management Column */}
                <div className="space-y-4">
                   <h4 className="font-bold text-xl dark:text-white flex items-center gap-2 border-b dark:border-slate-700 pb-2">
                    <Wrench size={22} className="text-gray-500" /> Maintenance & Upgrades
                  </h4>
                  
                  {/* Repair Action */}
                  <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold dark:text-slate-300">Repair Status</span>
                      <span className="text-xs text-gray-500">-${REPAIR_COST_PER_UNIT}/unit</span>
                    </div>
                    <button
                      onClick={() => onRepair(property.id)}
                      disabled={!canRepair}
                      className={`w-full py-3 px-4 rounded-lg flex justify-between items-center font-bold transition-all shadow-md ${
                        canRepair 
                        ? 'bg-red-500 hover:bg-red-600 text-white active:transform active:scale-95' 
                        : 'bg-gray-300 dark:bg-slate-600 text-gray-500 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span className="flex items-center gap-2"><Hammer size={18}/> Fix Damages</span>
                      <span>-${repairCost}</span>
                    </button>
                  </div>

                  {/* Tier Upgrade */}
                  {property.tier === 1 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700">
                       <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500 font-black uppercase tracking-wider text-xs mb-2">
                         <Castle size={14}/> Property Upgrade
                       </div>
                       <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                         Renovate to <span className="font-bold">Tier 2</span> to unlock Amenity Levels 6-10.
                       </p>
                       <button
                         onClick={() => onTierUpgrade(property.id)}
                         disabled={!canUpgradeTier}
                         className={`w-full py-2 text-sm font-bold rounded shadow-sm flex justify-between px-4 ${
                           canUpgradeTier 
                           ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                           : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                         }`}
                       >
                         <span>Renovate Building</span>
                         <span>${PROPERTY_TIER_COST.toLocaleString()}</span>
                       </button>
                    </div>
                  )}

                  <h5 className="font-bold text-sm text-gray-500 uppercase mt-6 mb-2">Amenities (Tier Max: Lvl {maxAmenityLevel})</h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {property.furnitures.map(f => {
                      const isLocked = level < f.unlockLevel;
                      const isTierLocked = f.level >= maxAmenityLevel;
                      
                      const upgradeCost = Math.floor(f.baseCost * Math.pow(1.5, f.level));
                      const currentComfort = f.baseComfort * f.level;

                      return (
                        <div key={f.id} className={`p-3 rounded-lg border ${
                          isLocked ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-70' : 
                          'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-sm dark:text-slate-200 flex items-center gap-2">
                                {f.name}
                                {isLocked && <span className="text-[10px] bg-gray-200 text-gray-600 px-1 rounded flex items-center gap-1"><Lock size={8}/> Lvl {f.unlockLevel}</span>}
                                {!isLocked && isTierLocked && f.level < 10 && (
                                  <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded flex items-center gap-1"><Lock size={8}/> Tier Limit</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Level: <span className="text-blue-500 font-bold">{f.level}</span>/10
                              </div>
                            </div>
                            
                            <div className="text-xs text-right">
                              <div className="text-green-600">+{currentComfort} Comfort</div>
                              <div className="text-red-400">-${f.level * f.baseUpkeep}/day</div>
                            </div>
                          </div>

                          {f.level < 10 && !isLocked && !isTierLocked && (
                             <button
                               onClick={() => onUpgrade(property.id, f.id)}
                               disabled={money < upgradeCost}
                               className={`w-full text-xs font-bold py-2 rounded-lg border flex justify-between px-3 transition-colors ${
                                 money >= upgradeCost 
                                 ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700' 
                                 : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                               }`}
                             >
                               <span className="flex items-center gap-1"><ArrowUpCircle size={12}/> Upgrade Lvl {f.level + 1}</span>
                               <span>${upgradeCost.toLocaleString()}</span>
                             </button>
                          )}
                          {isTierLocked && f.level < 10 && (
                             <div className="w-full text-center text-[10px] font-bold bg-yellow-50 text-yellow-600 py-1 rounded border border-yellow-100">
                               Upgrade Property Tier to Continue
                             </div>
                          )}
                          {f.level === 10 && (
                            <div className="w-full text-center text-[10px] font-bold bg-green-100 text-green-700 py-1 rounded">MAX LEVEL</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyModal;
