import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { ROUTES } from '../constants/routes';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-lavender-500/10 text-lavender-400 border border-lavender-500/20 flex items-center justify-center shadow-glow mb-2">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-white">404 — Page Not Found</h1>
      <p className="text-sm text-dark-muted max-w-md">
        The administration module or page you requested does not exist or has been moved.
      </p>
      <div className="pt-4">
        <Link to={ROUTES.DASHBOARD}>
          <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
