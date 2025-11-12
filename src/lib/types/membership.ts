export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  price_cn: number;
  old_price?: number;
  old_price_cn?: number;
  description: string;
  duration: number;
  features: string[];
  created_at: string;
  updated_at: string;
}