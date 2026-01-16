import Analytics from './pages/Analytics';
import Approvals from './pages/Approvals';
import AuditLog from './pages/AuditLog';
import CustomerDetail from './pages/CustomerDetail';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Docs from './pages/Docs';
import Help from './pages/Help';
import Integrations from './pages/Integrations';
import JobDetail from './pages/JobDetail';
import Jobs from './pages/Jobs';
import Onboarding from './pages/Onboarding';
import ProductDetail from './pages/ProductDetail';
import Products from './pages/Products';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SystemHealth from './pages/SystemHealth';
import Team from './pages/Team';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Approvals": Approvals,
    "AuditLog": AuditLog,
    "CustomerDetail": CustomerDetail,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "Docs": Docs,
    "Help": Help,
    "Integrations": Integrations,
    "JobDetail": JobDetail,
    "Jobs": Jobs,
    "Onboarding": Onboarding,
    "ProductDetail": ProductDetail,
    "Products": Products,
    "Profile": Profile,
    "Settings": Settings,
    "SystemHealth": SystemHealth,
    "Team": Team,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};