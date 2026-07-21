import React from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { TOOLS } from './tools.js';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import ComplaintTriage from './pages/ComplaintTriage.jsx';
import SentimentAnalysis from './pages/SentimentAnalysis.jsx';
import ResponseDraft from './pages/ResponseDraft.jsx';
import RefundRecommendation from './pages/RefundRecommendation.jsx';
import RootCauseCluster from './pages/RootCauseCluster.jsx';
import EscalationDecision from './pages/EscalationDecision.jsx';
import ChurnRisk from './pages/ChurnRisk.jsx';
import RegulatoryFlag from './pages/RegulatoryFlag.jsx';
import AgentChat from './pages/AgentChat.jsx';
import PostResolutionSummary from './pages/PostResolutionSummary.jsx';
import CustomViewsPage from './pages/CustomViewsPage.jsx';
import RegulatorySlaPlanner from './pages/RegulatorySlaPlanner.jsx';

// // === Batch 02 Gaps & Frontend Mounts ===
import CfComplaintAutoRoutingTriage from './pages/CfComplaintAutoRoutingTriage.jsx';
import CfResolutionPrediction from './pages/CfResolutionPrediction.jsx';
import CfRootCauseAnalysisAutomation from './pages/CfRootCauseAnalysisAutomation.jsx';
import CfSentimentDrivenEscalation from './pages/CfSentimentDrivenEscalation.jsx';
import CfPredictiveRefundScoring from './pages/CfPredictiveRefundScoring.jsx';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

function Sidebar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  function onLogout() { logout(); nav('/'); }
  return (
    <nav className="sidebar">
      <h1>Complaint Resolution AI</h1>
      <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
      <NavLink to="/custom-views" className={({ isActive }) => isActive ? 'active' : ''}>Complaint Views</NavLink>
      <NavLink to="/tools/regulatory-sla" className={({ isActive }) => isActive ? 'active' : ''}>Regulatory SLA</NavLink>
      <div style={{ marginTop: 12, fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af' }}>AI Tools</div>
      {TOOLS.map((t) => (
        <NavLink key={t.path} to={t.path} className={({ isActive }) => isActive ? 'active' : ''}>
          {t.title}
        </NavLink>
      ))}
      <div className="user-box">
        <div>Signed in as</div>
        <div><strong>{user?.name || user?.email}</strong></div>
        <button onClick={onLogout}>Sign out</button>
      </div>
    </nav>
  );
}

function ProtectedShell({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  return (
    <div className="app">
      <Sidebar />
      <div className="main">{children}</div>
    </div>
  );
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) {
    return (
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/complaint-auto-routing-triage" element={<CfComplaintAutoRoutingTriage />} />
        <Route path="/cf/resolution-prediction" element={<CfResolutionPrediction />} />
        <Route path="/cf/root-cause-analysis-automation" element={<CfRootCauseAnalysisAutomation />} />
        <Route path="/cf/sentiment-driven-escalation" element={<CfSentimentDrivenEscalation />} />
        <Route path="/cf/predictive-refund-scoring" element={<CfPredictiveRefundScoring />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/" element={<ProtectedShell><Home /></ProtectedShell>} />
      <Route path="/tools/complaint-triage" element={<ProtectedShell><ComplaintTriage /></ProtectedShell>} />
      <Route path="/tools/sentiment-analysis" element={<ProtectedShell><SentimentAnalysis /></ProtectedShell>} />
      <Route path="/tools/response-draft" element={<ProtectedShell><ResponseDraft /></ProtectedShell>} />
      <Route path="/tools/refund-recommendation" element={<ProtectedShell><RefundRecommendation /></ProtectedShell>} />
      <Route path="/tools/root-cause-cluster" element={<ProtectedShell><RootCauseCluster /></ProtectedShell>} />
      <Route path="/tools/escalation-decision" element={<ProtectedShell><EscalationDecision /></ProtectedShell>} />
      <Route path="/tools/churn-risk" element={<ProtectedShell><ChurnRisk /></ProtectedShell>} />
      <Route path="/tools/regulatory-flag" element={<ProtectedShell><RegulatoryFlag /></ProtectedShell>} />
      <Route path="/tools/agent-chat" element={<ProtectedShell><AgentChat /></ProtectedShell>} />
      <Route path="/tools/post-resolution-summary" element={<ProtectedShell><PostResolutionSummary /></ProtectedShell>} />
      <Route path="/tools/regulatory-sla" element={<ProtectedShell><RegulatorySlaPlanner /></ProtectedShell>} />
      <Route path="/custom-views" element={<ProtectedShell><CustomViewsPage /></ProtectedShell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
