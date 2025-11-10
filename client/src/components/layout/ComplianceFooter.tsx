import React from 'react';

export const ComplianceFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            © {currentYear} AFL Fantasy Manager. All data provided for informational purposes.
          </div>
          
          <div className="flex gap-6 text-sm">
            <a href="/privacy" className="text-gray-600 hover:text-gray-900">
              Privacy
            </a>
            <a href="/terms" className="text-gray-600 hover:text-gray-900">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
