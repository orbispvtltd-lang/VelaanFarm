import React, { useState, useEffect, useContext, createContext, useReducer, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from './firebase';

// ---------- IMAGE PATHS WITH BASE URL ----------
const LOGO_URL = `${import.meta.env.BASE_URL || '/admin/'}image2.jpeg`;

// ---------- CONTEXTS ----------
const AuthContext = createContext();

// ---------- REDUCERS ----------
const initialAuth = { 
  user: JSON.parse(localStorage.getItem('velaan_user')) || null,
  token: localStorage.getItem('velaan_token') || null
};
const authReducer = (state, action) => {
  if (action.type === 'LOGIN') {
    localStorage.setItem('velaan_user', JSON.stringify(action.payload.user));
    localStorage.setItem('velaan_token', action.payload.token);
    return { user: action.payload.user, token: action.payload.token };
  }
  if (action.type === 'LOGOUT') {
    localStorage.removeItem('velaan_user');
    localStorage.removeItem('velaan_token');
    return { user: null, token: null };
  }
  return state;
};

// ---------- PROTECTED ROUTE WRAPPER ----------
const Protected = ({ children }) => {
  const { state: auth } = useContext(AuthContext);
  if (!auth.user || auth.user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// ---------- COMPONENTS ----------

// 1. ADMIN DASHBOARD
const Admin = () => {
  const { state: auth } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'inquiries'

  useEffect(() => {
    // Listen to Orders
    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersList = Object.entries(data).map(([id, val]) => ({
          id,
          ...val
        })).filter(o => !o.adminDeleted).reverse();
        setOrders(ordersList);
      } else {
        setOrders([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setLoading(false);
    });

    // Listen to Inquiries
    const contactRef = ref(database, 'contact');
    const unsubscribeContact = onValue(contactRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const inquiriesList = Object.entries(data).map(([id, val]) => ({
          id,
          ...val
        })).reverse();
        setInquiries(inquiriesList);
      } else {
        setInquiries([]);
      }
    }, (error) => {
      console.error('Error fetching inquiries:', error);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeContact();
    };
  }, []);

  const ORDER_STATUSES = [
    { value: 'விநியோகத்தில் (Pending)',          label: 'ஆர்டர் பெறப்பட்டது',  color: '#856404', bg: '#fff3cd' },
    { value: 'உறுதிப்படுத்தப்பட்டது (Confirmed)', label: 'உறுதிப்படுத்தப்பட்டது', color: '#0d6efd', bg: '#cfe2ff' },
    { value: 'அனுப்பப்பட்டது (Dispatched)',       label: 'அனுப்பப்பட்டது',       color: '#6f42c1', bg: '#e8d5ff' },
    { value: 'விநியோகிக்கப்பட்டது (Delivered)',    label: 'வழங்கப்பட்டது',        color: '#198754', bg: '#d1e7dd' },
  ];

  const updateStatus = async (id, newStatus) => {
    try {
      const orderRef = ref(database, `orders/${id}`);
      await update(orderRef, { status: newStatus });
    } catch (err) {
      console.error('Update order status error:', err);
      alert('நிலை மாற்றத்தில் பிழை ஏற்பட்டது.');
    }
  };

  const deleteOrder = async (id, status) => {
    if (!status?.includes('வழங்கப்பட்டது') && !status?.includes('Delivered')) {
      alert('வழங்கப்பட்ட (Delivered) ஆர்டர்களை மட்டுமே நீக்க முடியும்.');
      return;
    }
    if (window.confirm('இந்த ஆர்டரை நிச்சயமாக நீக்க வேண்டுமா? (Are you sure you want to delete this order?)')) {
      try {
        const orderRef = ref(database, `orders/${id}`);
        await update(orderRef, { adminDeleted: true });
      } catch (err) {
        console.error('Delete order error:', err);
        alert('நீக்குவதில் பிழை ஏற்பட்டது.');
      }
    }
  };

  const totalSales = orders.reduce((sum, o) => sum + (o.status.includes('Delivered') ? o.total : 0), 0);
  const countByStatus = (kw) => orders.filter(o => o.status.includes(kw)).length;

  const downloadOrdersCSV = () => {
    if (orders.length === 0) {
      alert("தரவிறக்கம் செய்ய ஆர்டர்கள் எதுவும் இல்லை (No orders to download).");
      return;
    }

    const headers = [
      "Order ID", "Date", "Customer Name", "Phone", "Email", 
      "Address", "City", "District", "Pincode", "Payment Method", 
      "Total Amount (Rs)", "Status", "Items"
    ];

    const csvRows = [headers.join(',')];

    orders.forEach(o => {
      const itemsStr = o.items ? o.items.map(i => `${i.name} (${i.variant}) x${i.qty}`).join('; ') : '';
      const dateStr = new Date(o.createdAt).toLocaleString('en-IN');
      const row = [
        o.id,
        `"${dateStr}"`,
        `"${(o.name || '').replace(/"/g, '""')}"`,
        `"${o.phone || ''}"`,
        `"${(o.email || '').replace(/"/g, '""')}"`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        `"${(o.city || '').replace(/"/g, '""')}"`,
        `"${(o.district || '').replace(/"/g, '""')}"`,
        `"${o.pincode || ''}"`,
        `"${o.paymentMethod === 'cod' ? 'COD' : 'Online'}"`,
        o.total || 0,
        `"${o.status || ''}"`,
        `"${itemsStr}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VelaanFarm_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
        <span style={{ marginLeft: '10px' }}>தரவு ஏற்றப்படுகிறது (Loading)...</span>
      </div>
    );
  }

  return (
    <section style={{ paddingTop: 'clamp(90px, 12vw, 140px)', minHeight: '85vh' }}>
      <div style={{ maxWidth: '1700px', margin: '0 auto', padding: '0 4%' }}>
        <span className="section-subtitle">நிர்வாகம்</span>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', color: 'var(--primary-dark)', marginBottom: '30px' }}>கண்காணிப்புத் தளம் (Admin Dashboard)</h2>

        {/* Tab Selectors */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '10px' }}>
          <button 
            onClick={() => setActiveTab('orders')} 
            className="btn"
            style={{ 
              background: activeTab === 'orders' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'orders' ? 'white' : 'var(--primary-color)',
              border: activeTab === 'orders' ? 'none' : '1px solid var(--primary-color)',
              padding: '10px 20px',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-shopping-cart"></i> ஆர்டர்கள் ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('inquiries')} 
            className="btn"
            style={{ 
              background: activeTab === 'inquiries' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'inquiries' ? 'white' : 'var(--primary-color)',
              border: activeTab === 'inquiries' ? 'none' : '1px solid var(--primary-color)',
              padding: '10px 20px',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-envelope"></i> விசாரணை படிவங்கள் ({inquiries.length})
          </button>
        </div>

        {activeTab === 'orders' ? (
          <>
            {/* Summary Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="benefit-card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '5px' }}>₹{totalSales.toLocaleString()}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: '600' }}>மொத்த விற்பனை (Delivered)</div>
              </div>
              <div className="benefit-card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', color: '#e67e22', marginBottom: '5px' }}>{countByStatus('விநியோகத்தில்')}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: '600' }}>நிலுவையில் உள்ளவை (Pending)</div>
              </div>
              <div className="benefit-card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', color: '#27ae60', marginBottom: '5px' }}>{countByStatus('வழங்கப்பட்டது')}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: '600' }}>வழங்கப்பட்டவை (Delivered)</div>
              </div>
              <div className="benefit-card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', color: '#e74c3c', marginBottom: '5px' }}>{countByStatus('ரத்து')}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: '600' }}>ரத்து செய்யப்பட்டவை (Cancelled)</div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3>வாடிக்கையாளர் ஆர்டர்களின் பட்டியல் (Order List)</h3>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>மொத்தம் {orders.length} ஆர்டர்கள்</span>
              </div>
              {orders.length === 0 ? (
                <p style={{ textAlign: 'center', margin: '30px 0', color: 'var(--text-light)' }}>ஆர்டர்கள் எதுவும் இன்னும் சமர்ப்பிக்கப்படவில்லை.</p>
              ) : (
                <table className="order-table">
                  <thead>
                    <tr>
                      <th>வாடிக்கையாளர்</th>
                      <th>தயாரிப்புகள்</th>
                      <th>முகவரி</th>
                      <th>மொத்தம்</th>
                      <th>தேதி</th>
                      <th>நிலை (Status)</th>
                      <th>செயல் (Actions)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td data-label="வாடிக்கையாளர்">
                          <strong>{o.customer}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{o.phone}</div>
                        </td>
                        <td data-label="தயாரிப்புகள்" style={{ fontSize: '0.9rem' }}>{o.products}</td>
                        <td data-label="முகவரி" style={{ fontSize: '0.85rem', maxWidth: '200px' }}>{o.address}</td>
                        <td data-label="மொத்தம்" style={{ fontWeight: '600' }}>₹{o.total}</td>
                        <td data-label="தேதி" style={{ fontSize: '0.85rem' }}>{o.date}</td>
                        <td data-label="நிலை">
                          {(() => {
                            const st = ORDER_STATUSES.find(s => o.status.includes(s.value.split(' ')[0])) || ORDER_STATUSES[0];
                            return (
                              <span style={{
                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem',
                                fontWeight: '700', background: st.bg, color: st.color
                              }}>
                                {st.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td data-label="செயல்">
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                            <select
                              value={o.status}
                              onChange={e => updateStatus(o.id, e.target.value)}
                              style={{
                                padding: '6px 10px', borderRadius: '8px', fontSize: '0.82rem',
                                border: '1px solid rgba(30,94,58,0.25)', cursor: 'pointer',
                                background: 'white', color: 'var(--primary-dark)', fontWeight: '600',
                                outline: 'none', flexShrink: 0
                              }}
                            >
                              {ORDER_STATUSES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                            {(o.status?.includes('வழங்கப்பட்டது') || o.status?.includes('Delivered')) && (
                              <button
                                onClick={() => deleteOrder(o.id, o.status)}
                                className="remove-btn"
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.82rem',
                                  flexShrink: 0
                                }}
                                title="Delete Order"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          /* Inquiries Section */
          <div className="admin-card">
            <h3>விசாரணைப் படிவங்களின் பட்டியல் (Customer Inquiries)</h3>
            {inquiries.length === 0 ? (
              <p style={{ textAlign: 'center', margin: '30px 0', color: 'var(--text-light)' }}>விசாரணைகள் எதுவும் இன்னும் சமர்ப்பிக்கப்படவில்லை.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {inquiries.map(inq => (
                  <div key={inq.id} className="benefit-card" style={{ padding: '20px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--primary-dark)' }}>{inq.name}</strong>
                        <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: 'var(--text-light)' }}><i className="fas fa-phone"></i> {inq.phone}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{inq.date}</span>
                    </div>
                    <p style={{ color: '#444', lineHeight: '1.5' }}>{inq.message || 'செய்தி எதுவும் இல்லை.'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

// 2. AUTHENTICATION (LOGIN)
const Login = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showSplash, setShowSplash] = useState(false);
  const [progress, setProgress] = useState(0);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email && pass) {
      try {
        if (email === 'admin@gmail.com' && pass === 'admin@123') {
          setShowSplash(true);

          let currentProgress = 0;
          const interval = setInterval(() => {
            currentProgress += 20;
            setProgress(currentProgress);
            if (currentProgress >= 100) {
              clearInterval(interval);
            }
          }, 1000);

          setTimeout(() => {
            dispatch({ 
              type: 'LOGIN', 
              payload: { 
                user: { id: 1, name: 'Admin', email: 'admin@gmail.com', role: 'admin' }, 
                token: 'firebase-bypassed-token' 
              } 
            });
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
          }, 5000);
        } else {
          alert('மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது! (Invalid email or password)');
        }
      } catch (err) {
        console.error('Login error:', err);
        alert('உள்நுழைவதில் பிழை ஏற்பட்டது.');
      }
    } else {
      alert('மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.');
    }
  };

  return (
    <section style={{ paddingTop: 'clamp(90px, 12vw, 140px)', minHeight: '80vh' }}>
      {showSplash && (
        <div className="water-loader-container">
          <div className="water-logo-wrapper">
            <img src={LOGO_URL} alt="Velaan Farm Logo" className="water-logo-img" />
            <div className="water-fill" style={{ height: `${progress}%` }}>
              <img src={LOGO_URL} alt="Velaan Farm Logo" className="water-fill-logo-img" />
            </div>
          </div>
        </div>
      )}

      <div className="form-card">
        <h2 className="form-title">நிர்வாக உள்நுழைவு (Admin Login)</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>மின்னஞ்சல் (Email)</label>
            <input type="email" placeholder="admin@velaanfarm.in" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>கடவுச்சொல் (Password)</label>
            <input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-100" style={{ padding: '12px', marginTop: '10px' }}>
            உள்நுழைக (Login)
          </button>
        </form>
      </div>
    </section>
  );
};

// ---------- MAIN APP COMPONENT ----------
const App = () => {
  const [auth, authDispatch] = useReducer(authReducer, initialAuth);
  const authContextValue = useMemo(() => ({ state: auth, dispatch: authDispatch }), [auth]);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleMenuToggle = () => setMenuOpen(prev => !prev);

  return (
    <AuthContext.Provider value={authContextValue}>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

          {/* Header/Navbar */}
          <nav className="navbar">
            <div className="nav-container">
              <Link to="/" className="nav-logo">
                <img src={LOGO_URL} alt="Velaan Farm Logo" className="nav-logo-img" />
                <span className="nav-brand-text">வேளாண் பண்ணை <span style={{ fontSize: '0.9rem', color: 'var(--accent-color)' }}>[நிர்வாகம்]</span></span>
              </Link>

              {/* Hamburger toggle — only visible on mobile via CSS */}
              {auth.user && (
                <button
                  id="mobile-menu"
                  className={`menu-toggle${menuOpen ? ' is-active' : ''}`}
                  onClick={handleMenuToggle}
                  aria-label="Toggle menu"
                  style={{ background: 'none', border: 'none' }}
                >
                  <span className="bar"></span>
                  <span className="bar"></span>
                  <span className="bar"></span>
                </button>
              )}

              <ul className={`nav-links${menuOpen ? ' active' : ''}`}>
                {auth.user && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                      👤 {auth.user.name} ({auth.user.role})
                    </span>
                    <button
                      onClick={() => { authDispatch({ type: 'LOGOUT' }); setMenuOpen(false); }}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Logout
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </nav>

          {/* Routes Content */}
          <main style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Protected><Admin /></Protected>} />
              <Route path="/login" element={<Login />} />
              {/* Fallback to Admin Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer>
            <div className="footer-container">
              <div className="footer-brand">
                <img src={LOGO_URL} alt="Velaan Farm Logo" className="footer-logo" />
                <h3>வேளாண் பண்ணை - கட்டுப்பாட்டுத் தளம்</h3>
                <p>ஆர்டர்கள் மற்றும் விசாரணைகளை நிர்வகிப்பதற்கான பிரத்யேக தளம்.</p>
              </div>
              <div className="footer-copyright">
                <p>© 2026 Velaan Farm. All Rights Reserved. Admin Portal powered by Orbis Freelancing.</p>
              </div>
            </div>
          </footer>

        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default App;
export { AuthContext };
