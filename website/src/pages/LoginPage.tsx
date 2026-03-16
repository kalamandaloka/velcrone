import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      const role = result.role;
      if (role === 'owner') navigate('/dashboard/reports');
      else if (role === 'manager') navigate('/dashboard/raw-materials');
      else if (role === 'kasir') navigate('/dashboard/transactions');
      else navigate('/dashboard');
    } else {
      setError(result.error || 'Login gagal');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-velcrone-surface">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground">VELCRONE</h1>
          <p className="text-muted-foreground mt-1">Inventory & Fashion System</p>
        </div>
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Login</h2>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@velcrone.com" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full velcrone-gradient text-primary-foreground hover:opacity-90 transition-opacity">
              <LogIn size={18} className="mr-2" /> {submitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Demo Accounts:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>admin@velcrone.com</div><div>123456</div>
              <div>owner@velcrone.com</div><div>123456</div>
              <div>manager@velcrone.com</div><div>123456</div>
              <div>kasir@velcrone.com</div><div>123456</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
