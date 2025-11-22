import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText, Loader2, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import DocumentShareDialog from "./DocumentShareDialog";

export default function AddCertificationForm({ onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        technician_name: '',
        certification_name: '',
        certification_number: '',
        category: '',
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
                                placeholder="John Smith"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="certification_name">Certification Name *</Label>
                            <Input
                                id="certification_name"
                                value={formData.certification_name}
                                onChange={(e) => setFormData({...formData, certification_name: e.target.value})}
                                placeholder="OSHA Safety Certification"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="certification_number">Certification Number</Label>
                            <Input
                                id="certification_number"
                                value={formData.certification_number}
                                onChange={(e) => setFormData({...formData, certification_number: e.target.value})}
                                placeholder="CERT-12345"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({...formData, category: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="electrical">Electrical</SelectItem>
                                    <SelectItem value="mechanical">Mechanical</SelectItem>
                                    <SelectItem value="safety">Safety</SelectItem>
                                    <SelectItem value="hvac">HVAC</SelectItem>
                                    <SelectItem value="welding">Welding</SelectItem>
                                    <SelectItem value="quality">Quality</SelectItem>
                                    <SelectItem value="forklift">Forklift</SelectItem>
                                    <SelectItem value="first_aid">First Aid</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
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
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="relative"
                                disabled={uploading}
                            >
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                />
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Documents
                                    </>
                                )}
                            </Button>
                            <span className="text-sm text-gray-500">PDF, JPG, PNG, DOC accepted</span>
                        </div>
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