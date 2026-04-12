"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { completeTutorial } from "@/actions/character-actions";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { TUTORIAL_STEPS, type TutorialStep } from "@/lib/tutorial-steps";

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

function waitForStablePosition(
  el: Element,
  signal: AbortSignal,
): Promise<DOMRect | null> {
  return new Promise((resolve) => {
    let prev = el.getBoundingClientRect();
    let settled = 0;

    function check() {
      if (signal.aborted) { resolve(null); return; }
      const curr = el.getBoundingClientRect();
      const same =
        Math.abs(curr.top - prev.top) < 1 &&
        Math.abs(curr.left - prev.left) < 1;
      prev = curr;
      if (same) {
        settled++;
        if (settled >= 3) { resolve(curr); return; }
      } else {
        settled = 0;
      }
      requestAnimationFrame(check);
    }

    requestAnimationFrame(check);
  });
}

function computeTooltipStyle(
  step: TutorialStep,
  rect: SpotlightRect,
): React.CSSProperties {
  const tooltipWidth = 420;
  const tooltipGap = 16;
  const pos = step.tooltipPosition;
  const style: React.CSSProperties = { position: "fixed", width: tooltipWidth };

  if (pos === "below") {
    const topPos = rect.top + rect.height + tooltipGap;
    let leftPos = Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2);
    if (leftPos + tooltipWidth > window.innerWidth - 16) {
      leftPos = window.innerWidth - tooltipWidth - 16;
    }
    style.top = topPos;
    style.left = leftPos;
  } else if (pos === "right") {
    const rightLeft = rect.left + rect.width + tooltipGap;
    if (rightLeft + tooltipWidth > window.innerWidth - 16) {
      const topPos = rect.top + rect.height + tooltipGap;
      let leftPos = Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2);
      if (leftPos + tooltipWidth > window.innerWidth - 16) {
        leftPos = window.innerWidth - tooltipWidth - 16;
      }
      style.top = topPos;
      style.left = leftPos;
    } else {
      style.top = rect.top;
      style.left = rightLeft;
    }
  } else if (pos === "left") {
    const leftLeft = rect.left - tooltipWidth - tooltipGap;
    if (leftLeft < 16) {
      const topPos = rect.top + rect.height + tooltipGap;
      let leftPos = Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2);
      if (leftPos + tooltipWidth > window.innerWidth - 16) {
        leftPos = window.innerWidth - tooltipWidth - 16;
      }
      style.top = topPos;
      style.left = leftPos;
    } else {
      style.top = rect.top;
      style.left = leftLeft;
    }
  }

  if (typeof style.top === "number") {
    const estimatedTooltipHeight = 200;
    if (style.top + estimatedTooltipHeight > window.innerHeight - 16) {
      style.top = rect.top - estimatedTooltipHeight - tooltipGap;
      if (style.top < 16) style.top = 16;
    }
    if (style.top < 16) style.top = 16;
  }

  return style;
}

export function TutorialOverlay({ characterName, open }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(open);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [contentVisible, setContentVisible] = useState(true);
  const [isFinishing, startFinishing] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

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

    const domRect = el.getBoundingClientRect();
    const padding = 8;
    const newRect = {
      top: domRect.top - padding,
      left: domRect.left - padding,
      width: domRect.width + padding * 2,
      height: domRect.height + padding * 2,
    };
    setSpotlightRect(newRect);
    setTooltipStyle(computeTooltipStyle(currentStep, newRect));
  }, [currentStep]);

  useEffect(() => {
    if (!visible) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setContentVisible(false);

    if (currentStep?.target) {
      const el = document.querySelector(currentStep.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        waitForStablePosition(el, ac.signal).then((domRect) => {
          if (!domRect || ac.signal.aborted) return;
          const padding = 8;
          const newRect = {
            top: domRect.top - padding,
            left: domRect.left - padding,
            width: domRect.width + padding * 2,
            height: domRect.height + padding * 2,
          };
          setSpotlightRect(newRect);
          setTooltipStyle(computeTooltipStyle(currentStep, newRect));
          requestAnimationFrame(() => setContentVisible(true));
        });
      } else {
        setSpotlightRect(null);
        setTooltipStyle({});
        requestAnimationFrame(() => setContentVisible(true));
      }
    } else {
      setSpotlightRect(null);
      setTooltipStyle({});
      requestAnimationFrame(() => setContentVisible(true));
    }

    return () => ac.abort();
  }, [step, visible, currentStep, measureTarget]);

  useEffect(() => {
    if (!visible || !currentStep?.target) return;

    const handler = () => measureTarget();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
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
  const targetMissing = !isCentered && currentStep.target && !spotlightRect;
  const showCenteredFallback = isCentered || targetMissing;

  const contentOpacity = contentVisible ? "opacity-100" : "opacity-0";
  const contentTransition = "transition-opacity duration-200";

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Tutorial">
      {showCenteredFallback && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
      )}

      {!isCentered && spotlightRect && (
        <div
          className="fixed rounded-sm animate-rune-spotlight pointer-events-none"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            transition: "top 0.35s ease-out, left 0.35s ease-out, width 0.35s ease-out, height 0.35s ease-out",
            zIndex: 71,
          }}
        />
      )}

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

      {isCentered && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[72]">
          <div className={`norse-card p-8 md:p-10 relative overflow-hidden max-w-lg w-full animate-fade-in-up ${contentTransition} ${contentOpacity}`}>
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

      {targetMissing && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[72]">
          <div className={`norse-card p-8 relative overflow-hidden max-w-md w-full animate-fade-in-up border-t-2 border-t-gold/50 ${contentTransition} ${contentOpacity}`}>
            <div className="relative">
              {renderTooltipContent()}
            </div>
          </div>
        </div>
      )}

      {!isCentered && spotlightRect && (
        <div style={{ ...tooltipStyle, zIndex: 72 }} className={`${contentTransition} ${contentOpacity}`}>
          <div className="norse-card p-6 pb-5 border-t-2 border-t-gold/50 shadow-xl">
            {renderTooltipContent()}
          </div>
        </div>
      )}
    </div>
  );

  function renderTooltipContent() {
    return (
      <>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 flex-shrink-0 rounded-full border border-gold/30 bg-gold/10 flex items-center justify-center text-gold">
            {currentStep.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base tracking-wider uppercase text-gradient-gold">
              {currentStep.title}
            </h3>
            <p className="text-sm text-muted-foreground font-body mt-2 leading-relaxed">
              {currentStep.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-border/50">
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
      </>
    );
  }

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
