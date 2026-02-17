import React, {useEffect, useRef, useState} from "react";
import GridLayout from "react-grid-layout";
import {serverTypeMap} from "../widgets/registry";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../../styles/widgetGrid.css";

const GRID_COLS = 12;
const ROW_HEIGHT = 80;
const GRID_MARGIN = [16, 16];

export default function WidgetGrid({
                                       widgets,
                                       onLayoutChange,
                                       onWidgetUpdate,
                                       onWidgetDelete,
                                   }) {
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(1200);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const layout = widgets.map((widget) => ({
        i: String(widget.id),
        x: widget.layout?.x ?? 0,
        y: widget.layout?.y ?? 0,
        w: widget.layout?.w ?? 4,
        h: widget.layout?.h ?? 4,
        minW: 1,
        minH: 1,
    }));

    const handleLayoutChange = (newLayout) => {
        const layoutMap = {};
        newLayout.forEach((item) => {
            layoutMap[item.i] = {
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
            };
        });
        onLayoutChange?.(layoutMap);
    };

    return (
        <div className="widget-grid-container" ref={containerRef}>
            <GridLayout
                className="widget-grid"
                layout={layout}
                cols={GRID_COLS}
                rowHeight={ROW_HEIGHT}
                width={containerWidth}
                margin={GRID_MARGIN}
                onLayoutChange={handleLayoutChange}
                draggableHandle=".currency-header, .news-header"
                isResizable={true}
                isDraggable={true}
                compactType={null}
                preventCollision={false}
            >
                {widgets.map((widget) => {
                    const WidgetComponent = serverTypeMap[widget.type];
                    if (!WidgetComponent) return null;

                    const mode = widget.configuration?.mode || widget.configuration?.defaultMode || 'feed';

                    return (
                        <div key={String(widget.id)} className="widget-grid-item">
                            <WidgetComponent
                                id={widget.id}
                                mode={mode}
                                data={widget.configuration}
                                onUpdate={onWidgetUpdate}
                                onDelete={() => onWidgetDelete?.(widget.id)}
                            />
                        </div>
                    );
                })}
            </GridLayout>
        </div>
    );
}
