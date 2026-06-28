import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import UpcomingRenewals from "../components/certifications/UpcomingRenewals";
import CertificationCard from "../components/certifications/CertificationCard";
import AddCertificationForm from "../components/certifications/AddCertificationForm";
import ReminderManager from "../components/certifications/ReminderManager";
import QuickLogSheet from "../components/dashboard/QuickLogSheet";
import BottomNav from "../components/layout/BottomNav";

export default function Home() {
    const [showForm, setShowForm] = useState(false);
    const [showQuickLog, setShowQuickLog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: certifications = [], isLoading } = useQuery({
        queryKey: ['certifications'],
        queryFn: () => base44.entities.Certification.list('-expiry_date'),
    });

    const { data: experienceLogs = [] } = useQuery({
        queryKey: ['experienceLogs'],
        queryFn: () => base44.entities.ExperienceLog.list(),
    });

    const totalScsPoints = experienceLogs.reduce((sum, log) => sum + (log.points || 0), 0);

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Certification.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['certifications'] });
            toast.success('Certification deleted');
        },
    });

    const handleDelete = (certification) => {
        if (confirm(`Delete certification: ${certification.certification_name}?`)) {
            deleteMutation.mutate(certification.id);
        }
    };

    const filteredCertifications = certifications.filter(cert => {
        const matchesSearch =
            cert.certification_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cert.technician_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cert.certification_number?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || cert.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
            {/* Header */}
            <div className="px-4 pt-10 pb-4 sticky top-0 z-10 shadow-md" style={{ backgroundColor: '#6b7040' }}>
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://media.base44.com/images/public/692142275a8534a162072728/52e91b695_Untitleddesign.png"
                            alt="CERTainly"
                            className="h-12 w-auto object-contain"
                        />
                        <div className="flex flex-col">
                            <span className="text-lg font-bold" style={{ color: '#f5eed8' }}>CERTainly</span>
                            <span className="text-xs font-medium leading-tight" style={{ color: 'rgba(245,238,216,0.9)' }}>
                                Your tools. Your time. Your terms.
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ReminderManager certifications={certifications} />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-4">

                {/* Upcoming Renewals */}
                <div className="mb-4">
                    <UpcomingRenewals certifications={certifications} />
                </div>

                {/* Add Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            className="mb-6"
                        >
                            <AddCertificationForm
                                onSuccess={() => {
                                    setShowForm(false);
                                    queryClient.invalidateQueries({ queryKey: ['certifications'] });
                                }}
                                onCancel={() => setShowForm(false)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Add Certification + Search and Filters */}
                <div className="mb-5 space-y-3">
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                        style={{ backgroundColor: '#E8A020', color: '#6b7040' }}
                    >
                        <Plus className="w-5 h-5" />
                        Add Certification
                    </button>
                    <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by name, technician, or number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-xl bg-white"
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full md:w-52 rounded-xl bg-white">
                            <Filter className="w-4 h-4 mr-2 text-gray-400" />
                            <SelectValue placeholder="All Disciplines" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Disciplines</SelectItem>
                            <SelectItem value="ndt_mt">MT — Magnetic Particle</SelectItem>
                            <SelectItem value="ndt_ut">UT — Ultrasonic</SelectItem>
                            <SelectItem value="ndt_pt">PT — Liquid Penetrant</SelectItem>
                            <SelectItem value="ndt_rt">RT — Radiographic</SelectItem>
                            <SelectItem value="ndt_et">ET — Eddy Current</SelectItem>
                            <SelectItem value="ndt_vt">VT — Visual</SelectItem>
                            <SelectItem value="ndt_ut_pa">UT-PA — Phased Array</SelectItem>
                            <SelectItem value="ndt_xf">XF — X-Ray Fluorescence</SelectItem>
                            <SelectItem value="ndt_cedo">CEDO — CNSC</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </div>

                {/* Certifications — single column stack */}
                <div className="flex flex-col gap-4">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            <div className="text-center py-16">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" style={{ borderColor: '#6b7040', borderTopColor: 'transparent' }} />
                            </div>
                        ) : filteredCertifications.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-gray-400 text-base">No certifications found</p>
                                <p className="text-gray-300 text-sm mt-1">Tap + to log a quick entry</p>
                            </div>
                        ) : (
                            filteredCertifications.map((cert) => (
                                <motion.div
                                    key={cert.id}
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    <CertificationCard
                                        certification={cert}
                                        scsPoints={cert.scs_applicable ? totalScsPoints : 0}
                                        onDelete={handleDelete}
                                    />
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Employer Dashboard button */}
                <div className="mt-6">
                    <Link to="/employer-dashboard"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-sm transition-transform active:scale-95"
                        style={{ backgroundColor: '#6b7040', color: '#f5eed8' }}>
                        <Users className="w-4 h-4" style={{ color: '#E8A020' }} />
                        Employer Workforce Dashboard
                    </Link>
                </div>
            </div>

            {/* Quick Log Sheet */}
            <QuickLogSheet open={showQuickLog} onClose={() => setShowQuickLog(false)} />

            <BottomNav />
        </div>
    );
}