import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import ProfileCompleteModal from "@/components/ProfileCompleteModal";
import BirthdayPopup from "@/components/BirthdayPopup";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 pb-20">{children}</main>
      <InstallPrompt />
      <BottomNav />
      <ProfileCompleteModal />
      <BirthdayPopup />
    </div>
  );
}
