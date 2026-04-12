import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ChangeEmailForm } from "@/components/settings/change-email-form";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await getAuthUser();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-primary" />
        <h1 className="font-display text-2xl tracking-widest uppercase">
          Settings
        </h1>
      </div>

      <ChangePasswordForm />
      <ChangeEmailForm currentEmail={email} />
      <DeleteAccountSection />
    </div>
  );
}
