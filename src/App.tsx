import { type MouseEvent, useMemo, useState } from "react"
import { lootConfig } from "@/assets/pools.ts"
import useLoot from "@/hooks/useLoot.tsx"
import { Scene } from "./components/common/Scene.tsx"
export const toPercentage = (value: number, total: number) => {
  return Number.parseFloat((value === 0 ? 0 : (value / total) * 100).toFixed(2))
}
const App = () => {
  const [debug, setDebug] = useState<{
    [key: string]: string
  }>({})

  const [count, setCount] = useState(0)
  const observedCounts = useMemo(
    () =>
      new Map<string, number>([
        ["common", 0],
        ["uncommon", 0],
        ["rare", 0],
        ["epic", 0],
        ["legendary", 0],
        ["mythic", 0],
      ]),
    [],
  )

  const { getLootChances, getLoots, getRollCount } = useLoot(lootConfig.pools[0])
  const lootChances = getLootChances()

  const computeObservedDropRates = (items: string[]) => {
    const rollCount = getRollCount()
    setCount(rollCount)
    for (const item of items) {
      observedCounts.set(item, (observedCounts.get(item) ?? 0) + 1)
    }
  }

  const onLoot = (e: MouseEvent) => {
    e.preventDefault()

    const items = getLoots()
    computeObservedDropRates(items)

    setDebug((prevState) => ({
      ...prevState,
      loot: items.join(", "),
    }))
  }

  return (
    <Scene className="flex flex-col items-center justify-center gap-4">
      <button type="button" className="px-5 py-3 border-2 border-white" onClick={onLoot}>
        Loot
      </button>
      <div className="flex flex-col gap-1  text-white  text-sm w-56 h-56">
        {Object.entries(debug).map(([key, value]) => (
          <div key={key}>
            {key}: {value}
          </div>
        ))}
      </div>
      <div className="flex gap-16 ">
        <div className="w-full max-w-md">
          <h3 className="text-white font-bold text-lg mb-3 text-center">Loot Drop Rates</h3>
          <table className="w-full border-collapse bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-white/10 border-b border-white/20">
                <th className="text-left py-3 px-4 text-white font-semibold whitespace-nowrap">Item</th>
                <th className="text-right py-3 px-4 text-white font-semibold whitespace-nowrap">Drop Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(lootChances).map(([key, value], index) => (
                <tr
                  key={key}
                  className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                    index % 2 === 0 ? "bg-white/5" : ""
                  }`}
                >
                  <td className="py-3 px-4 text-white capitalize">{key}</td>
                  <td className="py-3 px-4 text-right text-white font-mono">{value}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-full max-w-md">
          <h3 className="text-white font-bold text-lg mb-3 text-center">Observed Drop Rates</h3>
          <table className="w-full border-collapse bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-white/10 border-b border-white/20">
                <th className="text-left py-3 px-4 text-white font-semibold whitespace-nowrap">Item</th>
                <th className="text-right py-3 px-4 text-white font-semibold whitespace-nowrap">Rolls : {count}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(observedCounts.entries()).map(([key, value], index) => (
                <tr
                  key={key}
                  className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                    index % 2 === 0 ? "bg-white/5" : ""
                  }`}
                >
                  <td className="py-3 px-4 text-white capitalize">{key}</td>
                  <td className="py-3 px-4 text-right text-white font-mono">{toPercentage(value, count)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Scene>
  )
}

export default App
