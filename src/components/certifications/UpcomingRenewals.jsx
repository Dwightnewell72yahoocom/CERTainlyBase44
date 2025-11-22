import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Calendar } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";

export default function UpcomingRenewals({ certifications }) {
    const upcomingRenewals = certifications
        .filter(cert => {
            const daysUntilExpiry = differenceInDays(parseISO(cert.expiry_date), new Date());
            return daysUntilExpiry > 0 && daysUntilExpiry <= 180;
        })
        .sort((a, b) => parseISO(a.expiry_date) - parseISO(b.expiry_date));

    if (upcomingRenewals.length === 0) {
        return (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                        <Calendar className="w-5 h-5" />
                        Upcoming Renewals
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-green-700">No certifications require renewal in the next 6 months. Great job staying current!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-5 h-5" />
                    Upcoming Renewals ({upcomingRenewals.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {upcomingRenewals.map((cert) => {
                        const daysUntilExpiry = differenceInDays(parseISO(cert.expiry_date), new Date());
                        return (
                            <div 
                                key={cert.id} 
                                className="bg-white p-4 rounded-lg border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{cert.certification_name}</h4>
                                        <p className="text-sm text-gray-600">{cert.technician_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-amber-700">{daysUntilExpiry} days</div>
                                        <div className="text-xs text-gray-600">
                                            {format(parseISO(cert.expiry_date), 'MMM dd, yyyy')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}