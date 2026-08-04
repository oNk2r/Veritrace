import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Copy,
  Trash2,
  BarChart2,
  FileText,
  Check,
  Globe,
  Mail,
  Phone,
  MapPin,
  Building,
  Activity,
  Layers,
  Leaf,
  DollarSign,
  Users,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';
import { RevealLayer } from './components/RevealLayer';
import branchingLandscapeBase from './assets/branching_landscape_base.png';
import branchingLandscapeGlow from './assets/branching_landscape_glow.png';

const BG_IMAGE_1 = branchingLandscapeBase;
const BG_IMAGE_2 = branchingLandscapeGlow;

const NAV_ITEMS = ['Home', 'Analyze', 'Dashboard', 'Taxonomy', 'Partners', 'Live Map'];

const API_BASE = "http://localhost:8000/api/waste";

// TypeScript interfaces matching backend models
interface ReuseOpportunity {
  opportunity_name: string;
  process_description: string;
  estimated_value_per_unit_inr: number;
  carbon_offset_factor: number;
  suitability_score: number;
}

interface BusinessMatch {
  business_name: string;
  industry: string;
  location: string;
  distance_km: number;
  potential_monthly_revenue: number;
  carbon_saved_kg_monthly: number;
  landfill_diverted_kg_monthly: number;
  transportation_carbon_estimate_kg: number;
  circular_economy_score: number;
  contact_person: string;
  phone: string;
  address: string;
}

interface WasteAnalysisResponse {
  success: boolean;
  id: number;
  business_name: string;
  industry: string;
  waste_type: string;
  waste_type_standard: string;
  quantity: number;
  frequency: string;
  location: string;
  current_disposal_method: string;
  match_confidence: number;
  top_opportunity: ReuseOpportunity;
  other_opportunities: ReuseOpportunity[];
  nearby_businesses: BusinessMatch[];
  ai_explanation: string;
  environmental_benefits: string;
  financial_benefits: string;
  suggested_next_steps: string[];
  generated_outreach_email: string;
}

interface WasteLogItem {
  id: number;
  business_name: string;
  industry: string;
  waste_type: string;
  waste_type_standard: string;
  quantity: number;
  frequency: string;
  location: string;
  current_disposal_method: string;
  match_confidence: number;
  top_opportunity_name: string;
  buyer_name: string;
  distance_km: number;
  monthly_revenue: number;
  carbon_saved_monthly: number;
  landfill_diverted_monthly: number;
  circular_economy_score: number;
  created_at: string;
}

interface DashboardData {
  total_co2_saved: number;
  total_landfill_diverted: number;
  total_revenue_generated: number;
  active_partnerships_count: number;
  recent_logs: WasteLogItem[];
}

export default function App() {
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [activeTab, setActiveTab] = useState('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    business_name: '',
    industry: 'Food & Beverage',
    waste_type: '',
    description: '',
    quantity: '',
    frequency: 'monthly',
    location: 'Hadapsar',
    current_disposal_method: 'landfill',
  });

  // Analysis Result and loading state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<WasteAnalysisResponse | null>(null);

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // UI state copy indicators
  const [emailCopied, setEmailCopied] = useState(false);

  // Map state
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<any | null>(null);

  // AI Showcase Demo States
  const [demoActiveIndex, setDemoActiveIndex] = useState(0);
  const [demoStep, setDemoStep] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);

  const runDemoPipeline = (index: number) => {
    setDemoActiveIndex(index);
    setDemoStep(0);
    setDemoRunning(true);

    const stepIntervals = [1, 2, 3, 4, 5];
    stepIntervals.forEach((step) => {
      setTimeout(() => {
        setDemoStep(step);
        if (step === 5) {
          setDemoRunning(false);
        }
      }, step * 800);
    });
  };

  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number | null>(null);
  const particlesCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particles generator for background embers and dust
  useEffect(() => {
    if (activeTab !== 'Home') return;
    const canvas = particlesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
    }

    const particles: Particle[] = [];
    const maxParticles = 50;

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.5,
        speedX: Math.random() * 0.3 - 0.15,
        speedY: -(Math.random() * 0.6 + 0.2),
        opacity: Math.random() * 0.4 + 0.15,
        color: Math.random() > 0.5 ? 'rgba(232, 112, 42, 0.5)' : 'rgba(255, 255, 255, 0.25)'
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10 || p.x > width + 10) {
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTab]);

  // Mouse Move listener for spotlight
  useEffect(() => {
    if (activeTab !== 'Home') {
      return;
    }
    const initialX = window.innerWidth / 2;
    const initialY = window.innerHeight * 0.45;
    mouse.current = { x: initialX, y: initialY };
    smooth.current = { x: initialX, y: initialY };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        mouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchstart', handleTouchMove);

    const updateSmoothPosition = () => {
      const dx = mouse.current.x - smooth.current.x;
      const dy = mouse.current.y - smooth.current.y;
      
      if (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15) {
        smooth.current.x += dx * 0.1;
        smooth.current.y += dy * 0.1;
        setCursorPos({ x: Math.round(smooth.current.x * 10) / 10, y: Math.round(smooth.current.y * 10) / 10 });
      }
      rafRef.current = requestAnimationFrame(updateSmoothPosition);
    };

    rafRef.current = requestAnimationFrame(updateSmoothPosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [activeTab]);

  // Fetch Dashboard metrics on view load
  useEffect(() => {
    if (activeTab === 'Dashboard') {
      fetchDashboard();
    }
  }, [activeTab]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchDashboard = async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else {
        triggerToast("Failed to fetch dashboard metrics");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error connecting to backend API");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const submitAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.business_name || !formState.waste_type || !formState.quantity) {
      triggerToast("Please fill in all required fields.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisPhase(1);

    // Simulate stepping through analysis phases for a fluid modern loader experience
    const phases = [
      "Standardizing Waste Description (synonym taxonomy mapping)...",
      "Mapping local logistics coordinates (Pune regions database)...",
      "Evaluating Scope 3 logistics transport emissions...",
      "Consulting Gemini 2.5 Flash for operational safety checks...",
      "Persisting analysis logs to regional database storage..."
    ];

    let phaseCount = 1;
    const interval = setInterval(() => {
      phaseCount += 1;
      if (phaseCount <= 5) {
        setAnalysisPhase(phaseCount);
      } else {
        clearInterval(interval);
      }
    }, 900);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          quantity: parseFloat(formState.quantity)
        })
      });

      // Let the simulation complete or skip straight to results
      setTimeout(async () => {
        clearInterval(interval);
        if (res.ok) {
          const resultData = await res.json();
          setAnalysisResult(resultData);
          triggerToast("Analysis completed successfully!");
        } else {
          const err = await res.json();
          triggerToast(`Analysis failed: ${err.detail || 'Error'}`);
          setIsAnalyzing(false);
        }
      }, 4000);

    } catch (err) {
      clearInterval(interval);
      console.error(err);
      triggerToast("Connection failed. Ensure FastAPI backend is running.");
      setIsAnalyzing(false);
    }
  };

  const deleteLog = async (id: number) => {
    if (!confirm("Are you sure you want to delete this historical evaluation log?")) return;
    try {
      const res = await fetch(`${API_BASE}/logs/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerToast("Log entry deleted successfully.");
        fetchDashboard();
        if (analysisResult && analysisResult.id === id) {
          setAnalysisResult(null);
        }
      } else {
        triggerToast("Failed to delete log item.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error deleting item from database.");
    }
  };

  const viewPastLogDetails = async (logItem: WasteLogItem) => {
    setIsAnalyzing(true);
    setAnalysisPhase(3);
    
    // Simulate loading details
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        success: true,
        id: logItem.id,
        business_name: logItem.business_name,
        industry: logItem.industry,
        waste_type: logItem.waste_type,
        waste_type_standard: logItem.waste_type_standard,
        quantity: logItem.quantity,
        frequency: logItem.frequency,
        location: logItem.location,
        current_disposal_method: logItem.current_disposal_method,
        match_confidence: logItem.match_confidence,
        top_opportunity: {
          opportunity_name: logItem.top_opportunity_name,
          process_description: "Reprocessed into basic recycled feedstock / circular second-life outputs.",
          estimated_value_per_unit_inr: logItem.monthly_revenue / logItem.quantity,
          carbon_offset_factor: 0.65,
          suitability_score: logItem.circular_economy_score
        },
        other_opportunities: [],
        nearby_businesses: [
          {
            business_name: logItem.buyer_name,
            industry: "Partner Industrial Outlet",
            location: logItem.location,
            distance_km: logItem.distance_km,
            potential_monthly_revenue: logItem.monthly_revenue,
            carbon_saved_kg_monthly: logItem.carbon_saved_monthly,
            landfill_diverted_kg_monthly: logItem.landfill_diverted_monthly,
            transportation_carbon_estimate_kg: logItem.distance_km * 0.15,
            circular_economy_score: logItem.circular_economy_score,
            contact_person: "Facility Logistics Lead",
            phone: "+91 98765 00000",
            address: `${logItem.location} Industrial Zone, Pune`
          }
        ],
        ai_explanation: `This evaluation record was loaded from the SQLite database. Standard synonym parsing successfully matched the raw waste descriptor "${logItem.waste_type}" with our standardized industrial taxonomy item "${logItem.waste_type_standard}".`,
        environmental_benefits: `Keeps ${logItem.landfill_diverted_monthly.toLocaleString()} kg of waste out of landfills monthly, resulting in a net savings of ${logItem.carbon_saved_monthly.toLocaleString()} kg of greenhouse gases.`,
        financial_benefits: `Generates ₹${logItem.monthly_revenue.toLocaleString()} per month in additional revenues while eliminating municipal tipping and disposal fees.`,
        suggested_next_steps: [
          "Establish secondary separation bin directly at generation site.",
          "Arrange transportation scheduling with buyer logistics desk.",
          "Verify purity specs of the raw byproduct stream."
        ],
        generated_outreach_email: `Subject: Industrial Supply Partnership request | ${logItem.waste_type_standard}\n\nDear Partner,\n\nWe are looking to supply up to ${logItem.quantity} kg of standard ${logItem.waste_type_standard} regularly from our ${logItem.location} location.\n\nOur carbon modeling indicates this circular redirect saves ${logItem.carbon_saved_monthly} kg CO2e monthly. Let us know a suitable time to discuss sample validation.\n\nBest,\nLogistics Lead\n${logItem.business_name}`
      });
      setActiveTab('Analyze');
      triggerToast(`Loaded analysis for ${logItem.business_name}`);
    }, 500);
  };

  const copyEmailToClipboard = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult.generated_outreach_email);
    setEmailCopied(true);
    triggerToast("Email template copied to clipboard!");
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const DEMO_PRESETS = [
    {
      input: "We generate 250kg of coffee grounds every week.",
      detected: "Coffee Grounds",
      category: "Organic Waste",
      uses: ["Mushroom Farm Cultivation", "Biogas Feedstock", "Premium Compost Soil"],
      match: "Green Mushroom Farm (Hadapsar)",
      distance: "4.2 km",
      carbon: "162 kg CO2 / week",
      revenue: "₹1,250 / week"
    },
    {
      input: "Our machine shop produces 1.2 tons of steel scraps monthly.",
      detected: "Machined Metal Scrap",
      category: "Metallurgical Waste",
      uses: ["Smelting Foundry Re-melting", "Sintering Agglomerate", "Reinforcement Bars"],
      match: "Pune Steel Reforming Ltd (Chakan)",
      distance: "18.5 km",
      carbon: "1,440 kg CO2 / month",
      revenue: "₹26,400 / month"
    },
    {
      input: "We have 800kg of treated wood sawdust from timber sizing.",
      detected: "Sawdust & Wood Shavings",
      category: "Wood Waste",
      uses: ["Bio-pellet Fuels", "Particle Board Core Material", "Animal Bedding Litter"],
      match: "Deccan Particle Boards (Chakan)",
      distance: "12.1 km",
      carbon: "520 kg CO2 / month",
      revenue: "₹3,600 / month"
    },
    {
      input: "Our factory throws away 400kg of synthetic textile clippings weekly.",
      detected: "Textile Fabric Scraps",
      category: "Fabric Waste",
      uses: ["Thermal Sound Insulation Padding", "Industrial Rags", "Coarse Yarn Retexturing"],
      match: "Maharashtra Shredders & Fibers (Pimpri)",
      distance: "8.7 km",
      carbon: "380 kg CO2 / week",
      revenue: "₹3,200 / week"
    }
  ];

  // Preset taxonomies for rendering
  const TAXONOMY_DATA = [
    { id: 'coffee_grounds', name: 'Coffee Grounds', category: 'Organic Waste', desc: 'Spent coffee grounds from commercial brewing operations. High in nitrogen, ideal for mushroom cultivation and premium organic composting.', synonyms: 'used coffee, coffee waste, powder grinds', value: '₹5.00/kg' },
    { id: 'sawdust', name: 'Sawdust & Wood Shavings', category: 'Wood Waste', desc: 'Fine wood particles from sawmills and furniture manufacturing. Free of chemical treatments, used for bio-pellet fuels and board manufacturing.', synonyms: 'wood scrap, shavings, timber cutoffs', value: '₹4.50/kg' },
    { id: 'textile_scraps', name: 'Textile Fabric Scraps', category: 'Fabric Waste', desc: 'Leftover cotton and synthetic fabrics from apparel manufacturers. Upcycled into shredding fiber insulation or industrial wiping rags.', synonyms: 'cloth clippings, scrap denim, garment waste', value: '₹8.00/kg' },
    { id: 'plastic_scrap', name: 'Industrial Plastic Scrap', category: 'Polymer Waste', desc: 'Industrial polymer residues, HDPE/PET trimmings, and blow-molding scrap. Shredded and extruded into secondary plastic products.', synonyms: 'plastic bottles, cutoffs, scrap bags', value: '₹12.00/kg' },
    { id: 'glass_waste', name: 'Broken Glass Waste', category: 'Silicate Waste', desc: 'Broken cullet glass from bottling plants and glass workshops. Remelted to reduce furnace energy requirements by up to 30%.', synonyms: 'broken bottles, glass shards, cullet', value: '₹3.50/kg' },
    { id: 'metal_scrap', name: 'Machined Metal Scrap', category: 'Metallurgical Waste', desc: 'Iron filings, aluminum cutoffs, and steel shavings. Cleaned and melted back into industrial smelting cycles.', synonyms: 'steel shavings, iron swarf, copper trimmings', value: '₹22.00/kg' },
    { id: 'food_waste', name: 'Organic Food Waste', category: 'Organic Waste', desc: 'Canteen food waste, kitchen scraps, and stale products. Standardized feedstock for anaerobic digestion and local biogas operations.', synonyms: 'kitchen waste, food leftovers, compostable items', value: '₹2.50/kg' },
    { id: 'construction_debris', name: 'Construction Debris', category: 'Mineral Waste', desc: 'Clean masonry rubble, broken bricks, and concrete waste. Crushed and sorted for road base construction and concrete aggregate.', synonyms: 'concrete rubble, brick pieces, plaster debris', value: '₹1.50/kg' },
    { id: 'agricultural_waste', name: 'Agricultural Crop Husks', category: 'Organic Waste', desc: 'Rice husks, bagasse, crop stalks, and organic harvesting byproducts. Compressed into solid fuel briquettes for bio-furnaces.', synonyms: 'bagasse, rice husk, straw, crop residues', value: '₹3.00/kg' }
  ];

  // Preset regional buyers near Pune for rendering
  const BUYERS_DATA = [
    { name: "Green Mushroom Farm", location: "Hadapsar", industry: "Agriculture", accepts: "Coffee Grounds", capacity: "1,000 kg/week", contact: "Rahul Patil", phone: "+91 98765 43210", address: "Gate No. 42, Hadapsar Industrial Estate, Pune" },
    { name: "EcoPellets Biofuels", location: "Chakan", industry: "Energy", accepts: "Coffee Grounds, Sawdust", capacity: "5,000 kg/week", contact: "Sanjay Joshi", phone: "+91 98765 43211", address: "Plot 12, MIDC Chakan Phase 2, Pune" },
    { name: "Pune Organic Composting Co.", location: "Talegaon", industry: "Agriculture", accepts: "Coffee Grounds, Food Waste, Agricultural Waste", capacity: "8,000 kg/week", contact: "Amit Shinde", phone: "+91 98765 43212", address: "Talegaon Dabhade Road, Pune" },
    { name: "Deccan Particle Boards", location: "Chakan", industry: "Manufacturing", accepts: "Sawdust", capacity: "15,000 kg/week", contact: "Vijay Kamble", phone: "+91 98765 43213", address: "Plot 115, MIDC Chakan Phase 1, Pune" },
    { name: "Maharashtra Shredders & Fibers", location: "Pimpri", industry: "Textiles", accepts: "Textile Scraps", capacity: "4,000 kg/week", contact: "Ramesh Shah", phone: "+91 98765 43214", address: "Block H, Pimpri Industrial Area, Pune" },
    { name: "PolyRecycle Industries", location: "Chakan", industry: "Recycling", accepts: "Plastic Scrap", capacity: "10,000 kg/week", contact: "Nitin Deshmukh", phone: "+91 98765 43215", address: "Plot 88, MIDC Chakan Phase 3, Pune" },
    { name: "Western Glass Smelters", location: "Hadapsar", industry: "Manufacturing", accepts: "Glass Waste", capacity: "12,000 kg/week", contact: "Karan Malhotra", phone: "+91 98765 43216", address: "Hadapsar Industrial Estate, Road No. 3, Pune" },
    { name: "Pune Steel Reforming Ltd.", location: "Chakan", industry: "Metallurgical", accepts: "Metal Scrap", capacity: "20,000 kg/week", contact: "Vikram Salunkhe", phone: "+91 98765 43217", address: "Plot 232, Chakan MIDC, Pune" },
    { name: "Chaitanya Biogas Plant", location: "Talegaon", industry: "Energy", accepts: "Food Waste", capacity: "6,000 kg/week", contact: "Dinesh Mehta", phone: "+91 98765 43218", address: "Talegaon-Chakan Road, Pune" },
    { name: "Sahyadri Bio-Fuels", location: "Talegaon", industry: "Energy", accepts: "Agricultural Waste", capacity: "10,000 kg/week", contact: "Anand Rao", phone: "+91 98765 43220", address: "MIDC Talegaon, Pune" },
    { name: "Sahyadri Recycled Aggregates", location: "Hinjawadi", industry: "Construction", accepts: "Construction Debris", capacity: "25,000 kg/week", contact: "Sunil Kadam", phone: "+91 98765 43219", address: "Hinjawadi Phase 3, Near IT Park, Pune" }
  ];

  // Coordinates mapping for Live Map
  const MAP_NODES = [
    { name: "Pune Center (FC Road)", id: "pune", cx: 280, cy: 380, lat: 18.5204, lon: 73.8400, desc: "Logistics Hub & HQ", partners: 0 },
    { name: "Hadapsar Regional Hub", id: "hadapsar", cx: 420, cy: 400, lat: 18.5089, lon: 73.9260, desc: "Agricultural & Manufacturing Center", partners: 2 },
    { name: "Chakan Industrial Zone", id: "chakan", cx: 300, cy: 120, lat: 18.7500, lon: 73.8500, desc: "High Capacity Automotive & recycling units", partners: 4 },
    { name: "Talegaon Energy Park", id: "talegaon", cx: 120, cy: 150, lat: 18.7300, lon: 73.6800, desc: "Composting & Biogas Plants", partners: 3 },
    { name: "Hinjawadi IT & Tech Park", id: "hinjawadi", cx: 180, cy: 300, lat: 18.5913, lon: 73.7389, desc: "Aggregate Construction Recycling Centers", partners: 1 },
    { name: "Pimpri Manufacturing Belt", id: "pimpri", cx: 240, cy: 260, lat: 18.6298, lon: 73.7997, desc: "Textile & Shredding Mills", partners: 1 }
  ];

  const MAP_CONNECTIONS = [
    {
      id: "chakan-hadapsar",
      from: "chakan",
      to: "hadapsar",
      fromName: "Chakan Industrial Zone",
      toName: "Hadapsar Regional Hub",
      material: "Machined Steel Scrap",
      distance: "23.4 km",
      revenue: "₹28,500",
      carbon: "1,200 kg CO2",
      x1: 300, y1: 120, x2: 420, y2: 400
    },
    {
      id: "talegaon-chakan",
      from: "talegaon",
      to: "chakan",
      fromName: "Talegaon Energy Park",
      toName: "Chakan Industrial Zone",
      material: "Organic Bio-pellets",
      distance: "15.1 km",
      revenue: "₹8,400",
      carbon: "480 kg CO2",
      x1: 120, y1: 150, x2: 300, y2: 120
    },
    {
      id: "hinjawadi-pimpri",
      from: "hinjawadi",
      to: "pimpri",
      fromName: "Hinjawadi IT & Tech Park",
      toName: "Pimpri Manufacturing Belt",
      material: "HDPE Plastic Granules",
      distance: "9.2 km",
      revenue: "₹14,500",
      carbon: "720 kg CO2",
      x1: 180, y1: 300, x2: 240, y2: 260
    },
    {
      id: "pimpri-chakan",
      from: "pimpri",
      to: "chakan",
      fromName: "Pimpri Manufacturing Belt",
      toName: "Chakan Industrial Zone",
      material: "Synthetic Textile Fiber",
      distance: "16.8 km",
      revenue: "₹9,200",
      carbon: "580 kg CO2",
      x1: 240, y1: 260, x2: 300, y2: 120
    },
    {
      id: "hadapsar-pune",
      from: "hadapsar",
      to: "pune",
      fromName: "Hadapsar Regional Hub",
      toName: "Pune Center (FC Road)",
      material: "Standardized Glass Cullet",
      distance: "11.5 km",
      revenue: "₹6,100",
      carbon: "320 kg CO2",
      x1: 420, y1: 400, x2: 280, y2: 380
    }
  ];

  return (
    <div
      className="min-h-screen bg-black text-white selection:bg-[#e8702a]/30 tracking-[-0.02em]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-[110] bg-neutral-900/95 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#e8702a]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5 bg-black/40 backdrop-blur-md border-b border-white/5">
        {/* Left Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => { setActiveTab('Home'); triggerToast("Navigated to Home"); }}>
          <svg
            width="26"
            height="26"
            viewBox="0 0 256 256"
            fill="#ffffff"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0 drop-shadow-md"
          >
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic font-medium tracking-tight">
            ReSource AI
          </span>
        </div>

        {/* Center Navigation Pill */}
        <div className="hidden md:flex bg-white/5 border border-white/10 rounded-full px-1.5 py-1.5 items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                onClick={() => {
                  setActiveTab(item);
                  triggerToast(`Opened ${item} view`);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#e8702a] text-white shadow-md shadow-[#e8702a]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Right Desktop Button */}
        <button
          onClick={() => {
            setActiveTab('Analyze');
            setAnalysisResult(null);
            triggerToast("Intake Wizard active");
          }}
          className="hidden md:block bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer shadow-md active:scale-95 duration-200"
        >
          Intake Form
        </button>

        {/* Mobile Menu Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-xl md:hidden flex flex-col justify-center px-8 py-20 gap-6 text-white animate-fade-in">
          <div className="flex flex-col gap-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setActiveTab(item);
                  setMobileMenuOpen(false);
                  triggerToast(`Selected ${item} view`);
                }}
                className={`text-left text-2xl font-medium transition-colors py-1 border-b border-white/10 ${
                  activeTab === item ? 'text-[#e8702a]' : 'text-white/80 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setActiveTab('Analyze');
              setAnalysisResult(null);
              triggerToast("Opening Intake Form...");
            }}
            className="w-full mt-6 bg-[#e8702a] text-white text-base font-semibold py-3.5 rounded-full hover:bg-[#d2611f] transition-colors"
          >
            Intake Form
          </button>
        </div>
      )}

      {/* -------------------- HOME VIEW -------------------- */}
      {activeTab === 'Home' && (
        <div className="relative">
          {/* Spotlight Hero Section */}
          <section className="relative w-full overflow-hidden h-screen bg-black flex flex-col justify-between p-6 sm:p-12 md:p-20 md:px-24 pt-28 pb-10 sm:pb-14" style={{ height: '100dvh' }}>
            {/* Layer 1: Base Image (z-10) with slow float and zoom */}
            <div
              className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 animate-slow-float"
              style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
            />

            {/* Layer 2: Reveal Image (z-30) inside spotlight mask, animated in sync */}
            <RevealLayer image={BG_IMAGE_2} cursorX={cursorPos.x} cursorY={cursorPos.y} className="animate-slow-float" />

            {/* Layer 2.5: Floating Particle Canvas Overlay */}
            <canvas
              ref={particlesCanvasRef}
              className="absolute inset-0 pointer-events-none z-45 opacity-60"
            />

            {/* Layer 3: Overlapping Typography */}
            <div className="relative z-50 max-w-4xl pointer-events-none text-left select-none font-sans mt-2">
              <span className="inline-block text-xs font-semibold tracking-widest text-[#e8702a] uppercase bg-[#e8702a]/10 px-3.5 py-1.5 rounded-full mb-5">
                ReSource AI // Material Intelligence
              </span>
              <h1 className="text-white font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-[-0.04em] uppercase">
                Every <span className="font-playfair italic font-light lowercase tracking-tight normal-case text-[#e8702a]">by-product</span> <br/>
                deserves another purpose.
              </h1>
              <p className="text-white/60 font-light text-sm sm:text-base md:text-lg max-w-xl mt-6 leading-relaxed normal-case">
                We map secondary material chemistry to regional industrial sinks—powering a search engine for the circular economy.
              </p>
            </div>

            {/* Bottom row containing detailed descriptions and call-to-actions */}
            <div className="relative z-50 flex flex-col md:flex-row md:items-end justify-between gap-8 w-full mt-auto">
              
              {/* Bottom-Left Detail */}
              <div className="hidden md:block max-w-[320px] text-left font-sans pointer-events-none">
                <p className="text-[11px] uppercase tracking-wider text-[#e8702a] font-semibold mb-2">Branching Material Landscape</p>
                <p className="text-xs text-white/50 leading-relaxed font-light normal-case">
                  Hover to trace how coffee grounds, polymer flakes, textile scraps, and wood shavings transition into structural steel, compost, and bio-feedstock.
                </p>
              </div>

              {/* Bottom-Right CTA and Description */}
              <div className="max-w-full sm:max-w-[340px] flex flex-col items-start gap-4 font-sans text-left">
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light normal-case">
                  Our decision engine geolocates regional buyers to calculate Scope 3 logistics routing and carbon offsets.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('Analyze');
                    triggerToast("Opening Ingestion Form...");
                  }}
                  className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-semibold px-8 py-3.5 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30 pointer-events-auto cursor-pointer flex items-center gap-2"
                >
                  <span>Log Material Stream</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </section>

          {/* Scrollable Content Section below the fold */}
          <section className="bg-neutral-950 border-t border-white/10 py-24 px-6 relative z-50">
            <div className="max-w-7xl mx-auto">
              
              {/* Material Flow Pipelines */}
              <div className="mb-28 text-left font-sans">
                <span className="text-xs font-semibold tracking-widest text-[#e8702a] uppercase bg-[#e8702a]/10 px-3.5 py-1.5 rounded-full">
                  Material Flow Pipelines
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-6 mb-4 tracking-tight uppercase">
                  Value is in the routing.
                </h2>
                <p className="text-white/60 max-w-xl font-light text-sm sm:text-base normal-case">
                  Each card represents an active circular match, transforming raw industrial waste streams into raw material assets.
                </p>

                {/* Micro-story cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
                  
                  {/* Micro-story 1 */}
                  <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between hover:border-[#e8702a]/30 transition-all duration-500 group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#e8702a]/5 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#e8702a] bg-[#e8702a]/10 px-3 py-1 rounded-full">
                          Organic Loop
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">ID: ML-084</span>
                      </div>
                      
                      {/* Flow visual */}
                      <div className="space-y-4 my-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#e8702a]" />
                          <div>
                            <div className="text-[10px] text-white/40 uppercase font-semibold">Source Material</div>
                            <div className="text-sm font-bold text-white">Spent Coffee Grounds</div>
                          </div>
                        </div>
                        <div className="h-6 w-0.5 bg-gradient-to-b from-[#e8702a] to-emerald-500 ml-1.25" />
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <div>
                            <div className="text-[10px] text-white/40 uppercase font-semibold">Matched Recipient</div>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>Green Mushroom Farm</span>
                              <span className="text-[10px] font-normal text-white/40">(Hadapsar)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-6 mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-semibold">Revenue Created</div>
                        <div className="text-lg font-extrabold text-white font-mono mt-1">₹5,000<span className="text-xs font-light text-white/50">/ton</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-semibold">Carbon Offset</div>
                        <div className="text-lg font-extrabold text-emerald-400 font-mono mt-1">-650kg <span className="text-xs font-light text-white/50">CO2</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Micro-story 2 */}
                  <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between hover:border-[#e8702a]/30 transition-all duration-500 group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-400/5 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-400/10 px-3 py-1 rounded-full">
                          Polymer Loop
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">ID: ML-102</span>
                      </div>
                      
                      {/* Flow visual */}
                      <div className="space-y-4 my-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                          <div>
                            <div className="text-[10px] text-white/40 uppercase font-semibold">Source Material</div>
                            <div className="text-sm font-bold text-white">PET Plastic Flakes</div>
                          </div>
                        </div>
                        <div className="h-6 w-0.5 bg-gradient-to-b from-sky-400 to-emerald-500 ml-1.25" />
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <div>
                            <div className="text-[10px] text-white/40 uppercase font-semibold">Matched Recipient</div>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>PolyRecycle Industries</span>
                              <span className="text-[10px] font-normal text-white/40">(Chakan)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-6 mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-semibold">Revenue Created</div>
                        <div className="text-lg font-extrabold text-white font-mono mt-1">₹12,000<span className="text-xs font-light text-white/50">/ton</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-semibold">Carbon Offset</div>
                        <div className="text-lg font-extrabold text-emerald-400 font-mono mt-1">-1,800kg <span className="text-xs font-light text-white/50">CO2</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Micro-story 3 */}
                  <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between hover:border-[#e8702a]/30 transition-all duration-500 group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                          Timber Loop
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">ID: ML-049</span>
                      </div>
                      
                      {/* Flow visual */}
                      <div className="space-y-4 my-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <div>
                            <div className="text-[10px] text-white/40 uppercase font-semibold">Source Material</div>
                            <div className="text-sm font-bold text-white">Sawmill Sawdust Scraps</div>
                          </div>
                        </div>
                        <div className="h-6 w-0.5 bg-gradient-to-b from-amber-500 to-emerald-500 ml-1.25" />
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <div>
                            <div className="text-[10px] text-white/40 uppercase font-semibold">Matched Recipient</div>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>Deccan Particle Boards</span>
                              <span className="text-[10px] font-normal text-white/40">(Chakan)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-6 mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-semibold">Revenue Created</div>
                        <div className="text-lg font-extrabold text-white font-mono mt-1">₹4,500<span className="text-xs font-light text-white/50">/ton</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-semibold">Carbon Offset</div>
                        <div className="text-lg font-extrabold text-emerald-400 font-mono mt-1">-850kg <span className="text-xs font-light text-white/50">CO2</span></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* How It Works */}
              <div className="border-t border-white/5 pt-24 mb-28">
                <div className="text-center mb-16 font-sans">
                  <span className="text-xs font-semibold tracking-widest text-[#e8702a] uppercase bg-[#e8702a]/10 px-3.5 py-1.5 rounded-full">
                    Operational Protocol
                  </span>
                  <h3 className="text-3xl sm:text-5xl font-extrabold text-white mt-6 mb-4 tracking-tight uppercase">
                    The Circular Routing Engine
                  </h3>
                  <p className="text-white/40 text-xs sm:text-sm mt-3 max-w-lg mx-auto font-light normal-case">
                    How ReSource AI maps byproduct chemistry to regional industrial sinks in real-time.
                  </p>
                </div>

                {/* Horizontal Connected Process Map */}
                <div className="relative px-4 font-sans">
                  {/* SVG Connector Line (Desktop) */}
                  <div className="hidden lg:block absolute top-[21px] left-12 right-12 h-1 z-0 pointer-events-none">
                    <svg className="w-full h-2 overflow-visible" fill="none">
                      <line
                        x1="0"
                        y1="2"
                        x2="100%"
                        y2="2"
                        stroke="rgba(232, 112, 42, 0.15)"
                        strokeWidth="2"
                      />
                      <line
                        x1="0"
                        y1="2"
                        x2="100%"
                        y2="2"
                        stroke="#e8702a"
                        strokeWidth="2"
                        className="animate-dash"
                      />
                    </svg>
                  </div>

                  {/* Vertical Connector Line (Mobile) */}
                  <div className="lg:hidden absolute top-8 bottom-8 left-[29px] w-0.5 z-0 pointer-events-none">
                    <svg className="w-2 h-full overflow-visible" fill="none">
                      <line
                        x1="2"
                        y1="0"
                        x2="2"
                        y2="100%"
                        stroke="rgba(232, 112, 42, 0.15)"
                        strokeWidth="2"
                      />
                      <line
                        x1="2"
                        y1="0"
                        x2="2"
                        y2="100%"
                        stroke="#e8702a"
                        strokeWidth="2"
                        className="animate-dash"
                      />
                    </svg>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 lg:gap-4 relative z-10">
                    {/* Step 1 */}
                    <div className="flex lg:flex-col items-start gap-4 lg:gap-0 lg:text-center group">
                      <div className="w-11 h-11 rounded-full bg-[#1c1c1c] border-2 border-[#e8702a] flex items-center justify-center shrink-0 lg:mx-auto mb-4 group-hover:bg-[#e8702a] group-hover:text-black transition-colors duration-300">
                        <span className="text-xs font-bold font-mono text-white group-hover:text-black">01</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#e8702a] tracking-wider uppercase block mb-1">Waste</span>
                        <h4 className="text-xs font-bold text-white mb-1.5 uppercase">Ingestion</h4>
                        <p className="text-[10px] text-white/50 leading-relaxed max-w-[150px] lg:mx-auto font-light normal-case">
                          Identify raw by-product stream volumes.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex lg:flex-col items-start gap-4 lg:gap-0 lg:text-center group">
                      <div className="w-11 h-11 rounded-full bg-[#1c1c1c] border-2 border-[#e8702a]/40 flex items-center justify-center shrink-0 lg:mx-auto mb-4 group-hover:border-[#e8702a] group-hover:bg-[#e8702a] transition-all duration-300">
                        <span className="text-xs font-bold font-mono text-white group-hover:text-black">02</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#e8702a] tracking-wider uppercase block mb-1">Understanding</span>
                        <h4 className="text-xs font-bold text-white mb-1.5 uppercase">Material Science</h4>
                        <p className="text-[10px] text-white/50 leading-relaxed max-w-[150px] lg:mx-auto font-light normal-case">
                          Analyze physical and chemical properties.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex lg:flex-col items-start gap-4 lg:gap-0 lg:text-center group">
                      <div className="w-11 h-11 rounded-full bg-[#1c1c1c] border-2 border-[#e8702a]/40 flex items-center justify-center shrink-0 lg:mx-auto mb-4 group-hover:border-[#e8702a] group-hover:bg-[#e8702a] transition-all duration-300">
                        <span className="text-xs font-bold font-mono text-white group-hover:text-black">03</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#e8702a] tracking-wider uppercase block mb-1">Classification</span>
                        <h4 className="text-xs font-bold text-white mb-1.5 uppercase">Semantic Match</h4>
                        <p className="text-[10px] text-white/50 leading-relaxed max-w-[150px] lg:mx-auto font-light normal-case">
                          Resolve synonyms and standardize taxonomies.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex lg:flex-col items-start gap-4 lg:gap-0 lg:text-center group">
                      <div className="w-11 h-11 rounded-full bg-[#1c1c1c] border-2 border-[#e8702a]/40 flex items-center justify-center shrink-0 lg:mx-auto mb-4 group-hover:border-[#e8702a] group-hover:bg-[#e8702a] transition-all duration-300">
                        <span className="text-xs font-bold font-mono text-white group-hover:text-black">04</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#e8702a] tracking-wider uppercase block mb-1">Matching</span>
                        <h4 className="text-xs font-bold text-white mb-1.5 uppercase">Business Routing</h4>
                        <p className="text-[10px] text-white/50 leading-relaxed max-w-[150px] lg:mx-auto font-light normal-case">
                          Geolocate nearest logistics-compatible receivers.
                        </p>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex lg:flex-col items-start gap-4 lg:gap-0 lg:text-center group">
                      <div className="w-11 h-11 rounded-full bg-[#1c1c1c] border-2 border-[#e8702a]/40 flex items-center justify-center shrink-0 lg:mx-auto mb-4 group-hover:border-[#e8702a] group-hover:bg-[#e8702a] transition-all duration-300">
                        <span className="text-xs font-bold font-mono text-white group-hover:text-black">05</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#e8702a] tracking-wider uppercase block mb-1">Analysis</span>
                        <h4 className="text-xs font-bold text-white mb-1.5 uppercase">Impact Audit</h4>
                        <p className="text-[10px] text-white/50 leading-relaxed max-w-[150px] lg:mx-auto font-light normal-case">
                          Calculate carbon offset factor and diverted weight.
                        </p>
                      </div>
                    </div>

                    {/* Step 6 */}
                    <div className="flex lg:flex-col items-start gap-4 lg:gap-0 lg:text-center group">
                      <div className="w-11 h-11 rounded-full bg-[#1c1c1c] border-2 border-[#e8702a]/40 flex items-center justify-center shrink-0 lg:mx-auto mb-4 group-hover:border-[#e8702a] group-hover:bg-[#e8702a] transition-all duration-300">
                        <span className="text-xs font-bold font-mono text-white group-hover:text-black">06</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#e8702a] tracking-wider uppercase block mb-1">Recommendations</span>
                        <h4 className="text-xs font-bold text-white mb-1.5 uppercase">AI Modeling</h4>
                        <p className="text-[10px] text-white/50 leading-relaxed max-w-[150px] lg:mx-auto font-light normal-case">
                          Create outreach emails and logistic compliance.
                        </p>
                      </div>
                    </div>

                    {/* Step 7 */}
                    <div className="flex lg:flex-col items-start gap-4 lg:gap-0 lg:text-center group">
                      <div className="w-11 h-11 rounded-full bg-[#1c1c1c] border-2 border-[#e8702a]/40 flex items-center justify-center shrink-0 lg:mx-auto mb-4 group-hover:border-[#e8702a] group-hover:bg-[#e8702a] transition-all duration-300">
                        <span className="text-xs font-bold font-mono text-white group-hover:text-black">07</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#e8702a] tracking-wider uppercase block mb-1">Circular Economy</span>
                        <h4 className="text-xs font-bold text-white mb-1.5 uppercase">Value Realization</h4>
                        <p className="text-[10px] text-white/50 leading-relaxed max-w-[150px] lg:mx-auto font-light normal-case">
                          Close the loop and capture realized economic gains.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Showcase Sandbox */}
              <div className="border-t border-white/5 pt-24 mb-28">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center font-sans">
                  
                  {/* Left Column: Context & Presets */}
                  <div className="lg:col-span-5 space-y-6 text-left">
                    <span className="text-xs font-semibold tracking-widest text-[#e8702a] uppercase bg-[#e8702a]/10 px-3.5 py-1.5 rounded-full font-mono animate-pulse">
                      AI Ingestion Simulator
                    </span>
                    <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight uppercase font-sans">
                      Watch the <span className="font-playfair italic font-light lowercase text-[#e8702a] tracking-tight normal-case">AI</span> think.
                    </h3>
                    <p className="text-white/60 text-sm font-light leading-relaxed normal-case">
                      Select a raw waste stream query preset below to watch ReSource AI resolve raw synonym text into standardized chemistry, logistics matching, and impact math.
                    </p>

                    {/* Presets Row/Col */}
                    <div className="space-y-3 pt-4">
                      {DEMO_PRESETS.map((preset, idx) => (
                        <button
                          key={preset.input}
                          onClick={() => runDemoPipeline(idx)}
                          className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                            demoActiveIndex === idx
                              ? 'bg-neutral-900 border-[#e8702a] shadow-lg shadow-[#e8702a]/5'
                              : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-neutral-900/30'
                          }`}
                        >
                          <div className="max-w-[85%] font-sans normal-case">
                            <div className="text-[10px] uppercase font-bold text-[#e8702a] mb-1">{preset.category}</div>
                            <div className="text-xs text-white/80 font-medium truncate">{preset.input}</div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-white/10 flex items-center justify-center shrink-0 group-hover:border-[#e8702a] group-hover:bg-[#e8702a]/10 transition-colors">
                            <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:text-[#e8702a]" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Animated Terminal Mockup */}
                  <div className="lg:col-span-7 bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative min-h-[460px] flex flex-col justify-between overflow-hidden">
                    {/* Glowing status bar */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#e8702a] to-transparent opacity-45" />

                    {/* Terminal Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 font-sans">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        <span className="text-[10px] text-white/30 font-mono ml-2 uppercase tracking-widest">material_auditor_v1.0</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${demoRunning ? 'bg-[#e8702a] animate-ping' : 'bg-emerald-500'}`} />
                        <span className="text-[9px] font-mono uppercase text-white/40 font-bold">
                          {demoRunning ? "auditing..." : "standby"}
                        </span>
                      </div>
                    </div>

                    {/* Terminal Content */}
                    <div className="space-y-3.5 flex-grow font-mono text-xs text-left">
                      {/* Query prompt */}
                      <div className="bg-[#141414] border border-white/5 rounded-xl p-4 mb-6">
                        <span className="text-[#e8702a] font-bold">&gt; Ingest Query: </span>
                        <span className="text-white/80">"{DEMO_PRESETS[demoActiveIndex].input}"</span>
                      </div>

                      {/* Step 1: Standardization */}
                      {demoStep >= 1 ? (
                        <div className="border border-[#e8702a]/10 bg-neutral-900/30 rounded-xl p-3.5 flex items-center justify-between animate-fade-in border-l-2 border-l-[#e8702a]">
                          <div className="space-y-1">
                            <span className="text-[9px] text-[#e8702a] font-bold uppercase tracking-wider">01 // Semantic Taxonomy Classification</span>
                            <div className="text-white text-xs font-semibold">
                              Detected: <span className="text-[#e8702a]">{DEMO_PRESETS[demoActiveIndex].detected}</span>
                            </div>
                          </div>
                          <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 ml-4" />
                        </div>
                      ) : demoRunning && demoStep === 0 ? (
                        <div className="h-10 flex items-center gap-2 text-white/30 italic pl-4 animate-pulse">
                          <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#e8702a] rounded-full animate-spin" />
                          <span>Standardizing chemical composition...</span>
                        </div>
                      ) : null}

                      {/* Step 2: Uses */}
                      {demoStep >= 2 ? (
                        <div className="border border-[#e8702a]/10 bg-neutral-900/30 rounded-xl p-3.5 flex items-center justify-between animate-fade-in border-l-2 border-l-emerald-500">
                          <div className="space-y-1">
                            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">02 // Physical Trait Compatibility</span>
                            <div className="text-white text-xs font-semibold flex flex-wrap gap-1.5 mt-1">
                              {DEMO_PRESETS[demoActiveIndex].uses.map((use, uIdx) => (
                                <span key={uIdx} className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/10">
                                  {use}
                                </span>
                              ))}
                            </div>
                          </div>
                          <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 ml-4" />
                        </div>
                      ) : demoRunning && demoStep === 1 ? (
                        <div className="h-10 flex items-center gap-2 text-white/30 italic pl-4 animate-pulse">
                          <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#e8702a] rounded-full animate-spin" />
                          <span>Scanning physical compatibilities...</span>
                        </div>
                      ) : null}

                      {/* Step 3: Match */}
                      {demoStep >= 3 ? (
                        <div className="border border-[#e8702a]/10 bg-neutral-900/30 rounded-xl p-3.5 flex items-center justify-between animate-fade-in border-l-2 border-l-[#e8702a]">
                          <div className="space-y-1">
                            <span className="text-[9px] text-[#e8702a] font-bold uppercase tracking-wider">03 // Geodetic Logistics Routing</span>
                            <div className="text-white text-xs font-semibold">
                              Nearest Sink: <span className="text-white font-bold">{DEMO_PRESETS[demoActiveIndex].match}</span>
                              <span className="text-white/40 text-[10px] font-normal ml-2">({DEMO_PRESETS[demoActiveIndex].distance})</span>
                            </div>
                          </div>
                          <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 ml-4" />
                        </div>
                      ) : demoRunning && demoStep === 2 ? (
                        <div className="h-10 flex items-center gap-2 text-white/30 italic pl-4 animate-pulse">
                          <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#e8702a] rounded-full animate-spin" />
                          <span>Calculating geodetic distance matrices...</span>
                        </div>
                      ) : null}

                      {/* Step 4: Carbon */}
                      {demoStep >= 4 ? (
                        <div className="border border-[#e8702a]/10 bg-neutral-900/30 rounded-xl p-3.5 flex items-center justify-between animate-fade-in border-l-2 border-l-emerald-500">
                          <div className="space-y-1">
                            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">04 // Carbon Offset Math</span>
                            <div className="text-emerald-400 text-xs font-bold font-mono">
                              Diverted emissions: {DEMO_PRESETS[demoActiveIndex].carbon}
                            </div>
                          </div>
                          <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 ml-4" />
                        </div>
                      ) : demoRunning && demoStep === 3 ? (
                        <div className="h-10 flex items-center gap-2 text-white/30 italic pl-4 animate-pulse">
                          <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#e8702a] rounded-full animate-spin" />
                          <span>Evaluating transportation offset multipliers...</span>
                        </div>
                      ) : null}

                      {/* Step 5: Revenue */}
                      {demoStep >= 5 ? (
                        <div className="border border-[#e8702a]/25 bg-[#e8702a]/5 rounded-xl p-3.5 flex items-center justify-between animate-fade-in border-l-4 border-l-[#e8702a]">
                          <div className="space-y-1">
                            <span className="text-[9px] text-[#e8702a] font-bold uppercase tracking-wider">05 // Financial Yield Estimate</span>
                            <div className="text-white text-xs font-bold font-mono">
                              Projected B2B Value: <span className="text-amber-400">{DEMO_PRESETS[demoActiveIndex].revenue}</span>
                            </div>
                          </div>
                          <CheckCircle className="w-4.5 h-4.5 text-[#e8702a] shrink-0 ml-4" />
                        </div>
                      ) : demoRunning && demoStep === 4 ? (
                        <div className="h-10 flex items-center gap-2 text-white/30 italic pl-4 animate-pulse">
                          <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#e8702a] rounded-full animate-spin" />
                          <span>Assessing market rate index matrix...</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Trigger Button */}
                    <div className="mt-8 border-t border-white/5 pt-4 flex items-center justify-between font-sans">
                      <span className="text-[10px] text-white/35 font-light">
                        Click presets on the left to trace material loops.
                      </span>
                      <button
                        onClick={() => runDemoPipeline(demoActiveIndex)}
                        disabled={demoRunning}
                        className="bg-white text-black text-xs font-bold px-6 py-2.5 rounded-full shadow-lg active:scale-95 transition-all hover:bg-neutral-100 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        <span>Analyze Stream</span>
                        <Sparkles className="w-3.5 h-3.5 text-[#e8702a]" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom CTA Panel */}
              <div className="bg-gradient-to-r from-[#e8702a]/10 via-[#e8702a]/5 to-transparent border border-white/10 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 mt-16 text-left font-sans">
                <div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
                    Ready to map circular value?
                  </h3>
                  <p className="text-white/60 mt-3 max-w-xl text-sm font-light">
                    Submit your first material log to evaluate offset indices, financial revenue possibilities, and print localized buyer contacts.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('Analyze');
                    setAnalysisResult(null);
                    triggerToast("Intake wizard active");
                  }}
                  className="bg-white text-black hover:bg-neutral-100 font-semibold px-8 py-3 rounded-full shrink-0 shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Open Ingestion Form</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </section>
        </div>
      )}

      {/* -------------------- ANALYZE VIEW & RESULTS -------------------- */}
      {activeTab === 'Analyze' && (
        <section className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
          
          {/* progressive loader overlay during analysis */}
          {isAnalyzing && (
            <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
              <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
                {/* Glowing status line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e8702a] to-transparent animate-pulse" />
                
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-[#e8702a]/20 border-t-[#e8702a] rounded-full animate-spin mx-auto" />
                  <Sparkles className="w-6 h-6 text-[#e8702a] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Analyzing Circular Yields</h3>
                <p className="text-xs text-white/50 mb-8 max-w-xs mx-auto">
                  Running computational models and calling Gemini Generative Services...
                </p>

                {/* Simulated Steps */}
                <div className="text-left space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${analysisPhase >= 1 ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-white/30'}`}>
                      {analysisPhase > 1 ? <Check className="w-3 h-3" /> : "1"}
                    </div>
                    <span className={`text-xs ${analysisPhase >= 1 ? 'text-white' : 'text-white/30'}`}>Standardizing raw description synonyms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${analysisPhase >= 2 ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-white/30'}`}>
                      {analysisPhase > 2 ? <Check className="w-3 h-3" /> : "2"}
                    </div>
                    <span className={`text-xs ${analysisPhase >= 2 ? 'text-white' : 'text-white/30'}`}>Resolving logistics lat/long offsets</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${analysisPhase >= 3 ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-white/30'}`}>
                      {analysisPhase > 3 ? <Check className="w-3 h-3" /> : "3"}
                    </div>
                    <span className={`text-xs ${analysisPhase >= 3 ? 'text-white' : 'text-white/30'}`}>Evaluating Scope 3 logistics transport emissions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${analysisPhase >= 4 ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-white/30'}`}>
                      {analysisPhase > 4 ? <Check className="w-3 h-3" /> : "4"}
                    </div>
                    <span className={`text-xs ${analysisPhase >= 4 ? 'text-white' : 'text-white/30'}`}>Consulting Gemini 2.5 flash chemical auditor</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${analysisPhase >= 5 ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-white/30'}`}>
                      {analysisPhase >= 5 ? <Check className="w-3 h-3" /> : "5"}
                    </div>
                    <span className={`text-xs ${analysisPhase >= 5 ? 'text-white' : 'text-white/30'}`}>Writing persist tables into local SQLite</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Render Form when no result exists */}
          {!analysisResult ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Explanatory Panel Left */}
              <div className="lg:col-span-5 space-y-6">
                <span className="text-xs font-semibold tracking-widest text-[#e8702a] uppercase bg-[#e8702a]/10 px-3.5 py-1.5 rounded-full">
                  Ingestion Engine
                </span>
                <h2 className="text-3xl sm:text-5xl font-playfair font-normal italic text-white tracking-tight text-white mt-4">
                  Log Secondary Material
                </h2>
                <p className="text-sm text-white/60 leading-relaxed font-light">
                  Input raw materials and byproducts from production lines. Standardize names locally, compute shipping impact matrices and query LLM models to identify secondary buyers in the Pune MIDC grids.
                </p>

                <div className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-neutral-900 border border-white/5 shrink-0 text-[#e8702a]">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Pune Geographic Focus</h4>
                      <p className="text-xs text-white/50 mt-1">Geocodes and computes coordinate distances specifically for Hadapsar, Chakan, Talegaon, Hinjawadi, and Pimpri industrial areas.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-neutral-900 border border-white/5 shrink-0 text-emerald-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Gemini 2.5 Flash Inquiries</h4>
                      <p className="text-xs text-white/50 mt-1">Generates chemical audits, logistics compliance guidelines and B2B outreach templates on the fly.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input Right */}
              <div className="lg:col-span-7 bg-neutral-900/50 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative">
                <form onSubmit={submitAnalysis} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-white/50 mb-2">Business Name *</label>
                      <input
                        type="text"
                        name="business_name"
                        required
                        value={formState.business_name}
                        onChange={handleInputChange}
                        placeholder="e.g., Pune Bakery Co."
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#e8702a] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-white/50 mb-2">Industry Sector</label>
                      <select
                        name="industry"
                        value={formState.industry}
                        onChange={handleInputChange}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e8702a] focus:outline-none transition-colors"
                      >
                        <option>Food & Beverage</option>
                        <option>Woodworking & Carpentry</option>
                        <option>Garment Manufacturing</option>
                        <option>Industrial Polymers</option>
                        <option>Glass Works</option>
                        <option>Metallurgical Foundry</option>
                        <option>Construction & Real Estate</option>
                        <option>Agriculture & Farming</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-white/50 mb-2">Waste Stream Title * (synonym checks apply)</label>
                    <input
                      type="text"
                      name="waste_type"
                      required
                      value={formState.waste_type}
                      onChange={handleInputChange}
                      placeholder="e.g., spent coffee grounds, wood dust, scrap plastic clippings"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#e8702a] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-white/50 mb-2">Composition Description & Storage Specs</label>
                    <textarea
                      name="description"
                      value={formState.description}
                      onChange={handleInputChange}
                      placeholder="Specify moisture contents, plastic grade, packing type or delivery limits..."
                      rows={3}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#e8702a] focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-white/50 mb-2">Quantity generated * (kg)</label>
                      <input
                        type="number"
                        name="quantity"
                        required
                        value={formState.quantity}
                        onChange={handleInputChange}
                        placeholder="e.g., 500"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#e8702a] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-white/50 mb-2">Frequency</label>
                      <select
                        name="frequency"
                        value={formState.frequency}
                        onChange={handleInputChange}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e8702a] focus:outline-none transition-colors"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="annually">Annually</option>
                        <option value="one-time">One-time / Batch</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-white/50 mb-2">Origin Location (Pune region)</label>
                      <select
                        name="location"
                        value={formState.location}
                        onChange={handleInputChange}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e8702a] focus:outline-none transition-colors"
                      >
                        <option value="Hadapsar">Hadapsar</option>
                        <option value="Chakan">Chakan</option>
                        <option value="Talegaon">Talegaon</option>
                        <option value="Hinjawadi">Hinjawadi</option>
                        <option value="Pimpri">Pimpri</option>
                        <option value="Kothrud">Kothrud / Pune Center</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-white/50 mb-2">Current Disposal Method</label>
                      <select
                        name="current_disposal_method"
                        value={formState.current_disposal_method}
                        onChange={handleInputChange}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e8702a] focus:outline-none transition-colors"
                      >
                        <option value="landfill">Landfill Dump</option>
                        <option value="incineration">Incineration (burning)</option>
                        <option value="composting">Composting</option>
                        <option value="unknown">Unspecified/Unknown</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-semibold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Initiate Analytical Audit</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          ) : (
            // Results Display
            <div className="space-y-8 animate-fade-in">
              {/* Header Action Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                  <button
                    onClick={() => { setAnalysisResult(null); setIsAnalyzing(false); }}
                    className="text-xs text-[#e8702a] font-semibold flex items-center gap-1 hover:underline cursor-pointer mb-2"
                  >
                    &larr; Back to Intake Form
                  </button>
                  <h2 className="text-2xl sm:text-4xl font-playfair font-normal italic text-white">
                    Analysis Completed for {analysisResult.business_name}
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Matched Taxonomy Stream: <strong className="text-white">{analysisResult.waste_type_standard}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 bg-neutral-900 border border-white/5 rounded-full px-5 py-2">
                  <span className="text-xs font-semibold text-white/60">Circular Economy Score:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {Math.round(analysisResult.match_confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Core metrics row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <Leaf className="w-6 h-6 text-emerald-400 mb-4" />
                  <div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {analysisResult.nearby_businesses[0]?.carbon_saved_kg_monthly.toLocaleString() || 'N/A'} kg
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Monthly CO2 Savings</div>
                  </div>
                </div>

                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <Activity className="w-6 h-6 text-[#e8702a] mb-4" />
                  <div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {analysisResult.nearby_businesses[0]?.landfill_diverted_kg_monthly.toLocaleString() || 'N/A'} kg
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Landfill waste diverted</div>
                  </div>
                </div>

                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <DollarSign className="w-6 h-6 text-amber-400 mb-4" />
                  <div>
                    <div className="text-2xl font-bold font-mono text-white">
                      ₹{analysisResult.nearby_businesses[0]?.potential_monthly_revenue.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Potential monthly revenue</div>
                  </div>
                </div>

                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <MapPin className="w-6 h-6 text-sky-400 mb-4" />
                  <div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {analysisResult.nearby_businesses[0]?.distance_km || 'N/A'} km
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Logistics Shipping Distance</div>
                  </div>
                </div>
              </div>

              {/* Main Match and AI Insights Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Primary Buyer details + AI guidelines */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Primary Partner Match Card */}
                  {analysisResult.nearby_businesses.length > 0 && (
                    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-[#e8702a]/10 border-l border-b border-[#e8702a]/20 text-[#e8702a] text-[10px] font-semibold tracking-wider uppercase px-4 py-1.5 rounded-bl-xl">
                        Primary Partner Match
                      </div>

                      <h3 className="text-xl font-bold text-white mb-6">Partner Organization</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Building className="w-4 h-4 text-white/40 shrink-0" />
                            <div>
                              <div className="text-[10px] text-white/40 uppercase">Organization Name</div>
                              <div className="text-sm font-semibold text-white">{analysisResult.nearby_businesses[0].business_name}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Layers className="w-4 h-4 text-white/40 shrink-0" />
                            <div>
                              <div className="text-[10px] text-white/40 uppercase">Industry Sector</div>
                              <div className="text-sm font-semibold text-white">{analysisResult.nearby_businesses[0].industry}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-white/40 shrink-0" />
                            <div>
                              <div className="text-[10px] text-white/40 uppercase">Delivery Address</div>
                              <div className="text-sm font-semibold text-white">{analysisResult.nearby_businesses[0].address}</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-white/40 shrink-0" />
                            <div>
                              <div className="text-[10px] text-white/40 uppercase">Contact Representative</div>
                              <div className="text-sm font-semibold text-white">{analysisResult.nearby_businesses[0].contact_person}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-white/40 shrink-0" />
                            <div>
                              <div className="text-[10px] text-white/40 uppercase">Phone contact</div>
                              <div className="text-sm font-semibold text-white">{analysisResult.nearby_businesses[0].phone}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Compass className="w-4 h-4 text-white/40 shrink-0" />
                            <div>
                              <div className="text-[10px] text-white/40 uppercase">Circular Pipeline Target</div>
                              <div className="text-sm font-semibold text-[#e8702a]">{analysisResult.top_opportunity.opportunity_name}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gemini Recommendations Sheets */}
                  <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#e8702a]" />
                      <span>Gemini AI Circular Audit</span>
                    </h3>

                    <div className="space-y-6 text-sm leading-relaxed">
                      {/* Compatibility logic */}
                      <div className="border-b border-white/5 pb-5">
                        <h4 className="text-xs font-semibold uppercase text-white/40 tracking-wider mb-2">Material Science Compatibility</h4>
                        <div className="text-white/80 font-light" dangerouslySetInnerHTML={{ __html: analysisResult.ai_explanation.replace(/\n/g, '<br />') }} />
                      </div>

                      {/* Environmental Audit */}
                      <div className="border-b border-white/5 pb-5">
                        <h4 className="text-xs font-semibold uppercase text-white/40 tracking-wider mb-2">Environmental Benefits Log</h4>
                        <div className="text-white/80 font-light" dangerouslySetInnerHTML={{ __html: analysisResult.environmental_benefits.replace(/\n/g, '<br />') }} />
                      </div>

                      {/* Financial gains */}
                      <div className="border-b border-white/5 pb-5">
                        <h4 className="text-xs font-semibold uppercase text-white/40 tracking-wider mb-2">Financial Return Analysis</h4>
                        <div className="text-white/80 font-light" dangerouslySetInnerHTML={{ __html: analysisResult.financial_benefits.replace(/\n/g, '<br />') }} />
                      </div>

                      {/* Suggested Next Steps Checklist */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-white/40 tracking-wider mb-4">Operational Compliance checklist</h4>
                        <ul className="space-y-3">
                          {analysisResult.suggested_next_steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                className="mt-1 accent-[#e8702a] w-4 h-4 rounded border-white/10 bg-black"
                              />
                              <span className="text-white/85 text-xs sm:text-sm font-light">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: B2B Email outreach template */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Outreach template envelope */}
                  <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 relative flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-semibold text-[#e8702a] uppercase tracking-wider">
                        B2B Outreach Envelope
                      </span>
                      <button
                        onClick={copyEmailToClipboard}
                        className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-xl border border-white/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs"
                      >
                        {emailCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{emailCopied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex-grow font-mono text-[11px] leading-relaxed text-white/70 h-[380px] overflow-y-auto select-text whitespace-pre-wrap">
                      {analysisResult.generated_outreach_email}
                    </div>

                    <div className="mt-4 text-[10px] text-white/40 text-center leading-relaxed">
                      This template is custom generated by the Gemini engine based on coordinates distance and buyer needs.
                    </div>
                  </div>

                  {/* Alternative Opportunities */}
                  {analysisResult.other_opportunities.length > 0 && (
                    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-5">
                      <h4 className="text-xs font-semibold text-white/50 uppercase mb-3.5 tracking-wider">Alternative Pathways</h4>
                      <div className="space-y-3">
                        {analysisResult.other_opportunities.map((opp, idx) => (
                          <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-3.5">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-white">{opp.opportunity_name}</span>
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                Value: {opp.estimated_value_per_unit_inr} INR/kg
                              </span>
                            </div>
                            <p className="text-[10px] text-white/40 mt-1.5 leading-relaxed">{opp.process_description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </section>
      )}

      {/* -------------------- DASHBOARD VIEW -------------------- */}
      {activeTab === 'Dashboard' && (
        <section className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
            <div>
              <span className="text-xs font-semibold tracking-widest text-[#e8702a] uppercase bg-[#e8702a]/10 px-3.5 py-1.5 rounded-full">
                Operations Board
              </span>
              <h2 className="text-3xl sm:text-5xl font-playfair font-normal italic text-white tracking-tight mt-4">
                Circular Dashboard
              </h2>
            </div>
            
            <button
              onClick={fetchDashboard}
              className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-full border border-white/10 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Refresh Metrics</span>
              <Activity className="w-3.5 h-3.5" />
            </button>
          </div>

          {dashboardLoading && !dashboardData ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-t-[#e8702a] border-[#e8702a]/20 rounded-full animate-spin" />
            </div>
          ) : dashboardData ? (
            <div className="space-y-8">
              
              {/* Aggregated Counts */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <Leaf className="w-6 h-6 text-emerald-400 mb-4" />
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
                      {dashboardData.total_co2_saved.toLocaleString()} kg
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Total CO2 Savings</div>
                  </div>
                </div>

                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <Activity className="w-6 h-6 text-[#e8702a] mb-4" />
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
                      {dashboardData.total_landfill_diverted.toLocaleString()} kg
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Total Landfill Diverted</div>
                  </div>
                </div>

                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <DollarSign className="w-6 h-6 text-amber-400 mb-4" />
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
                      ₹{dashboardData.total_revenue_generated.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Total Revenue Generated</div>
                  </div>
                </div>

                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <Users className="w-6 h-6 text-sky-400 mb-4" />
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
                      {dashboardData.active_partnerships_count}
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Active Partnerships</div>
                  </div>
                </div>
              </div>

              {/* Chart & Stats Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Custom SVG Line Chart */}
                <div className="lg:col-span-8 bg-neutral-900 border border-white/10 rounded-3xl p-6 flex flex-col justify-between min-h-[380px]">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                        GHG Offset Trend (Historical Logs)
                      </h4>
                      <span className="text-xs text-white/40 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Carbon saved per entry</span>
                      </span>
                    </div>

                    {/* Chart Body */}
                    <div className="relative w-full h-[240px] mt-4 flex items-center justify-center">
                      {dashboardData.recent_logs.length === 0 ? (
                        <div className="text-xs text-white/30 flex flex-col items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          <span>No logged material evaluations to graph.</span>
                        </div>
                      ) : (
                        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#e8702a" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#e8702a" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          
                          {/* Grid Lines */}
                          <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.04)" strokeDasharray="3" />
                          <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.04)" strokeDasharray="3" />
                          <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.04)" strokeDasharray="3" />
                          
                          {/* Path generation */}
                          {(() => {
                            const logs = [...dashboardData.recent_logs].reverse();
                            const maxVal = Math.max(...logs.map(l => l.carbon_saved_monthly), 100);
                            const points = logs.map((log, idx) => {
                              const x = logs.length > 1 ? (idx / (logs.length - 1)) * 500 : 250;
                              const y = 170 - (log.carbon_saved_monthly / maxVal) * 140;
                              return { x, y, log };
                            });

                            let pathD = "";
                            let areaD = "";
                            points.forEach((p, idx) => {
                              if (idx === 0) {
                                pathD = `M ${p.x} ${p.y}`;
                                areaD = `M ${p.x} 180 L ${p.x} ${p.y}`;
                              } else {
                                pathD += ` L ${p.x} ${p.y}`;
                                areaD += ` L ${p.x} ${p.y}`;
                              }
                              if (idx === points.length - 1) {
                                areaD += ` L ${p.x} 180 Z`;
                              }
                            });

                            return (
                              <>
                                {/* Fill area */}
                                {points.length > 1 && <path d={areaD} fill="url(#chartGradient)" />}
                                {/* Stroke Line */}
                                <path d={pathD} fill="none" stroke="#e8702a" strokeWidth="2.5" />
                                
                                {/* Point Indicators */}
                                {points.map((p, idx) => (
                                  <g key={idx} className="cursor-pointer group">
                                    <circle
                                      cx={p.x}
                                      cy={p.y}
                                      r="5"
                                      fill="black"
                                      stroke="#e8702a"
                                      strokeWidth="2"
                                      className="hover:r-7 transition-all duration-150"
                                    />
                                    {/* SVG Tooltip */}
                                    <title>{`${p.log.business_name} - ${p.log.waste_type}: ${p.log.carbon_saved_monthly.toLocaleString()} kg CO2e`}</title>
                                  </g>
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-white/30 border-t border-white/5 pt-4">
                    <span>Older Records (Left)</span>
                    <span>Interactive logs: hover points for specs</span>
                    <span>Most Recent (Right)</span>
                  </div>
                </div>

                {/* Right: Ecosystem breakdown metrics */}
                <div className="lg:col-span-4 bg-neutral-900 border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-5">
                      Waste Taxonomy Ratios
                    </h4>
                    
                    {dashboardData.recent_logs.length === 0 ? (
                      <div className="text-xs text-white/30 text-center py-12">
                        No materials categories stored.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Calculate standard percentages */}
                        {(() => {
                          const counts: { [key: string]: number } = {};
                          dashboardData.recent_logs.forEach(l => {
                            counts[l.waste_type_standard] = (counts[l.waste_type_standard] || 0) + l.quantity;
                          });
                          const total = Object.values(counts).reduce((a, b) => a + b, 0);

                          return Object.entries(counts).map(([name, qty]) => {
                            const pct = Math.round((qty / total) * 100);
                            return (
                              <div key={name} className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="font-medium text-white">{name}</span>
                                  <span className="text-white/50">{pct}% ({Math.round(qty).toLocaleString()} kg)</span>
                                </div>
                                <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#e8702a] h-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-white/5 pt-4 text-[10px] text-white/35 leading-relaxed mt-6">
                    Distribution represents the weight ratio of registered materials persistent in SQLite.
                  </div>
                </div>

              </div>

              {/* Logs Registry Table */}
              <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
                <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6">
                  Recent Evaluations Registry
                </h4>

                <div className="overflow-x-auto">
                  {dashboardData.recent_logs.length === 0 ? (
                    <div className="text-xs text-white/30 text-center py-16">
                      SQLite database is currently empty. Open the Ingestion Wizard to log materials.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-white/40 uppercase tracking-wider border-b border-white/5 pb-4">
                          <th className="pb-3 pr-4 font-semibold">Business</th>
                          <th className="pb-3 pr-4 font-semibold">Location</th>
                          <th className="pb-3 pr-4 font-semibold">Waste Logged</th>
                          <th className="pb-3 pr-4 font-semibold">Standard Match</th>
                          <th className="pb-3 pr-4 font-semibold text-right">Qty (kg)</th>
                          <th className="pb-3 pr-4 font-semibold text-right">Offset (CO2)</th>
                          <th className="pb-3 pr-4 font-semibold text-right">Revenue</th>
                          <th className="pb-3 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recent_logs.map((log) => (
                          <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="py-3.5 pr-4 text-white font-medium cursor-pointer" onClick={() => viewPastLogDetails(log)}>
                              {log.business_name}
                            </td>
                            <td className="py-3.5 pr-4 text-white/60">{log.location}</td>
                            <td className="py-3.5 pr-4 italic text-white/55">"{log.waste_type}"</td>
                            <td className="py-3.5 pr-4 text-[#e8702a] font-medium">{log.waste_type_standard}</td>
                            <td className="py-3.5 pr-4 text-right font-mono text-white/80">{Math.round(log.quantity).toLocaleString()}</td>
                            <td className="py-3.5 pr-4 text-right font-mono text-emerald-400 font-medium">-{Math.round(log.carbon_saved_monthly).toLocaleString()}</td>
                            <td className="py-3.5 pr-4 text-right font-mono text-amber-400 font-medium">₹{Math.round(log.monthly_revenue).toLocaleString()}</td>
                            <td className="py-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => viewPastLogDetails(log)}
                                  className="text-[10px] text-white/50 hover:text-white bg-white/5 px-2.5 py-1 rounded border border-white/5 group-hover:border-white/15 cursor-pointer"
                                >
                                  View Specs
                                </button>
                                <button
                                  onClick={() => deleteLog(log.id)}
                                  className="text-white/30 hover:text-red-400 p-1.5 rounded cursor-pointer"
                                  title="Delete log entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center text-xs text-white/35 py-16">
              Could not resolve dashboard endpoints. Make sure your FastAPI backend database connects.
            </div>
          )}

        </section>
      )}

      {/* -------------------- TAXONOMY VIEW -------------------- */}
      {activeTab === 'Taxonomy' && (
        <section className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
          <div>
            <span className="text-xs font-semibold tracking-widest text-[#e8702a] uppercase bg-[#e8702a]/10 px-3.5 py-1.5 rounded-full">
              Standardized taxonomy
            </span>
            <h2 className="text-3xl sm:text-5xl font-playfair font-normal italic text-white mt-4">
              Material Library
            </h2>
            <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-xl font-light">
              We translate raw text synonyms into standardized material types to trigger chemical matching constraints correctly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {TAXONOMY_DATA.map((tax) => (
              <div key={tax.id} className="bg-neutral-900 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-[#e8702a]/30 transition-all duration-300 group">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-semibold text-[#e8702a] uppercase bg-[#e8702a]/15 px-2 py-0.5 rounded">
                      {tax.category}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      Avg value: {tax.value}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#e8702a] transition-colors">{tax.name}</h3>
                  <p className="text-xs text-white/60 mt-3.5 leading-relaxed font-light">{tax.desc}</p>
                </div>

                <div className="mt-6 border-t border-white/5 pt-4">
                  <div className="text-[10px] text-white/40 uppercase">Typical input synonyms matched:</div>
                  <div className="text-xs text-white/80 italic mt-1 font-mono">{tax.synonyms}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------- PARTNERS VIEW -------------------- */}
      {activeTab === 'Partners' && (
        <section className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
          <div>
            <span className="text-xs font-semibold tracking-widest text-[#e8702a] uppercase bg-[#e8702a]/10 px-3.5 py-1.5 rounded-full">
              Pune MIDC directory
            </span>
            <h2 className="text-3xl sm:text-5xl font-playfair font-normal italic text-white mt-4">
              Regional Buyers
            </h2>
            <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-xl font-light">
              Registered factories and processing yards accepting circular inputs near Pune.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {BUYERS_DATA.map((buyer, idx) => (
              <div key={idx} className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all duration-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-base font-bold text-white">{buyer.name}</h3>
                    <span className="text-[10px] font-semibold text-white/60 bg-white/5 px-2 py-0.5 rounded uppercase">
                      {buyer.location}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-white/65 font-light">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span>Accepts: <strong className="text-white">{buyer.accepts}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span>Capacity: <strong className="text-white">{buyer.capacity}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span className="truncate">{buyer.address}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/5 pt-4 flex justify-between items-center text-xs">
                  <div>
                    <div className="text-[10px] text-white/40">Contact Representative</div>
                    <div className="text-white font-medium">{buyer.contact}</div>
                  </div>
                  <a
                    href={`tel:${buyer.phone}`}
                    className="text-[#e8702a] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Partner</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------- LIVE MAP VIEW -------------------- */}
      {activeTab === 'Live Map' && (
        <section className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-8 animate-fade-in font-sans">
          <div>
            <span className="text-xs font-semibold tracking-widest text-[#e8702a] uppercase bg-[#e8702a]/10 px-3.5 py-1.5 rounded-full">
              Live Logistics Visualizer
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-4 tracking-tight uppercase">
              Regional Connections
            </h2>
            <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-xl font-light leading-relaxed">
              Interactive map illustrating logistics links between Pune industrial hubs. Hover nodes or routing lines to examine real-time circular loads and transport math.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
            
            {/* SVG Visual Canvas Map */}
            <div className="lg:col-span-8 bg-neutral-900 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[480px]">
              
              {/* Grid backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              <svg
                width="100%"
                height="420"
                viewBox="0 0 600 500"
                className="relative z-10 w-full max-w-[550px]"
              >
                {/* Connection links */}
                <g fill="none">
                  {MAP_CONNECTIONS.map((conn) => {
                    const isHovered = hoveredConnection?.id === conn.id;
                    return (
                      <g key={conn.id}>
                        {/* Static connection base */}
                        <line
                          x1={conn.x1}
                          y1={conn.y1}
                          x2={conn.x2}
                          y2={conn.y2}
                          stroke={isHovered ? "rgba(232, 112, 42, 0.4)" : "rgba(232, 112, 42, 0.15)"}
                          strokeWidth={isHovered ? "2.5" : "1.5"}
                          className="transition-all duration-300"
                        />
                        {/* Animated flowing glowing dash */}
                        <line
                          x1={conn.x1}
                          y1={conn.y1}
                          x2={conn.x2}
                          y2={conn.y2}
                          stroke={isHovered ? "#ffffff" : "#e8702a"}
                          strokeWidth="2"
                          strokeDasharray="5 5"
                          className="animate-dash"
                        />
                        {/* Invisible thicker target for easier mouse hover */}
                        <line
                          x1={conn.x1}
                          y1={conn.y1}
                          x2={conn.x2}
                          y2={conn.y2}
                          stroke="transparent"
                          strokeWidth="12"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredConnection(conn)}
                          onMouseLeave={() => setHoveredConnection(null)}
                        />
                      </g>
                    );
                  })}
                </g>

                {/* Nodes rendering */}
                {MAP_NODES.map((node) => {
                  const isHovered = hoveredNode === node.id;
                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Pulse ring for active nodes */}
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={isHovered ? 16 : 9}
                        fill="none"
                        stroke={node.id === 'pune' ? '#ffffff' : '#e8702a'}
                        strokeWidth="1"
                        className="animate-ping"
                        style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                      />
                      
                      {/* Core circle */}
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={node.id === 'pune' ? 6 : 5}
                        fill={node.id === 'pune' ? '#ffffff' : '#e8702a'}
                        className="transition-all duration-200 group-hover:scale-125"
                      />

                      {/* Label Text */}
                      <text
                        x={node.cx}
                        y={node.cy - 14}
                        textAnchor="middle"
                        fill="rgba(255, 255, 255, 0.75)"
                        fontSize="9"
                        fontWeight="semibold"
                        className="transition-colors group-hover:fill-[#e8702a] select-none"
                      >
                        {node.id === 'pune' ? "PUNE CENTER" : node.id.toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Info panel Right */}
            <div className="lg:col-span-4 space-y-6 h-full font-sans">
              <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 min-h-[380px] flex flex-col justify-between">
                {hoveredConnection ? (
                  <div className="space-y-4 animate-fade-in text-left">
                    <span className="text-[10px] font-semibold text-[#e8702a] uppercase bg-[#e8702a]/15 px-2.5 py-1 rounded">
                      Active Route Specifications
                    </span>
                    
                    <h3 className="text-lg font-bold text-white mt-2">
                      {hoveredConnection.fromName} <span className="text-[#e8702a] text-xs block sm:inline">→</span> {hoveredConnection.toName}
                    </h3>
                    
                    <div className="border-t border-white/5 pt-4 space-y-3.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Standardized Material:</span>
                        <span className="font-semibold text-white/90">{hoveredConnection.material}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Haversine Distance:</span>
                        <span className="font-mono text-white/80">{hoveredConnection.distance}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Projected B2B Value:</span>
                        <span className="font-bold text-amber-400 font-mono">{hoveredConnection.revenue}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Carbon Offset Math:</span>
                        <span className="font-bold text-emerald-400 font-mono">-{hoveredConnection.carbon}</span>
                      </div>
                    </div>
                  </div>
                ) : hoveredNode ? (
                  (() => {
                    const node = MAP_NODES.find(n => n.id === hoveredNode);
                    if (!node) return null;
                    return (
                      <div className="space-y-4 animate-fade-in text-left">
                        <span className="text-[10px] font-semibold text-sky-400 bg-sky-400/15 px-2.5 py-1 rounded">
                          Regional Hub Specifications
                        </span>
                        
                        <h3 className="text-xl font-bold text-white mt-2">{node.name}</h3>
                        <p className="text-xs text-white/50 leading-relaxed font-light">{node.desc}</p>
                        
                        <div className="border-t border-white/5 pt-4 space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-white/40">Latitude Offset:</span>
                            <span className="font-mono text-white/80">{node.lat}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/40">Longitude Offset:</span>
                            <span className="font-mono text-white/80">{node.lon}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/40">Circular Buyers Active:</span>
                            <span className="font-bold text-[#e8702a]">{node.partners}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-20 text-xs text-white/35 flex flex-col items-center justify-center gap-3">
                    <Compass className="w-8 h-8 text-white/20 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Hover over map nodes or routing lines to georeference circular locations.</span>
                  </div>
                )}

                <div className="border-t border-white/5 pt-4 text-[10px] text-white/40 leading-relaxed text-left">
                  Logistics routes map distances directly using the Haversine formula on geodetic coordinates to minimize carbon transport impact grids.
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

    </div>
  );
}
