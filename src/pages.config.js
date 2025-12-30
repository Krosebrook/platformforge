import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Customers from './pages/Customers';
import Jobs from './pages/Jobs';
import Products from './pages/Products';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Onboarding": Onboarding,
    "Customers": Customers,
    "Jobs": Jobs,
    "Products": Products,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};