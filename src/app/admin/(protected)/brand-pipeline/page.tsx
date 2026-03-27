'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Check,
  Edit3,
  FolderKanban,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import swal from 'sweetalert';

import { get, post } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type TabKey = 'outreach' | 'network';

type SignupStatus = 'not_signed_up' | 'signed_up';
type ConversionPlan = 'not_converted' | 'trial_pack' | 'subscription';
type PlanType = '' | 'trial_pack' | 'subscription';
type SubscriptionStatus = '' | 'trial_active' | 'active' | 'expired' | 'cancelled';
type InfluencerSize = '' | 'nano' | 'micro' | 'mid' | 'macro' | 'celebrity';
type ContentType = '' | 'reel' | 'post' | 'story' | 'video' | 'mix';
type PlatformType = 'instagram' | 'youtube' | 'tiktok' | 'multiple';

type BrandOutreachRow = {
  _id: string;
  brandName?: string;
  website?: string;
  roleOfPerson?: string;
  emailOfPerson?: string;
  personalization?: string;
  outreached?: boolean;
  dateLastContact?: string | null;
  reply?: boolean;
  replyText?: string;
  repliedAt?: string | null;
  followUp1?: boolean;
  followUp1SentAt?: string | null;
  followUp2?: boolean;
  followUp2SentAt?: string | null;
  followUp3?: boolean;
  followUp3SentAt?: string | null;
  notes?: string;
  signupStatus?: SignupStatus;
  conversionToPlan?: ConversionPlan;
  moveToNetwork?: boolean;
  movedToNetworkAt?: string | null;
  linkedNetworkId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  moveToNetworkEligibility?: {
    canMove?: boolean;
    reasons?: string[];
  };
};

type BrandNetworkRow = {
  _id: string;
  sourceOutreachId?: string | null;
  brandName?: string;
  website?: string;
  contacts?: string;
  employeeCount?: number | null;
  monthlyBudget?: number | null;
  targetRegions?: string[];
  platforms?: PlatformType[];
  influencerSize?: InfluencerSize;
  influencerCategory?: string;
  numberOfInfluencers?: number | null;
  campaignRequirement?: string;
  contentType?: ContentType;
  campaignTimeline?: {
    startDate?: string | null;
    endDate?: string | null;
  };
  planType?: PlanType;
  subscriptionStatus?: SubscriptionStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

type OutreachListResponse = {
  success?: boolean;
  page?: number;
  limit?: number;
  total?: number;
  results?: BrandOutreachRow[];
};

type NetworkListResponse = {
  success?: boolean;
  page?: number;
  limit?: number;
  total?: number;
  results?: BrandNetworkRow[];
};

type DraftState = Record<string, any>;

const DASH = '--';

function showErr(message: string) {
  return swal({
    title: 'Error',
    text: message || 'Something went wrong.',
    icon: 'error',
  });
}

function showSuccess(message: string) {
  return swal({
    title: 'Success',
    text: message,
    icon: 'success',
  });
}

function asText(v: unknown) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function parseCsv(v: string) {
  return (v || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function joinList(v?: string[] | null) {
  return Array.isArray(v) && v.length ? v.join(', ') : DASH;
}

function toNullableNumber(v: any) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return DASH;
  return new Intl.NumberFormat('en-IN').format(n);
}

function formatCurrency(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return DASH;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso?: string | null) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
}

function formatDateRange(start?: string | null, end?: string | null) {
  const a = formatDate(start);
  const b = formatDate(end);
  if (a === DASH && b === DASH) return DASH;
  return `${a} - ${b}`;
}

function prettifySignupStatus(value?: SignupStatus) {
  if (value === 'signed_up') return 'Signed Up';
  return 'Not Signed Up';
}

function prettifyConversionPlan(value?: ConversionPlan) {
  if (value === 'trial_pack') return 'Trial Pack';
  if (value === 'subscription') return 'Subscription';
  return 'Not Converted';
}

function prettifyPlanType(value?: PlanType) {
  if (value === 'trial_pack') return 'Trial Pack';
  if (value === 'subscription') return 'Subscription';
  return DASH;
}

function prettifySubscriptionStatus(value?: SubscriptionStatus) {
  if (!value) return DASH;
  return value
    .split('_')
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(' ');
}

function prettifyInfluencerSize(value?: InfluencerSize) {
  if (!value) return DASH;
  return value === 'mid' ? 'Mid' : value.charAt(0).toUpperCase() + value.slice(1);
}

function prettifyContentType(value?: ContentType) {
  if (!value) return DASH;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function canMoveToNetwork(row: BrandOutreachRow) {
  return !!row.moveToNetworkEligibility?.canMove;
}

function getDefaultOutreachCreateDraft() {
  return {
    brandName: '',
    website: '',
    roleOfPerson: '',
    emailOfPerson: '',
    personalization: '',
    notes: '',
    signupStatus: 'not_signed_up',
    conversionToPlan: 'not_converted',
  };
}

function getDefaultNetworkCreateDraft() {
  return {
    brandName: '',
    website: '',
    contacts: '',
    employeeCount: '',
    monthlyBudget: '',
    targetRegions: '',
    platforms: '',
    influencerSize: '',
    influencerCategory: '',
    numberOfInfluencers: '',
    campaignRequirement: '',
    contentType: '',
    startDate: '',
    endDate: '',
    planType: '',
    subscriptionStatus: '',
    notes: '',
  };
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="rounded-2xl border bg-muted/50 p-3 text-muted-foreground">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function BrandPipelinePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('outreach');
  const [outreachRows, setOutreachRows] = useState<BrandOutreachRow[]>([]);
  const [networkRows, setNetworkRows] = useState<BrandNetworkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [movingId, setMovingId] = useState<string>('');
  const [markingOutreachId, setMarkingOutreachId] = useState<string>('');
  const [followupLoading, setFollowupLoading] = useState<string>('');
  const [replyLoading, setReplyLoading] = useState<string>('');

  const [editingId, setEditingId] = useState<string>('');
  const [draft, setDraft] = useState<DraftState>({});

  const [showCreateRow, setShowCreateRow] = useState(false);
  const [createDraft, setCreateDraft] = useState<DraftState>(getDefaultOutreachCreateDraft());

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const [counts, setCounts] = useState({
    outreach: 0,
    network: 0,
    reply: 0,
    converted: 0,
  });

  const rows = activeTab === 'outreach' ? outreachRows : networkRows;

  const selectedCount = useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds]
  );

  const selectedOutreachRows = useMemo(() => {
    return outreachRows.filter((row) => !!selectedIds[row._id] && !!row.emailOfPerson);
  }, [outreachRows, selectedIds]);

  const allSelected = useMemo(() => {
    if (!rows.length) return false;
    return rows.every((row: any) => !!selectedIds[row._id]);
  }, [rows, selectedIds]);

  const someSelected = useMemo(() => {
    if (!rows.length) return false;
    return rows.some((row: any) => !!selectedIds[row._id]);
  }, [rows, selectedIds]);

  async function loadCounts() {
    try {
      const [outreachResp, networkResp] = await Promise.all([
        get<OutreachListResponse>('/brand-outreach/list', { page: 1, limit: 100 }),
        get<NetworkListResponse>('/brand-network/list', { page: 1, limit: 1 }),
      ]);

      const outreachResults = Array.isArray(outreachResp?.results) ? outreachResp.results : [];

      setCounts({
        outreach: Number(outreachResp?.total || 0),
        network: Number(networkResp?.total || 0),
        reply: outreachResults.filter((row) => !!row.reply).length,
        converted: outreachResults.filter(
          (row) => row.conversionToPlan && row.conversionToPlan !== 'not_converted'
        ).length,
      });
    } catch (e) {
      console.error('Failed to load counts', e);
    }
  }

  async function loadRows(tab: TabKey = activeTab) {
    setLoading(true);
    try {
      if (tab === 'outreach') {
        const resp = await get<OutreachListResponse>('/brand-outreach/list', {
          page: 1,
          limit: 100,
        });
        setOutreachRows(Array.isArray(resp?.results) ? resp.results : []);
      } else {
        const resp = await get<NetworkListResponse>('/brand-network/list', {
          page: 1,
          limit: 100,
        });
        setNetworkRows(Array.isArray(resp?.results) ? resp.results : []);
      }
    } catch (e: any) {
      await showErr(e?.message || 'Failed to load rows.');
    } finally {
      setLoading(false);
    }
  }

  async function refreshAll(tab: TabKey = activeTab) {
    await Promise.all([loadRows(tab), loadCounts()]);
  }

  useEffect(() => {
    setSelectedIds({});
    setShowCreateRow(false);
    setEditingId('');
    setDraft({});
    setCreateDraft(
      activeTab === 'outreach'
        ? getDefaultOutreachCreateDraft()
        : getDefaultNetworkCreateDraft()
    );
    refreshAll(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function startEdit(row: any) {
    setShowCreateRow(false);
    setEditingId(row._id);

    if (activeTab === 'outreach') {
      setDraft({
        id: row._id,
        brandName: row.brandName || '',
        website: row.website || '',
        roleOfPerson: row.roleOfPerson || '',
        emailOfPerson: row.emailOfPerson || '',
        personalization: row.personalization || '',
        notes: row.notes || '',
        signupStatus: row.signupStatus || 'not_signed_up',
        conversionToPlan: row.conversionToPlan || 'not_converted',
      });
      return;
    }

    setDraft({
      id: row._id,
      brandName: row.brandName || '',
      website: row.website || '',
      contacts: row.contacts || '',
      employeeCount: row.employeeCount ?? '',
      monthlyBudget: row.monthlyBudget ?? '',
      targetRegions: Array.isArray(row.targetRegions) ? row.targetRegions.join(', ') : '',
      platforms: Array.isArray(row.platforms) ? row.platforms.join(', ') : '',
      influencerSize: row.influencerSize || '',
      influencerCategory: row.influencerCategory || '',
      numberOfInfluencers: row.numberOfInfluencers ?? '',
      campaignRequirement: row.campaignRequirement || '',
      contentType: row.contentType || '',
      startDate: row?.campaignTimeline?.startDate
        ? String(row.campaignTimeline.startDate).slice(0, 10)
        : '',
      endDate: row?.campaignTimeline?.endDate
        ? String(row.campaignTimeline.endDate).slice(0, 10)
        : '',
      planType: row.planType || '',
      subscriptionStatus: row.subscriptionStatus || '',
      notes: row.notes || '',
    });
  }

  function cancelEdit() {
    setEditingId('');
    setDraft({});
  }

  function openCreateRow() {
    setEditingId('');
    setDraft({});
    setShowCreateRow(true);
    setCreateDraft(
      activeTab === 'outreach'
        ? getDefaultOutreachCreateDraft()
        : getDefaultNetworkCreateDraft()
    );
  }

  function cancelCreateRow() {
    setShowCreateRow(false);
    setCreateDraft(
      activeTab === 'outreach'
        ? getDefaultOutreachCreateDraft()
        : getDefaultNetworkCreateDraft()
    );
  }

  function setField(key: string, value: any) {
    setDraft((p) => ({ ...p, [key]: value }));
  }

  function setCreateField(key: string, value: any) {
    setCreateDraft((p) => ({ ...p, [key]: value }));
  }

  function toggleRowSelection(id: string, checked: boolean) {
    setSelectedIds((prev) => ({ ...prev, [id]: checked }));
  }

  function toggleSelectAll(checked: boolean) {
    const next: Record<string, boolean> = {};
    rows.forEach((row: any) => {
      next[row._id] = checked;
    });
    setSelectedIds(next);
  }

  async function saveRow() {
    try {
      const id = asText(draft.id);
      if (!id) return;

      if (activeTab === 'outreach') {
        await post('/brand-outreach/update', {
          id,
          brandName: asText(draft.brandName),
          website: asText(draft.website),
          roleOfPerson: asText(draft.roleOfPerson),
          emailOfPerson: asText(draft.emailOfPerson),
          personalization: asText(draft.personalization),
          notes: asText(draft.notes),
          signupStatus: asText(draft.signupStatus),
          conversionToPlan: asText(draft.conversionToPlan),
        });
      } else {
        await post('/brand-network/update', {
          id,
          brandName: asText(draft.brandName),
          website: asText(draft.website),
          contacts: asText(draft.contacts),
          employeeCount: toNullableNumber(draft.employeeCount),
          monthlyBudget: toNullableNumber(draft.monthlyBudget),
          targetRegions: parseCsv(asText(draft.targetRegions)),
          platforms: parseCsv(asText(draft.platforms)),
          influencerSize: asText(draft.influencerSize),
          influencerCategory: asText(draft.influencerCategory),
          numberOfInfluencers: toNullableNumber(draft.numberOfInfluencers),
          campaignRequirement: asText(draft.campaignRequirement),
          contentType: asText(draft.contentType),
          campaignTimeline: {
            startDate: asText(draft.startDate) || null,
            endDate: asText(draft.endDate) || null,
          },
          planType: asText(draft.planType),
          subscriptionStatus: asText(draft.subscriptionStatus),
          notes: asText(draft.notes),
        });
      }

      setEditingId('');
      setDraft({});
      await refreshAll(activeTab);
      await showSuccess('Row updated successfully.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to save row.');
    }
  }

  async function createRow() {
    try {
      setCreating(true);

      if (activeTab === 'outreach') {
        await post('/brand-outreach/create', {
          brandName: asText(createDraft.brandName),
          website: asText(createDraft.website),
          roleOfPerson: asText(createDraft.roleOfPerson),
          emailOfPerson: asText(createDraft.emailOfPerson),
          personalization: asText(createDraft.personalization),
          notes: asText(createDraft.notes),
          signupStatus: asText(createDraft.signupStatus),
          conversionToPlan: asText(createDraft.conversionToPlan),
        });
      } else {
        await post('/brand-network/create', {
          brandName: asText(createDraft.brandName),
          website: asText(createDraft.website),
          contacts: asText(createDraft.contacts),
          employeeCount: toNullableNumber(createDraft.employeeCount),
          monthlyBudget: toNullableNumber(createDraft.monthlyBudget),
          targetRegions: parseCsv(asText(createDraft.targetRegions)),
          platforms: parseCsv(asText(createDraft.platforms)),
          influencerSize: asText(createDraft.influencerSize),
          influencerCategory: asText(createDraft.influencerCategory),
          numberOfInfluencers: toNullableNumber(createDraft.numberOfInfluencers),
          campaignRequirement: asText(createDraft.campaignRequirement),
          contentType: asText(createDraft.contentType),
          campaignTimeline: {
            startDate: asText(createDraft.startDate) || null,
            endDate: asText(createDraft.endDate) || null,
          },
          planType: asText(createDraft.planType),
          subscriptionStatus: asText(createDraft.subscriptionStatus),
          notes: asText(createDraft.notes),
        });
      }

      setShowCreateRow(false);
      setCreateDraft(
        activeTab === 'outreach'
          ? getDefaultOutreachCreateDraft()
          : getDefaultNetworkCreateDraft()
      );
      await refreshAll(activeTab);
      await showSuccess('Row created successfully.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to create row.');
    } finally {
      setCreating(false);
    }
  }

  async function markOutreach(id: string) {
    try {
      setMarkingOutreachId(id);
      await post('/brand-outreach/mark-outreach', { id });
      await refreshAll('outreach');
      await showSuccess('Outreach marked successfully.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to mark outreach.');
    } finally {
      setMarkingOutreachId('');
    }
  }

  async function markFollowUp(id: string, step: 1 | 2 | 3) {
    try {
      setFollowupLoading(`${id}-${step}`);
      await post('/brand-outreach/mark-followup', { id, step });
      await refreshAll('outreach');
      await showSuccess(`Follow up ${step} marked successfully.`);
    } catch (e: any) {
      await showErr(e?.message || 'Failed to mark follow up.');
    } finally {
      setFollowupLoading('');
    }
  }

  async function markReply(id: string, currentReplyText?: string) {
    try {
      const replyText = window.prompt('Enter reply note', currentReplyText || '');
      if (replyText === null) return;

      setReplyLoading(id);
      await post('/brand-outreach/mark-reply', {
        id,
        replyText,
      });
      await refreshAll('outreach');
      await showSuccess('Reply marked successfully.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to mark reply.');
    } finally {
      setReplyLoading('');
    }
  }

  function goToBulkOutreach() {
    if (!selectedOutreachRows.length) {
      showErr('Please select at least one outreach row with an email.');
      return;
    }

    const ids = selectedOutreachRows.map((row) => row._id).join(',');
    router.push(`/admin/inbound-emails?mode=brand&brandOutreachIds=${ids}`);
  }

  async function moveToNetwork(id: string) {
    try {
      setMovingId(id);
      await post('/brand-outreach/move-to-network', { id });
      await refreshAll('outreach');
      await refreshAll('network');
      await showSuccess('Moved to network successfully.');
    } catch (e: any) {
      await showErr(e?.message || 'Failed to move to network.');
    } finally {
      setMovingId('');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1700px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden rounded-3xl border shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white sm:px-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                    <Sparkles className="h-3.5 w-3.5" />
                    Brand workflow
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                      <FolderKanban className="h-7 w-7" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Brand Outreach & Network
                      </h1>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
                        <span className="inline-flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          CRM: <b className="text-white">Direct Brand Management</b>
                        </span>
                        <span>
                          Workflow: <b className="text-white">Outreach → Signup → Conversion → Network</b>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
                  <StatCard label="Outreach" value={counts.outreach} icon={<Mail className="h-5 w-5" />} />
                  <StatCard label="Network" value={counts.network} icon={<Users className="h-5 w-5" />} />
                  <StatCard label="Replies" value={counts.reply} icon={<Check className="h-5 w-5" />} />
                  <StatCard label="Selected" value={selectedCount} icon={<Sparkles className="h-5 w-5" />} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
            <TabsList className="h-auto rounded-2xl p-1">
              <TabsTrigger value="outreach" className="rounded-xl px-4 py-2.5">
                Outreach ({counts.outreach})
              </TabsTrigger>
              <TabsTrigger value="network" className="rounded-xl px-4 py-2.5">
                Network ({counts.network})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => refreshAll(activeTab)}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button className="rounded-xl" onClick={openCreateRow}>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
            {activeTab === 'outreach' ? (
              <Button className="rounded-xl" onClick={goToBulkOutreach} disabled={!selectedOutreachRows.length}>
                <Send className="mr-2 h-4 w-4" />
                Bulk Outreach
              </Button>
            ) : null}
          </div>
        </div>

        <SectionCard
          title={activeTab === 'outreach' ? 'Brand Outreach Sheet' : 'Brand Network Sheet'}
          description={
            activeTab === 'outreach'
              ? 'Track direct outreach, follow-ups, replies, signup status, and conversion.'
              : 'Manage active brands that converted and shared campaign or creator requirements.'
          }
          action={
            loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading rows
              </div>
            ) : null
          }
        >
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : !rows.length && !showCreateRow ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No rows found in {activeTab}.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[1800px]">
                <Table className="w-full table-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[56px]">
                        <Checkbox
                          checked={allSelected || (someSelected ? 'indeterminate' : false)}
                          onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                          aria-label="Select all"
                        />
                      </TableHead>

                      {activeTab === 'outreach' ? (
                        <>
                          <TableHead>Brand Name</TableHead>
                          <TableHead>Website</TableHead>
                          <TableHead>Role of Person</TableHead>
                          <TableHead>Email of Person</TableHead>
                          <TableHead>Personalization</TableHead>
                          <TableHead>Outreached</TableHead>
                          <TableHead>Date Last Contact</TableHead>
                          <TableHead>Reply</TableHead>
                          <TableHead>Follow Up 1</TableHead>
                          <TableHead>Follow Up 2</TableHead>
                          <TableHead>Follow Up 3</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Signup Status</TableHead>
                          <TableHead>Conversion Plan</TableHead>
                          <TableHead>Move to Network</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </>
                      ) : null}

                      {activeTab === 'network' ? (
                        <>
                          <TableHead>Brand Name</TableHead>
                          <TableHead>Website</TableHead>
                          <TableHead>Contacts</TableHead>
                          <TableHead>Employee Count</TableHead>
                          <TableHead>Monthly Budget</TableHead>
                          <TableHead>Target Regions</TableHead>
                          <TableHead>Platforms</TableHead>
                          <TableHead>Influencer Size</TableHead>
                          <TableHead>Influencer Category</TableHead>
                          <TableHead>No. of Influencers</TableHead>
                          <TableHead>Campaign Requirement</TableHead>
                          <TableHead>Content Type</TableHead>
                          <TableHead>Campaign Timeline</TableHead>
                          <TableHead>Plan Type</TableHead>
                          <TableHead>Subscription Status</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </>
                      ) : null}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {showCreateRow ? (
                      <TableRow className="bg-muted/40">
                        <TableCell />

                        {activeTab === 'outreach' ? (
                          <>
                            <TableCell><Input value={createDraft.brandName} onChange={(e) => setCreateField('brandName', e.target.value)} /></TableCell>
                            <TableCell><Input value={createDraft.website} onChange={(e) => setCreateField('website', e.target.value)} /></TableCell>
                            <TableCell><Input value={createDraft.roleOfPerson} onChange={(e) => setCreateField('roleOfPerson', e.target.value)} /></TableCell>
                            <TableCell><Input value={createDraft.emailOfPerson} onChange={(e) => setCreateField('emailOfPerson', e.target.value)} /></TableCell>
                            <TableCell><Textarea value={createDraft.personalization} onChange={(e) => setCreateField('personalization', e.target.value)} rows={2} /></TableCell>
                            <TableCell>{DASH}</TableCell>
                            <TableCell>{DASH}</TableCell>
                            <TableCell>{DASH}</TableCell>
                            <TableCell>{DASH}</TableCell>
                            <TableCell>{DASH}</TableCell>
                            <TableCell>{DASH}</TableCell>
                            <TableCell><Textarea value={createDraft.notes} onChange={(e) => setCreateField('notes', e.target.value)} rows={2} /></TableCell>
                            <TableCell>
                              <Select value={createDraft.signupStatus} onValueChange={(value) => setCreateField('signupStatus', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_signed_up">Not Signed Up</SelectItem>
                                  <SelectItem value="signed_up">Signed Up</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select value={createDraft.conversionToPlan} onValueChange={(value) => setCreateField('conversionToPlan', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_converted">Not Converted</SelectItem>
                                  <SelectItem value="trial_pack">Trial Pack</SelectItem>
                                  <SelectItem value="subscription">Subscription</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>{DASH}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" onClick={createRow} disabled={creating}>
                                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelCreateRow}><X className="mr-2 h-4 w-4" />Cancel</Button>
                              </div>
                            </TableCell>
                          </>
                        ) : null}

                        {activeTab === 'network' ? (
                          <>
                            <TableCell><Input value={createDraft.brandName} onChange={(e) => setCreateField('brandName', e.target.value)} /></TableCell>
                            <TableCell><Input value={createDraft.website} onChange={(e) => setCreateField('website', e.target.value)} /></TableCell>
                            <TableCell><Textarea value={createDraft.contacts} onChange={(e) => setCreateField('contacts', e.target.value)} rows={2} /></TableCell>
                            <TableCell><Input type="number" value={createDraft.employeeCount} onChange={(e) => setCreateField('employeeCount', e.target.value)} /></TableCell>
                            <TableCell><Input type="number" value={createDraft.monthlyBudget} onChange={(e) => setCreateField('monthlyBudget', e.target.value)} /></TableCell>
                            <TableCell><Input value={createDraft.targetRegions} onChange={(e) => setCreateField('targetRegions', e.target.value)} placeholder="comma separated" /></TableCell>
                            <TableCell><Input value={createDraft.platforms} onChange={(e) => setCreateField('platforms', e.target.value)} placeholder="instagram,youtube" /></TableCell>
                            <TableCell>
                              <Select value={createDraft.influencerSize} onValueChange={(value) => setCreateField('influencerSize', value)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="nano">Nano</SelectItem>
                                  <SelectItem value="micro">Micro</SelectItem>
                                  <SelectItem value="mid">Mid</SelectItem>
                                  <SelectItem value="macro">Macro</SelectItem>
                                  <SelectItem value="celebrity">Celebrity</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell><Input value={createDraft.influencerCategory} onChange={(e) => setCreateField('influencerCategory', e.target.value)} /></TableCell>
                            <TableCell><Input type="number" value={createDraft.numberOfInfluencers} onChange={(e) => setCreateField('numberOfInfluencers', e.target.value)} /></TableCell>
                            <TableCell><Textarea value={createDraft.campaignRequirement} onChange={(e) => setCreateField('campaignRequirement', e.target.value)} rows={2} /></TableCell>
                            <TableCell>
                              <Select value={createDraft.contentType} onValueChange={(value) => setCreateField('contentType', value)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="reel">Reel</SelectItem>
                                  <SelectItem value="post">Post</SelectItem>
                                  <SelectItem value="story">Story</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="mix">Mix</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <Input type="date" value={createDraft.startDate} onChange={(e) => setCreateField('startDate', e.target.value)} />
                                <Input type="date" value={createDraft.endDate} onChange={(e) => setCreateField('endDate', e.target.value)} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select value={createDraft.planType} onValueChange={(value) => setCreateField('planType', value)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="trial_pack">Trial Pack</SelectItem>
                                  <SelectItem value="subscription">Subscription</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select value={createDraft.subscriptionStatus} onValueChange={(value) => setCreateField('subscriptionStatus', value)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="trial_active">Trial Active</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="expired">Expired</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell><Textarea value={createDraft.notes} onChange={(e) => setCreateField('notes', e.target.value)} rows={2} /></TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" onClick={createRow} disabled={creating}>
                                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelCreateRow}><X className="mr-2 h-4 w-4" />Cancel</Button>
                              </div>
                            </TableCell>
                          </>
                        ) : null}
                      </TableRow>
                    ) : null}

                    {rows.map((row: any) => {
                      const isEdit = editingId === row._id;

                      return (
                        <TableRow key={row._id}>
                          <TableCell>
                            <Checkbox
                              checked={!!selectedIds[row._id]}
                              onCheckedChange={(checked) => toggleRowSelection(row._id, !!checked)}
                              aria-label={`Select ${row.brandName || 'row'}`}
                            />
                          </TableCell>

                          {activeTab === 'outreach' ? (
                            <>
                              <TableCell className="font-medium">{row.brandName || DASH}</TableCell>
                              <TableCell>
                                {row.website ? (
                                  <a href={row.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline underline-offset-4">
                                    Open
                                  </a>
                                ) : DASH}
                              </TableCell>
                              <TableCell>{isEdit ? <Input value={draft.roleOfPerson ?? ''} onChange={(e) => setField('roleOfPerson', e.target.value)} /> : (row.roleOfPerson || DASH)}</TableCell>
                              <TableCell>{isEdit ? <Input value={draft.emailOfPerson ?? ''} onChange={(e) => setField('emailOfPerson', e.target.value)} /> : (row.emailOfPerson || DASH)}</TableCell>
                              <TableCell className="max-w-[250px]">{isEdit ? <Textarea value={draft.personalization ?? ''} onChange={(e) => setField('personalization', e.target.value)} rows={2} /> : (row.personalization || DASH)}</TableCell>
                              <TableCell>
                                <Badge variant={row.outreached ? 'default' : 'secondary'}>{row.outreached ? 'Yes' : 'No'}</Badge>
                              </TableCell>
                              <TableCell>{formatDate(row.dateLastContact || row.updatedAt)}</TableCell>
                              <TableCell>
                                <Badge variant={row.reply ? 'default' : 'secondary'}>{row.reply ? 'Yes' : 'No'}</Badge>
                              </TableCell>
                              <TableCell>{row.followUp1 ? formatDate(row.followUp1SentAt) : DASH}</TableCell>
                              <TableCell>{row.followUp2 ? formatDate(row.followUp2SentAt) : DASH}</TableCell>
                              <TableCell>{row.followUp3 ? formatDate(row.followUp3SentAt) : DASH}</TableCell>
                              <TableCell className="max-w-[220px]">{isEdit ? <Textarea value={draft.notes ?? ''} onChange={(e) => setField('notes', e.target.value)} rows={2} /> : (row.notes || DASH)}</TableCell>
                              <TableCell>
                                {isEdit ? (
                                  <Select value={draft.signupStatus ?? 'not_signed_up'} onValueChange={(value) => setField('signupStatus', value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="not_signed_up">Not Signed Up</SelectItem>
                                      <SelectItem value="signed_up">Signed Up</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant={row.signupStatus === 'signed_up' ? 'default' : 'secondary'}>
                                    {prettifySignupStatus(row.signupStatus)}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEdit ? (
                                  <Select value={draft.conversionToPlan ?? 'not_converted'} onValueChange={(value) => setField('conversionToPlan', value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="not_converted">Not Converted</SelectItem>
                                      <SelectItem value="trial_pack">Trial Pack</SelectItem>
                                      <SelectItem value="subscription">Subscription</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant={row.conversionToPlan && row.conversionToPlan !== 'not_converted' ? 'default' : 'secondary'}>
                                    {prettifyConversionPlan(row.conversionToPlan)}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-2">
                                  <Badge variant={row.moveToNetwork ? 'default' : 'secondary'}>
                                    {row.moveToNetwork ? 'Moved' : 'Pending'}
                                  </Badge>
                                  {!row.moveToNetwork && row.moveToNetworkEligibility?.reasons?.length ? (
                                    <p className="max-w-[190px] text-xs text-muted-foreground">
                                      {row.moveToNetworkEligibility.reasons.join(', ')}
                                    </p>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-wrap justify-end gap-2">
                                  {isEdit ? (
                                    <>
                                      <Button size="sm" onClick={saveRow}><Save className="mr-2 h-4 w-4" />Save</Button>
                                      <Button size="sm" variant="outline" onClick={cancelEdit}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button size="sm" variant="outline" onClick={() => startEdit(row)}>
                                        <Edit3 className="mr-2 h-4 w-4" />Edit
                                      </Button>
                                      <Button size="sm" onClick={() => moveToNetwork(row._id)} disabled={movingId === row._id || !canMoveToNetwork(row)}>
                                        {movingId === row._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                                        Move to Network
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </>
                          ) : null}

                          {activeTab === 'network' ? (
                            <>
                              <TableCell className="font-medium">{row.brandName || DASH}</TableCell>
                              <TableCell>
                                {row.website ? (
                                  <a href={row.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline underline-offset-4">
                                    Open
                                  </a>
                                ) : DASH}
                              </TableCell>
                              <TableCell className="max-w-[220px]">{isEdit ? <Textarea value={draft.contacts ?? ''} onChange={(e) => setField('contacts', e.target.value)} rows={2} /> : (row.contacts || DASH)}</TableCell>
                              <TableCell>{isEdit ? <Input type="number" value={draft.employeeCount ?? ''} onChange={(e) => setField('employeeCount', e.target.value)} /> : formatNumber(row.employeeCount)}</TableCell>
                              <TableCell>{isEdit ? <Input type="number" value={draft.monthlyBudget ?? ''} onChange={(e) => setField('monthlyBudget', e.target.value)} /> : formatCurrency(row.monthlyBudget)}</TableCell>
                              <TableCell>{isEdit ? <Input value={draft.targetRegions ?? ''} onChange={(e) => setField('targetRegions', e.target.value)} /> : joinList(row.targetRegions)}</TableCell>
                              <TableCell>{isEdit ? <Input value={draft.platforms ?? ''} onChange={(e) => setField('platforms', e.target.value)} /> : joinList(row.platforms)}</TableCell>
                              <TableCell>
                                {isEdit ? (
                                  <Select value={draft.influencerSize ?? ''} onValueChange={(value) => setField('influencerSize', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="nano">Nano</SelectItem>
                                      <SelectItem value="micro">Micro</SelectItem>
                                      <SelectItem value="mid">Mid</SelectItem>
                                      <SelectItem value="macro">Macro</SelectItem>
                                      <SelectItem value="celebrity">Celebrity</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  prettifyInfluencerSize(row.influencerSize)
                                )}
                              </TableCell>
                              <TableCell>{isEdit ? <Input value={draft.influencerCategory ?? ''} onChange={(e) => setField('influencerCategory', e.target.value)} /> : (row.influencerCategory || DASH)}</TableCell>
                              <TableCell>{isEdit ? <Input type="number" value={draft.numberOfInfluencers ?? ''} onChange={(e) => setField('numberOfInfluencers', e.target.value)} /> : formatNumber(row.numberOfInfluencers)}</TableCell>
                              <TableCell className="max-w-[260px]">{isEdit ? <Textarea value={draft.campaignRequirement ?? ''} onChange={(e) => setField('campaignRequirement', e.target.value)} rows={2} /> : (row.campaignRequirement || DASH)}</TableCell>
                              <TableCell>
                                {isEdit ? (
                                  <Select value={draft.contentType ?? ''} onValueChange={(value) => setField('contentType', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="reel">Reel</SelectItem>
                                      <SelectItem value="post">Post</SelectItem>
                                      <SelectItem value="story">Story</SelectItem>
                                      <SelectItem value="video">Video</SelectItem>
                                      <SelectItem value="mix">Mix</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  prettifyContentType(row.contentType)
                                )}
                              </TableCell>
                              <TableCell>
                                {isEdit ? (
                                  <div className="space-y-2">
                                    <Input type="date" value={draft.startDate ?? ''} onChange={(e) => setField('startDate', e.target.value)} />
                                    <Input type="date" value={draft.endDate ?? ''} onChange={(e) => setField('endDate', e.target.value)} />
                                  </div>
                                ) : (
                                  formatDateRange(row?.campaignTimeline?.startDate, row?.campaignTimeline?.endDate)
                                )}
                              </TableCell>
                              <TableCell>
                                {isEdit ? (
                                  <Select value={draft.planType ?? ''} onValueChange={(value) => setField('planType', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="trial_pack">Trial Pack</SelectItem>
                                      <SelectItem value="subscription">Subscription</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  prettifyPlanType(row.planType)
                                )}
                              </TableCell>
                              <TableCell>
                                {isEdit ? (
                                  <Select value={draft.subscriptionStatus ?? ''} onValueChange={(value) => setField('subscriptionStatus', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="trial_active">Trial Active</SelectItem>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="expired">Expired</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  prettifySubscriptionStatus(row.subscriptionStatus)
                                )}
                              </TableCell>
                              <TableCell className="max-w-[220px]">{isEdit ? <Textarea value={draft.notes ?? ''} onChange={(e) => setField('notes', e.target.value)} rows={2} /> : (row.notes || DASH)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {isEdit ? (
                                    <>
                                      <Button size="sm" onClick={saveRow}><Save className="mr-2 h-4 w-4" />Save</Button>
                                      <Button size="sm" variant="outline" onClick={cancelEdit}><X className="mr-2 h-4 w-4" />Cancel</Button>
                                    </>
                                  ) : (
                                    <Button size="sm" variant="outline" onClick={() => startEdit(row)}>
                                      <Edit3 className="mr-2 h-4 w-4" />Edit
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </>
                          ) : null}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </SectionCard>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick notes</CardTitle>
            <CardDescription>
              A brand can move from Outreach to Network once signup is marked as Signed Up.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <Field label="Module">
              <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">Brand Outreach & Network</div>
            </Field>
            <Field label="Outreach leads">
              <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">{counts.outreach}</div>
            </Field>
            <Field label="Replies received">
              <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">{counts.reply}</div>
            </Field>
            <Field label="Network brands">
              <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">{counts.network}</div>
            </Field>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
