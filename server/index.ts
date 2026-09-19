import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { 
  getProductsCatalog, 
  generateRecommendations, 
  modifyDesignWithPrompt 
} from './services/recommendationEngine.js';
import { analyzeBathroomImage } from './services/imageAnalyzer.js';
import { interpretCopilotRequest } from './services/copilotInterpreter.js';
import { DesignStyle, RecommendationRequest, ModifyDesignRequest } from '../src/types/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// In-memory designs store
const savedDesigns: any[] = [];
const DESIGN_STYLES: DesignStyle[] = [
  'minimalist_modern',
  'classic_luxury',
  'japanese_zen',
  'contemporary',
  'premium',
  'modern'
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), brand: 'Verre Studio AI' });
});

// Products catalog
app.get('/api/products', (req, res) => {
  try {
    const products = getProductsCatalog();
    const { category, style, minPrice, maxPrice } = req.query;

    let filtered = products;
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    if (typeof style === 'string' && DESIGN_STYLES.includes(style as DesignStyle)) {
      filtered = filtered.filter(p => p.styles.includes(style as DesignStyle));
    }
    if (minPrice) {
      filtered = filtered.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(p => p.price <= Number(maxPrice));
    }

    res.json({ success: true, count: filtered.length, products: filtered });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Recommendation & Constraint Engine
app.post('/api/recommend', (req, res) => {
  try {
    const request: RecommendationRequest = req.body;
    
    if (!request.room || !request.room.length || !request.room.width || !request.budget || !request.style) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: room.length, room.width, budget, style' 
      });
    }

    const result = generateRecommendations(request);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// "Change My Design" AI Engine
app.post('/api/modify-design', (req, res) => {
  try {
    const request: ModifyDesignRequest = req.body;
    if (!request.currentBundle || !request.userPrompt) {
      return res.status(400).json({ success: false, error: 'Missing currentBundle or userPrompt' });
    }

    const result = modifyDesignWithPrompt(request);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Image Understanding / Computer Vision
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { image, knownWidth } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const analysis = await analyzeBathroomImage(image, knownWidth);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Natural Language Copilot Interpreter (supports both /api/copilot and /api/copilot-action)
const handleCopilotEndpoint = async (req: express.Request, res: express.Response) => {
  try {
    const { message, room, budget, style, finishes, bundleSummary } = req.body;
    if (!message || !room || !budget || !style || !finishes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, room, budget, style, finishes'
      });
    }

    const result = await interpretCopilotRequest({
      message,
      room,
      budget,
      style,
      finishes,
      bundleSummary
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.json({
      success: true,
      action: 'unsupported',
      params: {},
      assistantReply: `I could not safely interpret that request: ${err.message}`
    });
  }
};

app.post('/api/copilot', handleCopilotEndpoint);
app.post('/api/copilot-action', handleCopilotEndpoint);

// Save Design
app.post('/api/save-design', (req, res) => {
  try {
    const design = {
      id: `dsg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    savedDesigns.unshift(design);
    res.json({ success: true, designId: design.id, message: 'Design saved successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List Designs
app.get('/api/designs', (req, res) => {
  res.json({ success: true, designs: savedDesigns });
});

const server = app.listen(PORT, () => {
  console.log(`[Verre Studio API] Server running on http://localhost:${PORT}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `[Verre Studio API] Port ${PORT} is already in use. Stop the existing server or set PORT in .env, then update vite.config.ts proxy to match.`
    );
    process.exit(1);
  }

  throw error;
});
