// import React, {useEffect, useState} from 'react';
// import {BrowserRouter as Router, Route, Routes, useLocation} from 'react-router-dom';
// import Header from './components/Header/Header';
// // import Sidebar from './components/Sidebar/Sidebar';
// // import ProductList from './components/ProductsPages/ProductList/ProductList';
// // import ProductDetails from './components/ProductsPages/ProductDetails/ProductDetail/ProductDetails';
// import LoginRegister from './components/LoginRegister/LoginRegister';
// // import Profile from './components/Profile/Profile';
// // import Cart from './components/Cart/Cart';
// // import AdminPanel from "./components/AdminPanel/AdminPanel";
// // import OrderList from "./components/AdminPanel/OrderList/OrderList";
// // import ClientListPage from './components/AdminPanel/ClientListPage/ClientListPage';
// // import SellerRegistrationForm from "./components/Header/SellerRegistrationForm/SellerRegistrationForm";
// // import SellerListPage from "./components/AdminPanel/SellerListPage/SellerListPage";
// // import SellerProfile from "./components/SellersProfiles/SellerProfile/SellerProfile";
// // import SellerProductsPage from "./components/SellersProfiles/SellerProductsPage/SellerProductsPage";
// // import ProductForm from "./components/SellersProfiles/SellerProductsPage/ProductForm";
// // import SalesHistory from "./components/SellersProfiles/SalesHistory/SalesHistory";
// // import OrderDetailsPage from "./components/AdminPanel/OrderDetailsPage/OrderDetailsPage";
// import Home from "./components/Home/Home";
// // import Footer from "./components/Footer/Footer";
// // import ContactInfo from "./components/Footer/ContactInfo/ContactInfo";
// import LoadingSpinner from "./LoadingSpinner";
// // import PurchaseBuyHistory from "./components/SellersProfiles/SellerProfile/PurchaseBuyHistory";
// // import AdminHomepage from "./components/AdminPanel/AdminHomepage/AdminHomepage";
// // import FavoritesPage from "./components/ProductsPages/FavoritesPage/FavoritesPage";
// import { ToastContainer } from 'react-toastify';
// import './App.css';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min';
// import 'react-toastify/dist/ReactToastify.css';
//
//
// const AppContent = ({ children, showHeader, ...props }) => {
//   const location = useLocation();
//   // eslint-disable-next-line
//   const [showContactInfo, setShowContactInfo] = useState(false);
//
//   const isLoginRoute = location.pathname === '/login';
//
//   useEffect(() => {
//     if (!isLoginRoute) {
//       setShowContactInfo(true);
//     }
//   }, [isLoginRoute]);
//
//   return (
//       <div className="app">
//         {props.isLoading && <LoadingSpinner />}
//         {!props.isLoading && (
//             <>
//               {showHeader && (
//                   <Header
//                       onSearch={props.handleSearch}
//                       cartItems={props.cartItems}
//                       setShowSidebar={props.setShowSidebar}
//                       showSidebar={props.showSidebar}
//                       resetFilter={props.resetFilter}
//                       setSelectedOption={props.setSelectedOption}
//                       setCurrentPage={props.setCurrentPage}
//                       setIsFooterCatalog={props.setIsFooterCatalog}
//                       setSearchTerm={props.setSearchTerm}
//                       searchTerm={props.searchTerm}
//                   />
//               )}
//               {/*<div>*/}
//               {/*  <Sidebar*/}
//               {/*      setProducts={props.setProducts}*/}
//               {/*      showSidebar={props.showSidebar}*/}
//               {/*      setShowSidebar={props.setShowSidebar}*/}
//               {/*      selectedOption={props.selectedOption}*/}
//               {/*      selectedGender={props.selectedGender}*/}
//               {/*      selectedCategory={props.selectedCategory}*/}
//               {/*      selectedType={props.selectedType}*/}
//               {/*      setSelectedGender={props.setSelectedGender}*/}
//               {/*      setSelectedCategory={props.setSelectedCategory}*/}
//               {/*      setSelectedType={props.setSelectedType}*/}
//               {/*      setSearchTerm={props.setSearchTerm}*/}
//               {/*      onSearch={props.handleSearch}*/}
//               {/*  />*/}
//               {/*  {children}*/}
//               {/*</div>*/}
//               {/*{!isLoginRoute && (*/}
//               {/*    <>*/}
//               {/*      <Footer*/}
//               {/*          cartItems={props.cartItems}*/}
//               {/*          showSidebar={props.showSidebar}*/}
//               {/*          setShowSidebar={props.setShowSidebar}*/}
//               {/*          selectedOption={props.selectedOption}*/}
//               {/*          setSelectedOption={props.setSelectedOption}*/}
//               {/*          resetFilter={props.resetFilter}*/}
//               {/*          setCurrentPage={props.setCurrentPage}*/}
//               {/*          setActiveComponent={props.setActiveComponent}*/}
//               {/*          activeComponent={props.activeComponent}*/}
//               {/*          setIsFooterCatalog={props.setIsFooterCatalog}*/}
//               {/*          showFooter={props.showFooter}*/}
//               {/*      />*/}
//               {/*      {showContactInfo && <ContactInfo showContactInfo={showContactInfo} />}*/}
//               {/*    </>*/}
//               {/*)}*/}
//             </>
//         )}
//       </div>
//   );
// };
//
// const App = () => {
//   // eslint-disable-next-line
//   const [searchKeyword, setSearchKeyword] = useState('');
//   const [cartItems, setCartItems] = useState([]);
//   // eslint-disable-next-line
//   const [products, setProducts] = useState([]);
//   const [showSidebar, setShowSidebar] = useState(false);
//   const [showHeader, setShowHeader] = useState(true);
//   // eslint-disable-next-line
//   const [selectedOption, setSelectedOption] = useState(null);
//   // eslint-disable-next-line
//   const [currentPage, setCurrentPage] = useState(1);
//   // eslint-disable-next-line
//   const [orders, setOrders] = useState([]);
//   const [selectedGender, setSelectedGender] = useState(null);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [selectedType, setSelectedType] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [activeComponent, setActiveComponent] = useState(null);
//   const [isFooterCatalog, setIsFooterCatalog] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   // eslint-disable-next-line
//   const [showContactInfo, setShowContactInfo] = useState(true);
//   // eslint-disable-next-line
//   const [showFooter, setShowFooter] = useState(true);
//
//   useEffect(() => {
//     const token = sessionStorage.getItem('token');
//     if (token) {
//       setToken(token);
//     }
//   }, []);
//
//   const setToken = (token) => {
//     sessionStorage.setItem('token', token);
//   };
//
//   useEffect(() => {
//     const fetchOrders = async () => {
//       const token = sessionStorage.getItem('token');
//       const role = sessionStorage.getItem('role');
//
//       if (!token || (role !== 'customer' && role !== 'admin')) {
//         setIsLoading(false);
//         return;
//       }
//
//       try {
//         const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//
//         const data = await response.json();
//         setOrders(data);
//       } catch (error) {
//         console.error('Fetch error:', error);
//         setOrders([]);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//
//     fetchOrders();
//   }, []);
//
//   const handleSearch = (keyword) => {
//     setSearchKeyword(keyword);
//   };
//
//   const resetFilter = () => {
//     setSearchKeyword('');
//     setProducts([]);
//   };
//
//   useEffect(() => {
//     sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
//   }, [cartItems]);
//
//   return (
//       <Router>
//         <ToastContainer style={{zIndex:"999999"}} />
//         <Routes>
//           <Route path="/login" element={
//             <LoginRegister
//                 showHeader={showHeader}
//                 setShowHeader={setShowHeader}
//                 setShowSidebar={setShowSidebar}
//             />
//           } />
//           <Route path="*" element={
//             <AppContent
//                 isLoading={isLoading}
//                 showHeader={showHeader}
//                 cartItems={cartItems}
//                 showSidebar={showSidebar}
//                 setShowSidebar={setShowSidebar}
//                 selectedOption={selectedOption}
//                 selectedGender={selectedGender}
//                 selectedCategory={selectedCategory}
//                 selectedType={selectedType}
//                 setSelectedGender={setSelectedGender}
//                 setSelectedCategory={setSelectedCategory}
//                 setSelectedType={setSelectedType}
//                 searchTerm={searchTerm}
//                 setSearchTerm={setSearchTerm}
//                 handleSearch={handleSearch}
//                 resetFilter={resetFilter}
//                 setCurrentPage={setCurrentPage}
//                 activeComponent={activeComponent}
//                 setActiveComponent={setActiveComponent}
//                 isFooterCatalog={isFooterCatalog}
//                 setIsFooterCatalog={setIsFooterCatalog}
//                 setProducts={setProducts}
//                 showContactInfo={showContactInfo}
//                 showFooter={showFooter}
//             >
//               <Routes>
//                 <Route path="/" exact element={
//                   <Home
//                       setIsFooterCatalog={setIsFooterCatalog}
//                       setShowSidebar={setShowSidebar}
//                       setSelectedGender={setSelectedGender}
//                       setSelectedCategory={setSelectedCategory}
//                       setSelectedType={setSelectedType}
//                       setSearchTerm={setSearchTerm}
//                       setCartItems={setCartItems}
//                       cartItems={cartItems}
//                   />
//                 } />
//
//                 {/*<Route path="/catalog" exact element={*/}
//                 {/*  <ProductList*/}
//                 {/*      searchKeyword={searchKeyword}*/}
//                 {/*      cartItems={cartItems}*/}
//                 {/*      setCartItems={setCartItems}*/}
//                 {/*      products={products}*/}
//                 {/*      showSidebar={showSidebar}*/}
//                 {/*      setProducts={setProducts}*/}
//                 {/*      setShowSidebar={setShowSidebar}*/}
//                 {/*      selectedGender={selectedGender}*/}
//                 {/*      selectedCategory={selectedCategory}*/}
//                 {/*      selectedType={selectedType}*/}
//                 {/*      setSelectedGender={setSelectedGender}*/}
//                 {/*      setSelectedCategory={setSelectedCategory}*/}
//                 {/*      setSelectedType={setSelectedType}*/}
//                 {/*      isFooterCatalog={isFooterCatalog}*/}
//                 {/*      setSearchTerm={setSearchTerm}*/}
//                 {/*      searchTerm={searchTerm}*/}
//                 {/*      onSearch={handleSearch}*/}
//                 {/*  />*/}
//                 {/*} />*/}
//
//                 {/* Добавьте остальные маршруты аналогичным образом */}
//
//               </Routes>
//             </AppContent>
//           } />
//         </Routes>
//       </Router>
//   );
// };
//
// export default App;


// import React, {useEffect, useState} from 'react';
// import {BrowserRouter as Router, Route, Routes, useLocation} from 'react-router-dom';
// import Header from './components/Header/Header';
// import MobileFooter from './components/MobileFooter/MobileFooter'
// import LoginRegister from './components/LoginRegister/LoginRegister';
// import Home from "./components/Home/Home";
// import LoadingSpinner from "./LoadingSpinner";
// import { ToastContainer } from 'react-toastify';
// import { AuthProvider } from './contexts/AuthContext'; // Добавьте этот импорт
// import './App.css';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min';
// import 'react-toastify/dist/ReactToastify.css';
//
// const AppContent = ({ children, showHeader, ...props }) => {
//   const location = useLocation();
//   // eslint-disable-next-line
//   const [showContactInfo, setShowContactInfo] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//
//   const isLoginRoute = location.pathname === '/login';
//
//   useEffect(() => {
//     if (!isLoginRoute) {
//       setShowContactInfo(true);
//     }
//   }, [isLoginRoute]);
//
//   // Определяем мобильное устройство
//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth <= 768);
//     };
//
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);
//
//   // Скрываем мобильный футер на странице логина
//   const showMobileFooter = isMobile && !isLoginRoute;
//
//   return (
//       <div className="app">
//         {props.isLoading && <LoadingSpinner />}
//         {!props.isLoading && (
//             <>
//               {showHeader && (
//                   <Header
//                       onSearch={props.handleSearch}
//                       cartItems={props.cartItems}
//                       setShowSidebar={props.setShowSidebar}
//                       showSidebar={props.showSidebar}
//                       resetFilter={props.resetFilter}
//                       setSelectedOption={props.setSelectedOption}
//                       setCurrentPage={props.setCurrentPage}
//                       setIsFooterCatalog={props.setIsFooterCatalog}
//                       setSearchTerm={props.setSearchTerm}
//                       searchTerm={props.searchTerm}
//                   />
//               )}
//               <div className={showMobileFooter ? 'content-with-mobile-footer' : 'content'}>
//                 {children}
//               </div>
//               {showMobileFooter && <MobileFooter />}
//             </>
//         )}
//       </div>
//   );
// };
//
// const App = () => {
//   // eslint-disable-next-line
//   const [searchKeyword, setSearchKeyword] = useState('');
//   const [cartItems, setCartItems] = useState([]);
//   // eslint-disable-next-line
//   const [products, setProducts] = useState([]);
//   const [showSidebar, setShowSidebar] = useState(false);
//   const [showHeader, setShowHeader] = useState(true);
//   // eslint-disable-next-line
//   const [selectedOption, setSelectedOption] = useState(null);
//   // eslint-disable-next-line
//   const [currentPage, setCurrentPage] = useState(1);
//   // eslint-disable-next-line
//   const [orders, setOrders] = useState([]);
//   const [selectedGender, setSelectedGender] = useState(null);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [selectedType, setSelectedType] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [activeComponent, setActiveComponent] = useState(null);
//   const [isFooterCatalog, setIsFooterCatalog] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   // eslint-disable-next-line
//   const [showContactInfo, setShowContactInfo] = useState(true);
//   // eslint-disable-next-line
//   const [showFooter, setShowFooter] = useState(true);
//
//   useEffect(() => {
//     const token = sessionStorage.getItem('token');
//     if (token) {
//       setToken(token);
//     }
//   }, []);
//
//   const setToken = (token) => {
//     sessionStorage.setItem('token', token);
//   };
//
//   useEffect(() => {
//     const fetchOrders = async () => {
//       const token = sessionStorage.getItem('token');
//       const role = sessionStorage.getItem('role');
//
//       if (!token || (role !== 'customer' && role !== 'admin')) {
//         setIsLoading(false);
//         return;
//       }
//
//       try {
//         const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//
//         const data = await response.json();
//         setOrders(data);
//       } catch (error) {
//         console.error('Fetch error:', error);
//         setOrders([]);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//
//     fetchOrders();
//   }, []);
//
//   const handleSearch = (keyword) => {
//     setSearchKeyword(keyword);
//   };
//
//   const resetFilter = () => {
//     setSearchKeyword('');
//     setProducts([]);
//   };
//
//   useEffect(() => {
//     sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
//   }, [cartItems]);
//
//   return (
//       <AuthProvider> {/* Оберните все приложение в AuthProvider */}
//         <Router>
//           <ToastContainer style={{zIndex:"999999"}} />
//           <Routes>
//             <Route path="/login" element={
//               <LoginRegister
//                   showHeader={showHeader}
//                   setShowHeader={setShowHeader}
//                   setShowSidebar={setShowSidebar}
//               />
//             } />
//             <Route path="*" element={
//               <AppContent
//                   isLoading={isLoading}
//                   showHeader={showHeader}
//                   cartItems={cartItems}
//                   showSidebar={showSidebar}
//                   setShowSidebar={setShowSidebar}
//                   selectedOption={selectedOption}
//                   selectedGender={selectedGender}
//                   selectedCategory={selectedCategory}
//                   selectedType={selectedType}
//                   setSelectedGender={setSelectedGender}
//                   setSelectedCategory={setSelectedCategory}
//                   setSelectedType={setSelectedType}
//                   searchTerm={searchTerm}
//                   setSearchTerm={setSearchTerm}
//                   handleSearch={handleSearch}
//                   resetFilter={resetFilter}
//                   setCurrentPage={setCurrentPage}
//                   activeComponent={activeComponent}
//                   setActiveComponent={setActiveComponent}
//                   isFooterCatalog={isFooterCatalog}
//                   setIsFooterCatalog={setIsFooterCatalog}
//                   setProducts={setProducts}
//                   showContactInfo={showContactInfo}
//                   showFooter={showFooter}
//               >
//                 <Routes>
//                   <Route path="/" exact element={
//                     <Home
//                         setIsFooterCatalog={setIsFooterCatalog}
//                         setShowSidebar={setShowSidebar}
//                         setSelectedGender={setSelectedGender}
//                         setSelectedCategory={setSelectedCategory}
//                         setSelectedType={setSelectedType}
//                         setSearchTerm={setSearchTerm}
//                         setCartItems={setCartItems}
//                         cartItems={cartItems}
//                     />
//                   } />
//                 </Routes>
//               </AppContent>
//             } />
//           </Routes>
//         </Router>
//       </AuthProvider>
//   );
// };
//
// export default App;





// import React, {useEffect, useState} from 'react';
// import {BrowserRouter as Router, Route, Routes, useLocation} from 'react-router-dom';
// import Header from './components/Header/Header';
// import MobileFooter from './components/MobileFooter/MobileFooter';
// import Footer from './components/Footer/Footer'; // Импортируем новый футер
// import LoginRegister from './components/LoginRegister/LoginRegister';
// import Home from "./components/Home/Home";
// import LoadingSpinner from "./LoadingSpinner";
// import { ToastContainer } from 'react-toastify';
// import { AuthProvider } from './contexts/AuthContext';
// import './App.css';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min';
// import 'react-toastify/dist/ReactToastify.css';
// import CatalogPage from "./components/CatalogPage/CatalogPage";
//
// const AppContent = ({ children, showHeader, ...props }) => {
//   const location = useLocation();
//   // eslint-disable-next-line
//   const [showContactInfo, setShowContactInfo] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//
//   const isLoginRoute = location.pathname === '/login';
//
//   useEffect(() => {
//     if (!isLoginRoute) {
//       setShowContactInfo(true);
//     }
//   }, [isLoginRoute]);
//
//   // Определяем мобильное устройство
//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth <= 768);
//     };
//
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);
//
//   // Скрываем мобильный футер на странице логина
//   const showMobileFooter = isMobile && !isLoginRoute;
//
//   // Показываем основной футер на всех страницах кроме логина
//   const showMainFooter = !isLoginRoute;
//
//   return (
//       <div className="app">
//         {props.isLoading && <LoadingSpinner />}
//         {!props.isLoading && (
//             <>
//               {showHeader && (
//                   <Header
//                       onSearch={props.handleSearch}
//                       cartItems={props.cartItems}
//                       setShowSidebar={props.setShowSidebar}
//                       showSidebar={props.showSidebar}
//                       resetFilter={props.resetFilter}
//                       setSelectedOption={props.setSelectedOption}
//                       setCurrentPage={props.setCurrentPage}
//                       setIsFooterCatalog={props.setIsFooterCatalog}
//                       setSearchTerm={props.setSearchTerm}
//                       searchTerm={props.searchTerm}
//                   />
//               )}
//               <div className={showMobileFooter ? 'content-with-mobile-footer' : 'content'}>
//                 {children}
//               </div>
//
//               {/* Основной футер */}
//               {showMainFooter && <Footer />}
//
//               {/* Мобильный футер (если нужен) */}
//               {showMobileFooter && <MobileFooter />}
//             </>
//         )}
//       </div>
//   );
// };
//
// const App = () => {
//   // eslint-disable-next-line
//   const [searchKeyword, setSearchKeyword] = useState('');
//   const [cartItems, setCartItems] = useState([]);
//   // eslint-disable-next-line
//   const [products, setProducts] = useState([]);
//   const [showSidebar, setShowSidebar] = useState(false);
//   const [showHeader, setShowHeader] = useState(true);
//   // eslint-disable-next-line
//   const [selectedOption, setSelectedOption] = useState(null);
//   // eslint-disable-next-line
//   const [currentPage, setCurrentPage] = useState(1);
//   // eslint-disable-next-line
//   const [orders, setOrders] = useState([]);
//   const [selectedGender, setSelectedGender] = useState(null);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [selectedType, setSelectedType] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [activeComponent, setActiveComponent] = useState(null);
//   const [isFooterCatalog, setIsFooterCatalog] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   // eslint-disable-next-line
//   const [showContactInfo, setShowContactInfo] = useState(true);
//   // eslint-disable-next-line
//   const [showFooter, setShowFooter] = useState(true);
//
//   useEffect(() => {
//     const token = sessionStorage.getItem('token');
//     if (token) {
//       setToken(token);
//     }
//   }, []);
//
//   const setToken = (token) => {
//     sessionStorage.setItem('token', token);
//   };
//
//   useEffect(() => {
//     const fetchOrders = async () => {
//       const token = sessionStorage.getItem('token');
//       const role = sessionStorage.getItem('role');
//
//       if (!token || (role !== 'customer' && role !== 'admin')) {
//         setIsLoading(false);
//         return;
//       }
//
//       try {
//         const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//
//         const data = await response.json();
//         setOrders(data);
//       } catch (error) {
//         console.error('Fetch error:', error);
//         setOrders([]);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//
//     fetchOrders();
//   }, []);
//
//   const handleSearch = (keyword) => {
//     setSearchKeyword(keyword);
//   };
//
//   const resetFilter = () => {
//     setSearchKeyword('');
//     setProducts([]);
//   };
//
//   useEffect(() => {
//     sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
//   }, [cartItems]);
//
//   return (
//       <AuthProvider>
//         <Router>
//           <ToastContainer style={{zIndex:"999999"}} />
//           <Routes>
//             <Route path="/login" element={
//               <LoginRegister
//                   showHeader={showHeader}
//                   setShowHeader={setShowHeader}
//                   setShowSidebar={setShowSidebar}
//               />
//             } />
//             <Route path="*" element={
//               <AppContent
//                   isLoading={isLoading}
//                   showHeader={showHeader}
//                   cartItems={cartItems}
//                   showSidebar={showSidebar}
//                   setShowSidebar={setShowSidebar}
//                   selectedOption={selectedOption}
//                   selectedGender={selectedGender}
//                   selectedCategory={selectedCategory}
//                   selectedType={selectedType}
//                   setSelectedGender={setSelectedGender}
//                   setSelectedCategory={setSelectedCategory}
//                   setSelectedType={setSelectedType}
//                   searchTerm={searchTerm}
//                   setSearchTerm={setSearchTerm}
//                   handleSearch={handleSearch}
//                   resetFilter={resetFilter}
//                   setCurrentPage={setCurrentPage}
//                   activeComponent={activeComponent}
//                   setActiveComponent={setActiveComponent}
//                   isFooterCatalog={isFooterCatalog}
//                   setIsFooterCatalog={setIsFooterCatalog}
//                   setProducts={setProducts}
//                   showContactInfo={showContactInfo}
//                   showFooter={showFooter}
//               >
//                 <Routes>
//                   <Route path="/" exact element={
//                     <Home
//                         setIsFooterCatalog={setIsFooterCatalog}
//                         setShowSidebar={setShowSidebar}
//                         setSelectedGender={setSelectedGender}
//                         setSelectedCategory={setSelectedCategory}
//                         setSelectedType={setSelectedType}
//                         setSearchTerm={setSearchTerm}
//                         setCartItems={setCartItems}
//                         cartItems={cartItems}
//                     />
//                   } />
//                 </Routes>
//                 {/* Добавляем маршрут каталога */}
//                 <Route path="/catalog" element={<CatalogPage />} />
//
//               </AppContent>
//             } />
//           </Routes>
//         </Router>
//       </AuthProvider>
//   );
// };
//
// export default App;



import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Route, Routes, useLocation} from 'react-router-dom';
import Header from './components/Header/Header';
import MobileFooter from './components/MobileFooter/MobileFooter';
import Footer from './components/Footer/Footer';
import LoginRegister from './components/LoginRegister/LoginRegister';
import Home from "./components/Home/Home";
import LoadingSpinner from "./LoadingSpinner";
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'react-toastify/dist/ReactToastify.css';
import CatalogPage from "./components/CatalogPage/CatalogPage";

const AppContent = ({ children, showHeader, ...props }) => {
  const location = useLocation();
  // eslint-disable-next-line
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const isLoginRoute = location.pathname === '/login';

  useEffect(() => {
    if (!isLoginRoute) {
      setShowContactInfo(true);
    }
  }, [isLoginRoute]);

  // Определяем мобильное устройство
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Скрываем мобильный футер на странице логина
  const showMobileFooter = isMobile && !isLoginRoute;

  // Показываем основной футер на всех страницах кроме логина
  const showMainFooter = !isLoginRoute;

  return (
      <div className="app">
        {props.isLoading && <LoadingSpinner />}
        {!props.isLoading && (
            <>
              {showHeader && (
                  <Header
                      onSearch={props.handleSearch}
                      cartItems={props.cartItems}
                      setShowSidebar={props.setShowSidebar}
                      showSidebar={props.showSidebar}
                      resetFilter={props.resetFilter}
                      setSelectedOption={props.setSelectedOption}
                      setCurrentPage={props.setCurrentPage}
                      setIsFooterCatalog={props.setIsFooterCatalog}
                      setSearchTerm={props.setSearchTerm}
                      searchTerm={props.searchTerm}
                  />
              )}
              <div className={showMobileFooter ? 'content-with-mobile-footer' : 'content'}>
                {children}
              </div>

              {/* Основной футер */}
              {showMainFooter && <Footer />}

              {/* Мобильный футер (если нужен) */}
              {showMobileFooter && <MobileFooter />}
            </>
        )}
      </div>
  );
};

const App = () => {
  // eslint-disable-next-line
  const [searchKeyword, setSearchKeyword] = useState('');
  const [cartItems, setCartItems] = useState([]);
  // eslint-disable-next-line
  const [products, setProducts] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  // eslint-disable-next-line
  const [selectedOption, setSelectedOption] = useState(null);
  // eslint-disable-next-line
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line
  const [orders, setOrders] = useState([]);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState(null);
  const [isFooterCatalog, setIsFooterCatalog] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line
  const [showContactInfo, setShowContactInfo] = useState(true);
  // eslint-disable-next-line
  const [showFooter, setShowFooter] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      setToken(token);
    }
  }, []);

  const setToken = (token) => {
    sessionStorage.setItem('token', token);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      const token = sessionStorage.getItem('token');
      const role = sessionStorage.getItem('role');

      if (!token || (role !== 'customer' && role !== 'admin')) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Fetch error:', error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
  };

  const resetFilter = () => {
    setSearchKeyword('');
    setProducts([]);
  };

  useEffect(() => {
    sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  return (
      <AuthProvider>
        <Router>
          <ToastContainer style={{zIndex:"999999"}} />
          <Routes>
            {/* Отдельный маршрут для логина без общей структуры */}
            <Route path="/login" element={
              <LoginRegister
                  showHeader={showHeader}
                  setShowHeader={setShowHeader}
                  setShowSidebar={setShowSidebar}
              />
            } />

            {/* Все остальные маршруты с общей структурой (Header, Footer и т.д.) */}
            <Route path="*" element={
              <AppContent
                  isLoading={isLoading}
                  showHeader={showHeader}
                  cartItems={cartItems}
                  showSidebar={showSidebar}
                  setShowSidebar={setShowSidebar}
                  selectedOption={selectedOption}
                  selectedGender={selectedGender}
                  selectedCategory={selectedCategory}
                  selectedType={selectedType}
                  setSelectedGender={setSelectedGender}
                  setSelectedCategory={setSelectedCategory}
                  setSelectedType={setSelectedType}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  handleSearch={handleSearch}
                  resetFilter={resetFilter}
                  setCurrentPage={setCurrentPage}
                  activeComponent={activeComponent}
                  setActiveComponent={setActiveComponent}
                  isFooterCatalog={isFooterCatalog}
                  setIsFooterCatalog={setIsFooterCatalog}
                  setProducts={setProducts}
                  showContactInfo={showContactInfo}
                  showFooter={showFooter}
              >
                {/* Вложенные маршруты внутри AppContent */}
                <Routes>
                  <Route path="/" exact element={
                    <Home
                        setIsFooterCatalog={setIsFooterCatalog}
                        setShowSidebar={setShowSidebar}
                        setSelectedGender={setSelectedGender}
                        setSelectedCategory={setSelectedCategory}
                        setSelectedType={setSelectedType}
                        setSearchTerm={setSearchTerm}
                        setCartItems={setCartItems}
                        cartItems={cartItems}
                    />
                  } />
                  <Route path="/catalog" element={<CatalogPage />} />

                  {/* Добавьте сюда другие маршруты по мере необходимости */}
                  <Route path="/about" element={<div>Страница о нас</div>} />
                  <Route path="/payment" element={<div>Страница оплаты</div>} />

                  {/* Fallback для несуществующих маршрутов */}
                  <Route path="*" element={
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <h2>Страница не найдена</h2>
                      <p>Запрошенная страница не существует.</p>
                    </div>
                  } />
                </Routes>
              </AppContent>
            } />
          </Routes>
        </Router>
      </AuthProvider>
  );
};

export default App;
