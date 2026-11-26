(function(root){
function mount(host,nodes,onCommit){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 320 260');svg.style.cssText='width:100%;background:#f4f4f0;touch-action:none;border-radius:6px';host.append(svg);
 const minX=Math.min(...nodes.map(n=>n.x)),minY=Math.min(...nodes.map(n=>n.y)),maxX=Math.max(...nodes.map(n=>n.x)),maxY=Math.max(...nodes.map(n=>n.y));const scale=Math.min(240/Math.max(1,maxX-minX),180/Math.max(1,maxY-minY));const X=x=>40+(x-minX)*scale,Y=y=>40+(y-minY)*scale;
 function el(tag,attrs){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);svg.append(e);return e}
 let active=null;
 function draw(){svg.replaceChildren();nodes.forEach((a,i)=>{const b=nodes[(i+1)%nodes.length],x=X(a.x),y=Y(a.y),u=X(b.x),v=Y(b.y),c=Math.hypot(u-x,v-y),h=Math.abs(a.rise||0)*scale,r=h?c*c/(8*h)+h/2:0;el('path',{d:h&&c?'M'+x+' '+y+' A'+r+' '+r+' 0 '+(h>c/2?1:0)+' '+(a.rise>0?1:0)+' '+u+' '+v:'M'+x+' '+y+' L'+u+' '+v,stroke:'#333','stroke-width':2,fill:'none'});const label=el('text',{x:(x+u)/2,y:(y+v)/2-8,fill:'#333','font-size':10,'text-anchor':'middle'});label.textContent=Math.round(h&&c?r/scale*4*Math.atan2(2*h,c):c/scale)}) ;nodes.forEach((n,i)=>{const e=el('circle',{cx:X(n.x),cy:Y(n.y),r:8,fill:'#3977b5',stroke:'#fff'});e.onpointerdown=ev=>{ev.preventDefault();active=i;svg.setPointerCapture(ev.pointerId)};const t=el('text',{x:X(n.x)+10,y:Y(n.y)-10,fill:'#333','font-size':10,'pointer-events':'none'});t.textContent='Т'+(i+1)})}
 svg.onpointermove=e=>{if(active===null)return;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());nodes[active].x=Math.round((q.x-40)/scale+minX);nodes[active].y=Math.round((q.y-40)/scale+minY);draw()};svg.onpointerup=svg.onpointercancel=()=>{if(active===null)return;active=null;onCommit?.()};draw();return svg;
}
root.OtContourEditor={mount};
})(globalThis);