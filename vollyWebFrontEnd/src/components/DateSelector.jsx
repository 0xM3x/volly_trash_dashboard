import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { tr } from 'date-fns/locale';
import { useState } from 'react';

export default function DateSelector({ selectedDate, setSelectedDate }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Tarih Seç</h3>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          if (!date) return;
          setSelectedDate(date);
        }}
        locale={tr}
        styles={{
          caption: { color: '#4f46e5' }, // Indigo
        }}
        className="rounded-md text-sm"
      />
    </div>
  );
}

