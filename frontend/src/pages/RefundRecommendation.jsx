import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function RefundRecommendation() {
  return (
    <AiToolPage
      title="Refund Recommendation"
      intro="Recommend a fair refund or credit with policy reasoning."
      endpoint="refund-recommendation"
      fields={[
        { name: 'complaintCategory', label: 'Complaint category', type: 'text' },
        { name: 'orderValue', label: 'Order value ($)', type: 'number' },
        { name: 'customerLifetimeValue', label: 'Customer LTV ($)', type: 'number' },
        { name: 'faultParty', label: 'Fault', type: 'text', placeholder: 'company / customer / shared / unclear' },
        { name: 'repeatIncidence', label: 'Repeat incident?', type: 'text', default: 'No' },
      ]}
    />
  );
}
