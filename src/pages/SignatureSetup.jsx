import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, PenTool, Check, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';
import SignaturePad from '@/components/signature/SignaturePad';

export default function SignatureSetup() {
  const [signature, setSignature] = useState(null);
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    loadSignature();
  }, []);

  const loadSignature = async () => {
    try {
      const { items } = await base44.entities.Signature.filter(
        {},
        { sort: '-created_date', limit: 1 }
      );
      if (items[0]) {
        setSignature(items[0]);
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: items[0].signature_image_uri,
        });
        setSignedUrl(signed_url);
      }
    } catch (e) {
      // not logged in or no signature yet
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (blob) => {
    setSaving(true);
    try {
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });

      let result;
      if (signature) {
        result = await base44.entities.Signature.update(signature.id, {
          signature_image_uri: file_uri,
        });
      } else {
        result = await base44.entities.Signature.create({
          signature_image_uri: file_uri,
        });
      }
      setSignature(result);
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: result.signature_image_uri,
      });
      setSignedUrl(signed_url);
      setJustSaved(true);
      setReplacing(false);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f4ee' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-3 sticky top-0 z-10 shadow-md" style={{ backgroundColor: '#6b7040' }}>
        <div className="flex items-center gap-2 mb-2">
          <Link to="/nrcan-forms" className="flex items-center gap-1 text-xs font-bold" style={{ color: '#E8A020' }}>
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>
        </div>
        <h1 className="text-xl font-black" style={{ color: '#f5eed8' }}>Your Signature</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(232,160,32,0.8)' }}>
          Saved once, applied to all your renewal forms
        </p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6b7040' }} />
          </div>
        ) : signature && signedUrl && !replacing ? (
          <>
            {/* Existing signature */}
            <div className="bg-white rounded-2xl border p-4 space-y-3" style={{ borderColor: '#d1ccc0' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(59,109,17,0.1)' }}>
                  <Check className="w-4 h-4" style={{ color: '#3B6D11' }} />
                </div>
                <p className="text-sm font-black" style={{ color: '#3B6D11' }}>Signature on file</p>
              </div>
              <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#d1ccc0' }}>
                <img src={signedUrl} alt="Your signature" className="w-full h-32 object-contain bg-white" />
              </div>
              <p className="text-xs" style={{ color: '#999' }}>
                Your signature will be applied automatically to all signature fields across your NRCan renewal documents.
              </p>
              {justSaved && (
                <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(59,109,17,0.08)' }}>
                  <p className="text-xs font-bold" style={{ color: '#3B6D11' }}>
                    ✓ Signature saved successfully
                  </p>
                </div>
              )}
              <button
                onClick={() => setReplacing(true)}
                className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                style={{ backgroundColor: '#f0ede5', color: '#6b7040', border: '2px solid #6b7040' }}
              >
                <RefreshCw className="w-4 h-4" />
                Replace Signature
              </button>
            </div>

            {/* Info card */}
            <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#d1ccc0' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(232,160,32,0.15)' }}>
                  <PenTool className="w-5 h-5" style={{ color: '#E8A020' }} />
                </div>
                <div>
                  <p className="text-sm font-black" style={{ color: '#6b7040' }}>Why we need this</p>
                  <p className="text-xs mt-1" style={{ color: '#666' }}>
                    NRCan requires a signature on your renewal application, SCS form, and code of conduct. By saving your signature here, you authorize CERTainly to apply it to your documents when you submit a renewal package.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Signature pad */}
            <div className="bg-white rounded-2xl border p-4 space-y-3" style={{ borderColor: '#d1ccc0' }}>
              <p className="text-sm font-black" style={{ color: '#6b7040' }}>
                {signature ? 'Draw your new signature' : 'Create your signature'}
              </p>
              <p className="text-xs" style={{ color: '#666' }}>
                Sign once with your finger or mouse. This will be applied to all signature fields across your NRCan renewal documents.
              </p>
              <SignaturePad onSave={handleSave} saving={saving} />
              <p className="text-xs" style={{ color: '#999' }}>
                By saving your signature you confirm it is authentic and authorize CERTainly to apply it to your NRCan renewal documents on your instruction.
              </p>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}