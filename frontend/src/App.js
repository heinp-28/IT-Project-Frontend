import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Entries from "./pages/Entries"
import Login from "./pages/Login"
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import UserManagement from "./pages/UserManagement"
import { NextUIProvider } from "@nextui-org/react";

function App() {
  return (
    <NextUIProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/entries/:userID" element= {<Entries/>}/>
            <Route path="/login" element= {<Login/>}/>
            <Route path="/profile/:userID" element={<Profile />} />
            <Route path="/edit-profile/:userID" element={<EditProfile />} />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/manage-users/" element={<UserManagement />} />
          </Routes>
        </BrowserRouter>
      </div>
    </NextUIProvider>
  );    
}

export default App;
