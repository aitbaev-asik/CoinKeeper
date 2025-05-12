import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import transactionsApi from '../../api/transactionsApi';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';

// Async thunks
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await transactionsApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Ошибка загрузки транзакций');
    }
  }
);

export const fetchAccounts = createAsyncThunk(
  'transactions/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await transactionsApi.getAccounts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Ошибка загрузки счетов');
    }
  }
);

export const fetchStatistics = createAsyncThunk(
  'transactions/fetchStatistics',
  async (period = 'month', { rejectWithValue }) => {
    try {
      const response = await transactionsApi.getStatistics(period);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Ошибка загрузки статистики');
    }
  }
);

// Вспомогательная функция для преобразования значений в числовой формат
const ensureNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const addTransaction = createAsyncThunk(
  'transactions/add',
  async (transaction, { rejectWithValue, dispatch }) => {
    try {
      console.log('Sending transaction to API:', transaction);
      const response = await transactionsApi.add(transaction);
      
      // После успешного добавления транзакции обновляем счета и статистику
      try {
        // Обновляем счета - вернет обновленные счета и события для компонентов
        dispatch({ type: 'accounts/updateAfterTransaction' });
        
        // Обновляем сводку доходов/расходов
        dispatch({ type: 'dashboard/updateSummary' });
      } catch (updateError) {
        console.error('Ошибка при обновлении счетов и статистики:', updateError);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in addTransaction:', error);
      return rejectWithValue(error.response?.data?.message || 'Ошибка добавления транзакции');
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/update',
  async (transaction, { rejectWithValue, dispatch }) => {
    try {
      console.log('Updating transaction in API:', transaction);
      const response = await transactionsApi.update(transaction);
      
      // После успешного обновления транзакции обновляем счета и статистику
      try {
        // Обновляем счета - вернет обновленные счета и события для компонентов
        dispatch({ type: 'accounts/updateAfterTransaction' });
        
        // Обновляем сводку доходов/расходов
        dispatch({ type: 'dashboard/updateSummary' });
      } catch (updateError) {
        console.error('Ошибка при обновлении счетов и статистики:', updateError);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in updateTransaction:', error);
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления транзакции');
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      console.log('Deleting transaction from API, ID:', id);
      await transactionsApi.delete(id);
      
      // После успешного удаления транзакции обновляем счета и статистику
      try {
        // Обновляем счета - вернет обновленные счета и события для компонентов
        dispatch({ type: 'accounts/updateAfterTransaction' });
        
        // Обновляем сводку доходов/расходов
        dispatch({ type: 'dashboard/updateSummary' });
      } catch (updateError) {
        console.error('Ошибка при обновлении счетов и статистики:', updateError);
      }
      
      return id;
    } catch (error) {
      console.error('Error in deleteTransaction:', error);
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления транзакции');
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    items: [],
    accounts: [],
    statistics: {
      income: [],
      expense: [],
      period: 'month'
    },
    loading: false,
    error: null
  },
  reducers: {
    clearTransactionsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch statistics
      .addCase(fetchStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add transaction
      .addCase(addTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update transaction
      .addCase(updateTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.loading = false;
        
        if (!action.payload) {
          console.error('No payload received in updateTransaction.fulfilled');
          return;
        }
        
        // Находим индекс транзакции по ID
        const index = state.items.findIndex(t => {
          const tId = String(t.id);
          const payloadId = String(action.payload.id);
          console.log(`Comparing IDs: ${tId} (${typeof tId}) === ${payloadId} (${typeof payloadId})`);
          return tId === payloadId;
        });
        
        console.log('Transaction update successful with payload:', action.payload);
        console.log('Found transaction at index:', index, 'with ID:', action.payload.id);
        
        if (index !== -1) {
          // Обновляем транзакцию если найдена
          console.log('Updating transaction in state. Old:', state.items[index], 'New:', action.payload);
          state.items[index] = action.payload;
        } else {
          console.warn('Transaction not found in state with ID:', action.payload.id);
          console.log('Current transaction IDs in state:', state.items.map(t => ({ id: t.id, type: typeof t.id })));
          // Если транзакция не найдена, добавляем ее в начало списка
          state.items.unshift(action.payload);
          console.log('Transaction added to state since it was not found');
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete transaction
      .addCase(deleteTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Transaction deletion successful, removing ID:', action.payload);
        
        // Фильтруем транзакции, удаляя транзакцию с указанным ID
        state.items = state.items.filter(t => {
          const result = t.id !== action.payload;
          if (!result) {
            console.log('Removing transaction:', t);
          }
          return result;
        });
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export const { clearTransactionsError } = transactionsSlice.actions;

export default transactionsSlice.reducer;