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
import ProductDetails from "./components/ProductDetails/ProductDetails"
import FavoritesPage from "./components/FavoritesPage/FavoritesPage";
import { CartProvider } from "./contexts/CartContext";
import CartPage from "./components/CartPage/CartPage";
import CheckoutPage from "./components/CheckoutPage/CheckoutPage";
import OrderSuccess from "./components/OrderSuccess/OrderSuccess";
import AdminPanel from './components/AdminPanel/AdminPanel';
import AboutUs from './components/AboutUs/AboutUs';
import { jwtDecode } from "jwt-decode";


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

  // В App.js замените useEffect с fetchOrders на этот:

  useEffect(() => {
    const fetchOrders = async () => {
      const token = sessionStorage.getItem('token');
      const role = sessionStorage.getItem('role');

      // Проверяем, что пользователь авторизован и имеет нужную роль
      if (!token || (role !== 'customer' && role !== 'admin')) {
        setIsLoading(false);
        return;
      }

      try {
        const headers = {
          'Authorization': `Bearer ${token}`
        };
        const decoded = jwtDecode(token);

        // Если это админ, не пытаемся получить профиль из базы
        if (decoded.role === 'admin') {
          const adminUser = {
            _id: 'admin',
            email: decoded.email || 'admin@example.com',
            name: 'Администратор',
            role: 'admin'
          };

          return adminUser;
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/my-orders`, {
          headers: headers
        });

        if (!response.ok) {
          if (response.status === 403) {
            console.log('Доступ запрещен - пользователь не авторизован');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setOrders(data.orders || []);
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
        <CartProvider>
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
                  {/* Добавляем маршрут для страницы товара */}
                  <Route path="/product/:id" element={<ProductDetails />} />
                  {/*// eslint-disable-next-line*/}
                  <Route path="/favorites" element={<FavoritesPage />} />

                  {/*// Добавить маршруты в секцию Routes*/}
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  {/* Добавьте сюда другие маршруты по мере необходимости */}
                  <Route path="/about" element={<AboutUs />} />                  <Route path="/payment" element={<div>Страница оплаты</div>} />

                  <Route path="/admin" element={<AdminPanel />} />


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
        </CartProvider>
      </AuthProvider>
  );
};

export default App;
