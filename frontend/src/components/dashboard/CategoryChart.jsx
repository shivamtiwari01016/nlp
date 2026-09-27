import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { category, count } = payload[0].payload
  return (
    <div className="chart-tooltip">
      <strong>{category}</strong>
      <span>{count.toLocaleString()} tickets</span>
    </div>
  )
}

export default function CategoryChart({ data }) {
  return (
    <div className="category-chart" role="img" aria-label="Persisted ticket counts by predicted category">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 2, bottom: 4 }} barSize={17}>
          <CartesianGrid horizontal={false} stroke="#e9eeeb" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#79847f', fontSize: 11 }} />
          <YAxis type="category" dataKey="category" width={118} axisLine={false} tickLine={false} tick={{ fill: '#384540', fontSize: 12 }} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f2f5f3' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry) => <Cell key={entry.category} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
