export interface ServerMenuItem {
  id: string;
  theater_id?: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  isBestseller?: boolean;
  calories?: string;
  sizes?: { name: string; extraPrice: number }[];
  flavors?: string[];
  prepTimeMinutes: number;
  available?: boolean;
}

export const INITIAL_SERVER_MENU: ServerMenuItem[] = [
  {
    id: 'pop-1',
    name: 'Cheese Supreme Popcorn',
    category: 'popcorn',
    description: 'Golden popcorn tossed in velvety cheddar cheese seasoning with a rich savoury crunch.',
    price: 240,
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isBestseller: true,
    calories: '420 kcal',
    sizes: [
      { name: 'Regular (150g)', extraPrice: 0 },
      { name: 'Large (250g)', extraPrice: 70 },
      { name: 'Jumbo Tub (400g)', extraPrice: 130 },
    ],
    flavors: ['Classic Cheddar', 'Spicy Jalapeño Cheese', 'White Cheddar Herb'],
    prepTimeMinutes: 3,
  },
  {
    id: 'pop-2',
    name: 'Golden Butter Salted Popcorn',
    category: 'popcorn',
    description: 'Classic freshly popped warm corn loaded with hot clarified melted butter and sea salt.',
    price: 210,
    image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    calories: '380 kcal',
    sizes: [
      { name: 'Regular (150g)', extraPrice: 0 },
      { name: 'Large (250g)', extraPrice: 60 },
      { name: 'Jumbo Tub (400g)', extraPrice: 110 },
    ],
    prepTimeMinutes: 2,
  },
  {
    id: 'pop-3',
    name: 'Gourmet Caramel Crunch Popcorn',
    category: 'popcorn',
    description: 'Handcrafted mushroom corn coated with molten brown sugar caramel & Himalayan pink salt.',
    price: 260,
    image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isBestseller: true,
    calories: '510 kcal',
    sizes: [
      { name: 'Regular (150g)', extraPrice: 0 },
      { name: 'Large (250g)', extraPrice: 80 },
      { name: 'Jumbo Tub (400g)', extraPrice: 140 },
    ],
    prepTimeMinutes: 3,
  },
  {
    id: 'pop-4',
    name: 'Peri-Peri Firecracker Popcorn',
    category: 'popcorn',
    description: 'Zesty African bird’s eye chili rub with a tangy citrus kick and smoky paprika.',
    price: 230,
    image: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    calories: '395 kcal',
    prepTimeMinutes: 2,
  },
  {
    id: 'combo-1',
    name: 'Blockbuster Duo Combo',
    category: 'combos',
    description: '1 Jumbo Cheese Popcorn + 2 Large Fountain Colas (650ml each) + 1 Peri Peri Dip.',
    price: 490,
    image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isBestseller: true,
    calories: '890 kcal',
    prepTimeMinutes: 4,
  },
  {
    id: 'combo-2',
    name: 'Cinema VIP Feast Box',
    category: 'combos',
    description: '1 Large Butter Popcorn + 1 Loaded Mexican Nachos + 1 Cold Coffee + 1 Chocolate Lava Cake.',
    price: 640,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    calories: '1150 kcal',
    prepTimeMinutes: 5,
  },
  {
    id: 'nacho-1',
    name: 'Fiesta Cheese & Jalapeño Nachos',
    category: 'nachos',
    description: 'Stone-ground yellow corn tortilla chips served with warm melted queso dip & fresh salsa.',
    price: 220,
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isBestseller: true,
    calories: '460 kcal',
    prepTimeMinutes: 3,
  },
  {
    id: 'bev-1',
    name: 'Chilled Fountain Cola',
    category: 'beverages',
    description: 'Ice-cold carbonated fountain beverage served with lemon twist and crushed ice.',
    price: 130,
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    calories: '180 kcal',
    sizes: [
      { name: 'Regular (400ml)', extraPrice: 0 },
      { name: 'Large (650ml)', extraPrice: 40 },
    ],
    prepTimeMinutes: 1,
  },
  {
    id: 'hot-1',
    name: 'Crispy Veg Spring Rolls',
    category: 'hot_bites',
    description: 'Golden fried crispy wonton rolls stuffed with shredded wok vegetables and sweet chili dip.',
    price: 180,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    calories: '340 kcal',
    prepTimeMinutes: 5,
  },
  {
    id: 'des-1',
    name: 'Molten Chocolate Lava Cake',
    category: 'desserts',
    description: 'Warm dark chocolate sponge oozing with velvety Belgian ganache center.',
    price: 190,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isBestseller: true,
    calories: '410 kcal',
    prepTimeMinutes: 3,
  }
];
