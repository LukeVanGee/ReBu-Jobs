import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import ReBuHomepage from "./ReBuHomepage";
import JobBoard from "./JobBoard";
import JobDetails from "./JobDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<ReBuHomepage />} />
        <Route path="/job-board" element={<JobBoard />} />
        <Route path="/job/:id" element={<JobDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
