import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ArrowLeft, Save, Eye, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// Predefined field keys that map to Certification/technician data
const FIELD_KEYS = [
  { key: 'technician_name', label: 'Technician Full Name' },
  { key: 'technician_email', label: 'Technician Email' },
  { key: 'certification_name', label: 'Certification Name' },
  { key: 'certification_number', label: 'Certification Number' },
  { key: 'nrcan_id', label: 'NRCan ID' },
  { key: 'issue_date', label: 'Issue Date' },
  { key: 'expiry_date', label: 'Expiry Date' },
  { key: 'employer_name', label: 'Employer Name' },
  { key: 'employer_email', label: 'Employer Email' },
  { key: 'supervisor_name', label: 'Supervisor Name' },
  { key: 'supervisor_email', label: 'Supervisor Email' },
  { key: 'current_date', label: "Today's Date" },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'province', label: 'Province' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'phone', label: 'Phone' },
  { key: 'signature', label: 'Signature Line' },
  { key: 'method', label: 'NDT Method' },
  { key: 'level', label: 'Level' },
  { key: 'sector', label: 'Sector' },
  { key: 'total_points', label: 'Total SCS Points' },
  { key: 'custom', label: 'Custom / Other' },
];

// Load pdf.js from CDN via script tag (UMD build — reliable in Vite)
let pdfjsLibPromise = null;
async function loadPdfJs() {
  if (pdfjsLibPromise) return pdfjsLibPromise;
  pdfjsLibPromise = new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    script.onload = () => {
      const lib = window.pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      resolve(lib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
    document.head.appendChild(script);
  });
  return pdfjsLibPromise;
}

export default function PdfFormMapper() {
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [templateUrl, setTemplateUrl] = useState('');
  const [selectedFieldKey, setSelectedFieldKey] = useState('technician_name');
  const [customLabel, setCustomLabel] = useState('');
  const [fontSize, setFontSize] = useState(10);
  const [align, setAlign] = useState('left');
  const [pages, setPages] = useState([]); // [{canvas, viewport, pageNum}]
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMarkers, setActiveMarkers] = useState({}); // {pageNum: [{field_key, x, y, label}]}
  const canvasRefs = useRef({});
  const queryClient = useQueryClient();

  // Load existing maps for this form
  const { data: existingMaps = [], refetch } = useQuery({
    queryKey: ['pdfFieldMaps', formId],
    queryFn: () => base44.entities.PdfFieldMap.filter({ form_id: formId }),
    enabled: !!formId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PdfFieldMap.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfFieldMaps', formId] });
      toast.success('Field mapping deleted');
    },
  });

  const saveMapMutation = useMutation({
    mutationFn: (data) => base44.entities.PdfFieldMap.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfFieldMaps', formId] });
      toast.success('Field position saved');
    },
  });

  // Load and render PDF
  const loadPdf = useCallback(async () => {
    if (!templateUrl) return;
    setLoading(true);
    try {
      const pdfjsLib = await loadPdfJs();
      const loadingTask = pdfjsLib.getDocument(templateUrl);
      const doc = await loadingTask.promise;
      setPdfDoc(doc);

      const renderedPages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        renderedPages.push({ pageNum: i, page, viewport });
      }
      setPages(renderedPages);
      toast.success(`Loaded ${doc.numPages} page(s)`);
    } catch (e) {
      console.error('PDF load error:', e);
      toast.error('Failed to load PDF: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [templateUrl]);

  // Render pages to canvas
  useEffect(() => {
    pages.forEach(({ page, pageNum, viewport }) => {
      const canvas = canvasRefs.current[pageNum];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      page.render({ canvasContext: ctx, viewport }).promise.then(() => {
        drawMarkers(pageNum, viewport);
      });
    });
  }, [pages, activeMarkers, existingMaps]);

  // Draw markers on canvas
  const drawMarkers = (pageNum, viewport) => {
    const canvas = canvasRefs.current[pageNum];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const maps = existingMaps.filter(m => m.page_number === pageNum);
    const pending = activeMarkers[pageNum] || [];
    const allMarkers = [
      ...maps.map(m => ({ x: m.x, y: m.y, label: m.field_label || m.field_key, saved: true, id: m.id })),
      ...pending,
    ];
    allMarkers.forEach((marker, idx) => {
      // PDF coords are from bottom-left; canvas is from top-left
      const canvasX = marker.x * 1.5;
      const canvasY = (viewport.height / 1.5 - marker.y) * 1.5;
      ctx.fillStyle = marker.saved ? 'rgba(232,160,32,0.9)' : 'rgba(163,45,45,0.9)';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Label
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.font = '10px sans-serif';
      const labelText = marker.label || `#${idx}`;
      const textW = ctx.measureText(labelText).width;
      ctx.fillRect(canvasX + 10, canvasY - 6, textW + 6, 14);
      ctx.fillStyle = 'white';
      ctx.fillText(labelText, canvasX + 13, canvasY + 4);
    });
  };

  // Handle click on canvas
  const handleCanvasClick = (e, pageNum, viewport) => {
    const canvas = canvasRefs.current[pageNum];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const clickX = (e.clientX - rect.left) * scale;
    const clickY = (e.clientY - rect.top) * scale;

    // Convert to PDF points (viewport scale is 1.5, PDF coords from bottom-left)
    const pdfX = clickX / 1.5;
    const pdfY = (viewport.height / scale - clickY / scale) / 1.5 * scale / 1.5;

    // Simpler: PDF Y = (canvasHeight - clickY) / scale_factor
    const pdfYFinal = (canvas.height - clickY) / 1.5;

    const fieldKey = selectedFieldKey === 'custom' ? customLabel : selectedFieldKey;
    if (!fieldKey) {
      toast.error('Select a field to map first');
      return;
    }

    const fieldMeta = FIELD_KEYS.find(f => f.key === selectedFieldKey);
    const label = selectedFieldKey === 'custom' ? customLabel : fieldMeta?.label || selectedFieldKey;

    // Save directly
    saveMapMutation.mutate({
      form_id: formId,
      form_name: formName,
      template_url: templateUrl,
      field_key: fieldKey,
      field_label: label,
      page_number: pageNum,
      x: Math.round(pdfX),
      y: Math.round(pdfYFinal),
      width: 200,
      font_size: fontSize,
      align,
    });
  };

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: '#f7f4ee', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 shadow-md" style={{ backgroundColor: '#6b7040' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1 text-sm font-bold" style={{ color: '#f5eed8' }}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-black" style={{ color: '#E8A020' }}>PDF Field Mapper</h1>
            <p className="text-xs" style={{ color: 'rgba(245,238,216,0.8)' }}>Tap on PDF to define where data goes</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Setup panel */}
        <div className="rounded-2xl p-4 mb-4 shadow-sm" style={{ backgroundColor: 'white' }}>
          <h2 className="text-sm font-black mb-3" style={{ color: '#6b7040' }}>Step 1: Load a PDF Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <Label className="text-xs font-bold mb-1" style={{ color: '#6b7040' }}>Form ID</Label>
              <Input
                placeholder="e.g. 8.2.1-075"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-bold mb-1" style={{ color: '#6b7040' }}>Form Name</Label>
              <Input
                placeholder="e.g. Renewal Application Form"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-bold mb-1" style={{ color: '#6b7040' }}>Template PDF URL</Label>
              <Input
                placeholder="https://media.base44.com/..."
                value={templateUrl}
                onChange={(e) => setTemplateUrl(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>
          <Button
            onClick={loadPdf}
            disabled={!templateUrl || loading}
            className="w-full rounded-xl font-bold"
            style={{ backgroundColor: '#E8A020', color: '#6b7040' }}
          >
            {loading ? 'Loading...' : 'Load PDF'}
          </Button>

          {existingMaps.length > 0 && (
            <div className="mt-3 p-2 rounded-xl text-xs" style={{ backgroundColor: '#f0ede5', color: '#6b7040' }}>
              <strong>{existingMaps.length}</strong> field(s) already mapped for this form
            </div>
          )}
        </div>

        {/* Field selector */}
        {pages.length > 0 && (
          <div className="rounded-2xl p-4 mb-4 shadow-sm" style={{ backgroundColor: 'white' }}>
            <h2 className="text-sm font-black mb-3" style={{ color: '#6b7040' }}>Step 2: Select a Field, Then Tap the PDF</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs font-bold mb-1" style={{ color: '#6b7040' }}>Data Field</Label>
                <Select value={selectedFieldKey} onValueChange={setSelectedFieldKey}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELD_KEYS.map(f => (
                      <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedFieldKey === 'custom' && (
                <div>
                  <Label className="text-xs font-bold mb-1" style={{ color: '#6b7040' }}>Custom Label</Label>
                  <Input
                    placeholder="Field label"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}
              <div>
                <Label className="text-xs font-bold mb-1" style={{ color: '#6b7040' }}>Font Size</Label>
                <Select value={String(fontSize)} onValueChange={(v) => setFontSize(Number(v))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="11">11</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="14">14</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold mb-1" style={{ color: '#6b7040' }}>Alignment</Label>
                <Select value={align} onValueChange={setAlign}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: '#999' }}>
              <MapPin className="w-4 h-4" style={{ color: '#A32D2D' }} />
              <span>Orange dots = saved fields, Red dots = pending</span>
            </div>
          </div>
        )}

        {/* PDF Pages */}
        {pages.map(({ pageNum, viewport }) => (
          <div key={pageNum} className="mb-6">
            <h3 className="text-sm font-black mb-2" style={{ color: '#6b7040' }}>Page {pageNum}</h3>
            <div className="inline-block rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#ccc' }}>
              <canvas
                ref={(el) => { canvasRefs.current[pageNum] = el; }}
                onClick={(e) => handleCanvasClick(e, pageNum, viewport)}
                style={{ cursor: 'crosshair', maxWidth: '100%', display: 'block' }}
              />
            </div>
          </div>
        ))}

        {/* Mapped fields list */}
        {existingMaps.length > 0 && (
          <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: 'white' }}>
            <h2 className="text-sm font-black mb-3" style={{ color: '#6b7040' }}>Mapped Fields ({existingMaps.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {existingMaps.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: '#f0ede5' }}>
                  <div className="text-xs">
                    <span className="font-bold" style={{ color: '#6b7040' }}>{m.field_label}</span>
                    <span style={{ color: '#999' }}> · Page {m.page_number} · ({Math.round(m.x)}, {Math.round(m.y)}) · {m.font_size}pt</span>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(m.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: '#A32D2D' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}