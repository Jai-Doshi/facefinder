import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { GradientButton, GlassCard } from '../components/UIComponents';
import { signIn } from '../services/apiService';

interface SignInProps {
  onSignInSuccess: (token: string, user: any) => void;
  onSwitchToSignUp: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignInSuccess, onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await signIn(email, password);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      onSignInSuccess(response.token, response.user);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark dark:bg-brand-dark light:bg-white flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Logo size="lg" animated={true} />
        </div>

        <GlassCard className="p-8">
          <h1 className="text-3xl font-display font-bold text-white dark:text-white light:text-gray-900 mb-2 text-center">
            Welcome Back
          </h1>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-center mb-8">
            Sign in to continue
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 light:text-gray-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-white/5 dark:bg-white/5 light:bg-gray-50 border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl pl-12 pr-4 py-3 text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 light:text-gray-500" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-white/5 dark:bg-white/5 light:bg-gray-50 border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl pl-12 pr-12 py-3 text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 focus:outline-none focus:border-brand-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 light:text-gray-500 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 dark:border-white/20 light:border-gray-300 bg-white/5 dark:bg-white/5 light:bg-gray-50 text-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-offset-0 transition-colors"
                />
                <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Remember me</span>
              </label>
            </div>

            <GradientButton type="submit" fullWidth loading={loading}>
              Sign In
            </GradientButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignUp}
                className="text-brand-primary hover:text-brand-secondary transition-colors font-semibold"
              >
                Sign Up
              </button>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default SignIn;

