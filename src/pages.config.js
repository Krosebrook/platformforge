import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Customers from './pages/Customers';
import Jobs from './pages/Jobs';
import Products from './pages/Products';
import Team from './pages/Team';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';
import Approvals from './pages/Approvals';
import SystemHealth from './pages/SystemHealth';
import Integrations from './pages/Integrations';
import Docs from './pages/Docs';
import Help from './pages/Help';
import Profile from './pages/Profile';
import CustomerDetail from './pages/CustomerDetail';
import JobDetail from './pages/JobDetail';
import ProductDetail from './pages/ProductDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Onboarding": Onboarding,
    "Customers": Customers,
    "Jobs": Jobs,
    "Products": Products,
    "Team": Team,
    "Settings": Settings,
    "AuditLog": AuditLog,
    "Approvals": Approvals,
    "SystemHealth": SystemHealth,
    "Integrations": Integrations,
    "Docs": Docs,
    "Help": Help,
    "Profile": Profile,
    "CustomerDetail": CustomerDetail,
    "JobDetail": JobDetail,
    "ProductDetail": ProductDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};