"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Camera,
  Eye,
  Save,
  Image,
  Film,
  Package,
  Youtube,
  Video,
  Award,
  Instagram,
  Music2,
  Check,
  Plus,
  Globe,
  BarChart2,
  ShoppingBag,
  Users,
  MapPin,
  Mail,
  User,
  Tag,
  Languages,
  Shield,
  Search,
  TrendingUp,
  Star,
} from "lucide-react";

/* ── Types ── */
interface RateCardItemProps {
  Icon: LucideIcon;
  title: string;
  price: string;
  negotiable: boolean;
  description: string;
  highlight?: boolean;
}

interface SocialCardProps {
  platform: "Instagram" | "TikTok" | "YouTube";
  handle: string;
  followers: string;
  engagement: string;
  connected: boolean;
  primary?: boolean;
}

interface SectionHeaderProps {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

/* ── Rate Card Item ── */
const RateCardItem = ({
  Icon,
  title,
  price,
  negotiable,
  description,
  highlight = false,
}: RateCardItemProps) => (
  <Card
    className={`flex flex-col gap-1 transition-shadow hover:shadow-md ${
      highlight ? "border-orange-300 bg-orange-50/30" : ""
    }`}
  >
    <CardHeader className="pb-2 pt-4 px-4">
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            highlight ? "bg-orange-100" : "bg-muted"
          }`}
        >
          <Icon
            size={14}
            className={highlight ? "text-orange-500" : "text-muted-foreground"}
          />
        </div>
        <CardTitle className="text-sm leading-snug">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="px-4 pb-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={`text-base font-bold ${highlight ? "text-orange-500" : ""}`}>
          {price}
        </span>
        <Badge
          variant={negotiable ? "secondary" : "outline"}
          className={
            negotiable
              ? "bg-green-100 text-green-700 hover:bg-green-100"
              : ""
          }
        >
          {negotiable ? "Negotiable" : "Fixed"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

/* ── Social Platform Card ── */
const SocialCard = ({
  platform,
  handle,
  followers,
  engagement,
  connected,
  primary = false,
}: SocialCardProps) => {
  const gradients: Record<SocialCardProps["platform"], string> = {
    Instagram: "from-pink-500 to-orange-400",
    TikTok: "from-gray-700 to-gray-500",
    YouTube: "from-red-500 to-red-600",
  };

  const PIcon: LucideIcon =
    platform === "Instagram"
      ? Instagram
      : platform === "TikTok"
      ? Music2
      : Youtube;

  return (
    <Card className={primary ? "border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50" : ""}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradients[platform]} flex items-center justify-center`}
          >
            <PIcon size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">{handle}</p>
            <p className="text-xs text-muted-foreground">{platform}</p>
          </div>
        </div>

        <div className="flex gap-3 text-center">
          <div className="flex-1">
            <p className="text-sm font-bold">{followers}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <Separator orientation="vertical" className="h-auto" />
          <div className="flex-1">
            <p className="text-sm font-bold">{engagement}</p>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </div>
        </div>

        <Button
          size="sm"
          variant={connected ? (primary ? "default" : "secondary") : "outline"}
          className={`w-full text-xs gap-1.5 ${
            primary && connected ? "bg-orange-400 hover:bg-orange-500 text-white" : ""
          }`}
        >
          {connected ? (
            primary ? (
              <>
                <Star size={11} /> Primary
              </>
            ) : (
              <>
                <Check size={11} /> Connected
              </>
            )
          ) : (
            <>
              <Plus size={11} /> Connect
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ── Section Header ── */
const SectionHeader = ({
  Icon,
  title,
  subtitle,
  action,
}: SectionHeaderProps) => (
  <CardHeader className="pb-4 border-b">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
          <Icon size={14} className="text-orange-400" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs mt-0.5">{subtitle}</CardDescription>
        </div>
      </div>
      {action}
    </div>
  </CardHeader>
);

/* ── Main Component ── */
export default function ProfileRateCard() {
  const [industries] = useState<string[]>([
    "Food & Beverage",
    "Beauty",
    "Fashion",
    "Wellness",
    "Travel",
  ]);

  const [tags] = useState<string[]>(["Food", "Beauty", "Lifestyle"]);
  const [langs] = useState<string[]>(["English", "Spanish"]);

  const [collaborationTypes, setCollaborationTypes] = useState<
    Record<string, boolean>
  >({
    "Product Exchange": true,
    Affiliate: false,
  });

  const [campaignTypes, setCampaignTypes] = useState<Record<string, boolean>>({
    "Sponsored Posts": true,
    "Product Reviews": true,
    "Brand Ambassadorships": true,
    Giveaways: false,
  });

  const [privacyControls, setPrivacyControls] = useState<Record<string, boolean>>({
    "Show pricing publicly": true,
    "Searchable on marketplace": true,
    "Analytics sharing": false,
  });

  const collaborationTypeItems = [
    { label: "Product Exchange" },
    { label: "Affiliate" },
  ];

  const campaignTypeItems = [
    { label: "Sponsored Posts" },
    { label: "Product Reviews" },
    { label: "Brand Ambassadorships" },
    { label: "Giveaways" },
  ];

  const privacyItems: {
    Icon: LucideIcon;
    label: string;
    sub: string;
  }[] = [
    {
      Icon: Eye,
      label: "Show pricing publicly",
      sub: "Brands can see your rate card without contacting you",
    },
    {
      Icon: Search,
      label: "Searchable on marketplace",
      sub: "Allow brands to discover you in the creator directory",
    },
    {
      Icon: BarChart2,
      label: "Analytics sharing",
      sub: "Share engagement analytics automatically with interested brands",
    },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-muted/40">
        {/* Sticky Topbar */}
        <div className="bg-background border-b sticky top-0 z-10 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Profile & Rate Card</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage your creator profile and collaboration pricing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye size={14} /> Preview Rate Card
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-orange-400 hover:bg-orange-500 text-white"
              >
                <Save size={14} /> Save Changes
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 space-y-6">
          {/* ── Profile Information ── */}
          <Card>
            <SectionHeader
              Icon={User}
              title="Profile Information"
              subtitle="Manage your basic profile and creator identity"
            />
            <CardContent className="p-6 flex gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 border-2 border-orange-100 flex items-center justify-center">
                    <User size={38} className="text-orange-300" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-400 hover:bg-orange-500 text-white shadow-md"
                      >
                        <Camera size={12} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload photo</TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground">Profile Photo</p>
              </div>

              {/* Fields */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <User size={10} /> Creator Name / Handle
                  </Label>
                  <Input
                    defaultValue="Jane Doe / @janedoe_jane"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <Mail size={10} /> Email Address
                  </Label>
                  <Input
                    defaultValue="jane.doe@example.com"
                    className="text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <User size={10} /> Bio
                  </Label>
                  <Textarea
                    className="text-sm resize-none"
                    rows={3}
                    defaultValue="Passionate food influencer who collaborates with lifestyle brands, restaurants, and wellness companies during live demonstrations, pop-up food tastings, and brand activations with a focus on audience engagement and authentic brand storytelling."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <Tag size={10} /> Category / Niche Tags
                  </Label>
                  <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30 min-h-9 items-center">
                    {tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"
                      >
                        {t}
                      </Badge>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs text-orange-400 hover:text-orange-500 gap-0.5"
                    >
                      <Plus size={10} /> Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <MapPin size={10} /> Location
                  </Label>
                  <Input
                    defaultValue="New York City, USA"
                    className="text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <Languages size={10} /> Languages
                  </Label>
                  <div className="flex gap-1.5 items-center">
                    {langs.map((l) => (
                      <Badge
                        key={l}
                        variant="secondary"
                        className="bg-blue-50 text-blue-600 border border-blue-200"
                      >
                        {l}
                      </Badge>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs text-blue-400 hover:text-blue-500 gap-0.5"
                    >
                      <Plus size={10} /> Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Social Platform Connections ── */}
          <Card>
            <SectionHeader
              Icon={Globe}
              title="Social Platform Connections"
              subtitle="Connect your social accounts to enable analytics"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-500 hover:text-orange-600 gap-1 text-xs"
                >
                  <Plus size={12} /> Add Platform
                </Button>
              }
            />
            <CardContent className="p-6 grid grid-cols-3 gap-4">
              <SocialCard
                platform="Instagram"
                handle="@janedoe_jane"
                followers="150K"
                engagement="4.7%"
                connected={true}
              />
              <SocialCard
                platform="TikTok"
                handle="Jane Doe Official"
                followers="286K"
                engagement="5.8%"
                connected={true}
              />
              <SocialCard
                platform="YouTube"
                handle="@janedoe_vlogs"
                followers="198K"
                engagement="3.2%"
                connected={true}
                primary={true}
              />
            </CardContent>
          </Card>

          {/* ── Rate Card ── */}
          <Card>
            <SectionHeader
              Icon={TrendingUp}
              title="Rate Card"
              subtitle="Set your pricing for different types of collaborations"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-500 hover:text-orange-600 gap-1 text-xs"
                >
                  <Plus size={12} /> Add Rate
                </Button>
              }
            />
            <CardContent className="p-6 grid grid-cols-3 gap-4">
              <RateCardItem
                Icon={Image}
                title="Instagram Post"
                price="$800 – $1,200"
                negotiable={true}
                description="1 static feed post with caption, story marks, hashtags. 3 revisions included."
              />
              <RateCardItem
                Icon={Film}
                title="Instagram Reel / Short Video"
                price="$1,200 – $2,000"
                negotiable={true}
                description="30–60 sec Reel. Original audio or trending audio. Filming and editing included."
              />
              <RateCardItem
                Icon={Package}
                title="Instagram Story Package"
                price="$500 – $800"
                negotiable={true}
                description="5–7 story frames with product or brand feature, link sticker, poll or question sticker."
                highlight={true}
              />
              <RateCardItem
                Icon={Youtube}
                title="YouTube Video"
                price="$2,500 – $4,000"
                negotiable={false}
                description="8–12 min video, 60s dedicated brand mention or integration. Full production included."
              />
              <RateCardItem
                Icon={Video}
                title="UGC Content (Raw)"
                price="$300 – $600"
                negotiable={true}
                description="3–5 raw UGC videos or photos, no posting required. High-res files for brand's internal use."
              />
              <RateCardItem
                Icon={Award}
                title="Brand Ambassadorship (Monthly)"
                price="$3,500 – $6,000"
                negotiable={true}
                description="Long-term monthly partnerships. Includes multiple posts, stories, and exclusive content."
                highlight={true}
              />
            </CardContent>
          </Card>

          {/* ── Collaboration Preferences ── */}
          <Card>
            <SectionHeader
              Icon={Users}
              title="Collaboration Preferences"
              subtitle="Define the kinds of collaborations you're looking for"
            />
            <CardContent className="p-6 grid grid-cols-3 gap-8">
              {/* Preferred Industries */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Tag size={13} className="text-muted-foreground" /> Preferred
                    Industries
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs text-orange-500 hover:text-orange-600"
                  >
                    Edit
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {industries.map((i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-orange-50 text-orange-600 border border-orange-200"
                    >
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Collaboration Type */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <ShoppingBag size={13} className="text-muted-foreground" />{" "}
                  Collaboration Type
                </h3>
                <div className="space-y-3">
                  {collaborationTypeItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between"
                    >
                      <Label
                        htmlFor={item.label}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {item.label}
                      </Label>
                      <Switch
                        id={item.label}
                        checked={collaborationTypes[item.label]}
                        onCheckedChange={(checked) =>
                          setCollaborationTypes((prev) => ({
                            ...prev,
                            [item.label]: checked,
                          }))
                        }
                        className="data-[state=checked]:bg-orange-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaign Types */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <BarChart2 size={13} className="text-muted-foreground" /> Campaign
                  Types
                </h3>
                <div className="space-y-2.5">
                  {campaignTypeItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <Checkbox
                        id={item.label}
                        checked={campaignTypes[item.label]}
                        onCheckedChange={(checked) =>
                          setCampaignTypes((prev) => ({
                            ...prev,
                            [item.label]: checked === true,
                          }))
                        }
                        className="data-[state=checked]:bg-orange-400 data-[state=checked]:border-orange-400"
                      />
                      <Label
                        htmlFor={item.label}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Visibility & Privacy ── */}
          <Card>
            <SectionHeader
              Icon={Shield}
              title="Visibility & Privacy Controls"
              subtitle="Manage who can see and access your profile data"
            />
            <CardContent className="p-6 divide-y">
              {privacyItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <item.Icon size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={privacyControls[item.label]}
                    onCheckedChange={(checked) =>
                      setPrivacyControls((prev) => ({
                        ...prev,
                        [item.label]: checked,
                      }))
                    }
                    className="data-[state=checked]:bg-orange-400"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              © 2026 CreatorBase. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}