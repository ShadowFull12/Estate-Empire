
import React, { useEffect, useState } from 'react';
import { Property, BuildingType, RentMode } from '../types';
import { Building, Hotel, Briefcase, MapPin, AlertTriangle, Lock } from 'lucide-react';

interface Props {
  properties: Property[];
  onSelectProperty: (propertyId: string) => void;
  timeScale: number;
}

// --- 3D PRIMITIVES ---

const Building3D = ({ type, rentMode, tier, isHovered, condition }: { type: BuildingType, rentMode: RentMode, tier: number, isHovered: boolean, condition: number }) => {
  // Height based on type
  let height = 20; // Empty plot base
  if (type !== BuildingType.EMPTY_PLOT) height = 60; // House
  if (rentMode === RentMode.HOTEL) height = 100; // Hotel
  if (rentMode === RentMode.COMMERCIAL) height = 140; // Skyscraper
  
  // Tier bonus height
  if (tier > 1 && type !== BuildingType.EMPTY_PLOT) height += 20;

  // Colors
  let faceColor = '#cbd5e1'; // Slate-300 (Base)
  let topColor = '#e2e8f0'; // Slate-200
  
  if (rentMode === RentMode.LONG_TERM) { faceColor = '#3b82f6'; topColor = '#60a5fa'; } // Blue
  if (rentMode === RentMode.HOTEL) { faceColor = '#f97316'; topColor = '#fb923c'; } // Orange
  if (rentMode === RentMode.COMMERCIAL) { faceColor = '#8b5cf6'; topColor = '#a78bfa'; } // Purple
  if (type === BuildingType.EMPTY_PLOT) { faceColor = '#94a3b8'; topColor = '#cbd5e1'; } // Empty

  // Condition degradation overlay
  const isDamaged = condition < 50;

  return (
    <div 
      className="absolute bottom-0 w-full h-full transition-transform duration-500 ease-out"
      style={{ 
        transformStyle: 'preserve-3d', 
        transform: isHovered && type !== BuildingType.EMPTY_PLOT ? `translateZ(10px)` : 'translateZ(0)'
      }}
    >
      {/* SHADOW */}
      <div className="absolute inset-0 bg-black/40 blur-md transform translate-z-[-2px] rounded-full" />

      {/* 3D BOX */}
      {/* Front Face */}
      <div 
        className="absolute bottom-0 left-0 w-full origin-bottom transition-all duration-500"
        style={{ 
          height: `${height}px`, 
          backgroundColor: isDamaged ? '#503030' : faceColor,
          transform: 'rotateX(90deg)',
          filter: 'brightness(0.7)'
        }} 
      >
        {/* Windows Pattern */}
        {type !== BuildingType.EMPTY_PLOT && (
           <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(transparent_0px,transparent_10px,rgba(255,255,255,0.5)_10px,rgba(255,255,255,0.5)_14px)]" />
        )}
      </div>

      {/* Right Face */}
      <div 
        className="absolute bottom-0 right-0 h-full origin-right transition-all duration-500"
        style={{ 
          width: `${height}px`, 
          backgroundColor: isDamaged ? '#402020' : faceColor,
          transform: 'rotateY(90deg)',
          filter: 'brightness(0.5)'
        }} 
      >
         {type !== BuildingType.EMPTY_PLOT && (
           <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_10px,rgba(255,255,255,0.5)_10px,rgba(255,255,255,0.5)_14px)]" />
        )}
      </div>

      {/* Top Face (Roof) */}
      <div 
        className="absolute inset-0 transition-all duration-500 flex items-center justify-center border-4 border-white/10"
        style={{ 
          backgroundColor: isDamaged ? '#7f1d1d' : topColor,
          transform: `translateZ(${height}px)`
        }}
      >
        {/* Roof Content */}
        {type === BuildingType.EMPTY_PLOT ? (
           <div className="text-slate-500/50 font-bold tracking-widest border-2 border-dashed border-slate-400/50 p-2 rounded">
             FOR SALE
           </div>
        ) : (
           <div className="relative">
             {rentMode === RentMode.HOTEL && <div className="w-8 h-8 bg-yellow-400 rounded-full shadow-lg flex items-center justify-center text-xs font-bold text-orange-900">H</div>}
             {rentMode === RentMode.COMMERCIAL && <div className="w-12 h-8 bg-blue-900 rounded-sm shadow-lg flex items-center justify-center text-[8px] font-bold text-white tracking-widest border border-blue-500">CORP</div>}
             {tier > 1 && <div className="absolute -top-4 -right-4 w-4 h-4 bg-yellow-300 rounded-full animate-pulse shadow-[0_0_10px_yellow]" />}
           </div>
        )}
      </div>
    </div>
  );
};

const Car3D = ({ color, isVertical, moving }: { color: string, isVertical: boolean, moving: boolean }) => {
  // A voxel style car
  return (
    <div className="relative w-8 h-4" style={{ transformStyle: 'preserve-3d' }}>
       {/* Car Body */}
       <div className="absolute inset-0 transform translate-z-2">
          {/* Roof */}
          <div className="absolute inset-0 bg-[var(--c)] transform translateZ(6px)" style={{'--c': color} as any}></div>
          {/* Front */}
          <div className="absolute top-0 left-0 w-full h-3 bg-[var(--c)] origin-top transform rotateX(-90deg) filter brightness-75" style={{'--c': color} as any}></div>
          {/* Side */}
          <div className="absolute top-0 left-0 h-full w-3 bg-[var(--c)] origin-left transform rotateY(-90deg) filter brightness-50" style={{'--c': color} as any}></div>
          {/* Wheels */}
          <div className="absolute -bottom-1 left-1 w-1.5 h-1.5 bg-black transform translateZ(2px)"></div>
          <div className="absolute -bottom-1 right-1 w-1.5 h-1.5 bg-black transform translateZ(2px)"></div>
          <div className="absolute -top-1 left-1 w-1.5 h-1.5 bg-black transform translateZ(2px)"></div>
          <div className="absolute -top-1 right-1 w-1.5 h-1.5 bg-black transform translateZ(2px)"></div>
       </div>
       {/* Headlights */}
       <div className={`absolute right-0 top-1 w-0.5 h-2 bg-yellow-200 transform translateZ(8px) ${moving ? 'shadow-[0_0_10px_yellow]' : ''}`}></div>
    </div>
  )
}

const TrafficLight3D = ({ state }: { state: 'red' | 'green' }) => {
  return (
    <div className="absolute w-2 h-2" style={{ transformStyle: 'preserve-3d' }}>
      {/* Pole */}
      <div className="absolute bottom-0 w-1 h-16 bg-gray-800 origin-bottom transform rotateX(90deg)"></div>
      {/* Box */}
      <div className="absolute top-0 -left-1.5 w-4 h-10 bg-black origin-bottom transform translateZ(16px) rotateX(0deg) border border-gray-700 flex flex-col items-center justify-around py-1">
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${state === 'red' ? 'bg-red-500 shadow-[0_0_15px_red]' : 'bg-red-900'}`}></div>
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${state === 'green' ? 'bg-green-500 shadow-[0_0_15px_green]' : 'bg-green-900'}`}></div>
      </div>
    </div>
  )
}

// --- MAIN MAP COMPONENT ---

const IsometricMap: React.FC<Props> = ({ properties, onSelectProperty, timeScale }) => {
  const [cars, setCars] = useState<any[]>([]);
  const [hLight, setHLight] = useState<'red' | 'green'>('green');
  const [vLight, setVLight] = useState<'red' | 'green'>('red');

  // Traffic Lights Cycle
  useEffect(() => {
    if(timeScale === 0) return;
    const timer = setInterval(() => {
      setHLight(prev => prev === 'green' ? 'red' : 'green');
      setVLight(prev => prev === 'green' ? 'red' : 'green');
    }, 5000 / timeScale);
    return () => clearInterval(timer);
  }, [timeScale]);

  // Spawn Traffic
  useEffect(() => {
    const colors = ['#ef4444', '#3b82f6', '#eab308', '#fff', '#10b981'];
    const newCars = [];
    const laneCount = 12; 
    for(let i=0; i<laneCount; i++) {
       newCars.push({
         id: i,
         dir: i % 2 === 0 ? 'h' : 'v', // Horizontal or Vertical
         lane: Math.floor(i/2) % 2, // Which road lane (1 or 2)
         color: colors[Math.floor(Math.random() * colors.length)],
         delay: Math.random() * 5,
         speed: 3 + Math.random() * 2
       });
    }
    setCars(newCars);
  }, []);

  // The Map is a 5x5 Grid:
  // P = Property (120px), R = Road (60px)
  // P | R | P | R | P
  // --+---+---+---+--
  // R | X | R | X | R
  // --+---+---+---+--
  // P | R | P | R | P
  
  const gridTemplate = `120px 60px 120px 60px 120px`;

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 overflow-hidden perspective-[2000px]">
      
      <style>{`
        .iso-world {
          transform: rotateX(60deg) rotateZ(-45deg);
          transform-style: preserve-3d;
          transition: transform 0.5s ease;
        }
        @keyframes drive-h { 
          0% { transform: translateX(-50px) translateZ(2px); } 
          100% { transform: translateX(550px) translateZ(2px); } 
        }
        @keyframes drive-v { 
          0% { transform: translateY(-50px) rotateZ(90deg) translateZ(2px); } 
          100% { transform: translateY(550px) rotateZ(90deg) translateZ(2px); } 
        }
      `}</style>

      {/* World Container */}
      <div className="iso-world relative p-10 shadow-2xl bg-slate-800/50 rounded-[40px] border-4 border-slate-700">
        
        {/* Base Platform Depth */}
        <div className="absolute inset-0 bg-slate-900 transform translate-z-[-20px]" style={{transform: 'translateZ(-10px)'}} />
        
        {/* GRID LAYOUT */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            gridTemplateRows: gridTemplate,
            gap: 0,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* --- ROW 1 --- */}
          <PlotCell p={properties[0]} onClick={onSelectProperty} />
          <RoadCell dir="v" cars={cars.filter(c => c.dir === 'v' && c.lane === 0)} light={vLight} timeScale={timeScale} />
          <PlotCell p={properties[1]} onClick={onSelectProperty} />
          <RoadCell dir="v" cars={cars.filter(c => c.dir === 'v' && c.lane === 1)} light={vLight} timeScale={timeScale} />
          <PlotCell p={properties[2]} onClick={onSelectProperty} />

          {/* --- ROW 2 (Horizontal Road) --- */}
          <RoadCell dir="h" cars={cars.filter(c => c.dir === 'h' && c.lane === 0)} light={hLight} timeScale={timeScale} />
          <Intersection hLight={hLight} vLight={vLight} />
          <RoadCell dir="h" cars={cars.filter(c => c.dir === 'h' && c.lane === 0)} light={hLight} timeScale={timeScale} />
          <Intersection hLight={hLight} vLight={vLight} />
          <RoadCell dir="h" cars={cars.filter(c => c.dir === 'h' && c.lane === 0)} light={hLight} timeScale={timeScale} />

          {/* --- ROW 3 --- */}
          <PlotCell p={properties[3]} onClick={onSelectProperty} />
          <RoadCell dir="v" cars={cars.filter(c => c.dir === 'v' && c.lane === 0)} light={vLight} timeScale={timeScale} />
          <PlotCell p={properties[4]} onClick={onSelectProperty} />
          <RoadCell dir="v" cars={cars.filter(c => c.dir === 'v' && c.lane === 1)} light={vLight} timeScale={timeScale} />
          <PlotCell p={properties[5]} onClick={onSelectProperty} />

           {/* --- ROW 4 (Horizontal Road) --- */}
           <RoadCell dir="h" cars={cars.filter(c => c.dir === 'h' && c.lane === 1)} light={hLight} timeScale={timeScale} />
           <Intersection hLight={hLight} vLight={vLight} />
           <RoadCell dir="h" cars={cars.filter(c => c.dir === 'h' && c.lane === 1)} light={hLight} timeScale={timeScale} />
           <Intersection hLight={hLight} vLight={vLight} />
           <RoadCell dir="h" cars={cars.filter(c => c.dir === 'h' && c.lane === 1)} light={hLight} timeScale={timeScale} />

          {/* --- ROW 5 --- */}
          <PlotCell p={properties[6]} onClick={onSelectProperty} />
          <RoadCell dir="v" cars={cars.filter(c => c.dir === 'v' && c.lane === 0)} light={vLight} timeScale={timeScale} />
          <PlotCell p={properties[7]} onClick={onSelectProperty} />
          <RoadCell dir="v" cars={cars.filter(c => c.dir === 'v' && c.lane === 1)} light={vLight} timeScale={timeScale} />
          <PlotCell p={properties[8]} onClick={onSelectProperty} />

        </div>
      </div>
    </div>
  );
};

// --- SUB COMPONENTS FOR GRID CELLS ---

const PlotCell = ({ p, onClick }: { p: Property, onClick: (id: string) => void }) => {
  const [hover, setHover] = useState(false);
  
  return (
    <div 
      className="relative w-full h-full" 
      style={{ transformStyle: 'preserve-3d' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onClick(p.id)}
    >
      {/* Base Grass/Concrete */}
      <div className={`absolute inset-0 border-4 ${hover ? 'border-yellow-400' : 'border-slate-600'} ${p.isOwned ? 'bg-slate-200' : 'bg-emerald-800'} transition-colors duration-300 cursor-pointer shadow-inner`}>
          {/* Grass Texture */}
          {!p.isOwned && <div className="w-full h-full opacity-20 bg-[radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:4px_4px]"></div>}
      </div>

      {/* 3D Building Object */}
      <Building3D 
        type={p.type} 
        rentMode={p.rentMode} 
        tier={p.tier} 
        isHovered={hover}
        condition={p.condition}
      />

      {/* Icons for Events */}
      {p.activeLocalEventId && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 animate-bounce" style={{transform: 'translateZ(100px) translateX(-50%)'}}>
            <div className="bg-red-600 text-white p-2 rounded-full border-2 border-white shadow-lg">
              <AlertTriangle size={24} />
            </div>
        </div>
      )}
      
      {/* Floating Price Tag if For Sale */}
      {!p.isOwned && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-300" 
             style={{transform: 'translateZ(30px) translateX(-50%) translateY(-50%) rotateX(-60deg) rotateY(0deg) rotateZ(45deg)', opacity: hover ? 1 : 0.6}}>
           <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap border border-white">
             ${p.purchaseCost.toLocaleString()}
           </div>
        </div>
      )}
    </div>
  )
}

const RoadCell = ({ dir, cars, light, timeScale }: { dir: 'h' | 'v', cars: any[], light: 'red' | 'green', timeScale: number }) => {
  return (
    <div className="relative w-full h-full bg-slate-700" style={{ transformStyle: 'preserve-3d' }}>
       {/* Markings */}
       {dir === 'h' && (
         <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-dashed border-yellow-500/50 -translate-y-1/2"></div>
       )}
       {dir === 'v' && (
         <div className="absolute left-1/2 top-0 h-full w-0 border-l-2 border-dashed border-yellow-500/50 -translate-x-1/2"></div>
       )}

       {/* Cars */}
       {cars.map((car, i) => (
         <div 
           key={i}
           className="absolute top-1/2 left-1/2"
           style={{
             animation: `${dir === 'h' ? 'drive-h' : 'drive-v'} ${car.speed * 4 / (timeScale||1)}s linear infinite`,
             animationDelay: `-${car.delay}s`,
             animationPlayState: (light === 'red' || timeScale === 0) ? 'paused' : 'running'
           }}
         >
            <Car3D color={car.color} isVertical={dir === 'v'} moving={timeScale > 0 && light === 'green'} />
         </div>
       ))}
    </div>
  )
}

const Intersection = ({ hLight, vLight }: { hLight: 'red'|'green', vLight: 'red'|'green' }) => {
  return (
    <div className="relative w-full h-full bg-slate-700" style={{ transformStyle: 'preserve-3d' }}>
       {/* Zebra Crossing Pattern */}
       <div className="absolute inset-2 border-2 border-dashed border-white/20"></div>
       
       {/* Traffic Lights at Corners */}
       <div className="absolute top-0 right-0 transform translate-x-2 translate-y-2">
          <TrafficLight3D state={vLight} />
       </div>
       <div className="absolute bottom-0 left-0 transform -translate-x-2 -translate-y-2">
          <TrafficLight3D state={hLight} />
       </div>
    </div>
  )
}

export default IsometricMap;
