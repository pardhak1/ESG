import React, { useEffect, useState } from 'react';

export default function KeyenceWorkorderStep({ onContinue }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const endpoint = `${process.env.REACT_APP_BACKEND_HOST}/api/scan/getic`;
    fetch(endpoint, { method: 'GET' })
      .then((r) => r.json())
      .then((data) => {
        setWorkOrders(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load work orders');
        setLoading(false);
      });
  }, []);

  const chooseWorkOrder = (wo) => {
    localStorage.setItem('kit_code',     wo.kit_code);
    localStorage.setItem('WorkOrder',    wo.work_order);
    localStorage.setItem('workorder_id', wo.wo_id);
    onContinue();
  };

  if (loading) return <div className="keyence-panel"><p>Loading work orders…</p></div>;
  if (error)   return <div className="keyence-panel"><p className="keyence-error">{error}</p></div>;

  return (
    <div className="keyence-panel">
      <h2>Active Work Orders</h2>
      <div className="keyence-list">
        {workOrders.map((wo) => (
          <button
            key={wo.wo_id}
            className="keyence-btn keyence-list-btn"
            onClick={() => chooseWorkOrder(wo)}
          >
            {wo.work_order}
          </button>
        ))}
      </div>
    </div>
  );
}
