import React from 'react';
import { Users, FolderOpen, Activity, TrendingUp } from 'lucide-react';
import StatCard from '../Components/UI/StatCard';
import HealthStatus from '../Components/UI/HealthStatus';
import Chart from '../Components/UI/Chart';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Projects',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: FolderOpen,
      color: 'blue'
    },
    {
      title: 'Active Users',
      value: '847',
      change: '+5.2%',
      trend: 'up',
      icon: Users,
      color: 'green'
    },
    {
      title: 'Total Hits',
      value: '1.2M',
      change: '+23%',
      trend: 'up',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'System Health',
      value: '99.8%',
      change: '+0.1%',
      trend: 'up',
      icon: Activity,
      color: 'emerald'
    }
  ];

  const services = [
    { name: 'API Gateway', status: 'healthy', uptime: '99.9%' },
    { name: 'Database', status: 'healthy', uptime: '99.8%' },
    { name: 'Authentication', status: 'healthy', uptime: '100%' },
    { name: 'File Storage', status: 'warning', uptime: '98.5%' },
    { name: 'Notification Service', status: 'healthy', uptime: '99.7%' }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6 md:px-12 md:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Site Traffic</h2>
              <select className="text-sm border border-gray-700 rounded-lg px-3 py-1 bg-black text-white">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <Chart />
          </div>
        </div>

        {/* Health Status Only */}
        <HealthStatus services={services} />
      </div>
    </div>
  );
};

export default Dashboard;
