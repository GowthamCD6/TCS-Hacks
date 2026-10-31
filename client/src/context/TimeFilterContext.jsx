import React, { createContext, useContext, useState, useMemo } from 'react';

const TimeFilterContext = createContext({
  timeFilter: 'today',
  setTimeFilter: () => {},
  timeWindowLabel: 'Today (Last 24 Hours)',
  timeMultiplier: 1,
});

export const TimeFilterProvider = ({ children }) => {
  const [timeFilter, setTimeFilter] = useState('today');

  const value = useMemo(() => {
    let timeWindowLabel = 'Today (Last 24 Hours)';
    let timeMultiplier = 1;

    if (timeFilter === '7days') {
      timeWindowLabel = 'Last 7 Days';
      timeMultiplier = 2.4;
    } else if (timeFilter === '30days') {
      timeWindowLabel = 'Last 30 Days';
      timeMultiplier = 5.8;
    } else if (timeFilter === 'custom') {
      timeWindowLabel = 'Custom Range';
      timeMultiplier = 1.5;
    }

    return {
      timeFilter,
      setTimeFilter,
      timeWindowLabel,
      timeMultiplier,
    };
  }, [timeFilter]);

  return (
    <TimeFilterContext.Provider value={value}>
      {children}
    </TimeFilterContext.Provider>
  );
};

export const useTimeFilter = () => useContext(TimeFilterContext);

