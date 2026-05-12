'use client';
import { Card } from '@/components/ui';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#0a0a0a', '#b08d4f', '#666666', '#a99563', '#3a3a3a', '#d4b88a'];

export default function AnalyticsCharts({
  weeks, topCountries, topProducts, typeDistribution, statusDistribution
}: {
  weeks: { label: string; count: number; new: number; won: number }[];
  topCountries: { country: string; count: number }[];
  topProducts: { product: string; count: number }[];
  typeDistribution: { type: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
}) {
  return (
    <div className="space-y-6">
      {/* Monthly growth */}
      <Card>
        <div className="px-6 py-5 border-b border-line">
          <h3 className="font-serif text-2xl text-ink">Monthly Growth</h3>
          <p className="text-xs text-muted mt-1">Lead inflow over the last 12 weeks</p>
        </div>
        <div className="p-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeks}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b08d4f" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#b08d4f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e6e6e6" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b6b6b' }} axisLine={{ stroke: '#e6e6e6' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b6b6b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#b08d4f" strokeWidth={2} fill="url(#g1)" name="Total" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top countries + products */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-5 border-b border-line">
            <h3 className="font-serif text-xl text-ink">Top Countries</h3>
            <p className="text-xs text-muted mt-1">By inquiry volume</p>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCountries} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#e6e6e6" strokeDasharray="2 4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b6b6b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 12, fill: '#0a0a0a' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(176,141,79,.08)' }} />
                <Bar dataKey="count" fill="#0a0a0a" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="px-6 py-5 border-b border-line">
            <h3 className="font-serif text-xl text-ink">Most Requested Products</h3>
            <p className="text-xs text-muted mt-1">By product category</p>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid stroke="#e6e6e6" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="product" tick={{ fontSize: 10, fill: '#6b6b6b' }} axisLine={{ stroke: '#e6e6e6' }} tickLine={false} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#6b6b6b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(176,141,79,.08)' }} />
                <Bar dataKey="count" fill="#b08d4f" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Lead type + status distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-5 border-b border-line">
            <h3 className="font-serif text-xl text-ink">Lead Type Distribution</h3>
            <p className="text-xs text-muted mt-1">Buyer profile breakdown</p>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeDistribution} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2}>
                  {typeDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="px-6 py-5 border-b border-line">
            <h3 className="font-serif text-xl text-ink">Pipeline Status</h3>
            <p className="text-xs text-muted mt-1">Lead funnel breakdown</p>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution}>
                <CartesianGrid stroke="#e6e6e6" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#6b6b6b' }} axisLine={{ stroke: '#e6e6e6' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b6b6b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(176,141,79,.08)' }} />
                <Bar dataKey="count" fill="#0a0a0a" radius={[2, 2, 0, 0]}>
                  {statusDistribution.map((s, i) => (
                    <Cell key={i} fill={s.status === 'won' ? '#10b981' : s.status === 'lost' ? '#dc2626' : '#0a0a0a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: '#0a0a0a',
  border: 'none',
  borderRadius: 0,
  color: '#fff',
  fontSize: 11,
  letterSpacing: '0.05em'
};
