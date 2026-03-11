'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Settings2, MessageSquare, Terminal, Play, 
  Cpu, AlignLeft, Plus, GripHorizontal, 
  ZoomIn, ZoomOut, Maximize, AlertCircle,
  Link, Wifi, Globe, BrainCircuit, ChevronDown, ChevronUp,
  Zap, Database, Activity, X, Box, Layers, Copy, RefreshCcw,
  Sliders, Settings, FileText, Share2, FileUp, Image as ImageIcon
} from 'lucide-react';

// --- UI 设计系统 ---

const THEMES = {
  whiteWidget: "bg-white/90 backdrop-blur-xl text-zinc-800 border border-zinc-200/60 shadow-xl rounded-[24px]",
  glassLight: "bg-white/70 backdrop-blur-2xl text-zinc-800 border border-zinc-200/50 shadow-xl rounded-[24px]",
  creamSoft: "bg-[#faf9f6]/90 backdrop-blur-xl text-[#2c2c2c] border border-[#eaddc9]/60 shadow-xl rounded-[24px]",
  accentLight: "bg-indigo-50/80 backdrop-blur-xl text-zinc-900 border border-indigo-100/60 shadow-xl rounded-[24px]",
  toolDark: "bg-zinc-900/90 backdrop-blur-xl text-zinc-100 border border-zinc-800/60 shadow-2xl rounded-[24px]",
  emeraldWidget: "bg-emerald-50/80 backdrop-blur-xl text-zinc-900 border border-emerald-100/60 shadow-xl rounded-[24px]"
};

const NODE_TYPES = {
  raw_text: { 
    title: '文本輸入 (Data)', 
    theme: THEMES.whiteWidget,
    headerColor: 'text-blue-500',
    inputs: [], 
    outputs: [{ id: 'text', label: '文本輸出', type: 'text' }], 
    width: 300 
  },
  file_input: {
    title: '文件/圖片導入',
    theme: THEMES.whiteWidget,
    headerColor: 'text-amber-500',
    inputs: [],
    outputs: [{ id: 'output', label: '數據輸出', type: 'text' }],
    width: 320
  },
  ai_worker: {
    title: 'AI 工作節點 (Worker)',
    theme: THEMES.accentLight,
    headerColor: 'text-indigo-600',
    inputs: [
      { id: 'config', label: 'API 配置', accept: 'config' },
      { id: 'input', label: '上游輸入', accept: 'text' }
    ],
    outputs: [{ id: 'result', label: '輸出結果', type: 'text' }],
    width: 340
  },
  api_config: { 
    title: 'LM Studio 配置', 
    theme: THEMES.whiteWidget,
    headerColor: 'text-zinc-500',
    inputs: [], 
    outputs: [{ id: 'config', label: 'API 配置', type: 'config' }], 
    width: 280 
  },
  system_prompt: { 
    title: '系統角色 (System)', 
    theme: THEMES.glassLight,
    headerColor: 'text-orange-500',
    inputs: [{ id: 'dynamic_text', label: '上下文注入', accept: 'text' }], 
    outputs: [{ id: 'sys_text', label: '系統訊息', type: 'text' }], 
    width: 300 
  },
  user_prompt: { 
    title: '用戶指令 (User)', 
    theme: THEMES.creamSoft,
    headerColor: 'text-emerald-700',
    inputs: [{ id: 'dynamic_text', label: '上下文注入', accept: 'text' }], 
    outputs: [{ id: 'user_text', label: '用戶訊息', type: 'text' }], 
    width: 300 
  },
  text_combiner: {
    title: '文本合併器',
    theme: THEMES.whiteWidget,
    headerColor: 'text-blue-500',
    inputs: [
        { id: 'part_a', label: '前半段', accept: 'text' },
        { id: 'part_b', label: '後半段', accept: 'text' }
    ],
    outputs: [{ id: 'combined', label: '合併文本', type: 'text' }],
    width: 260
  },
  llm_processor: { 
    title: 'LLM 核心處理', 
    theme: THEMES.accentLight,
    headerColor: 'text-indigo-600',
    inputs: [
      { id: 'config', label: '配置', accept: 'config' },
      { id: 'sys_text', label: '系統', accept: 'text' },
      { id: 'user_text', label: '用戶', accept: 'text' }
    ], 
    outputs: [{ id: 'result', label: '生成結果', type: 'text' }], 
    width: 320 
  },
  output_display: { 
    title: '輸出結果展示', 
    theme: THEMES.whiteWidget,
    headerColor: 'text-zinc-600',
    inputs: [{ id: 'result', label: '結果輸入', accept: 'text' }], 
    outputs: [{ id: 'text_out', label: '文本輸出', type: 'text' }], 
    width: 420 
  },
  web_search: {
    title: '網路搜尋 (SearXNG)',
    theme: THEMES.emeraldWidget,
    headerColor: 'text-emerald-600',
    inputs: [{ id: 'query', label: '搜尋關鍵字', accept: 'text' }],
    outputs: [{ id: 'result', label: '搜尋結果', type: 'text' }],
    width: 320
  }
};

const INITIAL_NODES = [
  // Text Pipeline
  { id: 'node-input-1', type: 'raw_text', position: { x: -850, y: -100 }, data: { text: '蘋果、香蕉、高麗菜、牛肉、豬肉、菠菜' } },
  { id: 'node-worker-1', type: 'ai_worker', position: { x: -450, y: -100 }, data: { prompt: '你是一個分類助手。請將用戶輸入的食材進行分類（水果、蔬菜、肉類），並以列表形式輸出。', status: 'idle', provider: 'gemini', model: 'gemini-3.1-flash-preview', temperature: 0.7, showConfig: false } },
  { id: 'node-out-1', type: 'output_display', position: { x: -50, y: -100 }, data: { text: '等待邏輯運行...' } },
  
  // Vision / File Pipeline
  { id: 'node-file-1', type: 'file_input', position: { x: -850, y: 300 }, data: { content: '', fileName: '', fileType: '', status: 'idle' } },
  { id: 'node-worker-vision', type: 'ai_worker', position: { x: -450, y: 300 }, data: { prompt: '請仔細觀察這張圖片，提取其中的所有文字內容，並描述圖片中的主要場景與細節。如果是純文本文件，請總結其核心重點。', status: 'idle', provider: 'gemini', model: 'gemini-3.1-flash-preview', temperature: 0.3, showConfig: false } },
  { id: 'node-out-vision', type: 'output_display', position: { x: -50, y: 300 }, data: { text: '等待上傳文件並運行...' } }
];

const INITIAL_EDGES = [
  { id: 'e3', sourceNode: 'node-input-1', sourcePort: 'text', targetNode: 'node-worker-1', targetPort: 'input' },
  { id: 'e4', sourceNode: 'node-worker-1', sourcePort: 'result', targetNode: 'node-out-1', targetPort: 'result' },
  { id: 'e_file', sourceNode: 'node-file-1', sourcePort: 'output', targetNode: 'node-worker-vision', targetPort: 'input' },
  { id: 'e_vision_out', sourceNode: 'node-worker-vision', sourcePort: 'result', targetNode: 'node-out-vision', targetPort: 'result' }
];

const HEADER_HEIGHT = 56;
const PORT_SPACING = 36;

// 计算端口在画布上的绝对坐标（用于连线）
const getPortPos = (node: any, schema: any, portId: string, isInput: boolean) => {
  const x = isInput ? node.position.x : node.position.x + schema.width;
  const portIndex = isInput 
    ? schema.inputs.findIndex((p: any) => p.id === portId)
    : schema.outputs.findIndex((p: any) => p.id === portId);
  
  const y = node.position.y + HEADER_HEIGHT + 28 + (portIndex * PORT_SPACING);
  return { x, y };
};

const calculateBezier = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
  const dx = Math.abs(p2.x - p1.x);
  const cx = Math.max(dx * 0.4, 50);
  return `M ${p1.x} ${p1.y} C ${p1.x + cx} ${p1.y}, ${p2.x - cx} ${p2.y}, ${p2.x} ${p2.y}`;
};

// --- Markdown 渲染组件 ---
const MessageRenderer = ({ text }: { text: string }) => {
  const [showThink, setShowThink] = useState(true);
  if (!text) return null;

  const thinkMatch = typeof text === 'string' ? text.match(/<think>([\s\S]*?)<\/think>/) : null;
  const thinkContent = thinkMatch ? thinkMatch[1].trim() : null;
  const mainContent = typeof text === 'string' ? text.replace(/<think>[\s\S]*?<\/think>/, '').trim() : String(text);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {thinkContent && (
        <div className="rounded-2xl bg-zinc-50 border border-zinc-200 overflow-hidden shadow-sm">
          <button 
            onClick={() => setShowThink(!showThink)}
            className="w-full px-4 py-2 flex items-center justify-between text-[10px] text-zinc-400 hover:text-indigo-600 bg-zinc-100/50 uppercase tracking-widest transition-all"
          >
            <div className="flex items-center gap-2 font-bold"><BrainCircuit className="w-3.5 h-3.5" />模型思考深度</div>
            {showThink ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showThink && (
            <div className="px-5 py-4 text-xs text-zinc-400 italic font-serif leading-relaxed border-t border-zinc-100 bg-white/50">
              {thinkContent}
            </div>
          )}
        </div>
      )}
      <div className="text-zinc-800 text-sm whitespace-pre-wrap selection:bg-indigo-100 markdown-body">
        <Markdown 
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({node, ...props}) => (
              <div className="my-4 overflow-hidden rounded-xl border border-indigo-100 shadow-sm bg-white">
                <table className="w-full text-left border-collapse text-sm" {...props} />
              </div>
            ),
            thead: ({node, ...props}) => <thead className="bg-indigo-50/50 border-b border-indigo-100" {...props} />,
            th: ({node, ...props}) => <th className="px-4 py-3 font-semibold text-indigo-900" {...props} />,
            td: ({node, ...props}) => <td className="px-4 py-3 border-t border-zinc-100 text-zinc-600" {...props} />,
            h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4 text-zinc-900 border-b pb-2" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3 text-zinc-800" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2 text-zinc-700" {...props} />,
            ul: ({node, ...props}) => <ul className="ml-4 list-disc text-zinc-700 my-2 space-y-1" {...props} />,
            ol: ({node, ...props}) => <ol className="ml-4 list-decimal text-zinc-700 my-2 space-y-1" {...props} />,
            p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
            code: ({node, className, children, ...props}: any) => {
              const match = /language-(\w+)/.exec(className || '')
              return !match ? (
                <code className="bg-zinc-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-xs font-mono" {...props}>
                  {children}
                </code>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
          }}
        >
          {mainContent}
        </Markdown>
      </div>
    </div>
  );
};

// --- 节点组件 ---
const Node = memo(({ node, schema, isActive, isEditing, onDragStart, onRemove, onEdit, onDuplicate, onPortDown, onPortUp, drawingEdge, children }: any) => {
  return (
    <div 
      className={`absolute pointer-events-auto transition-all duration-200 ease-out ${schema.theme} 
        ${isActive ? 'z-50 scale-[1.02] ring-2 ring-indigo-500 shadow-2xl' : 'z-30 shadow-lg hover:shadow-xl'}
        ${isEditing ? 'ring-2 ring-indigo-400' : ''}`}
      style={{ width: schema.width, left: node.position.x, top: node.position.y }}
    >
      <div 
        className="h-[56px] px-5 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-zinc-200/50 group bg-white/40 rounded-t-[24px]"
        onPointerDown={onDragStart}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${node.data.status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : node.data.status === 'error' ? 'bg-red-500' : 'bg-zinc-300'}`} />
          <span className={`text-[11px] font-black uppercase tracking-widest ${schema.headerColor}`}>
            {node.data.customTitle || schema.title}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onDuplicate} className="p-1.5 text-zinc-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors" title="複製節點"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={onEdit} className="p-1.5 text-zinc-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="設定"><Settings className="w-3.5 h-3.5" /></button>
          <button onClick={onRemove} className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="刪除"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="p-5 relative space-y-4">
        {/* 输入端口 */}
        <div className="absolute left-0 top-[28px] -translate-x-1/2 flex flex-col gap-[22px]">
          {schema.inputs.map((port: any) => (
            <div 
              key={port.id}
              className={`w-3.5 h-3.5 rounded-full border-2 bg-white transition-all hover:scale-125 cursor-pointer shadow-sm ${
                drawingEdge && drawingEdge.type === port.accept ? 'border-indigo-600 animate-pulse scale-110' : 'border-zinc-300'
              }`}
              onPointerUp={(e) => onPortUp(e, port.id, true, port.accept)}
              title={port.label}
            />
          ))}
        </div>
        {/* 输出端口 */}
        <div className="absolute right-0 top-[28px] translate-x-1/2 flex flex-col gap-[22px]">
          {schema.outputs.map((port: any) => (
            <div 
              key={port.id}
              className="w-3.5 h-3.5 rounded-full border-2 border-white bg-indigo-500 shadow-md transition-all hover:scale-125 hover:bg-indigo-600 cursor-crosshair"
              onPointerDown={(e) => onPortDown(e, port.id, false, port.type)}
              title={port.label}
            />
          ))}
        </div>

        {/* 节点内容 */}
        <div className="text-xs">
          {children}
        </div>
      </div>
    </div>
  );
});

Node.displayName = 'Node';

// --- 主应用 ---
export default function App() {
  const [nodes, setNodes] = useState<any[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<any[]>(INITIAL_EDGES);
  const [transform, setTransform] = useState({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 500, scale: 0.8 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [drawingEdge, setDrawingEdge] = useState<any>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // --- 辅助函数：根据端口获取上游节点值 ---
  const getInputValue = useCallback((nodeId: string, portId: string, nodesMap: Map<string, any>) => {
    const edge = edges.find(e => e.targetNode === nodeId && e.targetPort === portId);
    if (!edge) return null;
    const sourceNode = nodesMap.get(edge.sourceNode);
    if (!sourceNode) return null;

    if (sourceNode.type === 'api_config') return sourceNode.data;
    if (sourceNode.type === 'raw_text') return sourceNode.data.text;
    if (sourceNode.type === 'file_input') return sourceNode.data.content;
    if (sourceNode.type === 'system_prompt' || sourceNode.type === 'user_prompt') {
      return sourceNode.data.compiledText || sourceNode.data.text;
    }
    if (sourceNode.type === 'text_combiner') return sourceNode.data.combined;
    if (sourceNode.type === 'llm_processor') return sourceNode.data.lastResult;
    if (sourceNode.type === 'ai_worker') return sourceNode.data.lastResult;
    if (sourceNode.type === 'output_display') return sourceNode.data.text;
    return null;
  }, [edges]);

  // --- 拓扑排序 ---
  const topologicalSort = useCallback((nodesList: any[], edgesList: any[]) => {
    const graph = new Map();
    const inDegree = new Map();
    nodesList.forEach(n => {
      graph.set(n.id, []);
      inDegree.set(n.id, 0);
    });
    edgesList.forEach(edge => {
      const from = edge.sourceNode;
      const to = edge.targetNode;
      if (graph.has(from) && graph.has(to)) {
        graph.get(from).push(to);
        inDegree.set(to, inDegree.get(to) + 1);
      }
    });
    const queue: string[] = [];
    inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });
    const sorted: string[] = [];
    while (queue.length) {
      const id = queue.shift()!;
      sorted.push(id);
      graph.get(id).forEach((neighbor: string) => {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) queue.push(neighbor);
      });
    }
    return sorted;
  }, []);

  // --- 运行工作流 ---
  const runFlow = async () => {
    const nodesMap = new Map(nodes.map(n => [n.id, { ...n }]));
    const order = topologicalSort(Array.from(nodesMap.values()), edges);

    for (const nodeId of order) {
      const node = nodesMap.get(nodeId);
      if (!node) continue;

      if (node.type === 'raw_text' || node.type === 'file_input') {
        // Data is already in node.data.text or node.data.content
      }
      else if (node.type === 'system_prompt' || node.type === 'user_prompt') {
        const injected = getInputValue(nodeId, 'dynamic_text', nodesMap);
        const baseText = node.data.text || '';
        if (injected) {
          if (baseText.includes('{{input}}')) {
            node.data.compiledText = baseText.replace(/\{\{input\}\}/g, injected);
          } else {
            node.data.compiledText = baseText ? `${baseText}\n\n${injected}` : injected;
          }
        } else {
          node.data.compiledText = baseText;
        }
      }
      else if (node.type === 'text_combiner') {
        const partA = getInputValue(nodeId, 'part_a', nodesMap) || '';
        const partB = getInputValue(nodeId, 'part_b', nodesMap) || '';
        node.data.combined = `${partA}\n\n${partB}`.trim();
      }
      else if (node.type === 'llm_processor') {
        node.data.status = 'running';
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n));

        const externalConfig = getInputValue(nodeId, 'config', nodesMap);
        const internalConfig = { endpoint: node.data.endpoint || 'http://localhost:1234', model: node.data.model || 'loaded-model', temperature: node.data.temperature || 0.7 };
        const config = externalConfig || internalConfig;
        
        const sys = getInputValue(nodeId, 'sys_text', nodesMap) || '';
        const user = getInputValue(nodeId, 'user_text', nodesMap) || '';

        try {
          const url = (config.endpoint || 'http://localhost:1234').replace(/\/$/, '') + '/v1/chat/completions';
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: config.model || 'loaded-model',
              messages: [
                ...(sys ? [{ role: 'system', content: sys }] : []),
                { role: 'user', content: user || "請打個招呼" }
              ],
              temperature: config.temperature || 0.7
            })
          });
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || "無響應";
          node.data.lastResult = content;
          node.data.status = 'success';
        } catch (err: any) {
          node.data.status = 'error';
          node.data.lastResult = `錯誤: ${err.message}`;
        }
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...node.data } } : n));
      }
      else if (node.type === 'ai_worker') {
        node.data.status = 'running';
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n));

        const externalConfig = getInputValue(nodeId, 'config', nodesMap);
        const internalConfig = { provider: node.data.provider || 'gemini', endpoint: node.data.endpoint || 'http://localhost:1234', model: node.data.model || 'gemini-3.1-flash-preview', temperature: node.data.temperature || 0.7 };
        const config = externalConfig || internalConfig;
        
        const injected = getInputValue(nodeId, 'input', nodesMap) || '';
        const promptTemplate = node.data.prompt || '';
        
        try {
          let resultText = '';
          const provider = config.provider || 'gemini';
          
          // Extract image if present
          const imageMatch = typeof injected === 'string' ? injected.match(/(data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+)/) : null;
          const imageUrl = imageMatch ? imageMatch[1] : null;
          
          let textContent = injected;
          if (imageUrl) {
              textContent = textContent.replace(imageUrl, '').trim();
          }
          
          const textPrompt = promptTemplate ? 
              (promptTemplate.includes('{{input}}') ? promptTemplate.replace(/\{\{input\}\}/g, textContent) : `${promptTemplate}\n\n${textContent}`) 
              : (textContent || "請描述這張圖片");

          if (provider === 'gemini') {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
            
            const parts: any[] = [];
            if (imageUrl) {
                const mimeType = imageUrl.split(';')[0].split(':')[1];
                const base64Data = imageUrl.split(',')[1];
                parts.push({
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                });
            }
            parts.push({ text: textPrompt });

            const response = await ai.models.generateContent({
                model: config.model || 'gemini-3.1-flash-preview',
                contents: { parts },
                config: {
                    temperature: config.temperature || 0.7
                }
            });
            resultText = response.text || '';
          } else if (provider === 'local-custom') {
            // SearXNG / Custom Local API Format
            const payload: any = {
                model: config.model || 'qwen3.5-9b-ultimate-irrefusable-heretic',
                system_prompt: promptTemplate || 'You are a helpful assistant.',
                input: textContent || 'Hello'
            };
            if (imageUrl) {
                payload.images = [imageUrl];
            }
            const url = config.endpoint || 'http://localhost:1234/api/v1/chat';
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`API 請求失敗: ${res.status}`);
            const data = await res.json();
            resultText = data.response || data.content || data.choices?.[0]?.message?.content || JSON.stringify(data);
          } else {
            // LM Studio / OpenAI logic
            let messages = [];
            if (imageUrl) {
                messages = [{
                    role: 'user',
                    content: [
                        { type: "text", text: textPrompt },
                        { type: "image_url", image_url: { url: imageUrl } }
                    ]
                }];
            } else {
                messages = [{ role: 'user', content: textPrompt }];
            }

            const url = (config.endpoint || 'http://localhost:1234').replace(/\/$/, '') + '/v1/chat/completions';
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: config.model || 'loaded-model',
                messages: messages,
                temperature: config.temperature || 0.7
              })
            });

            if (!res.ok) {
              throw new Error(`API 請求失敗: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            resultText = data.choices?.[0]?.message?.content || JSON.stringify(data);
          }
          
          node.data.lastResult = resultText;
          node.data.status = 'success';
        } catch (err: any) {
          console.error(err);
          node.data.status = 'error';
          node.data.lastResult = `錯誤: ${err.message}`;
        }
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...node.data } } : n));
      }
      else if (node.type === 'output_display') {
        const result = getInputValue(nodeId, 'result', nodesMap);
        if (result !== undefined) {
          node.data.text = result;
        } else {
          node.data.text = "無輸入數據";
        }
      }
      else if (node.type === 'web_search') {
        node.data.status = 'running';
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n));
        
        const query = getInputValue(nodeId, 'query', nodesMap) || node.data.query || '';
        const endpoint = node.data.endpoint || 'http://localhost:8080/search';
        
        try {
          const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}&format=json`);
          if (!res.ok) throw new Error(`搜尋失敗: ${res.status}`);
          const data = await res.json();
          const resultsText = data.results?.slice(0, 5).map((r: any) => `[${r.title}](${r.url})\n${r.content}`).join('\n\n') || '無搜尋結果';
          node.data.lastResult = resultsText;
          node.data.status = 'success';
        } catch (err: any) {
          node.data.status = 'error';
          node.data.lastResult = `錯誤: ${err.message}`;
        }
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...node.data } } : n));
      }
    }

    setNodes(prev => prev.map(n => {
      const updated = nodesMap.get(n.id);
      return updated ? { ...n, data: updated.data } : n;
    }));
  };

  // --- 屏幕坐标转画布坐标 ---
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - transform.x) / transform.scale,
      y: (clientY - rect.top - transform.y) / transform.scale
    };
  }, [transform]);

  // --- 缩放/平移 ---
  const handleWheel = useCallback((e: WheelEvent) => {
    const target = e.target as HTMLElement;
    const isScrollable = target.tagName === 'TEXTAREA' || !!target.closest('.custom-scrollbar');
    
    if (isScrollable && !e.ctrlKey && !e.metaKey) {
        return; // Let native scroll happen for textareas and scrollable areas
    }

    e.preventDefault();

    // Zoom by default
    const zoomSpeed = 0.002;
    const delta = -e.deltaY * zoomSpeed;
    const newScale = Math.min(Math.max(0.15, transform.scale * (1 + delta)), 3);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setTransform(prev => ({
      scale: newScale,
      x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
      y: mouseY - (mouseY - prev.y) * (newScale / prev.scale)
    }));
  }, [transform]);

  useEffect(() => {
    const el = containerRef.current;
    el?.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // --- 拖动处理 ---
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target === containerRef.current || e.button === 1) { // Middle click or background click
      e.preventDefault();
      setIsPanning(true);
    }
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (isPanning) {
      setTransform(prev => ({ ...prev, x: prev.x + e.movementX, y: prev.y + e.movementY }));
      return;
    }
    if (draggingNodeId) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setNodes(prev => prev.map(n => n.id === draggingNodeId ? {
          ...n,
          position: {
            x: n.position.x + e.movementX / transform.scale,
            y: n.position.y + e.movementY / transform.scale
          }
        } : n));
        rafRef.current = null;
      });
      return;
    }
    if (drawingEdge) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setDrawingEdge((prev: any) => ({ ...prev, curX: pos.x, curY: pos.y }));
    }
  }, [isPanning, draggingNodeId, drawingEdge, transform.scale, screenToCanvas]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setDrawingEdge(null);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // --- 添加/删除/复制节点 ---
  const addNode = (type: string) => {
    const pos = screenToCanvas(window.innerWidth / 2 - 100, window.innerHeight / 2 - 100);
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position: pos,
      data: type === 'file_input' 
        ? { content: '', fileName: '', fileType: '', status: 'idle' }
        : { text: '', prompt: '', status: 'idle', provider: 'gemini', endpoint: 'http://localhost:1234', model: 'gemini-3.1-flash-preview', temperature: 0.7 }
    };
    setNodes(prev => [...prev, newNode]);
    setIsLibraryOpen(false);
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.sourceNode !== id && e.targetNode !== id));
    if(editingNodeId === id) setEditingNodeId(null);
  };

  const duplicateNode = (id: string) => {
    const nodeToCopy = nodes.find(n => n.id === id);
    if (!nodeToCopy) return;
    
    const newNode = {
      ...nodeToCopy,
      id: `node-${Date.now()}`,
      position: {
        x: nodeToCopy.position.x + 50,
        y: nodeToCopy.position.y + 50
      },
      data: { ...nodeToCopy.data }
    };
    
    setNodes(prev => [...prev, newNode]);
  };

  // --- 端口事件 ---
  const onPortDown = (e: React.PointerEvent, nodeId: string, portId: string, isInput: boolean, type: string) => {
    e.stopPropagation();
    if (isInput) return;
    const node = nodes.find(n => n.id === nodeId);
    const schema = (NODE_TYPES as any)[node.type];
    const pos = getPortPos(node, schema, portId, false);
    setDrawingEdge({ sourceNode: nodeId, sourcePort: portId, startX: pos.x, startY: pos.y, curX: pos.x, curY: pos.y, type });
  };

  const onPortUp = (e: React.PointerEvent, nodeId: string, portId: string, isInput: boolean, acceptType: string) => {
    e.stopPropagation();
    if (drawingEdge && isInput && drawingEdge.type === acceptType) {
      if (drawingEdge.sourceNode === nodeId) return; // 避免自连
      setEdges(prev => [
        ...prev.filter(edge => !(edge.targetNode === nodeId && edge.targetPort === portId)),
        { id: `e-${Date.now()}`, sourceNode: drawingEdge.sourceNode, sourcePort: drawingEdge.sourcePort, targetNode: nodeId, targetPort: portId }
      ]);
    }
    setDrawingEdge(null);
  };

  // --- 计算所有连线的路径 ---
  const edgePaths = useMemo(() => {
    return edges.map(edge => {
      const src = nodes.find(n => n.id === edge.sourceNode);
      const tgt = nodes.find(n => n.id === edge.targetNode);
      if (!src || !tgt) return null;
      const p1 = getPortPos(src, (NODE_TYPES as any)[src.type], edge.sourcePort, false);
      const p2 = getPortPos(tgt, (NODE_TYPES as any)[tgt.type], edge.targetPort, true);
      return { id: edge.id, p1, p2, path: calculateBezier(p1, p2) };
    }).filter(Boolean);
  }, [nodes, edges]);

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] text-zinc-800 font-sans overflow-hidden select-none">
      {/* 顶部导航 */}
      <header className="h-16 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 z-[60] shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            className={`p-2.5 rounded-2xl border transition-all ${isLibraryOpen ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white border-zinc-200 text-indigo-600 hover:bg-indigo-50 shadow-sm'}`}
            title="添加節點"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-zinc-200 mx-1" />
          <div>
            <h1 suppressHydrationWarning className="text-sm font-black tracking-widest text-zinc-900 uppercase italic leading-tight">Sandbox AI</h1>
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono tracking-tighter">
              節點流程編輯器 / 邏輯與格式優化版
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-zinc-200/60 flex items-center gap-1 shadow-sm">
            <button onClick={() => setTransform(p => ({...p, scale: Math.max(0.15, p.scale - 0.1)}))} className="p-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-[10px] font-mono w-10 text-center text-zinc-600 font-bold">{Math.round(transform.scale * 100)}%</span>
            <button onClick={() => setTransform(p => ({...p, scale: Math.min(3, p.scale + 0.1)}))} className="p-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"><ZoomIn className="w-4 h-4" /></button>
          </div>
          <button 
            onClick={runFlow}
            className="group flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-full text-xs font-bold transition-all hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> 啟動流程
          </button>
        </div>
      </header>

      {/* 属性编辑面板 */}
      {editingNodeId && (
        <aside className="absolute right-6 top-20 w-80 bg-white/95 backdrop-blur-3xl border border-zinc-200/80 rounded-[32px] z-[70] p-6 shadow-2xl animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-indigo-600">
                    <Sliders className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">節點設定</span>
                </div>
                <button onClick={() => setEditingNodeId(null)} className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">自定義名稱</label>
                <input 
                  value={nodes.find(n => n.id === editingNodeId)?.data?.customTitle || ''} 
                  onChange={(e) => setNodes(nodes.map(n => n.id === editingNodeId ? {...n, data: {...n.data, customTitle: e.target.value}} : n))}
                  placeholder={(NODE_TYPES as any)[nodes.find(n => n.id === editingNodeId)?.type || '']?.title}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 outline-none font-medium text-xs focus:border-indigo-400 transition-colors" 
                />
              </div>

              {nodes.find(n => n.id === editingNodeId)?.type === 'api_config' && (
                  <div className="space-y-3 pt-4 border-t border-zinc-100">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                          <span>Temperature (採樣溫度)</span>
                          <span className="text-indigo-600 font-mono">{nodes.find(n => n.id === editingNodeId)?.data.temperature}</span>
                      </div>
                      <input 
                          type="range" min="0" max="2" step="0.1" 
                          value={nodes.find(n => n.id === editingNodeId)?.data.temperature}
                          onChange={(e) => setNodes(nodes.map(n => n.id === editingNodeId ? {...n, data: {...n.data, temperature: parseFloat(e.target.value)}} : n))}
                          className="w-full accent-indigo-600"
                      />
                  </div>
              )}
            </div>
            
            <div className="mt-8 p-4 bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-100 text-[10px] text-indigo-600/80 leading-relaxed">
                提示：修改參數後請重新點擊「啟動流程」以生效。
            </div>
        </aside>
      )}

      {/* 组件库 */}
      {isLibraryOpen && (
        <aside className="absolute left-6 top-20 w-64 bg-white/95 backdrop-blur-3xl border border-zinc-200/80 rounded-[32px] z-[70] p-6 shadow-2xl animate-in slide-in-from-left-4">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">可用組件</span>
            <button onClick={() => setIsLibraryOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {Object.entries(NODE_TYPES).map(([key, config]) => (
              <button 
                key={key}
                onClick={() => addNode(key)}
                className="w-full group p-4 bg-zinc-50/80 border border-zinc-200/60 rounded-2xl flex items-center gap-3 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all active:scale-95 text-left"
              >
                <div className="p-2.5 rounded-xl bg-white border border-zinc-100 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  {key.includes('prompt') ? <MessageSquare className="w-4 h-4" /> : key === 'text_combiner' ? <Share2 className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800">{config.title}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5 uppercase font-mono">{key.split('_').join(' ')}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* 画布 */}
      <main 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-[#f8f9fa]"
        onPointerDown={(e) => {
          if (e.target === containerRef.current || e.button === 1) {
            setIsPanning(true);
          }
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #000 1px, transparent 0)`,
            backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`
        }} />

        <div 
          style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0' }}
          className="absolute inset-0 pointer-events-none"
        >
          <svg className="absolute inset-0 overflow-visible pointer-events-none">
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            {edgePaths.map(({ id, p1, p2, path }: any) => (
              <g key={id}>
                <path d={path} stroke="url(#edgeGrad)" strokeWidth="3" fill="none" className="animate-dash opacity-80" style={{ strokeDasharray: '8, 12' }} />
                <circle cx={p1.x} cy={p1.y} r="4" fill="#818cf8" className="shadow-sm" />
                <circle cx={p2.x} cy={p2.y} r="4" fill="#c084fc" className="shadow-sm" />
              </g>
            ))}
            {drawingEdge && (
              <path 
                d={calculateBezier({x: drawingEdge.startX, y: drawingEdge.startY}, {x: drawingEdge.curX, y: drawingEdge.curY})} 
                stroke="#818cf8" strokeWidth="3" strokeDasharray="6,6" fill="none" className="opacity-60"
              />
            )}
          </svg>

          {nodes.map(node => {
            const schema = (NODE_TYPES as any)[node.type];
            const isActive = draggingNodeId === node.id;
            const isEditing = editingNodeId === node.id;

            return (
              <Node
                key={node.id}
                node={node}
                schema={schema}
                isActive={isActive}
                isEditing={isEditing}
                onDragStart={(e: any) => { e.stopPropagation(); setDraggingNodeId(node.id); }}
                onRemove={() => removeNode(node.id)}
                onEdit={(e: any) => { e.stopPropagation(); setEditingNodeId(node.id); }}
                onDuplicate={(e: any) => { e.stopPropagation(); duplicateNode(node.id); }}
                onPortDown={(e: any, portId: string, isInput: boolean, type: string) => onPortDown(e, node.id, portId, isInput, type)}
                onPortUp={(e: any, portId: string, isInput: boolean, acceptType: string) => onPortUp(e, node.id, portId, isInput, acceptType)}
                drawingEdge={drawingEdge}
              >
                {/* 节点内容根据类型动态渲染 */}
                {node.type === 'api_config' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">LM Studio Endpoint</label>
                      <input 
                        value={node.data.endpoint} 
                        onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, endpoint: e.target.value}} : n))} 
                        className="w-full bg-zinc-50/80 border border-zinc-200/80 rounded-xl px-3 py-2.5 outline-none font-mono text-[11px] focus:border-indigo-400 transition-colors" 
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Model Name</label>
                      <input 
                        value={node.data.model} 
                        onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, model: e.target.value}} : n))} 
                        className="w-full bg-zinc-50/80 border border-zinc-200/80 rounded-xl px-3 py-2.5 outline-none font-mono text-[11px] focus:border-indigo-400 transition-colors" 
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}

                {(node.type === 'system_prompt' || node.type === 'user_prompt') && (
                  <div className="space-y-3">
                     {edges.find(e => e.targetNode === node.id) && (
                       <div className="flex items-center gap-2 text-[10px] text-indigo-600 font-bold bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100/80 italic shadow-sm">
                         <Activity className="w-3.5 h-3.5 animate-pulse" /> 上下文內容已連接 (可用 {'{{input}}'} 插入)
                       </div>
                     )}
                     <textarea 
                       value={node.data.text}
                       onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, text: e.target.value}} : n))}
                       className="w-full min-h-[80px] bg-white/60 border border-zinc-200/80 rounded-2xl p-3 resize-y focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 leading-snug tracking-tight text-zinc-700 text-[13px] transition-all shadow-inner"
                       placeholder="在此編寫你的提示詞指令...&#10;若有上游輸入，可使用 {{input}} 指定插入位置。"
                       onClick={e => e.stopPropagation()}
                     />
                  </div>
                )}

                {node.type === 'text_combiner' && (
                    <div className="py-6 px-4 border border-zinc-200/60 bg-zinc-50/50 rounded-2xl text-center shadow-inner">
                        <Share2 className="w-8 h-8 mx-auto text-zinc-400 mb-3" />
                        <p className="text-[11px] text-zinc-500 font-medium">將兩個輸入文本按順序合併</p>
                    </div>
                )}

                {node.type === 'llm_processor' && (
                  <div className="py-12 flex flex-col items-center gap-5 bg-white/60 border border-zinc-200/60 rounded-[32px] shadow-inner">
                    {node.data.status === 'running' ? (
                      <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                         <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin shadow-lg" />
                         <span className="text-[11px] text-indigo-600 font-black uppercase tracking-widest">AI 思考中...</span>
                      </div>
                    ) : (
                      <>
                        <div className={`p-6 rounded-full transition-all duration-500 ${node.data.status === 'success' ? 'bg-emerald-50 text-emerald-500 shadow-lg shadow-emerald-100' : node.data.status === 'error' ? 'bg-red-50 text-red-500 shadow-lg shadow-red-100' : 'bg-zinc-100 text-zinc-400 shadow-inner'}`}>
                          <Cpu className="w-10 h-10" />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase font-bold">
                          {node.data.status === 'idle' ? 'Ready to process' : node.data.status === 'success' ? 'Task Finished' : 'Error Occurred'}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {node.type === 'raw_text' && (
                  <div className="space-y-3">
                     <textarea 
                       value={node.data.text}
                       onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, text: e.target.value}} : n))}
                       className="w-full min-h-[80px] bg-white/60 border border-zinc-200/80 rounded-2xl p-3 resize-y focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 leading-snug tracking-tight text-zinc-700 text-[13px] transition-all shadow-inner"
                       placeholder="在此輸入原始文本數據..."
                       onClick={e => e.stopPropagation()}
                     />
                  </div>
                )}

                {node.type === 'file_input' && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 transition-colors relative group">
                      <input 
                        type="file" 
                        accept="image/*,.pdf,.txt,.md,.csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          let content = '';
                          let fileType = 'text';
                          
                          setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, status: 'loading', fileName: file.name}} : n));

                          try {
                            if (file.type.startsWith('image/')) {
                              fileType = 'image';
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                content = event.target?.result as string;
                                setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, content, fileType, status: 'success'}} : n));
                              };
                              reader.readAsDataURL(file);
                              return;
                            } else if (file.type === 'application/pdf') {
                              fileType = 'pdf';
                              const arrayBuffer = await file.arrayBuffer();
                              // @ts-ignore
                              const pdfjsLib = await import('pdfjs-dist/build/pdf.min.mjs');
                              pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
                              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                              for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                content += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                              }
                            } else {
                              fileType = 'text';
                              content = await file.text();
                            }
                            
                            setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, content, fileType, status: 'success'}} : n));
                          } catch (err) {
                            console.error(err);
                            setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, status: 'error', error: String(err)}} : n));
                          }
                        }}
                      />
                      <FileUp className="w-8 h-8 text-zinc-300 mb-2 group-hover:text-amber-400 transition-colors" />
                      <div className="text-xs font-bold text-zinc-500">點擊或拖曳文件至此</div>
                      <div className="text-[10px] text-zinc-400 mt-1">支援 PDF, 圖片(Vision), TXT, MD</div>
                    </div>
                    
                    {node.data.status === 'loading' && <div className="text-xs text-amber-500 flex items-center gap-1"><Activity className="w-3 h-3 animate-spin"/> 讀取中...</div>}
                    {node.data.status === 'success' && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex items-center gap-2">
                        {node.data.fileType === 'image' ? <ImageIcon className="w-4 h-4 text-emerald-500" /> : <FileText className="w-4 h-4 text-emerald-500" />}
                        <span className="text-xs text-emerald-700 font-medium truncate" title={node.data.fileName}>{node.data.fileName}</span>
                      </div>
                    )}
                    {node.data.status === 'error' && <div className="text-xs text-red-500">讀取失敗，請檢查文件格式。</div>}
                    
                    {node.data.fileType === 'image' && node.data.content && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-zinc-200">
                        <img src={node.data.content} alt="preview" className="w-full h-auto object-cover max-h-[150px]" />
                      </div>
                    )}
                    {node.data.fileType !== 'image' && node.data.content && (
                      <div className="mt-2 p-2 bg-zinc-50 rounded-lg border border-zinc-200 max-h-[100px] overflow-y-auto custom-scrollbar">
                        <p className="text-[10px] text-zinc-500 whitespace-pre-wrap">{node.data.content.substring(0, 200)}{node.data.content.length > 200 ? '...' : ''}</p>
                      </div>
                    )}
                  </div>
                )}

                {node.type === 'ai_worker' && (
                  <div className="space-y-4">
                     {edges.find(e => e.targetNode === node.id && e.targetPort === 'input') && (
                       <div className="flex items-center gap-2 text-[10px] text-indigo-600 font-bold bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100/80 italic shadow-sm">
                         <Activity className="w-3.5 h-3.5 animate-pulse" /> 上游數據已連接
                       </div>
                     )}
                     <div className="space-y-1.5">
                       <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">任務指令 (Prompt)</label>
                       <textarea 
                         value={node.data.prompt}
                         onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, prompt: e.target.value}} : n))}
                         className="w-full min-h-[80px] bg-white/80 border border-indigo-100 rounded-2xl p-3 resize-y focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 leading-snug tracking-tight text-zinc-700 text-[13px] transition-all shadow-inner"
                         placeholder="輸入此節點的任務指令...&#10;若包含 {{input}} 則會替換，否則作為 System Prompt。"
                         onClick={e => e.stopPropagation()}
                       />
                     </div>
                     
                     {/* Local Config Toggle */}
                     <div className="pt-2 border-t border-indigo-100/50">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, showConfig: !n.data.showConfig}} : n));
                          }}
                          className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 hover:text-indigo-500 transition-colors uppercase tracking-wider"
                        >
                          <Settings2 className="w-3 h-3" />
                          {node.data.showConfig ? '隱藏本地模型配置' : '展開本地模型配置'}
                        </button>
                        
                        {node.data.showConfig && (
                          <div className="mt-3 space-y-2 p-3 bg-white/60 rounded-xl border border-indigo-50 shadow-inner">
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-400 font-bold uppercase">Provider</label>
                              <select 
                                value={node.data.provider || 'gemini'} 
                                onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, provider: e.target.value}} : n))} 
                                className="w-full bg-white border border-zinc-200/80 rounded-lg px-2 py-1.5 outline-none font-mono text-[9px] focus:border-indigo-400" 
                                onClick={e => e.stopPropagation()}
                              >
                                <option value="gemini">Google Gemini (Built-in)</option>
                                <option value="lm-studio">LM Studio / OpenAI</option>
                                <option value="local-custom">Local Custom (Qwen/SearXNG)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-400 font-bold uppercase">Endpoint</label>
                              <input 
                                value={node.data.endpoint || ''} 
                                onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, endpoint: e.target.value}} : n))} 
                                className="w-full bg-white border border-zinc-200/80 rounded-lg px-2 py-1.5 outline-none font-mono text-[9px] focus:border-indigo-400 disabled:opacity-50" 
                                placeholder="http://localhost:1234"
                                disabled={node.data.provider === 'gemini'}
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-400 font-bold uppercase">Model Name</label>
                              <input 
                                value={node.data.model || ''} 
                                onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, model: e.target.value}} : n))} 
                                className="w-full bg-white border border-zinc-200/80 rounded-lg px-2 py-1.5 outline-none font-mono text-[9px] focus:border-indigo-400" 
                                placeholder="gemini-3.1-flash-preview"
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        )}
                     </div>
                     
                     {/* Status display */}
                     <div className="pt-2 border-t border-indigo-100/50 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">狀態</span>
                        {node.data.status === 'running' ? (
                          <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"/> 處理中...</span>
                        ) : node.data.status === 'success' ? (
                          <span className="text-[10px] font-bold text-emerald-500">✅ 處理完成</span>
                        ) : node.data.status === 'error' ? (
                          <span className="text-[10px] font-bold text-red-500 break-words max-w-[200px]" title={node.data.lastResult}>❌ {node.data.lastResult || '發生錯誤'}</span>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400">等待中</span>
                        )}
                     </div>
                  </div>
                )}

                {node.type === 'output_display' && (
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-3 p-4 bg-white/50 rounded-2xl border border-zinc-200/60 shadow-inner text-[13px] leading-snug tracking-tight">
                    <MessageRenderer text={node.data.text} />
                  </div>
                )}
                {node.type === 'web_search' && (
                  <div className="space-y-3">
                     <div className="space-y-1.5">
                       <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">SearXNG Endpoint</label>
                       <input 
                         value={node.data.endpoint || 'http://localhost:8080/search'} 
                         onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, endpoint: e.target.value}} : n))} 
                         className="w-full bg-white/80 border border-emerald-100 rounded-lg px-2 py-1.5 outline-none font-mono text-[10px] focus:border-emerald-400 transition-colors" 
                         onClick={e => e.stopPropagation()}
                       />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">預設關鍵字 (若無上游輸入)</label>
                       <input 
                         value={node.data.query || ''} 
                         onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? {...n, data: {...n.data, query: e.target.value}} : n))} 
                         className="w-full bg-white/80 border border-emerald-100 rounded-lg px-2 py-1.5 outline-none text-[11px] focus:border-emerald-400 transition-colors" 
                         placeholder="例如: 最新 AI 新聞"
                         onClick={e => e.stopPropagation()}
                       />
                     </div>
                     {/* Status display */}
                     <div className="pt-2 border-t border-emerald-100/50 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">狀態</span>
                        {node.data.status === 'running' ? (
                          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"/> 搜尋中...</span>
                        ) : node.data.status === 'success' ? (
                          <span className="text-[10px] font-bold text-emerald-600">✅ 搜尋完成</span>
                        ) : node.data.status === 'error' ? (
                          <span className="text-[10px] font-bold text-red-500 break-words max-w-[200px]" title={node.data.lastResult}>❌ {node.data.lastResult || '發生錯誤'}</span>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400">等待中</span>
                        )}
                     </div>
                  </div>
                )}
              </Node>
            );
          })}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash { to { stroke-dashoffset: 0; } }
        .animate-dash { animation: dash 4s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
        input[type=range] { -webkit-appearance: none; height: 6px; background: #e2e8f0; border-radius: 3px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #6366f1; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: transform 0.1s; }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.1); }
      `}} />
    </div>
  );
}
