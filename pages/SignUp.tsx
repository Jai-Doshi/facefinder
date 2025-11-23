import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { GradientButton, GlassCard } from '../components/UIComponents';
import { signUp } from '../services/apiService';

interface SignUpProps {
  onSignUpSuccess: (token: string, user: any) => void;
  onSwitchToSignIn: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignUpSuccess, onSwitchToSignIn }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await signUp(name, email, password);
      onSignUpSuccess(response.token, response.user);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
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
            Create Account
          </h1>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-center mb-8">
            Sign up to get started
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/20 dark:bg-red-500/20 light:bg-red-100 border border-red-500/50 dark:border-red-500/50 light:border-red-300 rounded-lg text-red-300 dark:text-red-300 light:text-red-700 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 light:text-gray-500" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full bg-white/5 dark:bg-white/5 light:bg-gray-50 border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl pl-12 pr-4 py-3 text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

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

            <div>
              <label className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 light:text-gray-500" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full bg-white/5 dark:bg-white/5 light:bg-gray-50 border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl pl-12 pr-12 py-3 text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 focus:outline-none focus:border-brand-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 light:text-gray-500 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <GradientButton type="submit" fullWidth loading={loading}>
              Sign Up
            </GradientButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={onSwitchToSignIn}
                className="text-brand-primary hover:text-brand-secondary transition-colors font-semibold"
              >
                Sign In
              </button>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default SignUp;

