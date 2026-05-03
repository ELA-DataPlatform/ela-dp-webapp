import { Sidebar } from "@/components/layout/sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </>
  )
}
