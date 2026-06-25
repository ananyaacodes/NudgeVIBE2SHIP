import React from 'react';

export const LandscapeBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. LIGHT BEAMS: Soft vertical light beams glowing upward from behind the orb */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0 opacity-70">
        {/* Central lavender pillar of light, starting below the orb and shooting up to the top */}
        <div 
          className="absolute w-36 h-[140%] bg-gradient-to-t from-transparent via-violet-500/25 to-transparent blur-3xl animate-pulse" 
          style={{ transform: 'translateX(-100px) rotate(-3deg)', animationDuration: '8s' }}
        />
        <div 
          className="absolute w-48 h-[140%] bg-gradient-to-t from-transparent via-indigo-500/20 to-transparent blur-3xl animate-pulse" 
          style={{ transform: 'translateX(60px) rotate(4deg)', animationDuration: '11s' }}
        />
        <div 
          className="absolute w-24 h-[120%] bg-gradient-to-t from-transparent via-purple-400/15 to-transparent blur-2xl animate-pulse" 
          style={{ transform: 'translateX(200px) rotate(-1deg)', animationDuration: '7s' }}
        />
        <div 
          className="absolute w-40 h-[130%] bg-gradient-to-t from-transparent via-violet-600/18 to-transparent blur-3xl animate-pulse" 
          style={{ transform: 'translateX(-260px) rotate(2deg)', animationDuration: '14s' }}
        />
      </div>

      {/* 2. MOUNTAINS & STRUCTURES: Layered solid mountain/cliff silhouettes on left and right edges */}
      {/* LEFT CLIFF SYSTEM (SVG positioned at bottom-0, filled with rich solid dark purple gradients) */}
      <svg 
        className="absolute bottom-0 left-0 w-[50%] md:w-[42%] h-[320px] md:h-[460px] pointer-events-none z-25"
        viewBox="0 0 400 300" 
        preserveAspectRatio="none"
      >
        <defs>
          {/* Rich gradients fading nicely toward the center (right side) so they don't compete with the central orb */}
          <linearGradient id="leftSolidFar" x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0%" stopColor="#3d2480" stopOpacity="1" />
            <stop offset="50%" stopColor="#221254" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a0420" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="leftSolidMid" x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0%" stopColor="#3d2480" stopOpacity="1" />
            <stop offset="55%" stopColor="#221254" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a0420" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="leftSolidFore" x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0%" stopColor="#3d2480" stopOpacity="1" />
            <stop offset="60%" stopColor="#221254" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a0420" stopOpacity="0.45" />
          </linearGradient>

          {/* Glowing rim-light gradients that highlight top slopes facing the orb's light */}
          <linearGradient id="leftRimFar" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.05" />
            <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id="leftRimMid" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="70%" stopColor="#a78bfa" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#d8b4fe" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="leftRimFore" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#c084fc" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#f5f3ff" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* --- LEFT LAYER 1: Far Mountains (Solid Purple-to-Black shape) --- */}
        <path 
          d="M 0,300 L 0,110 Q 90,130 180,185 T 400,300 Z" 
          fill="url(#leftSolidFar)"
          stroke="url(#leftRimFar)"
          strokeWidth="1.2"
        />
        
        {/* STRUCTURES: Distant vertical communication antenna tower sitting on Far Mountain ridge */}
        <g opacity="0.35" transform="translate(4, 5)">
          <rect x="58" y="50" width="3.5" height="60" fill="#0c0721" stroke="#8b5cf6" strokeWidth="0.5" />
          <line x1="60" y1="50" x2="60" y2="20" stroke="#a78bfa" strokeWidth="1" />
          <circle cx="60" cy="20" r="2" fill="#ef4444" className="animate-pulse" />
        </g>

        {/* --- LEFT LAYER 2: Midground Mountains (Solid Purple-to-Black shape) --- */}
        <path 
          d="M 0,300 L 0,155 Q 80,165 160,205 T 400,300 Z" 
          fill="url(#leftSolidMid)"
          stroke="url(#leftRimMid)"
          strokeWidth="1.8"
        />

        {/* STRUCTURES: Satellite dish shape on Midground Mountain */}
        <g opacity="0.55" transform="translate(14, -10)">
          <line x1="140" y1="180" x2="140" y2="162" stroke="#120832" strokeWidth="2.5" />
          <line x1="140" y1="180" x2="140" y2="162" stroke="#a78bfa" strokeWidth="0.75" />
          <path d="M 128,157 C 128,147 152,147 152,157 Z" fill="#0d0526" stroke="#8b5cf6" strokeWidth="1.2" />
          <line x1="140" y1="152" x2="140" y2="142" stroke="#c084fc" strokeWidth="1" />
          <circle cx="140" cy="142" r="1.5" fill="#ffffff" />
        </g>

        {/* --- LEFT LAYER 3: Foreground Cliffs (Solid Purple-to-Black shape) --- */}
        <path 
          d="M 0,300 L 0,200 Q 70,215 140,240 T 400,300 Z" 
          fill="url(#leftSolidFore)"
          stroke="url(#leftRimFore)"
          strokeWidth="2.5"
        />
      </svg>

      {/* RIGHT CLIFF SYSTEM (SVG positioned at bottom-0, filled with rich solid dark purple gradients) */}
      <svg 
        className="absolute bottom-0 right-0 w-[50%] md:w-[42%] h-[320px] md:h-[460px] pointer-events-none z-25"
        viewBox="0 0 400 300" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="rightSolidFar" x1="1" y1="0" x2="0" y2="0.6">
            <stop offset="0%" stopColor="#3d2480" stopOpacity="1" />
            <stop offset="50%" stopColor="#221254" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a0420" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="rightSolidMid" x1="1" y1="0" x2="0" y2="0.6">
            <stop offset="0%" stopColor="#3d2480" stopOpacity="1" />
            <stop offset="55%" stopColor="#221254" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a0420" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="rightSolidFore" x1="1" y1="0" x2="0" y2="0.6">
            <stop offset="0%" stopColor="#3d2480" stopOpacity="1" />
            <stop offset="60%" stopColor="#221254" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a0420" stopOpacity="0.45" />
          </linearGradient>

          {/* Glowing rim-light gradients that highlight top slopes facing the orb's light */}
          <linearGradient id="rightRimFar" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.05" />
            <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id="rightRimMid" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="70%" stopColor="#a78bfa" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#d8b4fe" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="rightRimFore" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#c084fc" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#f5f3ff" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* --- RIGHT LAYER 1: Far Mountains (Solid Purple-to-Black shape) --- */}
        <path 
          d="M 400,300 L 400,100 Q 310,125 220,180 T 0,300 Z" 
          fill="url(#rightSolidFar)"
          stroke="url(#rightRimFar)"
          strokeWidth="1.2"
        />

        {/* STRUCTURES: Tall communication pylon tower on Far Mountain */}
        <g opacity="0.35" transform="translate(-10, 8)">
          <rect x="328" y="45" width="3.5" height="60" fill="#0c0721" stroke="#8b5cf6" strokeWidth="0.5" />
          <line x1="323" y1="55" x2="336" y2="55" stroke="#a78bfa" strokeWidth="0.75" />
          <line x1="325" y1="65" x2="334" y2="65" stroke="#a78bfa" strokeWidth="0.75" />
          <circle cx="330" cy="45" r="2" fill="#ef4444" className="animate-pulse" />
        </g>

        {/* --- RIGHT LAYER 2: Midground Mountains (Solid Purple-to-Black shape) --- */}
        <path 
          d="M 400,300 L 400,145 Q 310,160 230,200 T 0,300 Z" 
          fill="url(#rightSolidMid)"
          stroke="url(#rightRimMid)"
          strokeWidth="1.8"
        />

        {/* STRUCTURES: Small domed laboratory building outline on Midground Mountain */}
        <g opacity="0.65" transform="translate(10, 8)">
          <path d="M 235,175 A 14,14 0 0,1 263,175 Z" fill="#0d0526" stroke="#a78bfa" strokeWidth="1.2" />
          <line x1="249" y1="161" x2="249" y2="149" stroke="#c084fc" strokeWidth="1" />
          <circle cx="249" cy="149" r="1.5" fill="#ffffff" />
        </g>

        {/* --- RIGHT LAYER 3: Foreground Cliffs (Solid Purple-to-Black shape) --- */}
        <path 
          d="M 400,300 L 400,190 Q 320,205 250,235 T 0,300 Z" 
          fill="url(#rightSolidFore)"
          stroke="url(#rightRimFore)"
          strokeWidth="2.5"
        />
      </svg>

      {/* 3. GROUND/GRID FLOOR: Glowing perspective grid floor spanning full width */}
      <div className="absolute bottom-0 left-0 right-0 h-56 perspective-container z-20">
        {/* Radial dark-to-light gradient overlay that maps perfectly behind the grid floor to ground it */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060413] via-[#0b0722]/10 to-transparent pointer-events-none z-10" />
        
        {/* Subtle radial-gradient directly centered under the orb to make lines glow brightest in the middle */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(167,139,250,0.45)_0%,transparent_65%)] pointer-events-none z-10" />

        {/* The perspective grid itself, boosted in lines visibility and spacing */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1800px] h-[400px] perspective-grid opacity-95 z-0" />
        
        {/* Outer edges fade to darkness so the grid seamlessly dissolves at left/right/bottom edges */}
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#060413] to-transparent pointer-events-none z-30" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#060413] to-transparent pointer-events-none z-30" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#060413] to-transparent pointer-events-none z-30" />
      </div>

      {/* Central spotlight floor glow exactly beneath the central orb, positioned at the top of the grid floor above the mountains */}
      <div className="absolute bottom-56 left-0 right-0 h-0 pointer-events-none z-30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[180px] rounded-full bg-violet-600/35 blur-3xl pointer-events-none mix-blend-screen" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[100px] rounded-full bg-indigo-500/30 blur-2xl pointer-events-none mix-blend-screen" />
      </div>
    </div>
  );
};
