import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import categoriesApi from '../../api/categoriesApi';

// Sample initial data - экспортируем для использования в API
export const initialCategories = [
  {
    id: 1001,
    name: 'Зарплата',
    type: 'income',
    color: '#10b981',
    icon: 'wallet'
  },
  {
    id: 1002,
    name: 'Фриланс',
    type: 'income',
    color: '#3b82f6',
    icon: 'briefcase'
  },
  {
    id: 1003,
    name: 'Подарки',
    type: 'income',
    color: '#8b5cf6',
    icon: 'gift'
  },
  {
    id: 1004,
    name: 'Инвестиции',
    type: 'income',
    color: '#06b6d4',
    icon: 'trending-up'
  },
  {
    id: 2001,
    name: 'Продукты',
    type: 'expense',
    color: '#ef4444',
    icon: 'shopping-cart'
  },
  {
    id: 2002,
    name: 'Развлечения',
    type: 'expense',
    color: '#f59e0b',
    icon: 'film'
  },
  {
    id: 2003,
    name: 'Транспорт',
    type: 'expense',
    color: '#6366f1',
    icon: 'car'
  },
  {
    id: 2004,
    name: 'Коммунальные',
    type: 'expense',
    color: '#ec4899',
    icon: 'home'
  },
  {
    id: 2005,
    name: 'Здоровье',
    type: 'expense',
    color: '#14b8a6',
    icon: 'activity'
  },
  {
    id: 2006,
    name: 'Кафе и рестораны',
    type: 'expense',
    color: '#f97316',
    icon: 'coffee'
  }
];

// Получаем категории из localStorage при загрузке приложения
const getInitialCategories = () => {
  if (typeof window !== 'undefined') {
    const savedCategories = localStorage.getItem('wallet_categories');
    if (savedCategories) {
      try {
        return JSON.parse(savedCategories);
      } catch (e) {
        console.error('Ошибка при загрузке категорий из localStorage:', e);
        return [];
      }
    }
  }
  return [];
};

// Определяем, работаем ли мы с реальным API или с LocalStorage
const isUsingLocalStorage = () => {
  // Всегда возвращаем false, поскольку мы используем только серверный режим
  return false;
};

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoriesApi.getAll();
      console.log('Categories fetched:', response.data);
      
      // Если мы используем localStorage, сохраняем данные
      if (isUsingLocalStorage()) {
        localStorage.setItem('wallet_categories', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки категорий');
    }
  }
);

export const addCategory = createAsyncThunk(
  'categories/add',
  async (category, { rejectWithValue }) => {
    try {
      const response = await categoriesApi.add(category);
      
      // Если мы используем localStorage, обновляем сохраненные категории
      if (isUsingLocalStorage()) {
        const savedCategories = localStorage.getItem('wallet_categories');
        if (savedCategories) {
          const categories = JSON.parse(savedCategories);
          categories.push(response.data);
          localStorage.setItem('wallet_categories', JSON.stringify(categories));
        }
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка добавления категории');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async (category, { rejectWithValue }) => {
    try {
      const response = await categoriesApi.update(category);
      
      // Если мы используем localStorage, обновляем сохраненные категории
      if (isUsingLocalStorage()) {
        const savedCategories = localStorage.getItem('wallet_categories');
        if (savedCategories) {
          const categories = JSON.parse(savedCategories);
          const index = categories.findIndex(c => c.id === response.data.id);
          if (index !== -1) {
            categories[index] = response.data;
            localStorage.setItem('wallet_categories', JSON.stringify(categories));
          }
        }
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления категории');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id, { rejectWithValue }) => {
    try {
      await categoriesApi.delete(id);
      
      // Если мы используем localStorage, обновляем сохраненные категории
      if (isUsingLocalStorage()) {
        const savedCategories = localStorage.getItem('wallet_categories');
        if (savedCategories) {
          const categories = JSON.parse(savedCategories);
          const filteredCategories = categories.filter(c => c.id !== id);
          localStorage.setItem('wallet_categories', JSON.stringify(filteredCategories));
        }
      }
      
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления категории');
    }
  }
);

// Создание категорий по умолчанию для нового пользователя
export const createDefaultCategories = createAsyncThunk(
  'categories/createDefaults',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoriesApi.createDefaults();
      
      // Если мы используем localStorage, сохраняем данные
      if (isUsingLocalStorage()) {
        localStorage.setItem('wallet_categories', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка создания стандартных категорий');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: getInitialCategories(),
    loading: false,
    error: null,
  },
  reducers: {
    clearCategoriesError: (state) => {
      state.error = null;
    },
    // Вручную инициализируем категории, если нужно
    initializeCategories: (state) => {
      if (!state.items || state.items.length === 0) {
        state.items = initialCategories;
        localStorage.setItem('wallet_categories', JSON.stringify(initialCategories));
      }
    },
    // Больше не используется, но оставлено для обратной совместимости
    setUsingLocalStorage: (state, action) => {
      // Игнорируем входящее значение, всегда устанавливаем false
      localStorage.setItem('wallet_using_local_storage', 'false');
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Если при запросе произошла ошибка и у нас еще нет категорий, 
        // инициализируем стандартными
        if (!state.items || state.items.length === 0) {
          state.items = initialCategories;
          localStorage.setItem('wallet_categories', JSON.stringify(initialCategories));
        }
      })
      
      // Add
      .addCase(addCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create default categories
      .addCase(createDefaultCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDefaultCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(createDefaultCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearCategoriesError,
  initializeCategories,
  setUsingLocalStorage
} = categoriesSlice.actions;

export default categoriesSlice.reducer;