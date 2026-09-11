import React, { useState } from 'react';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { MenuItem, CartItem } from '../../types';

interface ItemCustomizerModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || !item) return null;

  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0);
  const [selectedFlavor, setSelectedFlavor] = useState<string>(
    item.flavors && item.flavors.length > 0 ? item.flavors[0] : ''
  );
  const [quantity, setQuantity] = useState<number>(1);

  const selectedSize = item.sizes ? item.sizes[selectedSizeIndex] : null;
  const unitPrice = item.price + (selectedSize ? selectedSize.extraPrice : 0);
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    const cartItem: CartItem = {
      id: `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      price: unitPrice,
      quantity,
      selectedSize: selectedSize?.name,
      selectedFlavor: selectedFlavor || undefined,
      isVeg: item.isVeg,
      image: item.image,
    };
    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-5 sm:p-6 text-neutral-100 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Item Banner Image */}
        <div className="relative h-44 rounded-2xl overflow-hidden mb-4">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                item.isVeg
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {item.isVeg ? '100% Pure Veg' : 'Non-Veg'}
            </span>
            {item.calories && (
              <span className="text-[11px] bg-neutral-900/80 backdrop-blur-md px-2 py-0.5 rounded text-neutral-300">
                {item.calories}
              </span>
            )}
          </div>
        </div>

        {/* Title & Desc */}
        <div>
          <h3 className="text-lg font-bold text-white">{item.name}</h3>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{item.description}</p>
        </div>

        {/* Size Selection */}
        {item.sizes && item.sizes.length > 0 && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              Select Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {item.sizes.map((size, index) => {
                const isSelected = selectedSizeIndex === index;
                const priceForThisSize = item.price + size.extraPrice;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedSizeIndex(index)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="truncate">{size.name}</div>
                    <div className="font-bold text-white mt-1">₹{priceForThisSize}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Flavor Selection */}
        {item.flavors && item.flavors.length > 0 && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              Select Flavor Seasoning
            </label>
            <div className="flex flex-wrap gap-2">
              {item.flavors.map((flavor) => {
                const isSelected = selectedFlavor === flavor;
                return (
                  <button
                    key={flavor}
                    onClick={() => setSelectedFlavor(flavor)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 border-amber-500 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {flavor}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity and Add Button */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1 rounded text-neutral-400 hover:text-white"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-sm text-white w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1 rounded text-neutral-400 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Add to Cart</span>
            <span>•</span>
            <span>₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
