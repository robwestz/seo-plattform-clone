'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// Line Chart Component
interface LineChartProps {
  data: Array<{ date: Date; value: number; label?: string }>;
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  color?: string;
  showArea?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

export const D3LineChart: React.FC<LineChartProps> = ({
  data,
  width = 800,
  height = 400,
  margin = { top: 20, right: 30, bottom: 30, left: 50 },
  color = '#3b82f6',
  showArea = false,
  showGrid = true,
  animate = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) as number])
      .nice()
      .range([innerHeight, 0]);

    // Grid
    if (showGrid) {
      g.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(
          d3
            .axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickFormat(() => '')
        );
    }

    // Area
    if (showArea) {
      const area = d3
        .area<{ date: Date; value: number }>()
        .x((d) => xScale(d.date))
        .y0(innerHeight)
        .y1((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      const areaPath = g
        .append('path')
        .datum(data)
        .attr('fill', color)
        .attr('fill-opacity', 0.1)
        .attr('d', area);

      if (animate) {
        const totalLength = areaPath.node()?.getTotalLength() || 0;
        areaPath
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(1500)
          .attr('stroke-dashoffset', 0);
      }
    }

    // Line
    const line = d3
      .line<{ date: Date; value: number }>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const path = g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

    if (animate) {
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1500)
        .attr('stroke-dashoffset', 0);
    }

    // Dots
    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(d.value))
      .attr('r', 0)
      .attr('fill', color)
      .transition()
      .delay((_, i) => i * 50)
      .duration(500)
      .attr('r', 4);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .selectAll('text')
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll('text')
      .style('font-size', '12px');

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    g.selectAll('circle')
      .on('mouseover', function (event, d: any) {
        d3.select(this).transition().duration(200).attr('r', 6);
        tooltip
          .style('visibility', 'visible')
          .html(
            `<div><strong>${d3.timeFormat('%b %d, %Y')(d.date)}</strong></div><div>${d.value.toLocaleString()}</div>`
          );
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', `${event.pageY - 10}px`)
          .style('left', `${event.pageX + 10}px`);
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('r', 4);
        tooltip.style('visibility', 'hidden');
      });

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, margin, color, showArea, showGrid, animate]);

  return <svg ref={svgRef} width={width} height={height} />;
};

// Bar Chart Component
interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  defaultColor?: string;
  horizontal?: boolean;
  animate?: boolean;
}

export const D3BarChart: React.FC<BarChartProps> = ({
  data,
  width = 800,
  height = 400,
  margin = { top: 20, right: 30, bottom: 60, left: 50 },
  defaultColor = '#3b82f6',
  horizontal = false,
  animate = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (horizontal) {
      // Horizontal bar chart
      const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) as number])
        .nice()
        .range([0, innerWidth]);

      const yScale = d3
        .scaleBand()
        .domain(data.map((d) => d.label))
        .range([0, innerHeight])
        .padding(0.2);

      // Bars
      const bars = g
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('y', (d) => yScale(d.label)!)
        .attr('height', yScale.bandwidth())
        .attr('fill', (d) => d.color || defaultColor)
        .attr('rx', 4);

      if (animate) {
        bars
          .attr('x', 0)
          .attr('width', 0)
          .transition()
          .duration(1000)
          .delay((_, i) => i * 50)
          .attr('width', (d) => xScale(d.value));
      } else {
        bars.attr('x', 0).attr('width', (d) => xScale(d.value));
      }

      // Value labels
      g.selectAll('text.value')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'value')
        .attr('x', (d) => xScale(d.value) + 5)
        .attr('y', (d) => yScale(d.label)! + yScale.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('fill', '#666')
        .attr('font-size', '12px')
        .text((d) => d.value.toLocaleString());

      // Axes
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(6));

      g.append('g').call(d3.axisLeft(yScale));
    } else {
      // Vertical bar chart
      const xScale = d3
        .scaleBand()
        .domain(data.map((d) => d.label))
        .range([0, innerWidth])
        .padding(0.2);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) as number])
        .nice()
        .range([innerHeight, 0]);

      // Bars
      const bars = g
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', (d) => xScale(d.label)!)
        .attr('width', xScale.bandwidth())
        .attr('fill', (d) => d.color || defaultColor)
        .attr('rx', 4);

      if (animate) {
        bars
          .attr('y', innerHeight)
          .attr('height', 0)
          .transition()
          .duration(1000)
          .delay((_, i) => i * 50)
          .attr('y', (d) => yScale(d.value))
          .attr('height', (d) => innerHeight - yScale(d.value));
      } else {
        bars
          .attr('y', (d) => yScale(d.value))
          .attr('height', (d) => innerHeight - yScale(d.value));
      }

      // Value labels
      g.selectAll('text.value')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'value')
        .attr('x', (d) => xScale(d.label)! + xScale.bandwidth() / 2)
        .attr('y', (d) => yScale(d.value) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .attr('font-size', '12px')
        .text((d) => d.value.toLocaleString());

      // Axes
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

      g.append('g').call(d3.axisLeft(yScale).ticks(6));
    }
  }, [data, width, height, margin, defaultColor, horizontal, animate]);

  return <svg ref={svgRef} width={width} height={height} />;
};

// Scatter Plot Component
interface ScatterPlotProps {
  data: Array<{ x: number; y: number; label?: string; size?: number; color?: string }>;
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  xLabel?: string;
  yLabel?: string;
  defaultColor?: string;
  animate?: boolean;
}

export const D3ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  width = 800,
  height = 600,
  margin = { top: 20, right: 30, bottom: 50, left: 60 },
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  defaultColor = '#3b82f6',
  animate = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.x) as number])
      .nice()
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.y) as number])
      .nice()
      .range([innerHeight, 0]);

    const sizeScale = d3
      .scaleSqrt()
      .domain([0, d3.max(data, (d) => d.size || 1) as number])
      .range([4, 20]);

    // Grid
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
      );

    // Circles
    const circles = g
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.x))
      .attr('cy', (d) => yScale(d.y))
      .attr('fill', (d) => d.color || defaultColor)
      .attr('fill-opacity', 0.6)
      .attr('stroke', (d) => d.color || defaultColor)
      .attr('stroke-width', 2);

    if (animate) {
      circles
        .attr('r', 0)
        .transition()
        .duration(800)
        .delay((_, i) => i * 30)
        .attr('r', (d) => sizeScale(d.size || 1));
    } else {
      circles.attr('r', (d) => sizeScale(d.size || 1));
    }

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    circles
      .on('mouseover', function (event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 1)
          .attr('r', sizeScale(d.size || 1) * 1.2);

        tooltip.style('visibility', 'visible').html(
          `<div>${d.label || 'Point'}</div>
           <div><strong>X:</strong> ${d.x.toLocaleString()}</div>
           <div><strong>Y:</strong> ${d.y.toLocaleString()}</div>
           ${d.size ? `<div><strong>Size:</strong> ${d.size.toLocaleString()}</div>` : ''}`
        );
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', `${event.pageY - 10}px`)
          .style('left', `${event.pageX + 10}px`);
      })
      .on('mouseout', function (_, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.6)
          .attr('r', sizeScale(d.size || 1));

        tooltip.style('visibility', 'hidden');
      });

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(8));

    g.append('g').call(d3.axisLeft(yScale).ticks(8));

    // Labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .style('font-size', '14px')
      .text(xLabel);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .style('font-size', '14px')
      .text(yLabel);

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, margin, xLabel, yLabel, defaultColor, animate]);

  return <svg ref={svgRef} width={width} height={height} />;
};

// Heatmap Component
interface HeatmapProps {
  data: Array<{ row: string; col: string; value: number }>;
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colorScheme?: string[];
  animate?: boolean;
}

export const D3Heatmap: React.FC<HeatmapProps> = ({
  data,
  width = 800,
  height = 600,
  margin = { top: 20, right: 30, bottom: 60, left: 100 },
  colorScheme = ['#f0f9ff', '#0ea5e9', '#0c4a6e'],
  animate = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get unique rows and columns
    const rows = Array.from(new Set(data.map((d) => d.row)));
    const cols = Array.from(new Set(data.map((d) => d.col)));

    // Scales
    const xScale = d3.scaleBand().domain(cols).range([0, innerWidth]).padding(0.05);

    const yScale = d3.scaleBand().domain(rows).range([0, innerHeight]).padding(0.05);

    const colorScale = d3
      .scaleSequential()
      .domain([0, d3.max(data, (d) => d.value) as number])
      .interpolator(d3.interpolateRgbBasis(colorScheme));

    // Cells
    const cells = g
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.col)!)
      .attr('y', (d) => yScale(d.row)!)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => colorScale(d.value))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('rx', 4);

    if (animate) {
      cells.attr('opacity', 0).transition().duration(800).delay((_, i) => i * 10).attr('opacity', 1);
    }

    // Value labels
    g.selectAll('text.cell-value')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'cell-value')
      .attr('x', (d) => xScale(d.col)! + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.row)! + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', (d) => (d.value > (d3.max(data, (d) => d.value) as number) / 2 ? 'white' : 'black'))
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text((d) => d.value.toLocaleString());

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    g.append('g').call(d3.axisLeft(yScale));

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    cells
      .on('mouseover', function (event, d: any) {
        d3.select(this).transition().duration(200).attr('opacity', 0.8);

        tooltip.style('visibility', 'visible').html(
          `<div><strong>${d.row} × ${d.col}</strong></div>
           <div>Value: ${d.value.toLocaleString()}</div>`
        );
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', `${event.pageY - 10}px`)
          .style('left', `${event.pageX + 10}px`);
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('opacity', 1);
        tooltip.style('visibility', 'hidden');
      });

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, margin, colorScheme, animate]);

  return <svg ref={svgRef} width={width} height={height} />;
};

// Donut Chart Component
interface DonutChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  animate?: boolean;
}

export const D3DonutChart: React.FC<DonutChartProps> = ({
  data,
  width = 400,
  height = 400,
  innerRadius,
  outerRadius,
  animate = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const calculatedOuterRadius = outerRadius || Math.min(width, height) / 2 - 40;
  const calculatedInnerRadius = innerRadius || calculatedOuterRadius * 0.6;

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3
      .pie<any>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<any>()
      .innerRadius(calculatedInnerRadius)
      .outerRadius(calculatedOuterRadius);

    const arcHover = d3
      .arc<any>()
      .innerRadius(calculatedInnerRadius)
      .outerRadius(calculatedOuterRadius + 10);

    const arcs = g
      .selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('fill', (d, i) => d.data.color || colorScale(i.toString()))
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    if (animate) {
      arcs
        .attr('d', d3.arc().innerRadius(calculatedInnerRadius).outerRadius(calculatedInnerRadius))
        .transition()
        .duration(1000)
        .delay((_, i) => i * 100)
        .attrTween('d', function (d: any) {
          const interpolate = d3.interpolate(
            { startAngle: 0, endAngle: 0 },
            { startAngle: d.startAngle, endAngle: d.endAngle }
          );
          return (t: number) => arc({ ...d, ...interpolate(t)});
        });
    } else {
      arcs.attr('d', arc);
    }

    // Labels
    const labels = g
      .selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');

    labels
      .append('tspan')
      .attr('x', 0)
      .attr('dy', '-0.2em')
      .text((d: any) => d.data.label);

    labels
      .append('tspan')
      .attr('x', 0)
      .attr('dy', '1.2em')
      .text((d: any) => `${((d.data.value / d3.sum(data, (d) => d.value)) * 100).toFixed(1)}%`);

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    arcs
      .on('mouseover', function (event, d: any) {
        d3.select(this).transition().duration(200).attr('d', arcHover);

        tooltip.style('visibility', 'visible').html(
          `<div><strong>${d.data.label}</strong></div>
           <div>Value: ${d.data.value.toLocaleString()}</div>
           <div>Percentage: ${((d.data.value / d3.sum(data, (d) => d.value)) * 100).toFixed(1)}%</div>`
        );
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', `${event.pageY - 10}px`)
          .style('left', `${event.pageX + 10}px`);
      })
      .on('mouseout', function (_, d: any) {
        d3.select(this).transition().duration(200).attr('d', arc);
        tooltip.style('visibility', 'hidden');
      });

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, calculatedInnerRadius, calculatedOuterRadius, animate]);

  return <svg ref={svgRef} width={width} height={height} />;
};
