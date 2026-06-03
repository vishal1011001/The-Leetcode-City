import React, { useState, useRef } from 'react';

interface ActionToolbarProps {
  cycleTheme: () => void;
  replayIntro: () => void;
  theme: {
    accent: string;
    name: string;
  };
  themeIndex: number;
  themesLength: number;
  isMounted: boolean;
  dayNightCycleActive: boolean;
  setDayNightCycleActive: React.Dispatch<React.SetStateAction<boolean>>;
  weatherMode?: "sunny" | "rainy" | "windy" | "stormy" | "snowy";
  cycleWeather?: () => void;
  cityName?: string | null;
  searchByCity?: (city: string) => void;
  weatherLoading?: boolean;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({
  cycleTheme,
  replayIntro,
  theme,
  themeIndex,
  themesLength,
  isMounted,
  dayNightCycleActive,
  setDayNightCycleActive,
  weatherMode = "sunny",
  cycleWeather = () => {},
  cityName,
  searchByCity,
  weatherLoading = false,
}) => {
  const [cityInputOpen, setCityInputOpen] = useState(false);
  const [cityDraft, setCityDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityDraft.trim() && searchByCity) {
      searchByCity(cityDraft.trim());
      setCityDraft("");
      setCityInputOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Theme Cycle Button */}
      <button
        onClick={cycleTheme}
        className="btn-press flex items-center gap-1.5 border-[3px] border-border bg-bg/70 px-2.5 py-1 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
      >
        <span style={{ color: theme.accent }}>&#9654;</span>
        <span className="text-cream">{theme.name}</span>
        <span className="text-dim">{themeIndex + 1}/{themesLength}</span>
      </button>

      {/* Day/Night Cycle Button */}
      <button
        onClick={() => {
          setDayNightCycleActive((prev) => {
            const next = !prev;
            try {
              localStorage.setItem("leetcodecity_daynight_cycle", next ? "1" : "0");
            } catch {}
            return next;
          });
        }}
        className={`btn-press flex items-center gap-1.5 border-[3px] px-2.5 py-1 text-[10px] backdrop-blur-sm transition-colors ${
          dayNightCycleActive
            ? "border-amber-500/80 bg-amber-500/10 text-amber-400 hover:border-amber-400"
            : "border-border bg-bg/70 text-cream hover:border-border-light"
        }`}
      >
        <span style={{ color: theme.accent }}>&#9654;</span>
        <span>{dayNightCycleActive ? "CYCLE ON" : "CYCLE OFF"}</span>
      </button>

      {/* Weather Controls */}
      <div className="flex items-center gap-1">
        {/* Weather cycle button — click to cycle mode */}
        <button
          onClick={cycleWeather}
          className="btn-press flex items-center gap-1.5 border-[3px] border-border bg-bg/70 px-2.5 py-1 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light text-cream"
        >
          <span style={{ color: theme.accent }}>&#9654;</span>
          <span>
            {weatherLoading ? "..." : weatherMode.toUpperCase()}
            {cityName && !weatherLoading && (
              <span className="text-dim ml-1 normal-case">({cityName})</span>
            )}
          </span>
        </button>

        {/* City search toggle */}
        {searchByCity && (
          <button
            onClick={() => {
              setCityInputOpen((v) => !v);
              if (!cityInputOpen) setTimeout(() => inputRef.current?.focus(), 50);
            }}
            title="Search by city"
            className="btn-press flex items-center border-[3px] border-border bg-bg/70 px-1.5 py-1 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light text-dim"
          >
            &#9906;
          </button>
        )}

        {/* Inline city search input */}
        {cityInputOpen && searchByCity && (
          <form onSubmit={handleCitySubmit} className="flex items-center">
            <input
              ref={inputRef}
              value={cityDraft}
              onChange={(e) => setCityDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setCityInputOpen(false)}
              placeholder="City name..."
              className="border-[3px] border-border bg-bg/90 px-2 py-1 text-[10px] text-cream outline-none placeholder:text-dim backdrop-blur-sm w-28"
            />
          </form>
        )}
      </div>

      {/* Audio/Radio Slot if mounted */}
      {isMounted && <div id="gc-radio-slot" />}

      {/* Replay Intro Button */}
      <button
        onClick={replayIntro}
        className="btn-press flex items-center gap-1 border-[3px] border-border bg-bg/70 px-2 py-1 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
        title="Replay intro"
      >
        <span style={{ color: theme.accent }}>&#9654;</span>
        <span className="text-cream">Intro</span>
      </button>
    </div>
  );
};

export default ActionToolbar;