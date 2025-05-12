import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { closeDateRangeModal, setDateRange } from '../../store/slices/uiSlice';

const DateRangeModal = () => {
  const dispatch = useDispatch();
  const { isDateRangeModalOpen, dateRange } = useSelector(state => state.ui);
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    preset: 'custom'
  });
  
  useEffect(() => {
    if (isDateRangeModalOpen) {
      setFormData({
        startDate: format(new Date(dateRange.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(dateRange.endDate), 'yyyy-MM-dd'),
        preset: 'custom'
      });
    }
  }, [isDateRangeModalOpen, dateRange]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If preset changes, update dates
    if (name === 'preset' && value !== 'custom') {
      let startDate, endDate;
      const today = new Date();
      
      switch (value) {
        case 'thisMonth':
          startDate = startOfMonth(today);
          endDate = today;
          break;
        case 'lastMonth':
          const lastMonth = subMonths(today, 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          break;
        case 'last3Months':
          startDate = startOfMonth(subMonths(today, 2));
          endDate = today;
          break;
        case 'thisYear':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = today;
          break;
        default:
          return;
      }
      
      setFormData(prev => ({
        ...prev,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      }));
    }
    
    if (name === 'startDate' || name === 'endDate') {
      setFormData(prev => ({ ...prev, preset: 'custom' }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    dispatch(setDateRange({
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString()
    }));
    dispatch(closeDateRangeModal());
  };
  
  if (!isDateRangeModalOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => dispatch(closeDateRangeModal())}
        ></div>
        
        <div className="bg-dark-700 rounded-lg shadow-xl w-full max-w-md p-6 relative z-10 slide-up">
          <h2 className="text-2xl font-bold mb-6">
            Выберите период
          </h2>
          
          <form onSubmit={handleSubmit}>
            {/* Preset Periods */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Быстрый выбор
              </label>
              
              <select
                name="preset"
                value={formData.preset}
                onChange={handleChange}
                className="input-field w-full"
              >
                <option value="custom">Произвольный период</option>
                <option value="thisMonth">Текущий месяц</option>
                <option value="lastMonth">Прошлый месяц</option>
                <option value="last3Months">Последние 3 месяца</option>
                <option value="thisYear">Текущий год</option>
              </select>
            </div>
            
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
                  Начальная дата
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  max={formData.endDate}
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
                  Конечная дата
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={formData.startDate}
                  className="input-field w-full"
                />
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => dispatch(closeDateRangeModal())}
                className="btn bg-dark-600 hover:bg-dark-500 text-white"
              >
                Отмена
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
              >
                Применить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DateRangeModal;