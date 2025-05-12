import React from 'react';
import { useDispatch } from 'react-redux';
import { 
  FiEdit2, FiTrash2, FiShoppingCart, FiCoffee, FiHome, 
  FiDollarSign, FiGift, FiCreditCard, FiTruck, FiHeart, 
  FiActivity, FiFilm, FiMusic, FiBookmark, FiWifi, 
  FiBriefcase, FiSmartphone, FiTrendingUp, FiSun, 
  FiUmbrella, FiBook, FiGlobe
} from 'react-icons/fi';
import { openCategoryModal } from '../../store/slices/uiSlice';
import { deleteCategory } from '../../store/slices/categoriesSlice';

// Функция для получения компонента иконки по имени
const getIconComponent = (iconName) => {
  const iconMap = {
    'shopping-cart': <FiShoppingCart size={18} />,
    'coffee': <FiCoffee size={18} />,
    'home': <FiHome size={18} />,
    'wallet': <FiDollarSign size={18} />,
    'gift': <FiGift size={18} />,
    'credit-card': <FiCreditCard size={18} />,
    'car': <FiTruck size={18} />,
    'heart': <FiHeart size={18} />,
    'activity': <FiActivity size={18} />,
    'film': <FiFilm size={18} />,
    'music': <FiMusic size={18} />,
    'bookmark': <FiBookmark size={18} />,
    'wifi': <FiWifi size={18} />,
    'briefcase': <FiBriefcase size={18} />,
    'smartphone': <FiSmartphone size={18} />,
    'trending-up': <FiTrendingUp size={18} />,
    'sun': <FiSun size={18} />,
    'umbrella': <FiUmbrella size={18} />,
    'book': <FiBook size={18} />,
    'globe': <FiGlobe size={18} />,
  };

  return iconMap[iconName] || <FiBookmark size={18} />;
};

const CategoryList = ({ categories, type }) => {
  const dispatch = useDispatch();
  
  const handleEdit = (category) => {
    dispatch(openCategoryModal(category));
  };
  
  const handleDelete = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию? Это также повлияет на все связанные транзакции.')) {
      dispatch(deleteCategory(id))
        .unwrap()
        .then(() => {
          console.log('Категория успешно удалена');
        })
        .catch((error) => {
          console.error('Ошибка при удалении категории:', error);
          alert(`Ошибка при удалении категории: ${error}`);
        });
    }
  };

  return (
    <div>
      {categories.length > 0 ? (
        <ul className="space-y-3">
          {categories.map(category => (
            <li 
              key={category.id}
              className="flex items-center justify-between p-3 bg-dark-700 rounded-xl hover:bg-dark-600 transition-all"
            >
              <div className="flex items-center">
                <div 
                  className="w-9 h-9 rounded-xl mr-3 flex items-center justify-center text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {getIconComponent(category.icon)}
                </div>
                <span className="font-medium">{category.name}</span>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(category)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-dark-500 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <FiEdit2 size={16} />
                </button>
                
                <button 
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-gray-400 hover:text-accent-500 hover:bg-dark-500 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-dark-700 rounded-xl">
          <div className="text-gray-500 mb-2">
            {type === 'income' ? <FiTrendingUp size={24} /> : <FiShoppingCart size={24} />}
          </div>
          <p>Нет категорий {type === 'income' ? 'доходов' : 'расходов'}</p>
          <p className="text-sm mt-1">Добавьте категории с помощью кнопки "Добавить категорию"</p>
        </div>
      )}
    </div>
  );
};

export default CategoryList;