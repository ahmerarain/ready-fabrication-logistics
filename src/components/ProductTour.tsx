import React, { useState, useEffect } from "react";
import { Sparkles, ChevronRight, ChevronLeft, X, HelpCircle, Check, Info } from "lucide-react";

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  tab?: "simulation" | "traceability" | "boxing" | "cutting" | "inventory" | "import" | "exceptions" | "nester";
  tip: string;
}

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: any) => void;
}

export default function ProductTour({ isOpen, onClose, setActiveTab }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightCoords, setHighlightCoords] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const steps: TourStep[] = [
    {
      targetId: "tour-job-info",
      title: "Active Job Registry",
      content: "This panel contains details of the active commercial construction project. You can click the pencil icon to rename the job and update project codes in real-time.",
      tip: "All statistics and dockets will instantly update."
    },
    {
      targetId: "tour-tab-import",
      title: "Step 1: Import CSV Schedule",
      content: "Begin your workflow here. You can upload standard steel profiles exported directly from Tekla or SDS/2 structural files. Or, use the 'Restore Default Seeds' button to load sample data for testing.",
      tab: "import",
      tip: "Wiping SQLite with Clear Database resets the sandbox."
    },
    {
      targetId: "tour-tab-simulation",
      title: "Step 2: Flow Simulator",
      content: "This is the interactive nerve center. Aligned plates are placed into nesting layouts, CNC lasers cut profile markings, and operators mock-scan individual QR barcodes of finished pieces.",
      tab: "simulation",
      tip: "Try clicking 'Nesting Aligner' then mock engraving."
    },
    {
      targetId: "tour-tab-cutting",
      title: "Step 3: Nesting Sheet Groups",
      content: "Review automated nesting plates. Steel parts are grouped onto plate schedules (e.g. 10mm structural steel raw materials) with complete dimensional layout tracking.",
      tab: "cutting",
      tip: "Click nested plates to inspect part status."
    },
    {
      targetId: "tour-tab-boxing",
      title: "Step 4: Pack Member Boxes",
      content: "Finished parts are gathered into wooden shipping kits/boxes grouped by Tekla assembly marks. Print official shipping delivery dockets and sign off on active steel loads.",
      tab: "boxing",
      tip: "Boxes enforce quality checklists before shipping."
    },
    {
      targetId: "tour-tab-nester",
      title: "Step 5: 1D Linear Nester & Kit Link",
      content: "This is the 1D Long-Section nesting workstation. Group long beams by profile size, edit merchant stock configurations, saw kerf, and reusable offcut thresholds to generate gorgeous 1D linear cut schedules.",
      tab: "nester",
      tip: "Try clicking 'RUN 1D LINEAR NESTING COMPILER' on this screen!"
    },
    {
      targetId: "tour-tab-inventory",
      title: "Step 6: Raw Stock Inventory",
      content: "Track structural material thickness profiles, remaining plate count stocks, and total weights in real-time. Crucial for verifying raw mill test certificates against physical steel inventory.",
      tab: "inventory",
      tip: "Shows current steel weights and plate thicknesses."
    },
    {
      targetId: "tour-tab-traceability",
      title: "Step 7: Traceability Chain",
      content: "Inspect full material certification and live tracking of individual steel plates from nested plate layout raw sheet files to specific boxed containers.",
      tab: "traceability",
      tip: "Deep-link by clicking any QR code on other screens."
    },
    {
      targetId: "tour-tab-exceptions",
      title: "Step 8: Exceptions Hub",
      content: "Manage manufacturing hiccups! If a plate is marked damaged or missing by scanning, it arrives here. Operators write manual overrides to re-order the cutting process instantly.",
      tab: "exceptions",
      tip: "Enter notes and click 'Override' to restore peace."
    }
  ];

  const step = steps[currentStep];

  // Reset step to 0 every time the tour is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Optional: Switch tab if required for this step
    if (step.tab) {
      setActiveTab(step.tab);
    }

    const calculateCoords = () => {
      const element = document.getElementById(step.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Calculate coords relative to document scroll
        setHighlightCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });

        // Scroll the target element into view
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        });
      } else {
        setHighlightCoords(null);
      }
    };

    // Small delay to allow react tab state switches and animations to settle
    const timeout = setTimeout(calculateCoords, 250);
    
    window.addEventListener("resize", calculateCoords);
    window.addEventListener("scroll", calculateCoords);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", calculateCoords);
      window.removeEventListener("scroll", calculateCoords);
    };
  }, [currentStep, isOpen, step?.targetId, step?.tab]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none no-print">
      {/* 1. Backdrop Overlay (Spotlight effect) */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300"
        style={{
          clipPath: highlightCoords 
            ? `polygon(
                0% 0%, 
                0% 100%, 
                ${highlightCoords.left}px 100%, 
                ${highlightCoords.left}px ${highlightCoords.top}px, 
                ${highlightCoords.left + highlightCoords.width}px ${highlightCoords.top}px, 
                ${highlightCoords.left + highlightCoords.width}px ${highlightCoords.top + highlightCoords.height}px, 
                ${highlightCoords.left}px ${highlightCoords.top + highlightCoords.height}px, 
                ${highlightCoords.left}px 100%, 
                100% 100%, 
                100% 0%
              )`
            : undefined,
          pointerEvents: "auto"
        }}
        onClick={onClose}
        title="Click anywhere of the backdrop to exit tour"
      />

      {/* 2. Highlight Border frame around the target element */}
      {highlightCoords && (
        <div 
          className="absolute border-2 border-indigo-500 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300 pointer-events-none z-50 animate-pulse"
          style={{
            top: highlightCoords.top - 4,
            left: highlightCoords.left - 4,
            width: highlightCoords.width + 8,
            height: highlightCoords.height + 8
          }}
        />
      )}

      {/* 3. Floating Tooltip Dialog Card with Guide */}
      <div 
        className="absolute bottom-6 md:bottom-12 right-6 md:right-12 w-full max-w-[380px] bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/50 p-5 p-r-4 pointer-events-auto z-50 transition-all duration-300"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-indigo-100">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-400 font-mono tracking-wider font-bold block uppercase leading-none">Interactive Manual</span>
              <h4 className="text-xs font-bold text-slate-100 mt-1">{step.title}</h4>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition"
            title="Exit Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {step.content}
        </p>

        {/* Operator Recommendation Tip Box */}
        <div className="flex items-start gap-2 bg-slate-800/60 rounded-lg p-2.5 mb-4 border border-slate-800">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium text-slate-300 leading-normal">
            <span className="font-bold text-indigo-300">Tip:</span> {step.tip}
          </p>
        </div>

        {/* Pagination & Navigation Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
          <span className="font-mono text-slate-500 font-bold">
            Step {currentStep + 1} of {steps.length}
          </span>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded font-bold transition flex items-center gap-1 cursor-pointer"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Done <Check className="w-3.5 h-3.5 ml-0.5" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
