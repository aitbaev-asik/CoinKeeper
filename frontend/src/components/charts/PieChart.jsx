import React, { useState } from 'react';
import { PieChart as RechartsComponent, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

const PieChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    
    return (
      <g>
        <text x={cx} y={cy - 15} dy={8} textAnchor="middle" fill="#fff" fontSize={16}>
          {payload.name}
        </text>
        <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#ddd" fontSize={14}>
          {value.toLocaleString('ru-RU')} ₸
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-800 p-3 rounded-lg shadow-lg border border-dark-600">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary-400 font-medium">{data.value.toLocaleString('ru-RU')} ₸</p>
          <p className="text-xs text-gray-400">
            {(data.percent * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
  
    return null;
  };
  
  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map(item => ({
    ...item,
    percent: item.value / total
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsComponent>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={dataWithPercentage}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          dataKey="value"
          onMouseEnter={onPieEnter}
        >
          {dataWithPercentage.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </RechartsComponent>
    </ResponsiveContainer>
  );
};

export default PieChart;