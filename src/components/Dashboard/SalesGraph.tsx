import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface SalesGraphProps {
    data: number[];
    color?: string;
    onClick?: () => void;
}

export const SalesGraph: React.FC<SalesGraphProps> = ({ data, color = '#10B981', onClick }) => {
    // Transform simple array to object array for Recharts
    const chartData = data.map((val, index) => ({ index, value: val }));

    return (
        <div
            className="h-12 w-24 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
        >
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#gradient-${color})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
