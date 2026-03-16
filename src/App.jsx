
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./Dashboard";
import PatientView from "./PatientView";

function App() {
return (
<Routes>
<Route path="/" element={<Navigate to="/dashboard" replace />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/patient/:id" element={<PatientView />} />
</Routes>
);
}
