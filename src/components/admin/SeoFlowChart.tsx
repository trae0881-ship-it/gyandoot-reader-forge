import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Brain, PenTool, Calendar, Send, Globe, BarChart3, Mail, ArrowRight, ArrowDown, Repeat } from "lucide-react";

const Step = ({ icon: Icon, title, desc, tone = "primary" }: any) => (
  <div className={`flex-1 min-w-[160px] rounded-lg border bg-card p-4 shadow-sm`}>
    <div className={`flex items-center gap-2 mb-2`}>
      <div className={`h-8 w-8 rounded-md flex items-center justify-center bg-${tone}/10 text-${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-semibold text-sm">{title}</p>
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

const Arrow = ({ dir = "right" }: { dir?: "right" | "down" }) => (
  <div className="flex items-center justify-center text-muted-foreground shrink-0">
    {dir === "right" ? <ArrowRight className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
  </div>
);

const SeoFlowChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-primary" />
          Autonomous SEO Workflow (runs every 48 hours)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Research → Write → Schedule */}
        <div className="flex flex-col lg:flex-row items-stretch gap-3">
          <Step icon={Search} title="1. Keyword Research"
            desc="Tavily + Exa + SerpAPI + Google scans discover trending spiritual keywords. Winners stored in seo_keyword_queue." />
          <Arrow />
          <Step icon={Brain} title="2. AI Analysis"
            desc="LLM chain (Anthropic → OpenAI → DeepSeek → Gemini) scores intent, difficulty & opportunity." />
          <Arrow />
          <Step icon={PenTool} title="3. Article Writing"
            desc="Long-form SEO article with TOC, JSON-LD schema, internal links, LSI keywords & cover image." />
          <Arrow />
          <Step icon={Calendar} title="4. Auto-Schedule"
            desc="Saved to posts table with publish_status = scheduled and scheduled_at timestamp." />
        </div>

        <div className="flex justify-center"><Arrow dir="down" /></div>

        {/* Row 2: Publish → Indexing → Report */}
        <div className="flex flex-col lg:flex-row items-stretch gap-3">
          <Step icon={Send} title="5. Auto-Publish"
            desc="Cron flips scheduled → published at the right time. Sitemap regenerates automatically." />
          <Arrow />
          <Step icon={Globe} title="6. Google Indexing"
            desc="Sitemap resubmitted to Google Search Console + URL inspection triggered via GSC API." />
          <Arrow />
          <Step icon={BarChart3} title="7. Rank Tracking"
            desc="GSC sync pulls clicks, impressions, CTR & position for each article (last 28 days)." />
          <Arrow />
          <Step icon={Mail} title="8. Email Report"
            desc="HTML report sent to amrendra8765@gmail.com with keyword, URL & indexing status." />
        </div>

        <div className="flex justify-center pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <Repeat className="h-3 w-3" />
            Loop repeats every 48 hours — fully autonomous
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeoFlowChart;
