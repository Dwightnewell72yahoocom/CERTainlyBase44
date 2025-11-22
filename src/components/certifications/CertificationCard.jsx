import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User, Hash, Trash2, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import StatusBadge from "./StatusBadge";

const categoryColors = {
    electrical: "bg-blue-50 text-blue-700 border-blue-200",
    mechanical: "bg-purple-50 text-purple-700 border-purple-200",
    safety: "bg-red-50 text-red-700 border-red-200",
    hvac: "bg-cyan-50 text-cyan-700 border-cyan-200",
    welding: "bg-orange-50 text-orange-700 border-orange-200",
    quality: "bg-green-50 text-green-700 border-green-200",
    forklift: "bg-yellow-50 text-yellow-700 border-yellow-200",
    first_aid: "bg-pink-50 text-pink-700 border-pink-200",
    other: "bg-gray-50 text-gray-700 border-gray-200"
};

export default function CertificationCard({ certification, onDelete }) {
    return (
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {certification.certification_name}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <StatusBadge expiryDate={certification.expiry_date} />
                            {certification.category && (
                                <Badge 
                                    variant="outline" 
                                    className={categoryColors[certification.category]}
                                >
                                    {certification.category}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(certification)}
                        className="text-gray-400 hover:text-red-600"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{certification.technician_name}</span>
                    </div>
                    {certification.certification_number && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Hash className="w-4 h-4 text-blue-600" />
                            <span>{certification.certification_number}</span>
                        </div>
                    )}
                    {certification.issue_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>Issued: {format(parseISO(certification.issue_date), 'MMM dd, yyyy')}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-red-600" />
                        <span className="font-medium">Expires: {format(parseISO(certification.expiry_date), 'MMM dd, yyyy')}</span>
                    </div>
                </div>

                {certification.notes && (
                    <p className="text-sm text-gray-600 pt-2 border-t">{certification.notes}</p>
                )}

                {certification.document_urls && certification.document_urls.length > 0 && (
                    <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Documents ({certification.document_urls.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {certification.document_urls.map((url, idx) => (
                                <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                                >
                                    <FileText className="w-3 h-3" />
                                    Document {idx + 1}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}