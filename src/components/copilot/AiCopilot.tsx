import React, { useState, useRef, useEffect } from 'react';
import { 
  RoomConfig, 
  DesignStyle, 
  RecommendationBundle,
  Product,
  PlacedProduct,
  ProductCategory
} from '../../types';
import { CATALOG_PRODUCTS } from '../../data/products';
import { SurfaceFinishes } from '../planner3d/MaterialFactory';
import { 
  Bot, 
  Send, 
  X, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Star,
  Check,
  Minimize2,
  Maximize2,
  Mic,
  MicOff
} from 'lucide-react';

interface AiCopilotProps {
  room: RoomConfig;
  budget: number;
  style: DesignStyle;
  finishes: SurfaceFinishes;
  bundle: RecommendationBundle | null;
  products?: PlacedProduct[];
  onUpdateRoom: (room: RoomConfig) => void;
  onUpdateBudget: (budget: number) => void;
  onUpdateStyle: (style: DesignStyle) => void;
  onUpdateFinishes: (finishes: SurfaceFinishes) => void;
  onSetIncludeBathtub?: (enabled: boolean) => void;
  onTriggerRegenerate: (overrides?: {
    room?: RoomConfig;
    budget?: number;
    style?: DesignStyle;
    includeBathtub?: boolean;
  }) => void;
  onSwapProduct?: (product: Product) => void;
  onUpdateProducts?: (products: PlacedProduct[]) => void;
  onToggleStudioFeature?: (feature: 'water' | 'clearance' | 'dimensions' | 'ceiling' | 'cutaway', enabled?: boolean) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionExecuted?: string;
  suggestedProducts?: Product[];
}

export const AiCopilot: React.FC<AiCopilotProps> = ({
  room,
  budget,
  style,
  finishes,
  bundle,
  products,
  onUpdateRoom,
  onUpdateBudget,
  onUpdateStyle,
  onUpdateFinishes,
  onSetIncludeBathtub,
  onTriggerRegenerate,
  onSwapProduct,
  onUpdateProducts,
  onToggleStudioFeature,
  isOpen,
  onToggleOpen
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `Hello! I'm your **Verre Studio Spatial Copilot**.\n\nAsk me to **suggest toilets**, switch themes (Zen, Luxury, Modern), adjust budgets, or review planning references.`,
      timestamp: 'Just now'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [appliedProductId, setAppliedProductId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live State Refs to eliminate stale-state closures during AI copilot mutation
  const roomRef = useRef(room);
  const budgetRef = useRef(budget);
  const styleRef = useRef(style);
  const finishesRef = useRef(finishes);
  const productsRef = useRef(products);
  const bundleRef = useRef(bundle);

  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { budgetRef.current = budget; }, [budget]);
  useEffect(() => { styleRef.current = style; }, [style]);
  useEffect(() => { finishesRef.current = finishes; }, [finishes]);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { bundleRef.current = bundle; }, [bundle]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const QUICK_PROMPTS = [
    { label: '🚽 Suggest Toilets', prompt: 'Suggest toilets' },
    { label: '🚿 Suggest Faucets', prompt: 'Suggest faucets' },
    { label: '🛁 Add Bathtub', prompt: 'Add bathtub' },
    { label: '❌ Remove Toilet', prompt: 'Remove toilet' },
    { label: '🌊 Water ON/OFF', prompt: 'Toggle water effect' },
    { label: '🛡️ Clearance ON/OFF', prompt: 'Toggle clearance zones' },
    { label: '📐 3D Rulers ON', prompt: 'Turn on dimensions and 3D rulers' },
    { label: '📏 Expand 10×8', prompt: 'Expand room to 10x8' },
    { label: '🎋 Japanese Zen', prompt: 'Change theme to Japanese Zen and apply Hinoki wood slats' },
    { label: '💰 Under ₹75k', prompt: 'Reduce my budget to ₹75,000 and select budget-smart fixtures' },
    { label: '🏛️ Luxury Marble', prompt: 'Switch to Classic Luxury with Calacatta Gold marble' },
    { label: '📐 Planning Notes', prompt: 'Explain plumbing clearances and drainage slope' }
  ];

  type CopilotActionName =
    | 'set_style'
    | 'set_budget'
    | 'set_room_size'
    | 'toggle_bathtub'
    | 'swap_tile'
    | 'regenerate'
    | 'explain'
    | 'add_fixture'
    | 'remove_fixture'
    | 'toggle_feature'
    | 'unsupported';

  interface CopilotActionResponse {
    success?: boolean;
    action: CopilotActionName;
    params: Record<string, any>;
    assistantReply: string;
  }

  const parseCopilotResponse = async (response: Response): Promise<CopilotActionResponse> => {
    const text = await response.text();

    if (!text.trim()) {
      throw new Error(
        response.ok
          ? 'Copilot returned an empty response.'
          : 'Backend server is not reachable. Start it with npm run server in a second terminal.'
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(
        response.ok
          ? 'Copilot returned an invalid response.'
          : 'Backend server returned a non-JSON error. Check the server terminal for details.'
      );
    }

    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || `Copilot request failed with HTTP ${response.status}.`);
    }

    return payload as CopilotActionResponse;
  };

  const styleFinishPresets: Record<DesignStyle, SurfaceFinishes> = {
    japanese_zen: { floor: 'wooden_hinoki', wall: 'designer_fluted_3d' },
    classic_luxury: { floor: 'marble_carrara', wall: 'marble_calacatta_gold' },
    minimalist_modern: { floor: 'designer_terrazzo_venetian', wall: 'ceramic_artisan_glazed' },
    contemporary: { floor: 'matte_graphite_slate', wall: 'concrete_industrial_cast' },
    premium: { floor: 'marble_calacatta_gold', wall: 'stone_roman_travertine' },
    modern: { floor: 'designer_terrazzo_venetian', wall: 'ceramic_artisan_glazed' }
  };

  const getActionLabel = (action: CopilotActionName, params: Record<string, any>) => {
    if (action === 'set_style') return `Applied ${String(params.style).replace('_', ' ')} style`;
    if (action === 'set_budget') return `Updated budget to ₹${Number(params.budget || 0).toLocaleString('en-IN')}`;
    if (action === 'set_room_size') return `Updated room to ${params.length}×${params.width} ft`;
    if (action === 'toggle_bathtub') return params.enabled ? 'Enabled bathtub preference' : 'Disabled bathtub preference';
    if (action === 'swap_tile') return `Updated ${params.surface} tile`;
    if (action === 'regenerate') return 'Regenerated design layout';
    if (action === 'add_fixture') return `Added ${String(params.category || 'fixture').replace('_', ' ')} to layout`;
    if (action === 'remove_fixture') return `Removed ${String(params.category || 'fixture').replace('_', ' ')} from layout`;
    if (action === 'toggle_feature') return `Toggled ${params.feature} ${params.enabled !== undefined ? (params.enabled ? 'ON' : 'OFF') : ''}`.trim();
    return '';
  };

  const executeAction = (action: CopilotActionResponse) => {
    const params = action.params || {};

    if (action.action === 'set_style') {
      const nextStyle = params.style as DesignStyle;
      styleRef.current = nextStyle;
      onUpdateStyle(nextStyle);
      const nextFinishes = {
        ...styleFinishPresets[nextStyle],
        floor: params.floor || styleFinishPresets[nextStyle].floor,
        wall: params.wall || styleFinishPresets[nextStyle].wall
      };
      finishesRef.current = nextFinishes;
      onUpdateFinishes(nextFinishes);
      if (params.regenerate !== false) {
        onTriggerRegenerate({
          style: nextStyle,
          budget: budgetRef.current,
          room: roomRef.current
        });
      }
      return;
    }

    if (action.action === 'set_budget') {
      const nextBudget = Number(params.budget);
      budgetRef.current = nextBudget;
      onUpdateBudget(nextBudget);
      if (params.regenerate !== false) {
        onTriggerRegenerate({
          budget: nextBudget,
          style: styleRef.current,
          room: roomRef.current
        });
      }
      return;
    }

    if (action.action === 'set_room_size') {
      const nextRoom = {
        ...roomRef.current,
        length: Number(params.length),
        width: Number(params.width),
        height: params.height ? Number(params.height) : roomRef.current.height
      };
      roomRef.current = nextRoom;
      onUpdateRoom(nextRoom);
      if (typeof params.includeBathtub === 'boolean') {
        onSetIncludeBathtub?.(params.includeBathtub);
      }
      if (params.regenerate !== false) {
        onTriggerRegenerate({
          room: nextRoom,
          budget: budgetRef.current,
          style: styleRef.current,
          includeBathtub: typeof params.includeBathtub === 'boolean' ? params.includeBathtub : undefined
        });
      }
      return;
    }

    if (action.action === 'toggle_bathtub') {
      const includeBathtub = Boolean(params.enabled);
      onSetIncludeBathtub?.(includeBathtub);
      let nextRoom = roomRef.current;
      if (params.enabled) {
        nextRoom = {
          ...roomRef.current,
          length: Math.max(roomRef.current.length, 9.5),
          width: Math.max(roomRef.current.width, 7.5)
        };
        roomRef.current = nextRoom;
        onUpdateRoom(nextRoom);
      }
      if (params.regenerate !== false) {
        onTriggerRegenerate({
          room: nextRoom,
          budget: budgetRef.current,
          style: styleRef.current,
          includeBathtub
        });
      }
      return;
    }

    if (action.action === 'swap_tile') {
      const nextFinishes = {
        ...finishesRef.current,
        [params.surface]: params.tileId
      };
      finishesRef.current = nextFinishes;
      onUpdateFinishes(nextFinishes);
      return;
    }

    if (action.action === 'regenerate') {
      onTriggerRegenerate({
        room: roomRef.current,
        budget: budgetRef.current,
        style: styleRef.current
      });
      return;
    }

    if (action.action === 'add_fixture') {
      const category = params.category as ProductCategory;
      if (!onUpdateProducts) return;

      const currentProducts = products || bundle?.products || [];
      const usedIds = new Set(currentProducts.map(p => p.id));
      
      const candidates = CATALOG_PRODUCTS.filter(p => {
        if (category === 'toilet') return p.category === 'toilet' || p.category === 'smart_toilet';
        return p.category === category;
      }).sort((a, b) => {
        const aUsed = usedIds.has(a.id) ? 1 : 0;
        const bUsed = usedIds.has(b.id) ? 1 : 0;
        const aStyle = a.styles?.includes(style) ? 0 : 1;
        const bStyle = b.styles?.includes(style) ? 0 : 1;
        return (aUsed - bUsed) || (aStyle - bStyle) || (a.price - b.price);
      });

      const product = candidates[0];
      if (!product) return;

      const candidatePoints = [
        { x: room.length * 0.5, y: room.width * 0.5 },
        { x: room.length * 0.28, y: room.width * 0.55 },
        { x: room.length * 0.72, y: room.width * 0.55 },
        { x: product.width / 2 + 0.4, y: room.width - product.depth / 2 - 0.45 },
        { x: room.length - product.width / 2 - 0.45, y: room.width - product.depth / 2 - 0.45 },
        { x: product.width / 2 + 0.4, y: product.depth / 2 + 0.45 },
        { x: room.length - product.width / 2 - 0.45, y: product.depth / 2 + 0.45 }
      ];

      const chosenPoint = candidatePoints.find((point) => {
        const overlaps = currentProducts.some((existing) => {
          const dx = Math.abs(point.x - existing.x);
          const dy = Math.abs(point.y - existing.y);
          return dx < (product.width + existing.width) / 2 + 0.4 && dy < (product.depth + existing.depth) / 2 + 0.4;
        });
        return !overlaps;
      }) || candidatePoints[0];

      const newPlaced: PlacedProduct = {
        ...product,
        instanceId: `copilot-${product.id}-${Date.now()}`,
        x: Number(chosenPoint.x.toFixed(2)),
        y: Number(chosenPoint.y.toFixed(2)),
        rotation: 0,
        wallAttached: category === 'bathtub' ? 'none' : 'south',
        score: 95,
        reason: `Added via AI Copilot voice/chat command`
      };

      onUpdateProducts([...currentProducts, newPlaced]);
      return;
    }

    if (action.action === 'remove_fixture') {
      const category = params.category;
      if (!onUpdateProducts) return;

      const currentProducts = products || bundle?.products || [];
      let updated: PlacedProduct[];

      if (category === 'all') {
        updated = [];
      } else if (category === 'toilet' || category === 'smart_toilet') {
        updated = currentProducts.filter(p => p.category !== 'toilet' && p.category !== 'smart_toilet');
      } else if (category === 'vanity') {
        updated = currentProducts.filter(p => p.category !== 'vanity' && p.category !== 'faucet' && p.category !== 'mirror');
      } else {
        updated = currentProducts.filter(p => p.category !== category);
      }

      onUpdateProducts(updated);
      return;
    }

    if (action.action === 'toggle_feature') {
      const feature = params.feature;
      const enabled = params.enabled;
      onToggleStudioFeature?.(feature, enabled);
      return;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          room: roomRef.current,
          budget: budgetRef.current,
          style: styleRef.current,
          finishes: finishesRef.current,
          bundleSummary: bundleRef.current
            ? `${bundleRef.current.title}. Cost ₹${bundleRef.current.totalCost}. ${bundleRef.current.aiSummary}`
            : undefined
        })
      });

      const action = await parseCopilotResponse(response);
      const canMutate = action.action !== 'unsupported' && action.action !== 'explain';
      if (canMutate) executeAction(action);

      const suggestedProducts = Array.isArray(action.params?.suggestedProducts)
        ? action.params.suggestedProducts as Product[]
        : undefined;

      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: action.assistantReply || 'I understood your request.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionExecuted: canMutate ? getActionLabel(action.action, action.params || {}) : '',
          suggestedProducts
        }
      ]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: `I could not safely process that request: ${error?.message || 'network error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is supported in Google Chrome, Microsoft Edge, and Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          setInputPrompt(transcript);
          handleSendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error !== 'no-speech') {
          setSpeechError(`Voice notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start voice recognition:', err);
      setIsListening(false);
    }
  };

  const handleApplyFixture = (p: Product) => {
    if (onSwapProduct) {
      onSwapProduct(p);
      setAppliedProductId(p.id);
      setTimeout(() => setAppliedProductId(null), 3000);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'msg-init',
        sender: 'ai',
        text: `Chat cleared! How can I assist with your Verre Studio bathroom layout?`,
        timestamp: 'Just now'
      }
    ]);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-amber-500 via-gold-500 to-amber-600 text-slate-950 font-bold text-xs shadow-2xl hover:scale-105 transition-all duration-300 border border-amber-300/40"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wide">AI Copilot</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Modern Floating Copilot Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[460px] bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized ? 'h-[68px]' : 'h-[620px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-gold-400 text-slate-950 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    Verre Studio Copilot
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Assisted
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Spatial command assistant
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetChat}
                title="Clear Chat"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onToggleOpen}
                title="Close"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 no-scrollbar">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-br-none'
                          : 'bg-slate-100/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 rounded-bl-none backdrop-blur'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>

                      {/* Interactive Visual Product Cards */}
                      {m.suggestedProducts && m.suggestedProducts.length > 0 && (
                        <div className="mt-3.5 flex flex-col gap-2.5">
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Suggested Verre Studio Fixtures
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {m.suggestedProducts.map((prod) => (
                              <div
                                key={prod.id}
                                className="group/card rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 flex flex-col justify-between hover:border-amber-500/50 transition-all shadow-sm"
                              >
                                <div>
                                  {prod.imageUrl && (
                                    <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-slate-100 dark:bg-slate-900">
                                      <img
                                        src={prod.imageUrl}
                                        alt={prod.name}
                                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                                      />
                                    </div>
                                  )}
                                  <div className="flex items-start justify-between gap-1">
                                    <h4 className="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-2">
                                      {prod.name}
                                    </h4>
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 shrink-0">
                                      <Star className="w-2.5 h-2.5 fill-current" />
                                      {prod.rating || 4.8}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 mt-1">
                                    ₹{Number(prod.price).toLocaleString('en-IN')}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {prod.width}ft × {prod.depth}ft
                                  </p>
                                </div>

                                {onSwapProduct && (
                                  <button
                                    onClick={() => handleApplyFixture(prod)}
                                    className={`mt-2 w-full py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                                      appliedProductId === prod.id
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {appliedProductId === prod.id ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>Applied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3" />
                                        <span>Apply to Design</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {m.actionExecuted && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{m.actionExecuted}</span>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 p-3 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] font-mono">Analyzing spatial parameters...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Carousel */}
              <div className="px-3 py-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/40 dark:bg-slate-900/40">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qp.prompt)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-medium border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:scale-105"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* Voice Listening Banner */}
              {isListening && (
                <div className="px-3.5 py-2 bg-gradient-to-r from-rose-500/20 via-amber-500/25 to-rose-500/20 border-t border-rose-500/40 flex items-center justify-between text-xs text-rose-500 dark:text-rose-400 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <span className="font-semibold text-[11px]">Listening... Speak your command (e.g., "Suggest toilets", "Switch to Japanese Zen")</span>
                  </div>
                  <button
                    onClick={handleToggleVoice}
                    className="text-[10px] font-mono font-bold text-slate-400 hover:text-rose-400 px-2 py-0.5 rounded bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Modern Input Bar */}
              <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 flex items-center gap-2">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isListening ? "Listening to your voice... Speak now!" : "Ask copilot or command changes..."}
                  className={`flex-1 bg-slate-100/80 dark:bg-slate-900/80 border rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                    isListening ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-amber-500'
                  }`}
                />

                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  title={isListening ? "Listening... Click to stop" : "Voice input (Speak commands like 'Suggest toilets' or 'Switch to Japanese Zen')"}
                  className={`p-2.5 rounded-2xl transition-all shadow-md shrink-0 ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                      : 'bg-slate-100 dark:bg-slate-900 hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 hover:text-amber-500 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputPrompt.trim() || isTyping}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-400 hover:to-gold-400 disabled:opacity-40 text-slate-950 font-bold transition-all shadow-md hover:scale-105 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
