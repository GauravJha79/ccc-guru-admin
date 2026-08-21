import React, { useState } from 'react';
import { Database, Copy, Check, ShieldAlert, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../../lib/sqlSchema';
import { isSupabaseConfigured, testSupabaseConnection } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const DatabaseSetupPage: React.FC = () => {
  const { success, error: toastError, info } = useToast();
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    success('Copied to Clipboard', 'Full PostgreSQL SQL schema copied.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const res = await testSupabaseConnection();
    setTestResult(res);
    setTesting(false);
    if (res.success) {
      success('Connected to Supabase', res.message);
    } else {
      toastError('Connection Check', res.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Overview Card */}
      <div className="p-6 rounded-3xl bg-background-card border border-dark-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-lavender-500/10 text-lavender-400 border border-lavender-500/20 shadow-glow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Database & Supabase Configuration</h2>
              <p className="text-xs text-dark-muted">
                Complete PostgreSQL Schema, Row Level Security (RLS) & Storage Buckets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              isLoading={testing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Test Supabase Live Connection
            </Button>
            <Button size="sm" onClick={handleCopySql} leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}>
              {copied ? 'Copied SQL' : 'Copy All SQL'}
            </Button>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div className="p-4 rounded-2xl bg-background-elevated/70 border border-dark-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-dark-muted">Current Connection Status:</span>
            {isSupabaseConfigured ? (
              <Badge variant="success" dot>
                Supabase URL & Anon Key Configured
              </Badge>
            ) : (
              <Badge variant="warning" dot>
                Using Reactive Local State / Mock Mode
              </Badge>
            )}
          </div>

          {testResult && (
            <span className={`font-semibold ${testResult.success ? 'text-emerald-300' : 'text-rose-400'}`}>
              {testResult.message}
            </span>
          )}
        </div>

        {/* Security Warning */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">Security Golden Rule:</p>
            <p className="leading-relaxed">
              NEVER expose your Supabase <code>service_role</code> secret key in this frontend application or in the <code>.env</code> file. The admin panel operates strictly via Supabase Auth and RLS role verification.
            </p>
          </div>
        </div>
      </div>

      {/* SQL Script Viewer */}
      <div className="p-6 rounded-3xl bg-background-card border border-dark-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">PostgreSQL Migration & Schema Setup Script</h3>
            <p className="text-xs text-dark-muted">Paste into your Supabase Dashboard &gt; SQL Editor and click Run</p>
          </div>
          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-lavender-300 bg-lavender-500/10 hover:bg-lavender-500/20 border border-lavender-500/30 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Script'}</span>
          </button>
        </div>

        <div className="relative rounded-2xl bg-background overflow-hidden border border-dark-border">
          <pre className="p-5 text-xs font-mono text-lavender-200 overflow-x-auto max-h-[450px] leading-relaxed select-all">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>
    </div>
  );
};
