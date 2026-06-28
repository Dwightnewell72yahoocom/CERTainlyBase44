import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { calculatePoints, cappedPoints } from "@/lib/points";
import { toast } from "sonner";

const NDT_METHODS = ['UT','RT','MT','PT','ET','VT','LT','AE','IR','NR'];
const SECTORS = ['Aerospace','Oil & Gas','Power Generation','Pipeline','Manufacturing','Infrastructure','Marine','Rail','Other'];

export default function AddLogEntrySheet({ open, onOpenChange, logType, technicianName, onSuccess }) {
  const [form, setForm] = useState({
    title: '', employer: '', organisation: '', ndt_method: '', sector: '',
    provider: '', training_type: '', event_name: '', organiser: '', role: '',
    supervisor: '', mentee_names: '', membership_id: '', students_count: '',
    hours: '', start_date: '', end_date: '', description: '', notes: ''
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const entry = { ...form, log_type: logType, technician_name: technicianName,
        hours: form.hours ? parseFloat(form.hours) : undefined,
        students_count: form.students_count ? parseInt(form.students_count) : undefined,
      };
      entry.points = cappedPoints(logType, calculatePoints(logType, entry));
      await base44.entities.ExperienceLog.create(entry);
      toast.success('Entry added');
      onSuccess();
      onOpenChange(false);
      setForm({ title: '', employer: '', organisation: '', ndt_method: '', sector: '',
        provider: '', training_type: '', event_name: '', organiser: '', role: '',
        supervisor: '', mentee_names: '', membership_id: '', students_count: '',
        hours: '', start_date: '', end_date: '', description: '', notes: '' });
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const f = (label, key, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} className="h-11" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle>Add Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {f('Title / Description', 'title', 'text', 'Brief title...')}

          {logType === 'field_work' && (<>
            {f('Employer', 'employer', 'text', 'Company name')}
            <div className="space-y-1.5">
              <Label>NDT Method</Label>
              <Select value={form.ndt_method} onValueChange={v => set('ndt_method', v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>{NDT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sector</Label>
              <Select value={form.sector} onValueChange={v => set('sector', v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select sector" /></SelectTrigger>
                <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {f('Supervisor', 'supervisor')}
            {f('Hours', 'hours', 'number', '0')}
          </>)}

          {logType === 'training_received' && (<>
            {f('Training Provider', 'provider')}
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.training_type} onValueChange={v => set('training_type', v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="theoretical">Theoretical</SelectItem>
                  <SelectItem value="practical">Practical</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {f('Hours', 'hours', 'number', '0')}
          </>)}

          {logType === 'training_delivered' && (<>
            {f('Organisation', 'organisation')}
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.training_type} onValueChange={v => set('training_type', v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="theoretical">Theoretical</SelectItem>
                  <SelectItem value="practical">Practical</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {f('Hours Taught', 'hours', 'number', '0')}
            {f('Number of Students', 'students_count', 'number', '0')}
          </>)}

          {logType === 'research' && (<>
            {f('Organisation / Institution', 'organisation')}
            {f('Hours', 'hours', 'number', '0')}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the research..." className="h-24" />
            </div>
          </>)}

          {logType === 'seminars' && (<>
            {f('Event Name', 'event_name')}
            {f('Organiser', 'organiser')}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => set('role', v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="attended">Attended</SelectItem>
                  <SelectItem value="presenter">Presented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>)}

          {logType === 'professional' && (<>
            {f('Organisation', 'organisation')}
            {f('Membership / Committee ID', 'membership_id')}
          </>)}

          {logType === 'mentoring' && (<>
            {f('Mentee Name(s)', 'mentee_names', 'text', 'Comma-separated names')}
            {f('Number of Mentees', 'students_count', 'number', '1')}
            <div className="space-y-1.5">
              <Label>NDT Method</Label>
              <Select value={form.ndt_method} onValueChange={v => set('ndt_method', v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>{NDT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {f('Hours', 'hours', 'number', '0')}
          </>)}

          <div className="grid grid-cols-2 gap-3">
            {f('Start Date', 'start_date', 'date')}
            {f('End Date', 'end_date', 'date')}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." className="h-16" />
          </div>

          {/* Live points preview */}
          <div className="rounded-xl p-3 text-center border" style={{ backgroundColor: 'rgba(107,112,64,0.06)', borderColor: 'rgba(232,160,32,0.3)' }}>
            <div className="text-xs text-gray-500 mb-0.5">Points this entry will earn</div>
            <div className="text-2xl font-black" style={{ color: '#E8A020' }}>
              +{cappedPoints(logType, calculatePoints(logType, { ...form, hours: parseFloat(form.hours) || 0, students_count: parseInt(form.students_count) || 1 }))} pts
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base font-black"
            style={{ backgroundColor: '#6b7040', color: '#E8A020' }}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Entry'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}