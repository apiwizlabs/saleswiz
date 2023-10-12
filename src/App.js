import { Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import PrivateRoutes from './components/PrivateRoutes';
import ResetPassword from "./pages/Auth/ResetPassword";
import ResetEmail from "./pages/Auth/ResetEmail";
import Unauthorised from './pages/Error/Unauthorised';
import NotFound from './pages/Error/NotFound';
import Expired from './pages/Error/Expired';
import Leads from "./pages/Leads/Leads";
import Currency from "./pages/Settings/Currency";
import Contacts from "./pages/Contacts/Contacts";
import ContactsOverview from "./pages/Contacts/ContactOverview";
import Pipelines from './pages/Pipelines'
import Settings from "./pages/Settings";
import TeamUserMgmt from "./pages/Settings/Team-User/index.js";
import Fields from "./pages/Settings/Fields";
import Profile from "./pages/Settings/Profile";
import LeadOverview from "./pages/Leads/LeadOverview";
import Activities from "./pages/Activities";
import "./styles/main.scss";
import 'remixicon/fonts/remixicon.css';
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Approvals from "./pages/Settings/Approvals/Approvals";
import "react-datepicker/dist/react-datepicker.css";
import DealDetails from "./pages/Pipelines/DealDetails";

const ROLES = {
  "Admin": "ADMIN",
  "OrgOwner": "ORG_OWNER",
  "SalesOwner": "SALES_OWNER",
  "Standard" : "STANDARD"
}

function App() {
  return (
    <div className='v1--styles'>
     <ToastContainer
        position="bottom-right"
        hideProgressBar={false}
        newestOnTop
        closeOnClick
      />
      
       <Routes>
          {/* <Route element={<PrivateRoutes allowedRoles={[ROLES.SuperAdmin, ROLES.SalesOwner ]} />}>
            <Route element={<ProfilePage />} path="/profile" />
            <Route element={<TicketsPage />} path="/tickets/:orgId" />
          </Route> */}

          {/* the allowed roles mentioned here are dummy values */}
          <Route element={<PrivateRoutes allowedRoles={[[ROLES.SuperAdmin, ROLES.SalesOwner, ROLES.Standard ] ]} />}>
             <Route element={<Pipelines />} path="/" exact />
             <Route element={<Leads />} path="/leads"  />
             <Route element={<LeadOverview />} path="/leads/:leadId"  />
             <Route element={<Contacts />} path="/contacts"  />
             <Route element={<ContactsOverview />} path="/contacts/:contactId"  />
             <Route element={<DealDetails />} path="/deals/:dealId"  />
             <Route element={<Activities />} path="/activities"  />
             <Route element={<Settings />} >
                <Route element={<Profile />} path="profile" />
                <Route element={<TeamUserMgmt />} path="teams" />
                <Route element={<Fields />} path="fields" />
                <Route element={<Approvals />} path="approvals" />
                <Route element={<Currency />} path="currency" />
             </Route>
             {/* <Route element={<ManageUsersPage />} path="/users" /> */}
          </Route>
          <Route element={<Login />} path="/login" />
          <Route element={<Signup />} path="/signup/:token" />
          <Route element={<ResetEmail />} path="/reset" />
          <Route element={<ResetPassword />} path="/reset/:token" />
          <Route element={<Unauthorised />} path="/unauthorised" />
          <Route element={<Expired />} path="/expired" />
          <Route path='*' element={<NotFound />}/>
        </Routes>

    </div>
   
  );
}

export default App;
