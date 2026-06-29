export type Room = {
  id: string;
  room_number: string;
  name: string;
  room_type: string;
  description: string | null;
  base_price: number;
  base_occupancy: number;
  extra_capacity: number;
  max_occupancy: number;
  amenities: string[] | null;
  photos: string[] | null;
  display_order: number;
  // Override-aware pricing, merged in after get_effective_room_prices.
  // Absent until the stay window is known; fall back to base_price * nights.
  stay_total?: number;
  effective_nightly?: number;
  is_uniform?: boolean;
  override_applied?: boolean;
  override_name?: string | null;
  nightly_breakdown?: Array<{
    date: string;
    rate: number;
    override_name: string | null;
  }>;
};

// Row shape returned by the get_effective_room_prices RPC.
export type EffectiveRoomPrice = {
  room_id: string;
  base_price: number;
  nights: number;
  stay_total: number;
  effective_nightly: number;
  is_uniform: boolean;
  override_applied: boolean;
  override_name: string | null;
  nightly_breakdown: Array<{
    date: string;
    rate: number;
    override_name: string | null;
  }>;
};

export type Addon = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_per_night: boolean;
  max_per_room: number;
  is_active: boolean;
};

export type BookingLookupResult = {
  booking_code: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  status: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  discount_type?: "none" | "percent" | "amount";
  discount_value?: number;
  discount_amount?: number;
  special_requests: string | null;
  rooms: Array<{
    room_number: string;
    name: string;
    room_type: string;
    rate_per_night: number;
    guests: number;
  }>;
};

export type SiteSettings = {
  hotel_name: string;
  hotel_tagline: string;
  hotel_address: string;
  contact_phone: string;
  contact_email: string;
  whatsapp_number: string;
  check_in_time: string;
  check_out_time: string;
};
