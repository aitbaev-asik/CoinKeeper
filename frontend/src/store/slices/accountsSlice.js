import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { accountsApi } from '../../api/accountsApi';
import { nanoid } from 'nanoid';
import { toast } from 'react-toastify';

// Получаем счета из localStorage при загрузке приложения
const getInitialAccounts = () => {
  if (typeof window !== 'undefined') {
    console.log('getInitialAccounts: проверка localStorage');
    const savedAccounts = localStorage.getItem('wallet_accounts');
    if (savedAccounts) {
      try {
        const parsedAccounts = JSON.parse(savedAccounts);
        console.log('getInitialAccounts: найдены сохраненные счета:', parsedAccounts.length);
        return parsedAccounts;
      } catch (e) {
        console.error('Ошибка при загрузке счетов из localStorage:', e);
        return initialAccounts;
      }
    }
  }
  console.log('getInitialAccounts: данных нет, возвращаем пустой массив');
  return [];
};

// Async thunks
export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Попытка получить данные через API
      const response = await accountsApi.getAll();
      console.log('accountsSlice: получены счета с сервера:', response.data);
      
      // Сохраняем в localStorage как кэш
      localStorage.setItem('wallet_accounts', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('accountsSlice: ошибка при получении счетов с сервера:', error);
      
      try {
        // Если API недоступен, пытаемся использовать данные из localStorage
        console.log('accountsSlice: пытаемся использовать локальные данные из localStorage...');
        const localResponse = await accountsApi.fallbackGetAll();
        return localResponse.data;
      } catch (localError) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки счетов');
      }
    }
  }
);

export const addAccount = createAsyncThunk(
  'accounts/add',
  async (account, { rejectWithValue }) => {
    try {
      const response = await accountsApi.add(account);
      toast.success('Счет успешно добавлен');
      return response.data;
    } catch (error) {
      toast.error('Ошибка при добавлении счета');
      return rejectWithValue(error.response?.data?.message || 'Ошибка при добавлении счета');
    }
  }
);

export const updateAccount = createAsyncThunk(
  'accounts/update',
  async (account, { rejectWithValue }) => {
    try {
      const response = await accountsApi.update(account);
      toast.success('Счет успешно обновлен');
      return response.data;
    } catch (error) {
      toast.error('Ошибка при обновлении счета');
      return rejectWithValue(error.response?.data?.message || 'Ошибка при обновлении счета');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'accounts/delete',
  async (id, { rejectWithValue }) => {
    try {
      await accountsApi.delete(id);
      toast.success('Счет успешно удален');
      return id;
    } catch (error) {
      toast.error('Ошибка при удалении счета');
      return rejectWithValue(error.response?.data?.message || 'Ошибка при удалении счета');
    }
  }
);

// Дефолтные аккаунты для примера
export const initialAccounts = [
  {
    id: 'account_cash',
    name: 'Наличные',
    icon: 'cash',
    color: '#10b981',
    balance: 15000
  },
  {
    id: 'account_card',
    name: 'Дебетовая карта',
    icon: 'credit-card',
    color: '#3b82f6',
    balance: 42500
  }
];

// Инициализация счетов (асинхронная)
export const initializeAccounts = createAsyncThunk(
  'accounts/initialize',
  async (_, { getState }) => {
    console.log('initializeAccounts: проверка состояния счетов');
    const { accounts } = getState();
    if (!accounts.items || !Array.isArray(accounts.items) || accounts.items.length === 0) {
      console.log('initializeAccounts: счета отсутствуют, загружаем из localStorage');
      const storedAccounts = localStorage.getItem('wallet_accounts');
      if (storedAccounts) {
        try {
          const parsedAccounts = JSON.parse(storedAccounts);
          if (Array.isArray(parsedAccounts) && parsedAccounts.length > 0) {
            console.log('initializeAccounts: загружены счета из localStorage:', parsedAccounts.length);
            return parsedAccounts;
          }
        } catch (e) {
          console.error('Ошибка при чтении счетов из localStorage:', e);
        }
      }
      
      // Если в localStorage ничего нет, используем дефолтные счета
      console.log('initializeAccounts: используем дефолтные счета');
      localStorage.setItem('wallet_accounts', JSON.stringify(initialAccounts));
      return initialAccounts;
    }
    
    console.log('initializeAccounts: счета уже существуют, возвращаем текущие');
    return accounts.items;
  }
);

// Создание стандартных счетов для нового пользователя
export const createDefaultAccounts = createAsyncThunk(
  'accounts/createDefaults',
  async (_, { rejectWithValue }) => {
    console.log('Создание стандартных счетов...');
    try {
      // Сначала пробуем создать через API
      const response = await accountsApi.createDefaults();
      console.log('Стандартные счета успешно созданы через API:', response.data);
      localStorage.setItem('wallet_accounts', JSON.stringify(response.data));
      toast.success('Стандартные счета созданы');
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании счетов через API:', error);
      
      // При ошибке используем локальные стандартные счета
      console.log('Создаем локальные стандартные счета из-за ошибки API');
      localStorage.setItem('wallet_accounts', JSON.stringify(initialAccounts));
      console.log('Созданы локальные стандартные счета:', initialAccounts);
      toast.info('Созданы стандартные счета в локальном режиме');
      return initialAccounts;
    }
  }
);

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    items: getInitialAccounts(),
    loading: false,
    error: null,
  },
  reducers: {
    // Локальное добавление счета
    addAccountLocal: (state, action) => {
      const newAccount = {
        ...action.payload,
        id: `account_${nanoid(8)}`,
      };
      state.items.push(newAccount);
      localStorage.setItem('wallet_accounts', JSON.stringify(state.items));
    },
    
    // Локальное обновление счета
    updateAccountLocal: (state, action) => {
      const index = state.items.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        localStorage.setItem('wallet_accounts', JSON.stringify(state.items));
      }
    },
    
    // Локальное удаление счета
    deleteAccountLocal: (state, action) => {
      state.items = state.items.filter(a => a.id !== action.payload);
      localStorage.setItem('wallet_accounts', JSON.stringify(state.items));
    },

    // Очистка ошибок
    clearAccountsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        console.log('accountsSlice: загрузка счетов (pending)');
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        console.log('accountsSlice: загрузка счетов выполнена (fulfilled), данные:', action.payload);
        state.loading = false;
        if (action.payload && Array.isArray(action.payload)) {
          state.items = action.payload;
          localStorage.setItem('wallet_accounts', JSON.stringify(action.payload));
          console.log('accountsSlice: счета сохранены в state:', state.items.length);
        } else {
          console.error('accountsSlice: получены некорректные данные счетов:', action.payload);
          // Если данные некорректны, но в state уже есть счета, оставляем их
          if (!state.items || !Array.isArray(state.items) || state.items.length === 0) {
            state.items = initialAccounts;
            localStorage.setItem('wallet_accounts', JSON.stringify(initialAccounts));
            console.log('accountsSlice: использованы стандартные счета из-за некорректных данных:', initialAccounts);
          }
        }
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('accountsSlice: ошибка загрузки счетов (rejected):', action.payload);
        
        // Если при запросе произошла ошибка и у нас еще нет аккаунтов, 
        // инициализируем стандартными
        if (!state.items || !Array.isArray(state.items) || state.items.length === 0) {
          state.items = initialAccounts;
          localStorage.setItem('wallet_accounts', JSON.stringify(initialAccounts));
          console.log('Инициализированы стандартные счета после ошибки загрузки:', initialAccounts);
        }
      })
      
      // Initialize accounts
      .addCase(initializeAccounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAccounts.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && Array.isArray(action.payload)) {
          state.items = action.payload;
          console.log('Счета инициализированы:', action.payload.length);
        }
      })
      .addCase(initializeAccounts.rejected, (state) => {
        state.loading = false;
        // При ошибке инициализации используем стандартные счета
        state.items = initialAccounts;
        localStorage.setItem('wallet_accounts', JSON.stringify(initialAccounts));
        console.log('Использованы стандартные счета из-за ошибки инициализации');
      })
      
      // Create default accounts
      .addCase(createDefaultAccounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDefaultAccounts.fulfilled, (state, action) => {
        state.loading = false;
        // Проверяем, что в action.payload есть данные
        if (action.payload && Array.isArray(action.payload)) {
          state.items = action.payload;
          localStorage.setItem('wallet_accounts', JSON.stringify(action.payload));
          console.log('Стандартные счета сохранены в state:', action.payload.length);
        } else {
          // Если данных нет, используем стандартные счета
          state.items = initialAccounts;
          localStorage.setItem('wallet_accounts', JSON.stringify(initialAccounts));
          console.log('Использованы стандартные счета из-за отсутствия данных:', initialAccounts);
        }
      })
      .addCase(createDefaultAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // В случае ошибки используем стандартные счета
        state.items = initialAccounts;
        localStorage.setItem('wallet_accounts', JSON.stringify(initialAccounts));
        console.log('Использованы стандартные счета из-за ошибки:', initialAccounts);
      })
      
      // Add
      .addCase(addAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(addAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        localStorage.setItem('wallet_accounts', JSON.stringify(state.items));
      })
      .addCase(addAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // В случае ошибки на сервере, добавляем аккаунт локально
        if (action.meta.arg) {
          const newAccount = {
            ...action.meta.arg,
            id: `account_${nanoid(8)}`,
          };
          state.items.push(newAccount);
          localStorage.setItem('wallet_accounts', JSON.stringify(state.items));
        }
      })
      
      // Update
      .addCase(updateAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
          localStorage.setItem('wallet_accounts', JSON.stringify(state.items));
        }
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // В случае ошибки на сервере, обновляем аккаунт локально
        if (action.meta.arg) {
          const index = state.items.findIndex(a => a.id === action.meta.arg.id);
          if (index !== -1) {
            state.items[index] = action.meta.arg;
            localStorage.setItem('wallet_accounts', JSON.stringify(state.items));
          }
        }
      })
      
      // Delete
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(a => a.id !== action.payload);
        localStorage.setItem('wallet_accounts', JSON.stringify(state.items));
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработчик для обновления счетов после операций с транзакциями
      .addCase('accounts/updateAfterTransaction', (state) => {
        // Здесь мы просто запускаем перезагрузку счетов
        state.loading = true;
        // Вызов API будет происходить через middleware
      });
  },
});

export const { 
  addAccountLocal, 
  updateAccountLocal, 
  deleteAccountLocal,
  clearAccountsError
} = accountsSlice.actions;

export default accountsSlice.reducer;

// Middleware для обработки события updateAfterTransaction
export const accountsMiddleware = store => next => action => {
  // Сначала передаем действие дальше
  const result = next(action);
  
  // Затем проверяем, нужно ли нам обновить счета
  if (action.type === 'accounts/updateAfterTransaction') {
    console.log('Middleware: Обновление счетов после операции с транзакцией');
    // Dispatch действия для обновления счетов
    store.dispatch(fetchAccounts());
  }
  
  return result;
}; 