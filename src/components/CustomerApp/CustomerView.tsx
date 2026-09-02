import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Sparkles, 
  MapPin, 
  Flame, 
  Plus, 
  Check, 
  Clock, 
  ChevronRight,
  Info,
  ShieldCheck
} from 'lucide-react';
import { MenuItem, CartItem, SeatLocation, Order } from '../../types';
import { menuStore } from '../../utils/menuStore';
import { ItemCustomizerModal } from './ItemCustomizerModal';
import { CartCheckoutDrawer } from './CartCheckoutDrawer';
import { UPIPaymentModal } from './UPIPaymentModal';
import { ActiveOrderTracker } from './ActiveOrderTracker';
import { orderStore } from '../../utils/storage';

interface CustomerViewProps {
  currentSeat: SeatLocation;
  onOpenAdmin?: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'popcorn', label: '🍿 Popcorn' },
  { id: 'combos', label: '🎬 Combos' },
  { id: 'nachos', label: '🧀 Nachos' },
  { id: 'beverages', label: '🥤 Drinks' },
  { id: 'hot_bites', label: '🍟 Hot Bites' },
  { id: 'desserts', label: '🍫 Desserts' },
];

export const CustomerView: React.FC<CustomerViewProps> = ({
  currentSeat,
  onOpenAdmin,
}) => {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [currentActiveOrder, setCurrentActiveOrder] = useState<Order | null>(null);

  // Load and listen to menu updates from menuStore
  useEffect(() => {
    setMenuList(menuStore.getMenu(currentSeat.theater_id));
    const unsub = menuStore.subscribe(() => {
      setMenuList(menuStore.getMenu(currentSeat.theater_id));
    });
    return () => unsub();
  }, [currentSeat.theater_id]);

  // Subscribe to order store for real-time changes to the user's active order
  useEffect(() => {
    const checkActiveOrders = () => {
      const orders = orderStore.getOrders();
      if (currentActiveOrder) {
        const found = orders.find(o => o.order_id === currentActiveOrder.order_id);
        if (found) {
          setCurrentActiveOrder(found);
        }
      }
    };

    const unsubscribe = orderStore.subscribe(checkActiveOrders);
    return () => unsubscribe();
  }, [currentActiveOrder]);

  const handleAddToCartDirect = (item: MenuItem) => {
    if ((item.sizes && item.sizes.length > 0) || (item.flavors && item.flavors.length > 0)) {
      setSelectedMenuItem(item);
      setIsCustomizerOpen(true);
      return;
    }

    const newItem: CartItem = {
      id: `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      isVeg: item.isVeg,
      image: item.image,
    };
    setCartItems(prev => [...prev, newItem]);
  };

  const handleAddToCartFromModal = (cartItem: CartItem) => {
    setCartItems(prev => [...prev, cartItem]);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleInitiatePayment = (order: Order) => {
    setIsCartOpen(false);
    setActivePaymentOrder(order);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paidOrder: Order) => {
    setIsPaymentModalOpen(false);
    setCartItems([]);
    setCurrentActiveOrder(paidOrder);
  };

  const filteredMenu = menuList.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (vegOnly && !item.isVeg) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 py-4 sm:py-6 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* If user has an active in-flight order, display tracker */}
        {currentActiveOrder ? (
          <ActiveOrderTracker
            order={currentActiveOrder}
            onNewOrder={() => setCurrentActiveOrder(null)}
          />
        ) : (
          /* Normal Food Ordering Menu Flow */
          <div className="space-y-4">
            {/* Search & Veg Filter */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search popcorn, combos, nachos, chilled sodas..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-neutral-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Veg Toggle */}
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  vegOnly
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-emerald-400 ring-2 ring-emerald-500/50' : 'bg-neutral-600'}`} />
                <span>Veg Only</span>
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {filteredMenu.map((item) => {
                const hasOptions = (item.sizes && item.sizes.length > 0) || (item.flavors && item.flavors.length > 0);

                return (
                  <div
                    key={item.id}
                    className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-3.5 sm:p-4 hover:border-neutral-700 transition-all flex gap-3 sm:gap-4 group relative overflow-hidden"
                  >
                    {/* Item Image */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-neutral-950">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {item.isBestseller && (
                        <div className="absolute top-1.5 left-1.5 bg-amber-500 text-neutral-950 font-black text-[9px] uppercase px-1.5 py-0.2 rounded shadow">
                          ★ Best
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center ${
                              item.isVeg
                                ? 'border-emerald-500'
                                : 'border-rose-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-white leading-snug">
                            {item.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/80">
                        <div>
                          <span className="text-xs text-neutral-500 font-normal">from </span>
                          <span className="text-sm sm:text-base font-bold text-white">₹{item.price}</span>
                        </div>

                        <button
                          onClick={() => {
                            if (hasOptions) {
                              setSelectedMenuItem(item);
                              setIsCustomizerOpen(true);
                            } else {
                              handleAddToCartDirect(item);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{hasOptions ? 'Customise' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredMenu.length === 0 && (
              <div className="py-12 text-center text-neutral-500 space-y-2">
                <p className="text-sm">No delicious items match your filter.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setVegOnly(false);
                  }}
                  className="text-xs text-amber-400 underline font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Floating Cart Bar (Fixed at bottom when cart has items) */}
        {!currentActiveOrder && totalCartCount > 0 && (
          <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-30 animate-slideUp">
            <div className="bg-amber-500 text-neutral-950 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between font-semibold">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-950 text-amber-400 flex items-center justify-center font-bold text-xs">
                  {totalCartCount}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold">Your Tray</div>
                  <div className="text-sm font-extrabold">₹{totalCartPrice.toFixed(2)}</div>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
              >
                <span>View Cart & Pay</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Item Customizer Modal */}
        <ItemCustomizerModal
          item={selectedMenuItem}
          isOpen={isCustomizerOpen}
          onClose={() => {
            setIsCustomizerOpen(false);
            setSelectedMenuItem(null);
          }}
          onAddToCart={handleAddToCartFromModal}
        />

        {/* Cart & Checkout Drawer */}
        <CartCheckoutDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={() => setCartItems([])}
          currentSeat={currentSeat}
          onInitiatePayment={handleInitiatePayment}
        />

        {/* UPI Payment Modal */}
        <UPIPaymentModal
          isOpen={isPaymentModalOpen}
          order={activePaymentOrder}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-neutral-900 text-center text-xs text-neutral-500 pb-8 space-y-1">
          <p>© {new Date().getFullYear()} Snack Box. All rights reserved.</p>
          <p className="text-[11px] text-neutral-600">Powered by N4X</p>
        </div>
      </div>
    </div>
  );
};
