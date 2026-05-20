import React, { useState } from 'react';
import { Lock, Loader2, Shield } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import GoldHeading from '@/components/ui/GoldHeading';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { clearAdminAccess, grantAdminAccess, hasAdminAccess, verifyAdminCode } from '@/lib/adminAccess';

export default function AdminGate({ children }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [granted, setGranted] = useState(() => hasAdminAccess());

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verifyAdminCode(code);
      grantAdminAccess();
      setGranted(true);
      setCode('');
    } catch (err) {
      setError(err.message || 'Invalid admin code');
      clearAdminAccess();
      setGranted(false);
    } finally {
      setLoading(false);
    }
  };

  if (granted) {
    return children;
  }

  return (
    <PageContainer className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-5 h-5 text-primary" />
        <GoldHeading size="md">Archive Admin</GoldHeading>
      </div>

      <GlassCard className="p-5">
        <p className="text-sm text-muted-foreground mb-4">
          Enter the shared admin code to open the import tools.
        </p>

        {error ? (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              type="password"
              placeholder="Admin code"
              className="pl-10 h-12"
              autoComplete="off"
              autoFocus
              required
            />
          </div>

          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking code...
              </>
            ) : (
              'Open admin tools'
            )}
          </Button>
        </form>
      </GlassCard>
    </PageContainer>
  );
}
