import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface Service {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
}

interface HealthStatusProps {
  services: Service[];
}

const HealthStatus: React.FC<HealthStatusProps> = ({ services }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h2>
      <div className="space-y-3">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center space-x-3">
              {getStatusIcon(service.status)}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {service.name}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium ${getStatusColor(service.status)}`}>
                {service.status.toUpperCase()}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{service.uptime}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthStatus;