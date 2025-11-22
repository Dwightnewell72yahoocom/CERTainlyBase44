import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Award, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { differenceInDays, isPast, parseISO } from "date-fns";

export default function StatsOverview({ certifications }) {
    const total = certifications.length;
    const expired = certifications.filter(c => isPast(parseISO(c.expiry_date))).length;
    const expiringSoon = certifications.filter(c => {
        const days = differenceInDays(parseISO(c.expiry_date), new Date());
        return days > 0 && days <= 180;
    }).length;
    const active = total - expired - expiringSoon;

    const stats = [
        {
            label: "Total Certifications",
            value: total,
            icon: Award,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200"
        },
        {
            label: "Active",
            value: active,
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200"
        },
        {
            label: "Expiring Soon",
            value: expiringSoon,
            icon: Clock,
            color: "text-amber-600",
            bgColor: "bg-amber-50",
            borderColor: "border-amber-200"
        },
        {
            label: "Expired",
            value: expired,
            icon: AlertCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <Card key={stat.label} className={`border-2 ${stat.borderColor} hover:shadow-lg transition-all duration-300`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`${stat.bgColor} p-3 rounded-xl`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}