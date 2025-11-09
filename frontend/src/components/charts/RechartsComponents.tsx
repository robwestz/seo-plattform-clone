'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadialBarChart,
  RadialBar,
  Pie,
  PieChart,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
  Treemap,
  Funnel,
  FunnelChart,
  LabelList,
} from 'recharts';

// Colors
const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

// Trend Line Chart
interface TrendLineChartProps {
  data: Array<{ date: string; [key: string]: string | number }>;
  lines: Array<{ dataKey: string; name: string; color?: string }>;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  lines,
  height = 300,
  showGrid = true,
  showLegend = true,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis
          dataKey="date"
          stroke="#666"
          style={{ fontSize: '12px' }}
        />
        <YAxis stroke="#666" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color || COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={{ fill: line.color || COLORS[index % COLORS.length], r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={1000}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

// Area Chart with Gradient
interface GradientAreaChartProps {
  data: Array<{ date: string; [key: string]: string | number }>;
  areas: Array<{ dataKey: string; name: string; color?: string }>;
  height?: number;
  stacked?: boolean;
}

export const GradientAreaChart: React.FC<GradientAreaChartProps> = ({
  data,
  areas,
  height = 300,
  stacked = false,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {areas.map((area, index) => {
            const color = area.color || COLORS[index % COLORS.length];
            return (
              <linearGradient key={area.dataKey} id={`gradient-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            );
          })}
        </defs>
        <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
        <YAxis stroke="#666" style={{ fontSize: '12px' }} />
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name}
            stroke={area.color || COLORS[index % COLORS.length]}
            fill={`url(#gradient-${area.dataKey})`}
            strokeWidth={2}
            stackId={stacked ? '1' : undefined}
            animationDuration={1000}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Multi-Bar Chart
interface MultiBarChartProps {
  data: Array<{ name: string; [key: string]: string | number }>;
  bars: Array<{ dataKey: string; name: string; color?: string }>;
  height?: number;
  horizontal?: boolean;
  stacked?: boolean;
}

export const MultiBarChart: React.FC<MultiBarChartProps> = ({
  data,
  bars,
  height = 300,
  horizontal = false,
  stacked = false,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        {horizontal ? (
          <>
            <XAxis type="number" stroke="#666" style={{ fontSize: '12px' }} />
            <YAxis dataKey="name" type="category" stroke="#666" style={{ fontSize: '12px' }} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" stroke="#666" style={{ fontSize: '12px' }} />
            <YAxis stroke="#666" style={{ fontSize: '12px' }} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color || COLORS[index % COLORS.length]}
            stackId={stacked ? '1' : undefined}
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

// Composed Chart (Multiple chart types combined)
interface ComposedChartProps {
  data: Array<{ name: string; [key: string]: string | number }>;
  lines?: Array<{ dataKey: string; name: string; color?: string }>;
  bars?: Array<{ dataKey: string; name: string; color?: string }>;
  areas?: Array<{ dataKey: string; name: string; color?: string }>;
  height?: number;
}

export const MultiTypeChart: React.FC<ComposedChartProps> = ({
  data,
  lines = [],
  bars = [],
  areas = [],
  height = 300,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" stroke="#666" style={{ fontSize: '12px' }} />
        <YAxis stroke="#666" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />

        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name}
            fill={area.color || COLORS[index % COLORS.length]}
            stroke={area.color || COLORS[index % COLORS.length]}
            fillOpacity={0.3}
          />
        ))}

        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color || COLORS[(areas.length + index) % COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}

        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color || COLORS[(areas.length + bars.length + index) % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Radar Chart for Multi-dimensional comparison
interface RadarChartProps {
  data: Array<{ subject: string; [key: string]: string | number }>;
  metrics: Array<{ dataKey: string; name: string; color?: string }>;
  height?: number;
}

export const MultiRadarChart: React.FC<RadarChartProps> = ({
  data,
  metrics,
  height = 400,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="subject" stroke="#666" style={{ fontSize: '12px' }} />
        <PolarRadiusAxis stroke="#666" style={{ fontSize: '11px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        {metrics.map((metric, index) => (
          <Radar
            key={metric.dataKey}
            name={metric.name}
            dataKey={metric.dataKey}
            stroke={metric.color || COLORS[index % COLORS.length]}
            fill={metric.color || COLORS[index % COLORS.length]}
            fillOpacity={0.3}
            strokeWidth={2}
            animationDuration={1000}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
};

// Radial Bar Chart
interface RadialBarChartProps {
  data: Array<{ name: string; value: number; fill?: string }>;
  height?: number;
}

export const RadialProgressChart: React.FC<RadialBarChartProps> = ({
  data,
  height = 400,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="20%"
        outerRadius="100%"
        barSize={20}
        data={data}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar
          background
          dataKey="value"
          cornerRadius={10}
          label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
          animationDuration={1000}
        />
        <Legend
          iconSize={10}
          layout="vertical"
          verticalAlign="middle"
          align="right"
          formatter={(value, entry: any) => `${entry.payload.name}: ${entry.payload.value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          formatter={(value: number) => `${value}%`}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

// Pie Chart with custom labels
interface CustomPieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  innerRadius?: number;
  showPercentage?: boolean;
}

export const CustomPieChart: React.FC<CustomPieChartProps> = ({
  data,
  height = 300,
  innerRadius = 0,
  showPercentage = true,
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {showPercentage ? `${(percent * 100).toFixed(0)}%` : name}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={height / 2 - 40}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
          animationDuration={1000}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [
            `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
            'Value',
          ]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry: any) => {
            const percentage = ((entry.payload.value / total) * 100).toFixed(1);
            return `${value}: ${entry.payload.value.toLocaleString()} (${percentage}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Scatter Plot
interface CustomScatterPlotProps {
  data: Array<{ x: number; y: number; z?: number; name?: string }>;
  xLabel?: string;
  yLabel?: string;
  height?: number;
}

export const CustomScatterPlot: React.FC<CustomScatterPlotProps> = ({
  data,
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  height = 400,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          stroke="#666"
          style={{ fontSize: '12px' }}
          label={{ value: xLabel, position: 'bottom', offset: 40, style: { fill: '#666' } }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          stroke="#666"
          style={{ fontSize: '12px' }}
          label={{ value: yLabel, angle: -90, position: 'left', offset: 40, style: { fill: '#666' } }}
        />
        {data[0]?.z && <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Size" />}
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          formatter={(value: any, name: string) => [value, name]}
        />
        <Legend />
        <Scatter
          name="Data Points"
          data={data}
          fill="#3b82f6"
          fillOpacity={0.6}
          animationDuration={1000}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

// Treemap for hierarchical data
interface TreemapChartProps {
  data: Array<{ name: string; size: number; children?: Array<{ name: string; size: number }> }>;
  height?: number;
}

export const TreemapChart: React.FC<TreemapChartProps> = ({ data, height = 400 }) => {
  const COLORS_EXTENDED = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#14b8a6',
  ];

  const CustomizedContent = (props: any) => {
    const { x, y, width, height, index, name, size } = props;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: COLORS_EXTENDED[index % COLORS_EXTENDED.length],
            stroke: '#fff',
            strokeWidth: 2,
          }}
        />
        {width > 50 && height > 30 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 8}
              textAnchor="middle"
              fill="#fff"
              fontSize={14}
              fontWeight="bold"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 8}
              textAnchor="middle"
              fill="#fff"
              fontSize={12}
            >
              {size.toLocaleString()}
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap
        data={data}
        dataKey="size"
        aspectRatio={4 / 3}
        stroke="#fff"
        fill="#8884d8"
        content={<CustomizedContent />}
        animationDuration={1000}
      />
    </ResponsiveContainer>
  );
};

// Funnel Chart for conversion analysis
interface FunnelChartProps {
  data: Array<{ name: string; value: number; fill?: string }>;
  height?: number;
}

export const ConversionFunnelChart: React.FC<FunnelChartProps> = ({ data, height = 400 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <FunnelChart>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          formatter={(value: number, name: string, props: any) => {
            const total = data[0].value;
            const percentage = ((value / total) * 100).toFixed(1);
            return [`${value.toLocaleString()} (${percentage}%)`, name];
          }}
        />
        <Funnel dataKey="value" data={data} isAnimationActive animationDuration={1000}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
          ))}
          <LabelList
            position="right"
            fill="#000"
            stroke="none"
            dataKey="name"
            fontSize={14}
            fontWeight="bold"
          />
          <LabelList
            position="inside"
            fill="#fff"
            stroke="none"
            dataKey="value"
            formatter={(value: number) => value.toLocaleString()}
            fontSize={12}
            fontWeight="bold"
          />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
};

// Export all components
export const RechartsLibrary = {
  TrendLineChart,
  GradientAreaChart,
  MultiBarChart,
  MultiTypeChart,
  MultiRadarChart,
  RadialProgressChart,
  CustomPieChart,
  CustomScatterPlot,
  TreemapChart,
  ConversionFunnelChart,
};
