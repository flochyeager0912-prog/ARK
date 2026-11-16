/** Re-mounts on every navigation, giving each page a soft enter transition. */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
