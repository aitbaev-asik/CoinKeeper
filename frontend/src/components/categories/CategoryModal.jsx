import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeCategoryModal } from '../../store/slices/uiSlice';
import {
  addCategory,
  updateCategory
} from '../../store/slices/categoriesSlice';
import { 
  FiShoppingCart, FiCoffee, FiHome, FiDollarSign, FiGift, 
  FiCreditCard, FiTruck, FiHeart, FiActivity, FiFilm, 
  FiMusic, FiBookmark, FiWifi, FiBriefcase, FiSmartphone,
  FiTrendingUp, FiSun, FiUmbrella, FiBook, FiGlobe, FiX,
  FiLoader
} from 'react-icons/fi';

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

const ICONS = [
  { name: 'shopping-cart', component: <FiShoppingCart size={24} /> },
  { name: 'coffee', component: <FiCoffee size={24} /> },
  { name: 'home', component: <FiHome size={24} /> },
  { name: 'wallet', component: <FiDollarSign size={24} /> },
  { name: 'gift', component: <FiGift size={24} /> },
  { name: 'credit-card', component: <FiCreditCard size={24} /> },
  { name: 'car', component: <FiTruck size={24} /> },
  { name: 'heart', component: <FiHeart size={24} /> },
  { name: 'activity', component: <FiActivity size={24} /> },
  { name: 'film', component: <FiFilm size={24} /> },
  { name: 'music', component: <FiMusic size={24} /> },
  { name: 'bookmark', component: <FiBookmark size={24} /> },
  { name: 'wifi', component: <FiWifi size={24} /> },
  { name: 'briefcase', component: <FiBriefcase size={24} /> },
  { name: 'smartphone', component: <FiSmartphone size={24} /> },
  { name: 'trending-up', component: <FiTrendingUp size={24} /> },
  { name: 'sun', component: <FiSun size={24} /> },
  { name: 'umbrella', component: <FiUmbrella size={24} /> },
  { name: 'book', component: <FiBook size={24} /> },
  { name: 'globe', component: <FiGlobe size={24} /> },
];

const CategoryModal = () => {
  const dispatch = useDispatch();
  const { isCategoryModalOpen, currentEditItem } = useSelector(state => state.ui);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: COLORS[0],
    icon: 'shopping-cart'
  });
  
  useEffect(() => {
    if (currentEditItem) {
      setFormData({
        ...currentEditItem
      });
    } else {
      // Reset form when opening for new category
      setFormData({
        name: '',
        type: 'expense',
        color: COLORS[0],
        icon: 'shopping-cart'
      });
    }
    setError(null);
  }, [currentEditItem, isCategoryModalOpen]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }));
  };
  
  const handleIconSelect = (icon) => {
    setFormData(prev => ({ ...prev, icon }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const saveCategory = async () => {
      try {
        if (currentEditItem) {
          await dispatch(updateCategory({ 
            ...formData, 
            id: currentEditItem.id 
          })).unwrap();
          console.log('Категория успешно обновлена');
        } else {
          await dispatch(addCategory(formData)).unwrap();
          console.log('Категория успешно добавлена');
        }
        
        // Закрываем модальное окно после успешного сохранения
        dispatch(closeCategoryModal());
      } catch (error) {
        console.error('Ошибка при сохранении категории:', error);
        setError(error);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    saveCategory();
  };
  
  if (!isCategoryModalOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => dispatch(closeCategoryModal())}
        ></div>
        
        <div className="bg-dark-700 rounded-lg shadow-xl w-full max-w-md p-6 relative z-10 slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {currentEditItem ? 'Редактировать' : 'Добавить'} категорию
            </h2>
            <button
              onClick={() => dispatch(closeCategoryModal())}
              className="p-2 hover:bg-dark-600 rounded-full text-gray-400 hover:text-white"
            >
              <FiX size={20} />
            </button>
          </div>
          
          {error && (
            <div className="bg-accent-500 text-white p-3 rounded-lg mb-4">
              Ошибка: {typeof error === 'string' ? error : 'Не удалось сохранить категорию'}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Category Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Название
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full p-3 bg-dark-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all border border-dark-600"
                placeholder="Название категории"
              />
            </div>
            
            {/* Category Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Тип категории
              </label>
              
              <div className="flex space-x-4">
                <label className="flex-1">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    className="sr-only"
                    checked={formData.type === 'income'}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <div className={`
                    text-center py-2 rounded-lg cursor-pointer transition-all transform
                    ${formData.type === 'income' 
                      ? 'bg-success-500 text-white font-medium shadow-md shadow-success-500/30' 
                      : 'bg-dark-600 text-gray-300 hover:bg-dark-500'}
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}>
                    Доход
                  </div>
                </label>
                
                <label className="flex-1">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    className="sr-only"
                    checked={formData.type === 'expense'}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <div className={`
                    text-center py-2 rounded-lg cursor-pointer transition-all transform
                    ${formData.type === 'expense' 
                      ? 'bg-accent-500 text-white font-medium shadow-md shadow-accent-500/30' 
                      : 'bg-dark-600 text-gray-300 hover:bg-dark-500'}
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}>
                    Расход
                  </div>
                </label>
              </div>
            </div>
            
            {/* Icon Picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Иконка
              </label>
              
              <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1">
                {ICONS.map(icon => (
                  <div 
                    key={icon.name}
                    onClick={() => !isSubmitting && handleIconSelect(icon.name)}
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all
                      ${formData.icon === icon.name 
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-110' 
                        : 'bg-dark-600 text-gray-300 hover:bg-dark-500 hover:text-white'}
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {icon.component}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Color Picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Цвет
              </label>
              
              <div className="grid grid-cols-5 gap-3">
                {COLORS.map(color => (
                  <div 
                    key={color}
                    onClick={() => !isSubmitting && handleColorSelect(color)}
                    className={`
                      w-12 h-12 rounded-full cursor-pointer transition-all
                      ${formData.color === color ? 'ring-2 ring-white scale-110 shadow-lg' : 'hover:scale-105'}
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    style={{ backgroundColor: color }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Preview */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Предпросмотр
              </label>
              
              <div className="flex items-center justify-center">
                <div className="bg-dark-800 p-4 rounded-xl flex flex-col items-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white mb-2"
                    style={{ backgroundColor: formData.color }}
                  >
                    {ICONS.find(icon => icon.name === formData.icon)?.component}
                  </div>
                  <span className="font-medium">{formData.name || 'Название категории'}</span>
                  <span className="text-xs text-gray-400 mt-1">
                    {formData.type === 'income' ? 'Доход' : 'Расход'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 text-gray-300 bg-dark-600 rounded-lg mr-3 hover:bg-dark-500 transition-colors"
                onClick={() => dispatch(closeCategoryModal())}
                disabled={isSubmitting}
              >
                Отмена
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    Сохранить
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;