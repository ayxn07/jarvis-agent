import { HomePage } from "@/components/home/home-page";

export default function Page() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[2440px] flex-col bg-background px-6 pb-16 pt-12 md:px-12 xl:px-20">
      <HomePage />
    </div>
  );
}
