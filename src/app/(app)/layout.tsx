import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LevelUpModal } from "@/components/shared/level-up-modal";
import { QuestCompleteFlash } from "@/components/shared/quest-complete-flash";
import { TutorialOverlay } from "@/components/onboarding/tutorial-overlay";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const userId = await getAuthUser();

  const character = await db.character.findUnique({ where: { userId } });
  if (!character) {
    redirect("/onboarding");
  }

  return (
    <div className="relative flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-60">
        <Header />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 pb-24 lg:pb-8 relative z-10">
          {children}
        </main>
      </div>
      <MobileNav />
      <LevelUpModal />
      <QuestCompleteFlash />
      <TutorialOverlay
        characterName={character.name}
        open={!character.hasCompletedTutorial}
      />
    </div>
  );
}
