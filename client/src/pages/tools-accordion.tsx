import React, { useState } from "react";
import { 
  ArrowUpDown, 
  CircleDollarSign, 
  Shield, 
  Sparkles, 
  ArrowRightCircle,
  BarChartHorizontal,
  TrendingUp,
  DollarSign,
  Layers,
  Calculator,
  Flame,
  Tag,
  Activity,
  CheckSquare,
  Thermometer,
  Timer,
  LineChart,
  Brain,
  Medal,
  Layout,
  Crown,
  GitCommit,
  TrendingDown,
  Shuffle,
  Briefcase,
  BarChart,
  LineChartIcon,
  ScatterChart,
  BadgeDollarSign,
  CalendarDays,
  Map,
  Compass,
  CloudRain,
  Wind,
  Calendar,
  MapPin,
  Star,
  Lightbulb,
  Users
} from "lucide-react";
import { Card } from "@/components/ui/card";

// Import collapsible tool component
import { CollapsibleTool } from "@/components/tools/collapsible-tool";

// Import captain tools
import {
  CaptainScorePredictor,
  LoopHole
} from "@/components/tools/captain";

// Trade tools deleted

// Import cash and price tools (merged)
import { 
  CashCeilingFloorTracker,
  BuySellTimingTool,
  PricePredictorCalculator,
  DowngradeTargetFinder,
  PriceScoreScatter,
  ValueTracker
} from "@/components/tools/cash";

// Import risk tools
import { 
  TagWatchTable,
  VolatilityIndexTable,
  ConsistencyScoreTable,
  InjuryRiskTable
} from "@/components/tools/risk";

// Import team manager tools
import { 
  TradeSuggester,
  BenchHygiene,
  TradeScore,
  RageTrades
} from "@/components/tools/team-manager";

// Role tools deleted (mock data only)

// Price tools are now in cash folder

// Import fixture analysis tools (kept after cleanup)
import {
  MatchupDVPAnalyzer,
  FixtureSwingRadar
} from "@/components/tools/fixture";

// Context tools deleted

type SectionKey = "cash" | "risk" | "team-manager" | "captain" | "fixture";

export default function ToolsAccordionPage() {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const toggleSection = (key: SectionKey) => {
    setOpenSection(prev => (prev === key ? null : key));
  };

  return (
    <div className="container mx-auto px-3 md:px-6 py-6 bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">⚡ AFL Fantasy Tools</h1>
        <p className="text-gray-400">
          🚀 Maximize your fantasy performance with our suite of advanced analytical tools
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        {/* CASH GENERATION TOOLS */}
        <Card className="mb-5 border-2 bg-gray-800 border-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <div 
            onClick={() => toggleSection("cash")}
            className="p-4 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center">
              <CircleDollarSign className="h-5 w-5 mr-3 text-green-400" />
              <h2 className="text-lg font-medium text-white">💰 Cash & Price Analysis Tools</h2>
            </div>
            <span className="text-green-400 text-lg">{openSection === "cash" ? "▲" : "▼"}</span>
          </div>
          
          {openSection === "cash" && (
            <div className="p-4 pt-0 border-t border-green-500/30 space-y-4 bg-gray-900">
              <CollapsibleTool title="📈 Buy/Sell Timing Tool" icon={<TrendingUp />} colorClass="text-green-400">
                <BuySellTimingTool />
              </CollapsibleTool>
              
              <CollapsibleTool title="🎯 Cash Ceiling & Floor Tracker" icon={<Layers />} colorClass="text-green-400">
                <CashCeilingFloorTracker />
              </CollapsibleTool>
              
              <CollapsibleTool title="🧮 Price Predictor Calculator" icon={<Calculator />} colorClass="text-green-400">
                <PricePredictorCalculator />
              </CollapsibleTool>
              
              <CollapsibleTool title="📊 Downgrade Target Finder" icon={<TrendingDown />} colorClass="text-green-400">
                <DowngradeTargetFinder />
              </CollapsibleTool>
              
              <CollapsibleTool title="📊 Value Tracker" icon={<BarChart />} colorClass="text-green-400">
                <ValueTracker />
              </CollapsibleTool>
            </div>
          )}
        </Card>

        {/* TAG & RISK TOOLS */}
        <Card className="mb-5 border-2 bg-gray-800 border-red-500 shadow-lg hover:shadow-xl transition-shadow">
          <div 
            onClick={() => toggleSection("risk")}
            className="p-4 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-3 text-red-400" />
              <h2 className="text-lg font-medium text-white">🔒 Tag & Risk Tools</h2>
            </div>
            <span className="text-red-400 text-lg">{openSection === "risk" ? "▲" : "▼"}</span>
          </div>
          
          {openSection === "risk" && (
            <div className="p-4 pt-0 border-t border-red-500/30 space-y-4 bg-gray-900">
              <CollapsibleTool title="⚠️ Tag Watch Monitor" icon={<Tag />} colorClass="text-red-400">
                <TagWatchTable />
              </CollapsibleTool>
              
              <CollapsibleTool title="📊 Tag History Impact Tracker" icon={<Activity />} colorClass="text-red-400">
                <VolatilityIndexTable />
              </CollapsibleTool>
              
              <CollapsibleTool title="🎯 Tag Target Priority Ranker" icon={<CheckSquare />} colorClass="text-red-400">
                <ConsistencyScoreTable />
              </CollapsibleTool>
              
              <CollapsibleTool title="🩹 Tag Breaker Score Estimator" icon={<Thermometer />} colorClass="text-red-400">
                <InjuryRiskTable />
              </CollapsibleTool>
              
              <CollapsibleTool title="🚨 Injury Risk Model" icon={<Thermometer />} colorClass="text-red-400">
                <InjuryRiskTable />
              </CollapsibleTool>
              
              <CollapsibleTool title="📈 Volatility Index Calculator" icon={<Activity />} colorClass="text-red-400">
                <VolatilityIndexTable />
              </CollapsibleTool>
              
            </div>
          )}
        </Card>

        {/* TEAM MANAGER TOOLS */}
        <Card className="mb-5 border-2 bg-gray-800 border-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <div 
            onClick={() => toggleSection("team-manager")}
            className="p-4 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-3 text-purple-400" />
              <h2 className="text-lg font-medium text-white">👥 Team Manager Tools</h2>
            </div>
            <span className="text-purple-400 text-lg">{openSection === "team-manager" ? "▲" : "▼"}</span>
          </div>
          
          {openSection === "team-manager" && (
            <div className="p-4 pt-0 border-t border-purple-500/30 space-y-4 bg-gray-900">
              <CollapsibleTool title="📊 Team Structure Analysis" icon={<Layout />} colorClass="text-purple-400">
                <BenchHygiene />
              </CollapsibleTool>
              
              <CollapsibleTool title="🔄 Trade Suggester" icon={<Shuffle />} colorClass="text-purple-400">
                <TradeSuggester />
              </CollapsibleTool>
              
              <CollapsibleTool title="🧮 Trade Score Calculator" icon={<Calculator />} colorClass="text-purple-400">
                <TradeScore />
              </CollapsibleTool>
              
              <CollapsibleTool title="🔥 Rage Trade Monitor" icon={<Flame />} colorClass="text-purple-400">
                <RageTrades />
              </CollapsibleTool>
            </div>
          )}
        </Card>

        {/* CAPTAINCY TOOLS */}
        <Card className="mb-5 border-2 bg-gray-800 border-yellow-500 shadow-lg hover:shadow-xl transition-shadow">
          <div 
            onClick={() => toggleSection("captain")}
            className="p-4 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center">
              <Crown className="h-5 w-5 mr-3 text-yellow-400" />
              <h2 className="text-lg font-medium text-white">👑 Captaincy Tools</h2>
            </div>
            <span className="text-yellow-400 text-lg">{openSection === "captain" ? "▲" : "▼"}</span>
          </div>
          
          {openSection === "captain" && (
            <div className="p-4 pt-0 border-t border-yellow-500/30 space-y-4 bg-gray-900">
              <CollapsibleTool title="🎯 Captain Optimizer" icon={<Calculator />} colorClass="text-yellow-400">
                <CaptainScorePredictor />
              </CollapsibleTool>
              
              <CollapsibleTool title="🔄 Loop Hole Strategy" icon={<Shuffle />} colorClass="text-yellow-400">
                <LoopHole />
              </CollapsibleTool>
            </div>
          )}
        </Card>

        {/* Price tools are now merged into Cash folder */}

        {/* FIXTURE & MATCHUP TOOLS */}
        <Card className="mb-5 border-2 bg-gray-800 border-indigo-500 shadow-lg hover:shadow-xl transition-shadow">
          <div 
            onClick={() => toggleSection("fixture")}
            className="p-4 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-3 text-indigo-400" />
              <h2 className="text-lg font-medium text-white">📅 Fixture & Matchup Tools</h2>
            </div>
            <span className="text-indigo-400 text-lg">{openSection === "fixture" ? "▲" : "▼"}</span>
          </div>
          
          {openSection === "fixture" && (
            <div className="p-4 pt-0 border-t border-indigo-500/30 space-y-4 bg-gray-900">
              <CollapsibleTool title="📈 Fixture Swing Radar" icon={<TrendingUp />} colorClass="text-indigo-400">
                <FixtureSwingRadar />
              </CollapsibleTool>
              
              <CollapsibleTool title="📊 DVP Matchup Analyzer" icon={<BarChartHorizontal />} colorClass="text-indigo-400">
                <MatchupDVPAnalyzer />
              </CollapsibleTool>
            </div>
          )}
        </Card>

        {/* Role tools deleted (mock data only) */}

        {/* Trade tools deleted */}
      </div>
    </div>
  );
}