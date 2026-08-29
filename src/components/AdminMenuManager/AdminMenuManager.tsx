import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Sparkles, 
  RotateCcw, 
  Check, 
  X, 
  Flame, 
  Clock, 
  Utensils, 
  Image as ImageIcon,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { MenuItem } from '../../types';
import { menuStore } from '../../utils/menuStore';

const CATEGORIES: { id: MenuItem['category']; label: string }[] = [
  { id: 'popcorn', label: '🍿 Popcorn' },
  { id: 'combos', label: '🎬 Combos' },
  { id: 'nachos', label: '🧀 Nachos' },
  { id: 'beverages', label: '🥤 Beverages' },
  { id: 'hot_bites', label: '🍟 Hot Bites' },
  { id: 'desserts', label: '🍫 Desserts' },
];

const PRESET_IMAGES = [
  { label: 'Cheese Popcorn', url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Salted Popcorn', url: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=600&auto=format&fit=crop&q=80' },
  { label: 'Caramel Popcorn', url: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=600&auto=format&fit=crop&q=80' },
  { label: 'Movie Combo', url: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=600&auto=format&fit=crop&q=80' },
  { label: 'Loaded Nachos', url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80' },
  { label: 'Fountain Soda', url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Crispy Nuggets', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80' },
  { label: 'Choco Lava Cake', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80' },
];

export const AdminMenuManager: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItem, setIsNewItem] = useState<boolean>(false);
  
  // Form fields
  const [formData, setFormData] = useState<{
    name: string;
    category: MenuItem['category'];
    description: string;
    price: number;
    image: string;
    isVeg: boolean;
    isBestseller: boolean;
    calories: string;
    prepTimeMinutes: number;
    flavorsInput: string;
  }>({
    name: '',
    category: 'popcorn',
    description: '',
    price: 200,
    image: PRESET_IMAGES[0].url,
    isVeg: true,
    isBestseller: false,
    calories: '400 kcal',
    prepTimeMinutes: 3,
    flavorsInput: '',
  });

  const loadMenu = () => {
    setMenuItems(menuStore.getMenu());
  };

  useEffect(() => {
    loadMenu();
    const unsubscribe = menuStore.subscribe(loadMenu);
    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setIsNewItem(true);
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'popcorn',
      description: '',
      price: 200,
      image: PRESET_IMAGES[0].url,
      isVeg: true,
      isBestseller: false,
      calories: '350 kcal',
      prepTimeMinutes: 3,
      flavorsInput: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setIsNewItem(false);
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      image: item.image,
      isVeg: item.isVeg,
      isBestseller: !!item.isBestseller,
      calories: item.calories || '',
      prepTimeMinutes: item.prepTimeMinutes || 3,
      flavorsInput: item.flavors ? item.flavors.join(', ') : '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const flavors = formData.flavorsInput
      ? formData.flavorsInput.split(',').map((f) => f.trim()).filter(Boolean)
      : undefined;

    if (isNewItem) {
      menuStore.addMenuItem({
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: Number(formData.price) || 100,
        image: formData.image || PRESET_IMAGES[0].url,
        isVeg: formData.isVeg,
        isBestseller: formData.isBestseller,
        calories: formData.calories.trim() || undefined,
        prepTimeMinutes: Number(formData.prepTimeMinutes) || 3,
        flavors,
      });
    } else if (editingItem) {
      menuStore.updateMenuItem(editingItem.id, {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: Number(formData.price) || 100,
        image: formData.image || PRESET_IMAGES[0].url,
        isVeg: formData.isVeg,
        isBestseller: formData.isBestseller,
        calories: formData.calories.trim() || undefined,
        prepTimeMinutes: Number(formData.prepTimeMinutes) || 3,
        flavors,
      });
    }

    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the customer menu?`)) {
      menuStore.deleteMenuItem(id);
    }
  };

  const handleResetMenu = () => {
    if (window.confirm('Reset the entire cinema menu to default catalog?')) {
      menuStore.resetToDefaultMenu();
    }
  };

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 py-4 sm:py-6 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Cinema Menu & Product Catalog Manager
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Add, modify prices, remove items, or manage food availability in real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleResetMenu}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Reset to initial default cinema menu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, popcorn, sodas..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              All ({menuItems.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = menuItems.filter((i) => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Table / Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex flex-col justify-between shadow-lg hover:border-neutral-700 transition-all relative overflow-hidden"
            >
              <div>
                {/* Image & Quick badges */}
                <div className="relative h-36 w-full rounded-2xl overflow-hidden mb-3 bg-neutral-950">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.isVeg
                          ? 'bg-emerald-500/90 text-neutral-950'
                          : 'bg-rose-500/90 text-white'
                      }`}
                    >
                      {item.isVeg ? 'VEG' : 'NON-VEG'}
                    </span>
                    {item.isBestseller && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-neutral-950">
                        ★ BESTSELLER
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-neutral-950/80 backdrop-blur-sm text-neutral-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                    {item.category.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-white">{item.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.flavors && item.flavors.length > 0 && (
                  <div className="mt-2 text-[11px] text-neutral-400">
                    <span className="text-neutral-500">Flavors: </span>
                    <span className="text-amber-400/90">{item.flavors.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Price & Actions */}
              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Price</span>
                  <span className="text-base font-extrabold text-white">₹{item.price}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
                    title="Edit Item"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors"
                    title="Remove from Menu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="py-16 text-center text-neutral-500 bg-neutral-900/50 rounded-3xl border border-neutral-800">
            <p className="text-sm">No items found matching the filter.</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs"
            >
              Add First Item
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 text-neutral-100 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  {isNewItem ? 'Add New Product to Menu' : 'Edit Menu Item'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Truffle Butter Popcorn"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MenuItem['category'] })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="5000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Appetizing description for cinema patrons..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Image Picker */}
              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
                <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                  <span className="text-neutral-500 shrink-0">Presets:</span>
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: preset.url })}
                      className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white shrink-0 hover:bg-neutral-700"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                  <input
                    type="checkbox"
                    id="isVegCheckbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <label htmlFor="isVegCheckbox" className="font-semibold text-neutral-200 cursor-pointer">
                    Vegetarian
                  </label>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                  <input
                    type="checkbox"
                    id="isBestsellerCheckbox"
                    checked={formData.isBestseller}
                    onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <label htmlFor="isBestsellerCheckbox" className="font-semibold text-neutral-200 cursor-pointer">
                    ★ Bestseller
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Flavors (Comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={formData.flavorsInput}
                  onChange={(e) => setFormData({ ...formData, flavorsInput: e.target.value })}
                  placeholder="e.g. Classic Cheddar, Jalapeño Cheese, Caramel"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 font-semibold hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  {isNewItem ? 'Add to Menu' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
