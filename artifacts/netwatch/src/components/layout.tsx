import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-auto bg-background p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
