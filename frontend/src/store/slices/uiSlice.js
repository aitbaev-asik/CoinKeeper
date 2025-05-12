import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isTransactionModalOpen: false,
    isCategoryModalOpen: false,
    isAccountModalOpen: false,
    isDateRangeModalOpen: false,
    isAccountsListModalOpen: false,
    currentEditItem: null,
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  reducers: {
    openTransactionModal: (state, action) => {
      state.isTransactionModalOpen = true;
      
      // Если передан объект транзакции для редактирования
      if (action.payload && (action.payload.id || (action.payload.type && action.payload.amount))) {
        console.log('Opening transaction modal for editing existing transaction:', action.payload);
        state.currentEditItem = action.payload;
      } 
      // Если передан объект с настройками для новой транзакции
      else if (action.payload) {
        console.log('Opening transaction modal with preset values:', action.payload);
        state.currentEditItem = {
          type: action.payload.type || 'expense',
          account: action.payload.account || action.payload.accountId || null,
          // Другие предустановленные значения
          amount: action.payload.amount || '',
          category: action.payload.category || '',
          date: action.payload.date || new Date().toISOString().split('T')[0]
        };
      } 
      // По умолчанию создаем новую транзакцию
      else {
        console.log('Opening transaction modal for new transaction');
        state.currentEditItem = {
          type: 'expense',
          amount: '',
          category: '',
          account: null,
          date: new Date().toISOString().split('T')[0]
        };
      }
    },
    closeTransactionModal: (state) => {
      state.isTransactionModalOpen = false;
      state.currentEditItem = null;
    },
    openCategoryModal: (state, action) => {
      state.isCategoryModalOpen = true;
      state.currentEditItem = action.payload || null;
    },
    closeCategoryModal: (state) => {
      state.isCategoryModalOpen = false;
      state.currentEditItem = null;
    },
    openAccountModal: (state, action) => {
      state.isAccountModalOpen = true;
      state.currentEditItem = action.payload || null;
    },
    closeAccountModal: (state) => {
      state.isAccountModalOpen = false;
      state.currentEditItem = null;
    },
    openAccountsListModal: (state) => {
      state.isAccountsListModalOpen = true;
    },
    closeAccountsListModal: (state) => {
      state.isAccountsListModalOpen = false;
    },
    openDateRangeModal: (state) => {
      state.isDateRangeModalOpen = true;
    },
    closeDateRangeModal: (state) => {
      state.isDateRangeModalOpen = false;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
      state.isDateRangeModalOpen = false;
    },
    closeModals: (state) => {
      state.isTransactionModalOpen = false;
      state.isCategoryModalOpen = false;
      state.isAccountModalOpen = false;
      state.isDateRangeModalOpen = false;
      state.isAccountsListModalOpen = false;
      state.currentEditItem = null;
    }
  }
});

export const { 
  openTransactionModal, 
  closeTransactionModal,
  openCategoryModal,
  closeCategoryModal,
  openAccountModal,
  closeAccountModal,
  openAccountsListModal,
  closeAccountsListModal,
  openDateRangeModal,
  closeDateRangeModal,
  setDateRange,
  closeModals
} = uiSlice.actions;

export default uiSlice.reducer;