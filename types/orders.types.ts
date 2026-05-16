export type Status = "Preparing" | "Ready" | "Delivered" | "Canceled";
export type OrderType = "Delivery" | "Pick Up" | "Dine-in";
export type PaymentMethod = "Cash" | "Card" | "Bank Transfer";

export type OrderItem = {
  name: string;
  qty: number;
  price: number;
};

export type Order = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  type: OrderType;
  status: Status;
  time: string;
};

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

export type Customer = {
  name: string;
  phone: string;
};

export type CartItem = MenuItem & { qty: number };

export const STATUS_STYLE: Record<Status, { bg: string; color: string }> = {
  Preparing: { bg: "rgba(239,68,68,0.10)",   color: "#dc2626" },
  Ready:     { bg: "rgba(245,158,11,0.12)",  color: "#b45309" },
  Delivered: { bg: "rgba(34,197,94,0.12)",   color: "#16a34a" },
  Canceled:  { bg: "rgba(156,163,175,0.18)", color: "#6b7280" },
};

export const SEED_ORDERS: Order[] = [
  { id: "#FD-2847", customer: "Sarah M.",  email: "sarahm@gmail.com",  phone: "+234 810 3335 279", address: "12 Lekki Phase 1, Lagos",  items: [{ name: "Spicy Jollof",    qty: 1, price: 5000  }, { name: "Peppered Turkey", qty: 1, price: 15000 }], type: "Delivery", status: "Preparing", time: "02:30 PM" },
  { id: "#FD-2846", customer: "Mike O.",   email: "mikeo@gmail.com",   phone: "+234 810 0000 444", address: "5 Allen Ave, Ikeja",        items: [{ name: "Pounded Yam",     qty: 1, price: 1200  }],                                                      type: "Dine-in",  status: "Ready",     time: "03:00 PM" },
  { id: "#FD-2845", customer: "Ada K.",    email: "adak@gmail.com",    phone: "+234 810 0000 444", address: "3 Ozumba Mbadiwe, VI",      items: [{ name: "Egusi Soup",      qty: 2, price: 7000  }, { name: "Starch",          qty: 1, price: 600   }], type: "Delivery", status: "Delivered", time: "10:00 AM" },
  { id: "#FD-2844", customer: "John C.",   email: "johnc@gmail.com",   phone: "+234 810 0000 444", address: "7 Admiralty Way, Lekki",    items: [{ name: "Fried Rice",      qty: 2, price: 6400  }, { name: "Afang Soup",      qty: 2, price: 6000  }], type: "Pick Up",  status: "Delivered", time: "08:00 AM" },
  { id: "#FD-2843", customer: "Lisa P.",   email: "lisap@gmail.com",   phone: "+234 810 0000 444", address: "21 Broad Street, Lagos",    items: [{ name: "Jam Doughnut",    qty: 5, price: 6000  }],                                                      type: "Delivery", status: "Canceled",  time: "08:00 AM" },
  { id: "#FD-2842", customer: "Abel F.",   email: "abelf@gmail.com",   phone: "+234 810 0000 444", address: "9 Bourdillon Rd, Ikoyi",    items: [{ name: "Pizza Roll",      qty: 1, price: 3700  }],                                                      type: "Delivery", status: "Delivered", time: "08:00 AM" },
  { id: "#FD-2841", customer: "Ngozi A.",  email: "ngozi@gmail.com",   phone: "+234 810 0000 444", address: "15 Awolowo Road, Ikoyi",    items: [{ name: "Pounded Yam",     qty: 2, price: 2400  }],                                                      type: "Pick Up",  status: "Delivered", time: "07:30 AM" },
  { id: "#FD-2840", customer: "Emeka T.",  email: "emeka@gmail.com",   phone: "+234 810 0000 444", address: "2 Kofo Abayomi, VI",        items: [{ name: "Egusi Soup",      qty: 1, price: 3500  }],                                                      type: "Dine-in",  status: "Ready",     time: "07:00 AM" },
  { id: "#FD-2839", customer: "Fatima B.", email: "fatima@gmail.com",  phone: "+234 810 0000 444", address: "44 Toyin Street, Ikeja",    items: [{ name: "Fried Rice",      qty: 1, price: 3200  }],                                                      type: "Delivery", status: "Preparing", time: "06:45 AM" },
  { id: "#FD-2838", customer: "Chidi O.",  email: "chidi@gmail.com",   phone: "+234 810 0000 444", address: "8 Opebi Road, Ikeja",       items: [{ name: "Starch",          qty: 2, price: 1200  }],                                                      type: "Pick Up",  status: "Delivered", time: "06:00 AM" },
  { id: "#FD-2837", customer: "Amaka N.",  email: "amaka@gmail.com",   phone: "+234 810 0000 444", address: "31 Adeola Odeku, VI",       items: [{ name: "Pizza Roll",      qty: 2, price: 7400  }],                                                      type: "Delivery", status: "Canceled",  time: "05:30 AM" },
  { id: "#FD-2836", customer: "Seun L.",   email: "seun@gmail.com",    phone: "+234 810 0000 444", address: "6 Idowu Taylor, VI",        items: [{ name: "Jam Doughnut",    qty: 1, price: 1200  }],                                                      type: "Dine-in",  status: "Delivered", time: "05:00 AM" },
];

export const SEED_CUSTOMERS: Customer[] = [
  { name: "Sarah M.", phone: "+234 810 0000 444" },
  { name: "Mike O.",  phone: "+234 810 0000 444" },
  { name: "Ada K.",   phone: "+234 810 0000 444" },
];

export const MENU_ITEMS: MenuItem[] = [
  { id: 1, name: "Jam Doughnut",  price: 1200, stock: 10 },
  { id: 2, name: "Fried Rice",    price: 3200, stock: 24 },
  { id: 3, name: "Egusi Soup",    price: 3500, stock: 8  },
  { id: 4, name: "Pizza Roll",    price: 3700, stock: 0  },
  { id: 5, name: "Pounded Yam",   price: 1200, stock: 15 },
  { id: 6, name: "Afang Soup",    price: 3000, stock: 6  },
  { id: 7, name: "Starch",        price: 600,  stock: 20 },
  { id: 8, name: "Spicy Jollof",  price: 5000, stock: 12 },
];

export const SEARCH_BY_OPTIONS = ["Name", "Type", "Order ID"] as const;
export const STATUS_OPTIONS     = ["All Status", "Preparing", "Ready", "Delivered", "Canceled"] as const;
export const ORDER_TYPES        = ["Dine-in", "Pick Up", "Delivery"] as const;
export const PAYMENT_METHODS    = ["Cash", "Card", "Bank Transfer"] as const;
export const PER_PAGE           = 6;
export const TAX_RATE           = 0.075;

export function fmt(n: number) {
  return `₦${n.toLocaleString()}`;
}