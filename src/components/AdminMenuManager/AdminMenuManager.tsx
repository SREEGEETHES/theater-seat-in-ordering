import React, { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  Upload,
  Camera,
  HelpCircle,
  Wand2
} from 'lucide-react';
import { MenuItem, Theater } from '../../types';
import { menuStore } from '../../utils/menuStore';
import { theaterStore } from '../../utils/theaterStore';

const CATEGORIES: { id: MenuItem['category']; label: string }[] = [
  { id: 'popcorn', label: '🍿 Popcorn' },
  { id: 'combos', label: '🎬 Combos' },
  { id: 'nachos', label: '🧀 Nachos' },
  { id: 'beverages', label: '🥤 Beverages' },
  { id: 'hot_bites', label: '🍟 Hot Bites' },
  { id: 'desserts', label: '🍫 Desserts' },
];

export const PRESET_IMAGES: { label: string; category: string; url: string }[] = [
  // Popcorn
  { label: 'Cheese Popcorn', category: 'popcorn', url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Salted Popcorn', category: 'popcorn', url: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=600&auto=format&fit=crop&q=80' },
  { label: 'Caramel Popcorn', category: 'popcorn', url: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=600&auto=format&fit=crop&q=80' },
  { label: 'Peri-Peri Popcorn', category: 'popcorn', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80' },
  
  // Combos
  { label: 'Movie Feast Combo', category: 'combos', url: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=600&auto=format&fit=crop&q=80' },
  { label: 'Popcorn & Soda Duet', category: 'combos', url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80' },
  
  // Nachos
  { label: 'Loaded Nachos', category: 'nachos', url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80' },
  { label: 'Salsa & Tortilla', category: 'nachos', url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80' },
  
  // Beverages
  { label: 'Fountain Soda / Coke', category: 'beverages', url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Iced Cold Coffee', category: 'beverages', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80' },
  { label: 'Mint Mojito', category: 'beverages', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80' },
  { label: 'Mineral Water', category: 'beverages', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80' },
  
  // Hot Bites
  { label: 'French Fries', category: 'hot_bites', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80' },
  { label: 'Crispy Nuggets', category: 'hot_bites', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80' },
  { label: 'Cinema Hot Dog', category: 'hot_bites', url: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80' },
  { label: 'Gourmet Burger', category: 'hot_bites', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { label: 'Crispy Samosa', category: 'hot_bites', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80' },
  { label: 'Paneer / Roll Wrap', category: 'hot_bites', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80' },
  
  // Desserts
  { label: 'Choco Lava Cake', category: 'desserts', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80' },
  { label: 'Chocolate Brownie', category: 'desserts', url: 'https://images.unsplash.com/photo-1607920592519-bab4d7db727d?w=600&auto=format&fit=crop&q=80' },
  { label: 'Ice Cream Cup', category: 'desserts', url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&auto=format&fit=crop&q=80' },
];

/**
 * Optimizes an Unsplash or external food image URL with optimal dimensions and format
 */
export function optimizeFoodImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('images.unsplash.com')) {
    const baseUrl = trimmed.split('?')[0];
    return `${baseUrl}?w=600&auto=format&fit=crop&q=80`;
  }
  return trimmed;
}

interface AdminMenuManagerProps {
  theater?: Theater;
}

export const AdminMenuManager: React.FC<AdminMenuManagerProps> = ({ theater }) => {
  const currentTheater = theater || theaterStore.getActiveTheater();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItem, setIsNewItem] = useState<boolean>(false);
  
  // Image handling state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>('all');
  const [imageError, setImageError] = useState<boolean>(false);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Selected image is too large. Please select an image under 15MB.');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress and resize using canvas to max 800px width/height
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormData((prev) => ({ ...prev, image: compressedDataUrl }));
          setImageError(false);
        }
        setIsUploadingImage(false);
      };
      img.onerror = () => {
        setIsUploadingImage(false);
        alert('Could not process this image file. Please try another image.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAutoOptimizeUrl = () => {
    if (!formData.image) return;
    const optimized = optimizeFoodImageUrl(formData.image);
    setFormData((prev) => ({ ...prev, image: optimized }));
    setImageError(false);
  };
  
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
    setMenuItems(menuStore.getMenu(currentTheater.theater_id));
  };

  useEffect(() => {
    menuStore.fetchMenuFromServer(currentTheater.theater_id).then(loadMenu);
    loadMenu();
    const unsubscribe = menuStore.subscribe(loadMenu);
    return () => unsubscribe();
  }, [currentTheater.theater_id]);

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
        theater_id: currentTheater.theater_id,
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

              {/* Food Image Selection, Upload & Preset Gallery */}
              <div className="space-y-2.5 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-bold flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Food Photo &amp; Presentation</span>
                  </label>
                  <span className="text-[10px] text-neutral-500">600×450 Recommended</span>
                </div>

                {/* Preview & Upload Bar */}
                <div className="flex items-center gap-3">
                  <div className="w-20 h-16 rounded-xl bg-neutral-900 border border-neutral-700 overflow-hidden shrink-0 relative flex items-center justify-center">
                    {formData.image && !imageError ? (
                      <img
                        src={formData.image}
                        alt="Preview"
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-neutral-600 flex flex-col items-center justify-center text-[10px]">
                        <Utensils className="w-5 h-5 mb-0.5" />
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-neutral-700 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isUploadingImage ? 'Processing...' : 'Upload from Device'}</span>
                      </button>

                      {formData.image?.includes('unsplash') && (
                        <button
                          type="button"
                          onClick={handleAutoOptimizeUrl}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs flex items-center gap-1 border border-amber-500/30 transition-colors cursor-pointer"
                          title="Auto-formats dimensions and compression for fast loading"
                        >
                          <Wand2 className="w-3 h-3 text-amber-400" />
                          <span>Optimize URL</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[10px] text-neutral-400">
                      Upload from phone/camera or paste a web link below.
                    </div>
                  </div>
                </div>

                {/* Direct URL Input */}
                <div>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      setImageError(false);
                    }}
                    placeholder="https://images.unsplash.com/... or paste image link"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white text-[11px] focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Cinema Food Presets Section */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Cinema Food Presets (1-Click Apply):
                    </span>
                  </div>

                  {/* Category Pills for Presets */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-thin">
                    {['all', 'popcorn', 'combos', 'nachos', 'beverages', 'hot_bites', 'desserts'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedPresetCategory(cat)}
                        className={`px-2 py-0.5 rounded-lg uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer ${
                          selectedPresetCategory === cat
                            ? 'bg-amber-500 text-neutral-950'
                            : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {cat.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Presets Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {PRESET_IMAGES
                      .filter((p) => selectedPresetCategory === 'all' || p.category === selectedPresetCategory)
                      .map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, image: preset.url });
                            setImageError(false);
                          }}
                          className={`flex items-center gap-1.5 p-1 rounded-lg border text-left transition-all cursor-pointer ${
                            formData.image === preset.url
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850 hover:text-white'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-7 h-7 rounded object-cover shrink-0"
                            loading="lazy"
                          />
                          <span className="text-[10px] font-medium truncate">{preset.label}</span>
                        </button>
                      ))}
                  </div>
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
