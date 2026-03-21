//import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
//import LoginPage from "./LoginPage";
//import ReBuHomepage from "./ReBuHomepage";

//function App() {
  //return (
    //<BrowserRouter>
      //<Routes>
        //<Route path="/" element={<Navigate to="/login" />} />
        //<Route path="/login" element={<LoginPage />} />
        //<Route path="/home" element={<ReBuHomepage />} />
      //</Routes>
//    </BrowserRouter>
 // );
//}

//export default App;
import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import ReBuHomepage from "./ReBuHomepage";

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return (
      <BrowserRouter>
        <LoginPage onLoginSuccess={setUser} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <ReBuHomepage user={user} onLogout={() => setUser(null)} />
    </BrowserRouter>
  );
}
