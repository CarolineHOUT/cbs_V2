import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./Dashboard";
import PatientsView from "./PatientsView";
import PatientView from "./PatientView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<PatientsView />} />
        <Route path="/patient/:id" element={<PatientView />} />
      </Routes>
    </BrowserRouter>
  );
}
