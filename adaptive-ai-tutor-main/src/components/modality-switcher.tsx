"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { MODALITY_LABELS, type ModalityMode, type ModalityWeights } from "@/lib/tutor/modality";

interface ModalitySwitcherProps {
  mode: ModalityMode;
  onModeChange: (mode: ModalityMode) => void;
  detectedWeights?: ModalityWeights | null;
}

export function ModalitySwitcher({ mode, onModeChange, detectedWeights }: ModalitySwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = MODALITY_LABELS[mode];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-[#d6dbe8] bg-white px-2.5 py-1.5 text-xs text-[#53647d] transition hover:border-[#8bb2ed] hover:text-[#0252d9]"
      >
        <span>{current.icon}</span>
        <span>{current.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-[#d6dbe8] bg-white p-1.5 shadow-xl shadow-[#102b4e]/10">
          {(Object.entries(MODALITY_LABELS) as [ModalityMode, typeof current][]).map(([key, info]) => {
            const isActive = key === mode;
            return (
              <button
                key={key}
                onClick={() => { onModeChange(key); setOpen(false); }}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  isActive
                    ? "bg-[#0252d9]/[0.08] text-[#0252d9]"
                    : "text-[#53647d] hover:bg-[#f1f5fc] hover:text-[#0b1c30]"
                }`}
              >
                <span className="mt-0.5 text-base">{info.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{info.label}</p>
                  <p className="text-xs text-[#7a879b] mt-0.5">{info.description}</p>
                  {key === "auto" && detectedWeights && (
                    <div className="mt-2 flex gap-1">
                      {(["auditory", "visual", "reading"] as const).map((m) => (
                        <div key={m} className="flex-1">
                          <div className="h-1 rounded-full bg-[#e7edf6] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#0252d9]"
                              style={{ width: `${Math.round(detectedWeights[m] * 100)}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-[#9aa8bb] text-center capitalize">
                            {m.slice(0, 3)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {isActive && (
                    <div className="mt-1 h-2 w-2 rounded-full bg-[#0252d9]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
