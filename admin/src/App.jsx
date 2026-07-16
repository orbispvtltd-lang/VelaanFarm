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
        })).reverse();
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

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus.includes('Pending') ? 'விநியோகிக்கப்பட்டது (Delivered)' : 'விநியோகத்தில் (Pending)';
    try {
      const orderRef = ref(database, `orders/${id}`);
      await update(orderRef, { status: nextStatus });
    } catch (err) {
      console.error('Update order status error:', err);
      alert('நிலை மாற்றத்தில் பிழை ஏற்பட்டது.');
    }
  };

  const deleteOrder = async (id) => {
    if (window.confirm('இந்த ஆர்டரை நீக்கலாமா?')) {
      try {
        const orderRef = ref(database, `orders/${id}`);
        await remove(orderRef);
      } catch (err) {
        console.error('Delete order error:', err);
        alert('ஆர்டரை நீக்குவதில் பிழை ஏற்பட்டது.');
      }
    }
  };

  const totalSales = orders.reduce((sum, o) => sum + (o.status.includes('Delivered') ? o.total : 0), 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
        <span style={{ marginLeft: '10px' }}>தரவு ஏற்றப்படுகிறது (Loading)...</span>
      </div>
    );
  }

  return (
    <section style={{ paddingTop: '140px', minHeight: '85vh' }}>
      <div style={{ maxWidth: '1700px', margin: '0 auto', padding: '0 4%' }}>
        <span className="section-subtitle">நிர்வாகம்</span>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-dark)', marginBottom: '30px' }}>கண்காணிப்புத் தளம் (Admin Dashboard)</h2>

        {/* Tab Selectors */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '10px' }}>
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
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="benefit-card" style={{ padding: '20px' }}>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>மொத்த ஆர்டர்கள் (Total Orders)</p>
                <h3 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '5px' }}>{orders.length}</h3>
              </div>
              <div className="benefit-card" style={{ padding: '20px' }}>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>விநியோகிக்கப்பட்டவை (Delivered)</p>
                <h3 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '5px' }}>{orders.filter(o => o.status.includes('Delivered')).length}</h3>
              </div>
              <div className="benefit-card" style={{ padding: '20px' }}>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>விநியோகம் செய்ய வேண்டியவை (Pending)</p>
                <h3 style={{ fontSize: '2rem', color: '#856404', marginTop: '5px' }}>{orders.filter(o => o.status.includes('Pending')).length}</h3>
              </div>
              <div className="benefit-card" style={{ padding: '20px' }}>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>மொத்த விற்பனை (Delivered Revenue)</p>
                <h3 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '5px' }}>₹{totalSales}</h3>
              </div>
            </div>

            {/* Orders Table */}
            <div className="admin-card" style={{ overflowX: 'auto' }}>
              <h3>வாடிக்கையாளர் ஆர்டர் பட்டியல் (Orders List)</h3>
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
                        <td>
                          <strong>{o.customer}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{o.phone}</div>
                        </td>
                        <td style={{ fontSize: '0.9rem' }}>{o.products}</td>
                        <td style={{ fontSize: '0.85rem', maxWidth: '200px' }}>{o.address}</td>
                        <td style={{ fontWeight: '600' }}>₹{o.total}</td>
                        <td style={{ fontSize: '0.85rem' }}>{o.date}</td>
                        <td>
                          <span className={`status-badge ${o.status.includes('Delivered') ? 'delivered' : 'pending'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => toggleStatus(o.id, o.status)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
                            >
                              மாற்று (Toggle)
                            </button>
                            <button
                              onClick={() => deleteOrder(o.id)}
                              className="remove-btn"
                              style={{ padding: '4px' }}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
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
        if (email === 'orbis.hitech@gmail.com' && pass === 'orbis03') {
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
                user: { id: 1, name: 'orbis', email: 'orbis.hitech@gmail.com', role: 'admin' }, 
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
    <section style={{ paddingTop: '140px', minHeight: '80vh' }}>
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

  return (
    <AuthContext.Provider value={authContextValue}>
      <BrowserRouter basename="/admin">
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

          {/* Header/Navbar */}
          <nav className="navbar">
            <div className="nav-container">
              <Link to="/" className="nav-logo">
                <img src={LOGO_URL} alt="Velaan Farm Logo" className="nav-logo-img" />
                <span className="nav-brand-text">வேளாண் பண்ணை <span style={{ fontSize: '0.9rem', color: 'var(--accent-color)' }}>[நிர்வாகம்]</span></span>
              </Link>

              <ul className="nav-links active">
                {auth.user && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                      👤 {auth.user.name} ({auth.user.role})
                    </span>
                    <button
                      onClick={() => { authDispatch({ type: 'LOGOUT' }); }}
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
