import React from 'react';
import { BarChart as RechartsComponent, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BarChart = ({ data, color = '#00d7d0' }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 p-3 rounded-lg shadow-lg border border-dark-600">
          <p className="font-medium">{label}</p>
          <p className="text-primary-400 font-medium">
            {payload[0].value.toLocaleString('ru-RU')} ₸
          </p>
        </div>
      );
    }
  
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsComponent
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis 
          dataKey="name" 
          stroke="#aaa"
          tick={{ fill: '#aaa' }}
        />
        <YAxis 
          stroke="#aaa"
          tick={{ fill: '#aaa' }}
          tickFormatter={(value) => {
            if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}k`;
            }
            return value;
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </RechartsComponent>
    </ResponsiveContainer>
  );
};

export default BarChart;