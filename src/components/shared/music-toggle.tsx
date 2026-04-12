"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "life-rpg-music-enabled";

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/audio/bg-music.mp3");
    audio.loop = true;
    audio.volume = 0.25;
    audioRef.current = audio;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== "false") {
      audio.play().then(() => setPlaying(true)).catch(() => {
        // Autoplay blocked — will resume on first user interaction
      });
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Resume music on first page interaction if user had it enabled
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "false") return;

    function resumeOnInteraction() {
      if (hasInteractedRef.current) return;
      hasInteractedRef.current = true;
      const audio = audioRef.current;
      if (audio && audio.paused) {
        audio.play().then(() => setPlaying(true)).catch(() => {});
      }
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("keydown", resumeOnInteraction);
    }

    document.addEventListener("click", resumeOnInteraction);
    document.addEventListener("keydown", resumeOnInteraction);
    return () => {
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("keydown", resumeOnInteraction);
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      localStorage.setItem(STORAGE_KEY, "false");
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      localStorage.setItem(STORAGE_KEY, "true");
      setPlaying(true);
    }
  }, [playing]);

  return (
    <button
      onClick={toggle}
      className="fixed bottom-20 right-4 lg:bottom-4 lg:right-4 z-30 p-2.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
      aria-label={playing ? "Mute background music" : "Play background music"}
    >
      {playing ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </button>
  );
}
