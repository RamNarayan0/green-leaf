/**
 * ShopAnalyticsCharts.jsx - Analytics charts for shop dashboard
 * Shows orders per day and revenue per day
 */

import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ShopAnalyticsCharts = ({ orders = [] }) => {
  // Process orders data to get orders per day and revenue per day
  const processOrderData = () => {
    const last7Days = [];
    const today = new Date();
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    // Initialize data
    const ordersPerDay = new Array(7).fill(0);
    const revenuePerDay = new Array(7).fill(0);

    // Process each order
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      const dayIndex = last7Days.indexOf(orderDate);
      
      if (dayIndex !== -1) {
        ordersPerDay[dayIndex]++;
        revenuePerDay[dayIndex] += order.totalAmount || 0;
      }
    });

    // Format labels
    const labels = last7Days.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    });

    return { labels, ordersPerDay, revenuePerDay };
  };

  const { labels, ordersPerDay, revenuePerDay } = processOrderData();

  // Orders chart data
  const ordersChartData = {
    labels,
    datasets: [
      {
        label: 'Orders',
        data: ordersPerDay,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(34, 197, 94)'
      }
    ]
  };

  // Revenue chart data
  const revenueChartData = {
    labels,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: revenuePerDay,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(59, 130, 246)'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Orders per day chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Orders (Last 7 Days)</h3>
        <div className="h-64">
          <Line data={ordersChartData} options={chartOptions} />
        </div>
      </div>

      {/* Revenue per day chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue (Last 7 Days)</h3>
        <div className="h-64">
          <Line data={revenueChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default ShopAnalyticsCharts;

