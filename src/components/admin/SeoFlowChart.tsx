import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock, BookOpen, Search, Filter, ShieldCheck, PenTool, Sparkles, Image as ImageIcon,
  Share2, CheckCircle2, Calendar, Send, Globe, BarChart3, Mail, ArrowRight, ArrowDown, Repeat,
} from "lucide-react";

const Step = ({ n, icon: Icon, title, desc }: any) => (
  <div className="flex-1 min-w-[170px] rounded-lg border bg-card p-3 shadow-sm">
    <div className="flex items-center gap-2 mb-1.5">
      <div className="h-7 w-7 rounded-md flex items-center justify-center bg-primary/10 text-primary shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-mono text-muted-foreground leading-none">STEP {n}</p>
        <p className="font-semibold text-sm truncate">{title}</p>
      </div>
    </div>
    <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
  </div>
);

const Arrow = ({ dir = "right" }: { dir?: "right" | "down" }) => (
  <div className="flex items-center justify-center text-muted-foreground shrink-0">
    {dir === "right" ? <ArrowRight className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
  </div>
);

const Row = ({ children }: any) => (
  <div className="flex flex-col lg:flex-row items-stretch gap-2">{children}</div>
);

const SeoFlowChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-primary" />
          Daily Blog Automation Flow
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            runs every day at 09:00 IST · 1 blog/day · queue ≥ 30
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Row 1: Trigger → Book KB → Research */}
        <Row>
          <Step n="1" icon={Clock} title="Daily Scheduler"
            desc="Cron fires seo-daily-publisher at 09:00 AM IST every day." />
          <Arrow />
          <Step n="2" icon={BookOpen} title="Crawl /book Library"
            desc="Refreshes Book Knowledge Base (topics, entities, concepts, keywords, FAQs)." />
          <Arrow />
          <Step n="3" icon={Search} title="Research Sources"
            desc="Google Trends, Search, PAA, Related, GSC, Reddit, Quora, News, competitors." />
          <Arrow />
          <Step n="4" icon={Filter} title="Match to Books"
            desc="Rejects keywords outside site niche. Only book-relevant topics survive." />
        </Row>

        <div className="flex justify-center"><Arrow dir="down" /></div>

        {/* Row 2: Uniqueness → Score → Plan → Write */}
        <Row>
          <Step n="5" icon={ShieldCheck} title="Uniqueness Gate"
            desc="Compare against every published, draft & scheduled post. Reject if similarity > 15%." />
          <Arrow />
          <Step n="6" icon={Sparkles} title="Opportunity Score"
            desc="Volume × CTR ÷ difficulty. Highest scoring keyword is picked." />
          <Arrow />
          <Step n="7" icon={PenTool} title="Content Planning"
            desc="Topic cluster, H1/H2 outline, entities, LSI keywords, internal link plan." />
          <Arrow />
          <Step n="8" icon={PenTool} title="Write 1500–2500 words"
            desc="Human-style Hindi/English article grounded in book KB. TOC + FAQ + JSON-LD." />
        </Row>

        <div className="flex justify-center"><Arrow dir="down" /></div>

        {/* Row 3: SEO/NLP → Meta → Links → Image → Social */}
        <Row>
          <Step n="9" icon={Sparkles} title="SEO + NLP Optimization"
            desc="Meta title, description, slug, schema, canonical, OG tags. NLP-tuned copy." />
          <Arrow />
          <Step n="10" icon={ImageIcon} title="Featured Image"
            desc="AI prompt generation + image render. Alt text with primary keyword." />
          <Arrow />
          <Step n="11" icon={Share2} title="Social Captions"
            desc="Facebook, Instagram, LinkedIn, X, Pinterest, Threads, Telegram, WhatsApp." />
          <Arrow />
          <Step n="12" icon={CheckCircle2} title="Quality Verification"
            desc="Plagiarism scan, EEAT check, helpful-content signals, readability ≥ 80, SEO ≥ 90." />
        </Row>

        <div className="flex justify-center"><Arrow dir="down" /></div>

        {/* Row 4: Publish → Index → Track → Report */}
        <Row>
          <Step n="13" icon={Calendar} title="Schedule / Publish"
            desc="Passes gate → publish today. Fails → regenerate. Extras go to scheduled queue." />
          <Arrow />
          <Step n="14" icon={Send} title="Auto-Publish"
            desc="Post flipped live. Sitemap regenerates. RSS updated." />
          <Arrow />
          <Step n="15" icon={Globe} title="Submit to Google"
            desc="Sitemap re-ping + URL Inspection via GSC API. Indexing hint sent." />
          <Arrow />
          <Step n="16" icon={BarChart3} title="Track Rankings"
            desc="GSC pulls clicks, CTR, impressions, position daily into posts table." />
        </Row>

        <div className="flex justify-center"><Arrow dir="down" /></div>

        {/* Row 5: Report → Queue */}
        <Row>
          <Step n="17" icon={Mail} title="Email Report"
            desc="HTML performance report emailed to amrendra8765@gmail.com after each publish." />
          <Arrow />
          <Step n="18" icon={Repeat} title="Queue Next 30 Blogs"
            desc="Every 6h: if scheduled < 30, seo-queue-topup generates new drafts. Never empty." />
        </Row>

        <div className="flex justify-center pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <Repeat className="h-3 w-3" />
            Fully autonomous · 1 blog/day · zero manual approval
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeoFlowChart;
