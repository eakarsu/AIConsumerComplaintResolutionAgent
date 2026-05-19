import React from 'react';
import SLAPerformanceChart from '../components/SLAPerformanceChart.jsx';
import CategoryChannelHeatmap from '../components/CategoryChannelHeatmap.jsx';
import ResolutionLetterPdf from '../components/ResolutionLetterPdf.jsx';
import RoutingRulesEditor from '../components/RoutingRulesEditor.jsx';

export default function CustomViewsPage() {
  return (
    <div>
      <h2>Complaint Views</h2>
      <p className="muted">Custom operational views for the complaint resolution workflow.</p>
      <SLAPerformanceChart />
      <CategoryChannelHeatmap />
      <ResolutionLetterPdf />
      <RoutingRulesEditor />
    </div>
  );
}
