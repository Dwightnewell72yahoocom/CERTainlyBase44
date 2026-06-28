import React, { useState } from 'react';

const NDT_DISCIPLINES = [
    { value: 'ndt_mt',    label: 'MT — Magnetic Testing',                     governing_body: 'NRCan', scs_applicable: true },
    { value: 'ndt_ut',    label: 'UT — Ultrasonic Testing',                   governing_body: 'NRCan', scs_applicable: true },
    { value: 'ndt_pt',    label: 'PT — Penetrant Testing',                    governing_body: 'NRCan', scs_applicable: true },
    { value: 'ndt_rt',    label: 'RT — Radiographic Testing',                 governing_body: 'NRCan', scs_applicable: true },
    { value: 'ndt_et',    label: 'ET — Eddy Current Testing',                 governing_body: 'NRCan', scs_applicable: true },
    { value: 'ndt_vt',    label: 'VT — Visual Testing',                       governing_body: 'NRCan', scs_applicable: true },
    { value: 'ndt_ut_pa', label: 'UT-PA — Ultrasonic Phased Array',           governing_body: 'NRCan', scs_applicable: true },
    { value: 'ndt_xf',    label: 'XF — X-Ray Fluorescence',                  governing_body: 'NRCan', scs_applicable: true },
    { value: 'ndt_cedo',  label: 'CEDO — Certified Exposure Device Operator', governing_body: 'CNSC',  scs_applicable: false },
    { value: 'other',     label: 'Other',                                      governing_body: 'NRCan', scs_applicable: true },
];
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText, Loader2, Share2, Camera, Image, FileImage } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import DocumentShareDialog from "./DocumentShareDialog";

export default function AddCertificationForm({ onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        technician_name: '',
        certification_name: '',
        certification_number: '',
        category: '',
        governing_body: '',
        scs_applicable: true,
        issue_date: '',
        expiry_date: '',
        notes: '',
        document_urls: []
    });
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const handleShareDocument = (url, index) => {
        setSelectedDocument({ url, name: `Document ${index + 1}` });
        setShareDialogOpen(true);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = files.map(file => 
                base44.integrations.Core.UploadFile({ file })
            );
            const results = await Promise.all(uploadPromises);
            const urls = results.map(r => r.file_url);
            
            setFormData(prev => ({
                ...prev,
                document_urls: [...prev.document_urls, ...urls]
            }));
            toast.success(`${files.length} document(s) uploaded`);
        } catch (error) {
            toast.error('Failed to upload documents');
        } finally {
            setUploading(false);
        }
    };

    const handleCameraCapture = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await base44.integrations.Core.UploadFile({ file });
            setFormData(prev => ({
                ...prev,
                document_urls: [...prev.document_urls, result.file_url]
            }));
            toast.success('Photo captured and uploaded');
        } catch (error) {
            toast.error('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const removeDocument = (index) => {
        setFormData(prev => ({
            ...prev,
            document_urls: prev.document_urls.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.technician_name || !formData.certification_name || !formData.expiry_date) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await base44.entities.Certification.create(formData);
            toast.success('Certification added successfully');
            onSuccess();
        } catch (error) {
            toast.error('Failed to add certification');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
        <DocumentShareDialog 
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            documentUrl={selectedDocument?.url}
            documentName={selectedDocument?.name}
        />
        <Card className="shadow-xl border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <CardTitle className="text-xl">Add New Certification</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="technician_name">Technician Name *</Label>
                            <Input
                                id="technician_name"
                                value={formData.technician_name}
                                onChange={(e) => setFormData({...formData, technician_name: e.target.value})}
                                placeholder="Dwight Conrad Newell"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="certification_name">Certification Name *</Label>
                            <Input
                                id="certification_name"
                                value={formData.certification_name}
                                onChange={(e) => setFormData({...formData, certification_name: e.target.value})}
                                placeholder="MT — Magnetic Testing"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="certification_number">Certification Number</Label>
                            <Input
                                id="certification_number"
                                value={formData.certification_number}
                                onChange={(e) => setFormData({...formData, certification_number: e.target.value})}
                                placeholder="13415"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">NDT Discipline</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => {
                                    const disc = NDT_DISCIPLINES.find(d => d.value === value);
                                    setFormData({
                                        ...formData,
                                        category: value,
                                        governing_body: disc?.governing_body || 'NRCan',
                                        scs_applicable: disc?.scs_applicable ?? true,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select NDT discipline (MT, UT, PT, RT, ET, VT, UT-PA, XF, CEDO)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {NDT_DISCIPLINES.map(d => (
                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formData.category === 'ndt_cedo' && (
                                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-1">
                                    CEDO is governed by the CNSC — SCS points do not apply.
                                </p>
                            )}
                            {formData.governing_body && formData.category !== 'ndt_cedo' && (
                                <p className="text-xs text-gray-400 mt-1">Governing body: {formData.governing_body} · SCS applicable</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="issue_date">Issue Date</Label>
                            <Input
                                id="issue_date"
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiry_date">Expiry Date *</Label>
                            <Input
                                id="expiry_date"
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Additional information..."
                            className="h-20"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Proof of Experience Documents</Label>
                        <p className="text-sm text-gray-600">Upload certification documents via photo, camera, PDF, or Word</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="relative h-auto py-4 flex flex-col items-center gap-2"
                                disabled={uploading}
                            >
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                />
                                <Image className="w-5 h-5 text-blue-600" />
                                <span className="text-xs">Photos</span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="relative h-auto py-4 flex flex-col items-center gap-2"
                                disabled={uploading}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleCameraCapture}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <Camera className="w-5 h-5 text-green-600" />
                                <span className="text-xs">Camera</span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="relative h-auto py-4 flex flex-col items-center gap-2"
                                disabled={uploading}
                            >
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept=".pdf"
                                />
                                <FileText className="w-5 h-5 text-red-600" />
                                <span className="text-xs">PDF</span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="relative h-auto py-4 flex flex-col items-center gap-2"
                                disabled={uploading}
                            >
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept=".doc,.docx,.txt"
                                />
                                <FileImage className="w-5 h-5 text-purple-600" />
                                <span className="text-xs">Word/Doc</span>
                            </Button>
                        </div>
                        {uploading && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Uploading documents...</span>
                            </div>
                        )}
                        {formData.document_urls.length > 0 && (
                            <div className="space-y-2">
                                {formData.document_urls.map((url, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm text-gray-700">Document {idx + 1}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleShareDocument(url, idx)}
                                            >
                                                <Share2 className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeDocument(idx)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Add Certification'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
        </>
    );
}