import React, { useMemo } from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import iconPaths from './iconPaths.js';

/*
 * Icon — vẽ bộ icon outline của thiết kế bằng react-native-svg.
 * iconPaths lưu chuỗi SVG con (<path/>, <circle/>, <rect/>); phân tích 1 lần và cache theo tên.
 */
const cache = {};
const attr = (s, name) => {
  const m = new RegExp(`${name}="([^"]*)"`).exec(s);
  return m ? m[1] : undefined;
};

function parse(name) {
  if (cache[name]) return cache[name];
  const src = iconPaths[name] || '';
  const nodes = [];
  const re = /<(path|circle|rect)\s([^>]*?)\/>/g;
  let m;
  while ((m = re.exec(src))) {
    const [, tag, a] = m;
    const key = `${name}-${nodes.length}`;
    if (tag === 'path') nodes.push({ key, tag, d: attr(a, 'd'), fill: attr(a, 'fill') });
    else if (tag === 'circle') nodes.push({ key, tag, cx: +attr(a, 'cx'), cy: +attr(a, 'cy'), r: +attr(a, 'r') });
    else nodes.push({ key, tag, x: +attr(a, 'x'), y: +attr(a, 'y'), width: +attr(a, 'width'), height: +attr(a, 'height'), rx: attr(a, 'rx') ? +attr(a, 'rx') : 0, fill: attr(a, 'fill') });
  }
  cache[name] = nodes;
  return nodes;
}

export default function Icon({ name, size = 24, color = '#000', filled = false, strokeWidth = 1.75, style }) {
  const nodes = useMemo(() => parse(name), [name]);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {nodes.map((n) => {
        const common = {
          stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
          fill: n.fill === 'currentColor' ? color : filled ? color : 'none',
        };
        if (n.fill === 'currentColor') common.stroke = 'none';
        if (n.tag === 'path') return <Path key={n.key} d={n.d} {...common} />;
        if (n.tag === 'circle') return <Circle key={n.key} cx={n.cx} cy={n.cy} r={n.r} {...common} />;
        return <Rect key={n.key} x={n.x} y={n.y} width={n.width} height={n.height} rx={n.rx} {...common} />;
      })}
    </Svg>
  );
}
