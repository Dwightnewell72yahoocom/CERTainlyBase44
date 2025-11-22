import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Download, 
    Mail, 
    MessageSquare, 
    Share2, 
    Smartphone,
    Globe,
    Loader2,
    CheckCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function DocumentShareDialog({ open, onOpenChange, documentUrl, documentName }) {
    const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
    const [sending, setSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleDownload = async () => {
        try {
            const response = await fetch(documentUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = documentName || 'document.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Document downloaded');
        } catch (error) {
            toast.error('Failed to download document');
        }
    };

    const handleSendEmail = async () => {
        if (!emailData.to) {
            toast.error('Please enter recipient email');
            return;
        }

        setSending(true);
        try {
            await base44.integrations.Core.SendEmail({
                to: emailData.to,
                subject: emailData.subject || `Certification Document: ${documentName}`,
                body: `${emailData.body}\n\nDocument: ${documentUrl}`
            });
            toast.success('Email sent successfully');
            setEmailSent(true);
            setTimeout(() => {
                setEmailSent(false);
                setEmailData({ to: '', subject: '', body: '' });
            }, 2000);
        } catch (error) {
            toast.error('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    const handleSMS = () => {
        const message = `Check out this certification document: ${documentUrl}`;
        window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: documentName || 'Certification Document',
                    text: 'Certification document',
                    url: documentUrl
                });
                toast.success('Shared successfully');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    toast.error('Failed to share');
                }
            }
        } else {
            navigator.clipboard.writeText(documentUrl);
            toast.success('Link copied to clipboard');
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(documentUrl);
        toast.success('Link copied to clipboard');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Share Document</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <Button
                                variant="outline"
                                className="flex flex-col items-center gap-2 h-auto py-4"
                                onClick={handleDownload}
                            >
                                <Download className="w-5 h-5 text-blue-600" />
                                <span className="text-sm">Download to PC</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="flex flex-col items-center gap-2 h-auto py-4"
                                onClick={handleNativeShare}
                            >
                                <Smartphone className="w-5 h-5 text-green-600" />
                                <span className="text-sm">Share (NFC/Bump)</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="flex flex-col items-center gap-2 h-auto py-4"
                                onClick={handleSMS}
                            >
                                <MessageSquare className="w-5 h-5 text-purple-600" />
                                <span className="text-sm">Send via SMS</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="flex flex-col items-center gap-2 h-auto py-4"
                                onClick={handleCopyLink}
                            >
                                <Globe className="w-5 h-5 text-orange-600" />
                                <span className="text-sm">Copy Web Link</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="flex flex-col items-center gap-2 h-auto py-4 col-span-2"
                                onClick={handleNativeShare}
                            >
                                <Share2 className="w-5 h-5 text-indigo-600" />
                                <span className="text-sm">Share via Apps</span>
                            </Button>
                        </div>
                    </div>

                    {/* Email Form */}
                    <div className="border-t pt-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-red-600" />
                            Send via Email
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email_to">Recipient Email *</Label>
                                <Input
                                    id="email_to"
                                    type="email"
                                    placeholder="recipient@example.com"
                                    value={emailData.to}
                                    onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email_subject">Subject</Label>
                                <Input
                                    id="email_subject"
                                    placeholder="Certification Document"
                                    value={emailData.subject}
                                    onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email_body">Message</Label>
                                <Textarea
                                    id="email_body"
                                    placeholder="Add a message..."
                                    value={emailData.body}
                                    onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                                    className="h-24"
                                />
                            </div>
                            <Button 
                                onClick={handleSendEmail}
                                disabled={sending || emailSent}
                                className="w-full bg-red-600 hover:bg-red-700"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : emailSent ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Sent!
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Email
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Document Preview Link */}
                    <div className="border-t pt-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Document Link</h3>
                        <div className="flex gap-2">
                            <Input 
                                value={documentUrl} 
                                readOnly 
                                className="font-mono text-xs bg-gray-50"
                            />
                            <Button 
                                variant="outline"
                                onClick={handleCopyLink}
                            >
                                Copy
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Share this link to upload the document to any website or service
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}