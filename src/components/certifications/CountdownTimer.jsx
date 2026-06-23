import React, { useState, useEffect } from 'react';
import { differenceInDays, isPast, parseISO } from "date-fns";
import { Clock } from "lucide-react";

export default function CountdownTimer({ expiryDate }) {
  const [days, setDays] = useState(null);

  useEffect(() => {
    const calc = () => setDays(differenceInDays(parseISO(expiryDate), new Date()));
    calc();
    const timer = setInterval(calc, 60000);
    return () => clearInterval(timer);
  }, [expiryDate]);

  if (days === null) return null;

  const expired = isPast(parseISO(expiryDate));

  let colorClass, bgClass, label;
  if (expired) {
    colorClass = 'text-red-700';
    bgClass = 'bg-red-100 border-red-300';
    label = 'EXPIRED';
  } else if (days <= 90) {
    colorClass = 'text-red-700';
    bgClass = 'bg-red-100 border-red-300';
    label = `${days} days left`;
  } else if (days <= 180) {
    colorClass = 'text-amber-700';
    bgClass = 'bg-amber-100 border-amber-300';
    label = `${days} days left`;
  } else {
    colorClass = 'text-green-700';
    bgClass = 'bg-green-100 border-green-300';
    label = `${days} days left`;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${bgClass} ${colorClass}`}>
      <Clock className="w-3 h-3" />
      {label}
    </div>
  );
}