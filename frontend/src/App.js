import { Routes, Route } from "react-router-dom";
// import About from "./component/About";
// import Blog from "./component/Blog";
// import Contact from "./component/Contact";
// import Home from "./component/Home";
// import Services from "./component/Services";
// import Team from "./component/Team";
import Login from "./component/login";
import WarehouseLogin from "./component/warehouseLogin";
import Logout from "./component/Logout";
import Userdashboard from "./component/userdashboard/Userdashboard";
import FinishingStations from "./component/wh/FinishingStations";
import Wh from "./component/wh/Wh";
import { Activeworkorder } from "./component/Workorder/Activeworkorder";
import { ActiveworkorderMobile } from "./component/Workorder/ActiveworkorderMobile";
import { FinishingActiveworkorder } from "./component/Workorder/FinishingActiveworkorder";
import Workstation from "./component/Workstation/Workstation";
import FinishingWorkstation from "./component/Workstation/FinishingWorkstation";
import PrintStation from "./component/PrintStation/PrintStation";
import MobileStation from "./component/mobile/MobileStation";
import MobilePrintStation from "./component/mobile/MobileStation";
import TrayId from "./component/wh/TrayId";
import FinishingTrayId from "./component/wh/FinishingTrayId";

function App() {
  const isAdminMode = process.env.REACT_APP_DEPLOYMENT_MODE === "ADMIN";
  const isRegularMode = process.env.REACT_APP_DEPLOYMENT_MODE === "REGULAR";
  return (
    <>
      <Routes>
        <Route path="/" index element={<Login />} />

        {isRegularMode && (
          <Route path="/warehouse" index element={<WarehouseLogin />} />
        )}
        {isRegularMode && <Route path="/logout" element={<Logout />} />}
        {isRegularMode && (
          <Route path="/dashboars" element={<Userdashboard />} />
        )}
        {isRegularMode && <Route path="/wh" element={<Wh />} />}
        {isRegularMode && (
          <Route path="/finishingstations" element={<FinishingStations />} />
        )}
        {isRegularMode && (
          <Route path="/activeorders" element={<Activeworkorder />} />
        )}
        {isRegularMode && (
          <Route
            path="/finishingactiveorders"
            element={<FinishingActiveworkorder />}
          />
        )}
        {isRegularMode && <Route path="/Station" element={<Workstation />} />}
        {isRegularMode && (
          <Route path="/FinishingStation" element={<FinishingWorkstation />} />
        )}
        {isRegularMode && <Route path="/TrayId" element={<TrayId />} />}
        {isRegularMode && (
          <Route path="/FinishingTrayId" element={<FinishingTrayId />} />
        )}
        {isRegularMode && <Route path="/mobile" element={<MobileStation />} />}
        {isRegularMode && (
          <Route
            path="/activeordersMobile"
            element={<ActiveworkorderMobile />}
          />
        )}
        {isRegularMode && (
          <Route path="/PrintStationMobile" element={<MobilePrintStation />} />
        )}
        {isRegularMode && (
          <Route path="/PrintStation" element={<PrintStation />} />
        )}

        <Route path="*" index element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
