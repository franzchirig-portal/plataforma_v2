import './TopTabs.css'

export interface TopTabItem {
  label: string
  active: boolean
  onClick: () => void
}

// Barra de pestañas superiores (mismo estilo que la barra principal de la app)
export default function TopTabBar({ tabs }: { tabs: TopTabItem[] }) {
  return (
    <div className="top-tabs">
      {tabs.map((t) => (
        <button
          key={t.label}
          className={`top-tab ${t.active ? 'active' : ''}`}
          onClick={t.onClick}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
