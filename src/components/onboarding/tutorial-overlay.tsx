"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { completeTutorial } from "@/actions/character-actions";
import {
  Shield,
  Scroll,
  Trophy,
  Sparkles,
  Zap,
  ChevronRight,
  ChevronLeft,
  X,
  Target,
} from "lucide-react";

type TutorialStep = {
  id: string;
  target: string | null;
  title: string;
  description: string;
  icon: React.ReactNode;
  tooltipPosition: "below" | "right" | "left" | "center";
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to the Realm",
    description:
      "Life RPG turns your real-life goals into quests. Complete them to earn XP, level up your character, and unlock achievements. Let's show you around.",
    icon: <Shield className="w-8 h-8" />,
    tooltipPosition: "center",
  },
  {
    id: "hero",
    target: '[data-tutorial="hero"]',
    title: "Your Hero",
    description:
      "This is you. Your level badge, title, XP bar, and key stats live here. Complete quests to earn XP and watch your hero grow stronger.",
    icon: <Shield className="w-6 h-6" />,
    tooltipPosition: "below",
  },
  {
    id: "quests",
    target: '[data-tutorial="quests"]',
    title: "Active Quests",
    description:
      "Your active quests live here with chain context. Use the sidebar to jump to Quests, Chains, or Dailies for the full view.",
    icon: <Scroll className="w-6 h-6" />,
    tooltipPosition: "below",
  },
  {
    id: "skills",
    target: '[data-tutorial="skills"]',
    title: "Skill Mastery",
    description:
      "Skills are categories of mastery — like Fitness, Coding, or Cooking. They level up as you complete related quests. Create at least 3 to see your radar chart.",
    icon: <Target className="w-6 h-6" />,
    tooltipPosition: "below",
  },
  {
    id: "achievements",
    target: '[data-tutorial="nav-achievements"]',
    title: "Achievements",
    description:
      "Achievements unlock automatically as you hit milestones — completing your first quest, reaching a streak, leveling up. Check the Achievements page to see them all.",
    icon: <Trophy className="w-6 h-6" />,
    tooltipPosition: "right",
  },
  {
    id: "forge-ai",
    target: '[data-tutorial="forge-ai"]',
    title: "Create Your First Goal",
    description:
      "Ready to begin? Use Odin AI to break any goal into a step-by-step quest chain, or create quests manually from scratch anytime.",
    icon: <Sparkles className="w-6 h-6" />,
    tooltipPosition: "below",
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialOverlayProps {
  characterName: string;
  open: boolean;
}

type TutorialListener = () => void;
const reopenListeners = new Set<TutorialListener>();

export function reopenTutorial() {
  reopenListeners.forEach((l) => l());
}

export function TutorialOverlay({ characterName, open }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(open);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isFinishing, startFinishing] = useTransition();
  const spotlightRef = useRef<HTMLDivElement>(null);

  const currentStep = TUTORIAL_STEPS[step];
  const isLastStep = step === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    const listener: TutorialListener = () => {
      setStep(0);
      setVisible(true);
    };
    reopenListeners.add(listener);
    return () => { reopenListeners.delete(listener); };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [visible]);

  const measureTarget = useCallback(() => {
    if (!currentStep?.target) {
      setSpotlightRect(null);
      setTooltipStyle({});
      return;
    }

    const el = document.querySelector(currentStep.target);
    if (!el) {
      setSpotlightRect(null);
      setTooltipStyle({});
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 8;

    const newRect = {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };
    setSpotlightRect(newRect);

    const tooltipWidth = 380;
    const tooltipGap = 16;
    const pos = currentStep.tooltipPosition;

    let style: React.CSSProperties = { position: "fixed", width: tooltipWidth };

    if (pos === "below") {
      const topPos = newRect.top + newRect.height + tooltipGap;
      let leftPos = Math.max(16, newRect.left + newRect.width / 2 - tooltipWidth / 2);
      if (leftPos + tooltipWidth > window.innerWidth - 16) {
        leftPos = window.innerWidth - tooltipWidth - 16;
      }
      style.top = topPos;
      style.left = leftPos;
    } else if (pos === "right") {
      const rightLeft = newRect.left + newRect.width + tooltipGap;
      if (rightLeft + tooltipWidth > window.innerWidth - 16) {
        const topPos = newRect.top + newRect.height + tooltipGap;
        let leftPos = Math.max(16, newRect.left + newRect.width / 2 - tooltipWidth / 2);
        if (leftPos + tooltipWidth > window.innerWidth - 16) {
          leftPos = window.innerWidth - tooltipWidth - 16;
        }
        style.top = topPos;
        style.left = leftPos;
      } else {
        style.top = newRect.top;
        style.left = rightLeft;
      }
    } else if (pos === "left") {
      const leftLeft = newRect.left - tooltipWidth - tooltipGap;
      if (leftLeft < 16) {
        const topPos = newRect.top + newRect.height + tooltipGap;
        let leftPos = Math.max(16, newRect.left + newRect.width / 2 - tooltipWidth / 2);
        if (leftPos + tooltipWidth > window.innerWidth - 16) {
          leftPos = window.innerWidth - tooltipWidth - 16;
        }
        style.top = topPos;
        style.left = leftPos;
      } else {
        style.top = newRect.top;
        style.left = leftLeft;
      }
    }

    if (typeof style.top === "number") {
      const estimatedTooltipHeight = 200;
      if (style.top + estimatedTooltipHeight > window.innerHeight - 16) {
        style.top = newRect.top - estimatedTooltipHeight - tooltipGap;
        if (style.top < 16) style.top = 16;
      }
      if (style.top < 16) style.top = 16;
    }

    setTooltipStyle(style);
  }, [currentStep]);

  useEffect(() => {
    if (!visible) return;

    if (currentStep?.target) {
      const el = document.querySelector(currentStep.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const timer = setTimeout(measureTarget, 400);
        return () => clearTimeout(timer);
      }
    }

    measureTarget();
  }, [step, visible, measureTarget, currentStep]);

  useEffect(() => {
    if (!visible || !currentStep?.target) return;

    const handleResize = () => measureTarget();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [visible, currentStep, measureTarget]);

  const finish = useCallback(() => {
    startFinishing(async () => {
      await completeTutorial();
      setVisible(false);
    });
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (!visible) return null;

  const isCentered = currentStep.tooltipPosition === "center";

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Tutorial">
      {/* Dark overlay for centered steps */}
      {isCentered && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
      )}

      {/* Spotlight cutout for targeted steps */}
      {!isCentered && spotlightRect && (
        <div
          ref={spotlightRef}
          className="fixed rounded-sm animate-rune-spotlight pointer-events-none"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            transition: "top 0.4s ease-in-out, left 0.4s ease-in-out, width 0.4s ease-in-out, height 0.4s ease-in-out",
            zIndex: 71,
          }}
        />
      )}

      {/* Pulsing "Try me!" hotspot on the Forge button for the last step */}
      {isLastStep && spotlightRect && (
        <div
          className="fixed pointer-events-none"
          style={{
            top: spotlightRect.top - 12,
            left: spotlightRect.left + spotlightRect.width - 16,
            zIndex: 73,
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 w-8 h-8 rounded-full bg-gold/40 animate-ping" />
            <div className="relative w-8 h-8 rounded-full bg-gold flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
          </div>
        </div>
      )}

      {/* Centered modal card (welcome only) */}
      {isCentered && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[72]">
          <div className="norse-card p-8 md:p-10 relative overflow-hidden max-w-lg w-full animate-fade-in-up">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, hsl(var(--gold) / 0.4), transparent 60%)",
              }}
            />
            <div className="relative">
              <button
                onClick={dismiss}
                disabled={isFinishing}
                className="absolute -top-2 -right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close tutorial"
              >
                <X className="w-5 h-5" />
              </button>

              {renderWelcomeStep()}
            </div>
          </div>
        </div>
      )}

      {/* Positioned tooltip card for spotlight steps */}
      {!isCentered && spotlightRect && (
        <div style={{ ...tooltipStyle, zIndex: 72 }} className="animate-fade-in-up">
          <div className="norse-card p-5 pb-4 border-t-2 border-t-gold/50 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 rounded-full border border-gold/30 bg-gold/10 flex items-center justify-center text-gold">
                {currentStep.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base tracking-wider uppercase text-gradient-gold">
                  {currentStep.title}
                </h3>
                <p className="text-sm text-muted-foreground font-body mt-1.5 leading-relaxed">
                  {currentStep.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <div className="flex gap-1.5">
                {TUTORIAL_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === step
                        ? "bg-gold scale-125"
                        : i < step
                          ? "bg-gold/40"
                          : "bg-border"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {!isLastStep && (
                  <button
                    onClick={dismiss}
                    disabled={isFinishing}
                    className="text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
                  >
                    Skip
                  </button>
                )}
                {step > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleBack}>
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
                {isLastStep ? (
                  <Button
                    size="sm"
                    onClick={finish}
                    disabled={isFinishing}
                  >
                    Finish Tour
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleNext}>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderWelcomeStep() {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full border-2 border-gold/30 bg-gold/10 text-gold">
          {currentStep.icon}
        </div>
        <div>
          <h2 className="font-display text-2xl md:text-3xl tracking-widest text-gradient-gold uppercase">
            Welcome to the Realm, {characterName}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-sm mx-auto">
          {currentStep.description}
        </p>

        <div className="flex gap-1.5 justify-center">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "bg-gold scale-125"
                  : i < step
                    ? "bg-gold/40"
                    : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <Button onClick={handleNext} className="w-full">
            Begin the Tour
            <ChevronRight className="w-4 h-4" />
          </Button>
          <button
            onClick={dismiss}
            disabled={isFinishing}
            className="text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
          >
            Skip Tutorial
          </button>
        </div>
      </div>
    );
  }
}
