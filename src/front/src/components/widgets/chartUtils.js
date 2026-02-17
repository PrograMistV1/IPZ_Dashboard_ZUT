import {useEffect, useRef, useState} from "react";

/**
 * Hook for measuring container dimensions with resize support
 */
export function useContainerDimensions(minWidth = 0, minHeight = 0) {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({width: minWidth, height: minHeight});

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                const {width, height} = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: Math.max(minWidth, width),
                    height: Math.max(minHeight, height),
                });
            }
        };

        // try an initial update in case element is already mounted
        update();

        // use ResizeObserver for more reliable size updates
        let ro;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => update());
            if (containerRef.current) ro.observe(containerRef.current);
        } else {
            window.addEventListener("resize", update);
        }

        return () => {
            if (ro) ro.disconnect();
            else window.removeEventListener("resize", update);
        };
    }, [minWidth, minHeight]);

    return {containerRef, dimensions};
}

/**
 * Chart grid component - renders background, axes and grid lines
 */
export function ChartGrid({
                              height,
                              padding,
                              yTicks,
                              xLabels,
                              chartWidth,
                              chartHeight
                          }) {
    const {left: paddingLeft, top: paddingTop, bottom: paddingBottom} = padding;

    return (
        <>
            {/* Background */}
            <rect
                x={paddingLeft}
                y={paddingTop}
                width={chartWidth}
                height={chartHeight}
                fill="#f8f9fa"
            />

            {/* Grid lines and Y-axis labels */}
            {yTicks.map((tick, i) => (
                <g key={`y-${i}`}>
                    <line
                        x1={paddingLeft}
                        y1={tick.y}
                        x2={paddingLeft + chartWidth}
                        y2={tick.y}
                        stroke="#e0e0e0"
                        strokeWidth="1"
                    />
                    <text
                        x={paddingLeft - 5}
                        y={tick.y}
                        textAnchor="end"
                        dominantBaseline="middle"
                        fontSize="10"
                        fill="#666"
                    >
                        {tick.label}
                    </text>
                </g>
            ))}

            {/* X-axis labels */}
            {xLabels.map((label, i) => (
                <g key={`x-${i}`}>
                    <line
                        x1={label.x}
                        y1={paddingTop}
                        x2={label.x}
                        y2={paddingTop + chartHeight}
                        stroke="#eee"
                        strokeWidth="1"
                    />
                    <text
                        x={label.x}
                        y={height - paddingBottom + 15}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#666"
                    >
                        {label.label}
                    </text>
                </g>
            ))}

            {/* Border */}
            <rect
                x={paddingLeft}
                y={paddingTop}
                width={chartWidth}
                height={chartHeight}
                fill="none"
                stroke="#ddd"
                strokeWidth="1"
            />
        </>
    );
}

/**
 * Generate Y-axis ticks
 */
export function generateYTicks(yMin, yRange, scaleY, tickCount = 4) {
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
        const value = yMin + (yRange * i) / tickCount;
        ticks.push({
            y: scaleY(value),
            label: value.toFixed(4),
        });
    }
    return ticks;
}

/**
 * Generate X-axis labels
 */
export function generateXLabels(data, chartWidth, scaleX, dateKey = "date") {
    const labels = [];
    if (!data || data.length === 0) return labels;

    const maxLabels = Math.max(1, Math.floor(chartWidth / 60));
    const labelStep = Math.max(1, Math.ceil(data.length / maxLabels));

    for (let i = 0; i < data.length; i += labelStep) {
        const raw = data[i] && data[i][dateKey] ? String(data[i][dateKey]) : '';
        labels.push({
            x: scaleX(i),
            label: raw.length >= 5 ? raw.slice(5) : raw,
        });
    }
    return labels;
}
