// Centralised plan catalogue – update only here.

export interface Plan {
  role: string;
  name: string;
  price: number;
  autoRenew?: boolean;
  durationMins?: number;
  features: Record<string, number>;
}

export const plans = [
  // ── BRAND ────────────────────────────────────────────────
  {
    role: 'Brand',
    name: 'Free',
    price: 0,
    autoRenew: true,
    durationMins: 5,
    features: {
      influencer_search_quota: 10,
      live_campaigns_limit: 1,
      email_outreach_credits: 0,
      dedicated_manager_support: 0
    }
  },
  {
    role: 'Brand',
    name: 'Growth',
    price: 99,
    features: {
      influencer_search_quota: 250,
      live_campaigns_limit: 10,
      email_outreach_credits: 250,
      dedicated_manager_support: 0
    }
  },
  {
    role: 'Brand',
    name: 'Pro',
    price: 199,
    features: {
      influencer_search_quota: 500,
      live_campaigns_limit: 0,
      email_outreach_credits: 500,
      dedicated_manager_support: 1
    }
  },
  {
    role: 'Brand',
    name: 'Premium',
    price: 299,
    features: {
      influencer_search_quota: 5000,
      live_campaigns_limit: 0,
      email_outreach_credits: 5000,
      dedicated_manager_support: 1
    }
  },

  // ── INFLUENCER ───────────────────────────────────────────
  {
    role: 'Influencer',
    name: 'Basic',
    price: 0,
    autoRenew: true,
    durationMins: 5,
    features: {
      apply_to_campaigns_quota: 3,
      email_outreach_credits: 0,
      pitch_templates_access: 0,
      dedicated_support_access: 0
    }
  },
  {
    role: 'Influencer',
    name: 'Starter',
    price: 19,
    features: {
      apply_to_campaigns_quota: 10,
      email_outreach_credits: 250,
      pitch_templates_access: 1,
      dedicated_support_access: 1
    }
  },
  {
    role: 'Influencer',
    name: 'Creator',
    price: 29,
    features: {
      apply_to_campaigns_quota: 50,
      email_outreach_credits: 500,
      pitch_templates_access: 1,
      dedicated_support_access: 1
    }
  },
  {
    role: 'Influencer',
    name: 'Elite',
    price: 49,
    features: {
      apply_to_campaigns_quota: 0,
      email_outreach_credits: 5000,
      pitch_templates_access: 1,
      dedicated_support_access: 1
    }
  }
];
