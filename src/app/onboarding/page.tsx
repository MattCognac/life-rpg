"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CHARACTER_CLASSES, CLASS_KEYS, type CharacterClass } from "@/lib/classes";
import { ClassIcon } from "@/components/shared/class-icon";
import { cn } from "@/lib/utils";
import { createCharacter } from "@/actions/character-actions";

type Step = "name" | "class" | "confirm";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep("class");
  };

  const handleClassSelect = (cls: CharacterClass) => {
    setSelectedClass(cls);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!selectedClass) return;
    setError(null);

    startTransition(async () => {
      const result = await createCharacter(name.trim(), selectedClass);
      if (!result.success) {
        setError(result.error ?? "Failed to create character");
        return;
      }
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Step 1: Name */}
        {step === "name" && (
          <div className="norse-card p-8 md:p-12 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.4), transparent 60%)",
              }}
            />
            <div className="relative space-y-8 text-center">
              <div>
                <h1 className="font-display text-3xl md:text-4xl tracking-widest text-gradient-gold uppercase">
                  A New Hero Rises
                </h1>
                <p className="text-sm text-muted-foreground mt-3 font-body">
                  Every legend begins with a name.
                </p>
              </div>

              <form onSubmit={handleNameSubmit} className="space-y-6 max-w-sm mx-auto">
                <div>
                  <label
                    htmlFor="hero-name"
                    className="block text-xs font-display uppercase tracking-[0.3em] text-muted-foreground mb-2"
                  >
                    What shall the realm know you as?
                  </label>
                  <input
                    id="hero-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    maxLength={30}
                    className="w-full px-4 py-3 bg-input border border-border text-foreground text-center text-lg font-display tracking-wider focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="Ragnar"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="btn-norse w-full"
                >
                  Continue
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step 2: Class */}
        {step === "class" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-3xl tracking-widest text-gradient-gold uppercase">
                Choose Your Path
              </h1>
              <p className="text-sm text-muted-foreground mt-2 font-body">
                Your class defines your identity. You can change it anytime.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {CLASS_KEYS.map((key) => {
                const cls = CHARACTER_CLASSES[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleClassSelect(key)}
                    className={cn(
                      "norse-card p-4 ember-hover text-center space-y-2 transition-all cursor-pointer",
                      selectedClass === key &&
                        "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                    )}
                  >
                    <div className="w-10 h-10 mx-auto flex items-center justify-center">
                      <ClassIcon characterClass={key} className="w-8 h-8 text-primary" />
                    </div>
                    <div className="font-display text-sm tracking-wider uppercase text-foreground">
                      {cls.name}
                    </div>
                    <div className="text-[10px] font-body text-muted-foreground italic leading-tight">
                      &ldquo;{cls.flavor}&rdquo;
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep("name")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && selectedClass && (
          <div className="norse-card p-8 md:p-12 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.4), transparent 60%)",
              }}
            />
            <div className="relative space-y-8 text-center">
              <div>
                <div className="w-16 h-16 mx-auto flex items-center justify-center mb-4">
                  <ClassIcon
                    characterClass={selectedClass}
                    className="w-12 h-12 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                  />
                </div>
                <div className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground">
                  {CHARACTER_CLASSES[selectedClass].name}
                </div>
                <h1 className="font-display text-4xl tracking-widest text-gradient-gold uppercase mt-1">
                  {name}
                </h1>
                <p className="text-sm text-muted-foreground mt-3 font-body italic">
                  &ldquo;{CHARACTER_CLASSES[selectedClass].flavor}&rdquo;
                </p>
              </div>

              {error && (
                <div className="text-sm text-destructive font-body">{error}</div>
              )}

              <div className="space-y-3 max-w-xs mx-auto">
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="btn-norse w-full"
                >
                  {isPending ? "Entering..." : "Enter the Realm"}
                </button>
                <button
                  onClick={() => setStep("class")}
                  disabled={isPending}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                >
                  ← Change class
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
