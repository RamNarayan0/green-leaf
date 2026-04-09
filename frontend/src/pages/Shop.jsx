import React, { useEffect, useState } from 'react';
import { shopsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function Shop() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await shopsAPI.getAll({ limit: 20 });
        setShops(data.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-8">Loading shops...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">Shops</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shops.map((shop) => (
          <article key={shop._id} className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-1">{shop.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{shop.address?.city}, {shop.address?.state}</p>
            <div className="flex justify-between items-center">
              <span className="text-green-600 font-semibold">{shop.rating || 4.3} ⭐</span>
              <Link to={`/shop/${shop._id}`}><Button variant="secondary" size="sm">Browse</Button></Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
