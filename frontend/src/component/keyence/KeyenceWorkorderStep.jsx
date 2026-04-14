import React, { useEffect, useState } from 'react';

export default function KeyenceWorkorderStep({ onContinue }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const endpoint = `${process.env.REACT_APP_BACKEND_HOST}/api/scan/getic`;
    console.log('[Keyence] [WorkorderStep] API Call: GET /api/scan/getic');
    
    fetch(endpoint, { method: 'GET' })
      .then((response) => response.json())
      .then((data) => {
        const workOrderCount = (data.data || []).length;
        console.log(`[Keyence] [WorkorderStep] API Response: status=200, success=${data.success}, ${workOrderCount} workorders loaded`);
        setWorkOrders(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Keyence] [WorkorderStep] Error:', err, { endpoint });
        setError(err.message || 'Failed to load work orders');
        setLoading(false);
      });
  }, []);

  const chooseWorkOrder = (wo) => {
    localStorage.setItem('kit_code', wo.kit_code);
    localStorage.setItem('WorkOrder', wo.work_order);
    localStorage.setItem('workorder_id', wo.wo_id);
    onContinue();
  };

  if (loading) return <div className="keyence-panel">Loading work orders...</div>;
  if (error) return <div className="keyence-panel keyence-error">{error}</div>;

  return (
    <div className="keyence-panel">
      <h2>Select Work Order</h2>
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
