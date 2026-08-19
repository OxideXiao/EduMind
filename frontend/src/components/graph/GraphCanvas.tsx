import {
  useMemo,
  useRef,
  useCallback,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, EChartsType } from 'echarts';
import type { GraphData, GraphNode } from '../../api/graph';
import { MASTERY_COLOR, MASTERY_LABEL, RECOMMENDED_BORDER } from '../../utils/colorMap';

interface GraphCanvasProps {
  data: GraphData;
  viewRole: 'student' | 'teacher';
  mini?: boolean;
  onNodeClick?: (node: GraphNode) => void;
}

export interface GraphCanvasHandle {
  resetLayout: () => void;
}

/** 节点 tooltip 数据载体 */
interface EChartsNodeData {
  id: string;
  name: string;
  x?: number;
  y?: number;
  symbolSize: number;
  itemStyle: Record<string, unknown>;
  label: Record<string, unknown>;
  _masteryScore: number;
  _masteryLevel: string;
  _description: string;
  _isRecommended: boolean;
  _isWeakTop: boolean;
}

/**
 * 知识图谱画布 — 基于 ECharts graph 力导向图
 * 后端提供预设坐标，ECharts force 布局微调
 */
const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas(
  { data, viewRole, mini = false, onNodeClick },
  ref,
) {
  const chartRef = useRef<ReactECharts>(null);
  const [resetKey, setResetKey] = useState(0);

  // 对外开放 resetLayout：强制重新挂载以还原力导向初始布局
  useImperativeHandle(
    ref,
    () => ({
      resetLayout: () => {
        setResetKey((k) => k + 1);
      },
    }),
    [],
  );

  /** 判断鼠标是否在节点圆形区域内（不在标签上） */
  const isOnCircle = useCallback(
    (
      chart: EChartsType,
      dataIndex: number,
      event: MouseEvent,
      nodeData?: { symbolSize?: number },
    ) => {
      // 从 getItemLayout 获取当前布局位置（力导向后会变）
      const itemLayout: unknown = chart
        .getModel()
        .getSeriesByIndex(0)
        ?.getData?.()
        ?.getItemLayout?.(dataIndex);
      let cx: number, cy: number;
      if (Array.isArray(itemLayout)) {
        [cx, cy] = itemLayout as [number, number];
      } else if (itemLayout && typeof itemLayout === 'object') {
        const obj = itemLayout as Record<string, number>;
        cx = obj.x ?? obj.cx ?? 0;
        cy = obj.y ?? obj.cy ?? 0;
      } else {
        return true; // 兜底
      }
      const size = nodeData?.symbolSize || 48;
      const radius = size / 2;

      // 将数据坐标转为像素坐标
      const nodePixel = chart.convertToPixel({ seriesIndex: 0 }, [cx, cy]);
      const rect = chart.getDom().getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const dx = mouseX - (nodePixel?.[0] ?? cx);
      const dy = mouseY - (nodePixel?.[1] ?? cy);
      return Math.sqrt(dx * dx + dy * dy) <= radius + 4;
    },
    [],
  );

  const option: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: (params: { dataType?: string; data?: EChartsNodeData }) => {
          const d = params.data;
          if (!d || !d.name) return '';
          const levelLabel = MASTERY_LABEL[d._masteryLevel] || '未知';
          return [
            `<div style="font-weight:600;font-size:14px;margin-bottom:6px">${d.name}</div>`,
            `<div>掌握度：<b style="color:${MASTERY_COLOR[d._masteryLevel]}">${Math.round(d._masteryScore)}</b> 分 · ${levelLabel}</div>`,
          ].join('');
        },
        backgroundColor: '#fff',
        borderColor: '#e8e8e8',
        textStyle: { color: '#333', fontSize: 13 },
        extraCssText:
          'border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,0.08);padding:14px 18px;',
      },
      animation: true,
      animationDuration: 600,
      animationEasing: 'cubicOut',
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: 'scale', // 仅保留 ECharts 原生缩放，平移由外层容器统一接管避免双倍速度
          draggable: !mini,
          data: data.nodes.map(
            (n): EChartsNodeData => ({
              id: String(n.id),
              name: n.name,
              x: n.x,
              y: n.y,
              symbolSize: n.isRecommended ? 56 : 48,
              itemStyle: {
                color: MASTERY_COLOR[n.masteryLevel] || '#c5bfb6',
                borderColor: n.isRecommended
                  ? RECOMMENDED_BORDER
                  : viewRole === 'teacher' && n.isWeakTop
                    ? '#ef4444'
                    : 'transparent',
                borderWidth:
                  n.isRecommended || (viewRole === 'teacher' && n.isWeakTop) ? 3 : 0,
                borderType:
                  viewRole === 'teacher' && n.isWeakTop ? 'dashed' : 'solid',
                shadowBlur: n.isRecommended ? 14 : 0,
                shadowColor: 'rgba(79,109,140,0.35)',
              },
              label: {
                show: !mini,
                fontSize: 13,
                fontWeight: 500,
                color: '#1a1a2e',
                position: 'bottom',
                distance: 4,
              },
              _masteryScore: n.masteryScore,
              _masteryLevel: n.masteryLevel,
              _description: n.description || '',
              _isRecommended: n.isRecommended,
              _isWeakTop: n.isWeakTop,
            }),
          ),
          edges: data.edges.map((e) => ({
            source: String(e.from),
            target: String(e.to),
            lineStyle: {
              color: '#d5d5d5',
              curveness: 0.2,
              width: 1.5,
            },
            emphasis: {
              focus: 'none',
              lineStyle: {
                width: 3,
              },
            },
          })),
          emphasis: {
            focus: 'adjacency',
            blurScope: 'coordinateSystem',
            itemStyle: {
              shadowBlur: 24,
              shadowColor: 'rgba(0,0,0,0.15)',
            },
          },
          stateAnimation: {
            duration: 300,
            easing: 'cubicOut',
          },
          force: {
            repulsion: 600,
            edgeLength: [120, 280],
            gravity: 0.08,
            friction: 0.6,
          },
        } as EChartsOption['series'],
      ],
    } as EChartsOption;
  }, [data, viewRole, mini]);

  // 手动管理高亮：只在鼠标落在节点圆形上时才高亮关联节点
  const onEvents = useMemo(() => {
    const events: Record<string, (params: unknown) => void> = {};

    // 节点点击
    if (onNodeClick) {
      events.click = (params: unknown) => {
        const p = params as { dataType?: string; data?: { id?: string } };
        if (p.dataType === 'node' && p.data?.id) {
          const nodeId = Number(p.data.id);
          const node = data.nodes.find((n) => n.id === nodeId);
          if (node) onNodeClick(node);
        }
      };
    }

    // 手动高亮管理：ECharts emphasis.focus='adjacency' 自动处理
    // 邻接高亮 + 无关节点变暗，这里只需拦截标签区域避免误触发
    events.mouseover = (rawParams: unknown) => {
      const p = rawParams as {
        dataType?: string;
        dataIndex?: number;
        event?: { event?: MouseEvent };
        data?: { symbolSize?: number };
      };
      if (p.dataType !== 'node' || p.dataIndex === undefined) return;
      const chart = chartRef.current?.getEchartsInstance();
      if (!chart) return;

      const mouseEvent = p.event?.event;
      if (!mouseEvent) return;

      // 鼠标不在圆形上 → 取消高亮，也不标记为"在节点上"（避免影响画布拖拽）
      if (!isOnCircle(chart, p.dataIndex, mouseEvent, p.data)) {
        isOverNode.current = false;
        chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
        return;
      }
      // 鼠标在圆形上 → 标记，让 ECharts 内置 focus:'adjacency' 生效
      isOverNode.current = true;
    };

    // 鼠标离开节点 → 取消所有高亮 + 清除标记
    events.mouseout = () => {
      const chart = chartRef.current?.getEchartsInstance();
      if (!chart) return;
      isOverNode.current = false;
      chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
    };

    // 鼠标移出图表区域
    events.globalout = () => {
      const chart = chartRef.current?.getEchartsInstance();
      if (!chart) return;
      isOverNode.current = false;
      chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
    };

    return events;
  }, [data.nodes, data.edges, onNodeClick, isOnCircle]);

  // 自适应容器高度
  const onChartReady = useCallback(() => {
    chartRef.current?.getEchartsInstance()?.resize();
  }, []);

  // ── 全画布手动拖拽平移 ──
  // 使用 ECharts graphRoam action 平移整个视图（而非 zrender 内部 API），
  // 保证坐标系统始终同步，平移后节点点击/悬浮不会偏移。
  const containerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const isOverNode = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!mini) container.style.cursor = 'grab';

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || mini) return;
      if (isOverNode.current) return; // 节点上交给 ECharts draggable

      panRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      container.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!panRef.current.active) return;
      const dx = e.clientX - panRef.current.lastX;
      const dy = e.clientY - panRef.current.lastY;
      panRef.current.lastX = e.clientX;
      panRef.current.lastY = e.clientY;

      chartRef.current?.getEchartsInstance()?.dispatchAction({
        type: 'graphRoam',
        seriesIndex: 0,
        dx: dx * 1.0,
        dy: dy * 1.0,
      });
    };

    const onMouseUp = () => {
      panRef.current.active = false;
      if (!mini) container.style.cursor = 'grab';
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [mini, resetKey]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <ReactECharts
        key={resetKey}
        ref={chartRef}
        option={option}
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas' }}
        onEvents={onEvents}
        onChartReady={onChartReady}
      />
    </div>
  );
});

export default GraphCanvas;
