import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { differenceInDays, isPast, parseISO } from "date-fns";

export default function StatusBadge({ expiryDate }) {
    const expiry = parseISO(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, new Date());
    const isExpired = isPast(expiry);
    
    if (isExpired) {
        return (
            <Badge className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1.5 px-3 py-1">
                <XCircle className="w-3.5 h-3.5" />
                Expired
            </Badge>
        );
    }
    
    if (daysUntilExpiry <= 180) {
        return (
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1.5 px-3 py-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Renewal Due ({daysUntilExpiry} days)
            </Badge>
        );
    }
    
    return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1.5 px-3 py-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Active
        </Badge>
    );
}