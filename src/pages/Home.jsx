import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import StatsOverview from "../components/certifications/StatsOverview";
import UpcomingRenewals from "../components/certifications/UpcomingRenewals";
import CertificationCard from "../components/certifications/CertificationCard";
import AddCertificationForm from "../components/certifications/AddCertificationForm";
import ReminderManager from "../components/certifications/ReminderManager";
import BottomNav from "../components/layout/BottomNav";

export default function Home() {
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: certifications = [], isLoading } = useQuery({
        queryKey: ['certifications'],
        queryFn: () => base44.entities.Certification.list('-expiry_date'),
    });

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
        <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
            {/* Header */}
            <div className="px-4 pt-10 pb-4 sticky top-0 z-10 shadow-sm" style={{ backgroundColor: '#5a5f38' }}>
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8A020' }}>
                      <span className="text-xs font-black" style={{ color: '#5a5f38' }}>SS</span>
                    </div>
                    <h1 className="text-2xl font-black leading-none">
                      <span style={{ color: '#E8A020' }}>CERT</span><span style={{ color: '#F5EDD6' }}>ainly</span>
                    </h1>
                  </div>
                  <p className="text-xs mt-0.5 pl-10" style={{ color: 'rgba(245,237,214,0.5)' }}>Sound Solutions DataCAT</p>
                </div>
                <div className="flex items-center gap-2">
                  <ReminderManager certifications={certifications} />
                  <Button
                    onClick={() => setShowForm(!showForm)}
                    size="sm"
                    className="font-bold"
                    style={{ backgroundColor: '#E8A020', color: '#5a5f38' }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 py-4">
                {/* spacer for old mb-6 header slot */}
                <div className="mb-0">

                </div>
                {/* Stats Overview */}
                <div className="mb-4">
                    <StatsOverview certifications={certifications} />
                </div>

                {/* Add Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-8"
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

                {/* Upcoming Renewals Alert */}
                <div className="mb-6">
                    <UpcomingRenewals certifications={certifications} />
                </div>

                {/* Search and Filters */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Search by name, technician, or number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full md:w-48">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="All Categories" />
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

                {/* Certifications Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            <div className="col-span-full text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                            </div>
                        ) : filteredCertifications.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500 text-lg">No certifications found</p>
                            </div>
                        ) : (
                            filteredCertifications.map((cert) => (
                                <motion.div
                                    key={cert.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <CertificationCard 
                                        certification={cert}
                                        onDelete={handleDelete}
                                    />
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}