import React, { useState, useEffect, useContext, createContext, useReducer, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { ref, push, get, child, set } from 'firebase/database';
import { database } from './firebase';

// ---------- IMAGE PATHS WITH BASE URL ----------
const LOGO_URL = `${import.meta.env.BASE_URL || '/shop/'}image2.jpeg`;
const FOUNDER_URL = `${import.meta.env.BASE_URL || '/shop/'}image1.jpeg`;
const MILK_IMG = `${import.meta.env.BASE_URL || '/shop/'}milk.png`;
const CURD_IMG = `${import.meta.env.BASE_URL || '/shop/'}curd.png`;
const PANEER_IMG = `${import.meta.env.BASE_URL || '/shop/'}paneer.png`;
const BUTTER_IMG = `${import.meta.env.BASE_URL || '/shop/'}butter.png`;
const GHEE_IMG = `${import.meta.env.BASE_URL || '/shop/'}ghee.png`;

// ---------- CONTEXTS ----------
const CartContext = createContext();
const AuthContext = createContext();

// ---------- SAMPLE DATA ----------
const PRODUCTS = [
  // Milk
  { id: 'p1', name: 'Fresh Milk (பசுவின் பால்)', category: 'milk', variant: '1 L', price: 60, image: MILK_IMG, description: 'எந்தவித கலப்படமும் இல்லாத நேரடி பண்ணை பால். கொமரபாளையத்தில் வெள்ளிக்கிழமை தோறும் விநியோகம்.' },
  { id: 'p2', name: 'Fresh Milk (பசுவின் பால்)', category: 'milk', variant: '½ L', price: 30, image: MILK_IMG, description: 'உடலுக்கு ஆரோக்கியமான, தூய்மையான பசுவின் பால். கொமரபாளையத்தில் வெள்ளிக்கிழமை தோறும் விநியோகம்.' },
  // Curd
  { id: 'p3', name: 'Fresh Curd (தயிர்)', category: 'curd', variant: '1 L', price: 80, image: CURD_IMG, description: 'நேரடி பண்ணை பாலில் இருந்து தயாரித்த புளிப்பு கலந்த இயற்கை தயிர்.' },
  { id: 'p4', name: 'Fresh Curd (தயிர்)', category: 'curd', variant: '½ L', price: 40, image: CURD_IMG, description: 'நேரடி பண்ணை பாலில் இருந்து தயாரித்த புளிப்பு கலந்த இயற்கை தயிர்.' },
  // Paneer
  { id: 'p5', name: 'Fresh Paneer (பனீர்)', category: 'paneer', variant: '200 g', price: 90, image: PANEER_IMG, description: 'தூய பண்ணை பாலில் இருந்து தயாரித்த மென்மையான, புதிய பனீர்.' },
  // Maattu Butter
  { id: 'p6', name: 'Maattu Butter (மாட்டு வெண்ணெய்)', category: 'butter', variant: '1 kg', price: 650, image: BUTTER_IMG, description: 'பாரம்பரிய முறையில் மாட்டு பாலில் இருந்து தயாரித்த தூய வெண்ணெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  { id: 'p7', name: 'Maattu Butter (மாட்டு வெண்ணெய்)', category: 'butter', variant: '½ kg', price: 325, image: BUTTER_IMG, description: 'பாரம்பரிய முறையில் மாட்டு பாலில் இருந்து தயாரித்த தூய வெண்ணெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  { id: 'p8', name: 'Maattu Butter (மாட்டு வெண்ணெய்)', category: 'butter', variant: '¾ kg', price: 488, image: BUTTER_IMG, description: 'பாரம்பரிய முறையில் மாட்டு பாலில் இருந்து தயாரித்த தூய வெண்ணெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  // Eruma Butter
  { id: 'p9', name: 'Eruma Butter (எருமை வெண்ணெய்)', category: 'butter', variant: '1 kg', price: 750, image: BUTTER_IMG, description: 'எருமை பாலில் இருந்து தயாரித்த வளமான, கொழுப்பு நிறைந்த வெண்ணெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  { id: 'p10', name: 'Eruma Butter (எருமை வெண்ணெய்)', category: 'butter', variant: '½ kg', price: 375, image: BUTTER_IMG, description: 'எருமை பாலில் இருந்து தயாரித்த வளமான, கொழுப்பு நிறைந்த வெண்ணெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  { id: 'p11', name: 'Eruma Butter (எருமை வெண்ணெய்)', category: 'butter', variant: '¾ kg', price: 563, image: BUTTER_IMG, description: 'எருமை பாலில் இருந்து தயாரித்த வளமான, கொழுப்பு நிறைந்த வெண்ணெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  // Maattu Ghee
  { id: 'p12', name: 'Maattu Ghee (மாட்டு நெய்)', category: 'ghee', variant: '1 L', price: 900, image: GHEE_IMG, description: 'மாட்டு பாலில் இருந்து பாரம்பரிய முறையில் காய்ச்சிய மணமிக்க நெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  { id: 'p13', name: 'Maattu Ghee (மாட்டு நெய்)', category: 'ghee', variant: '½ L', price: 450, image: GHEE_IMG, description: 'மாட்டு பாலில் இருந்து பாரம்பரிய முறையில் காய்ச்சிய மணமிக்க நெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  { id: 'p14', name: 'Maattu Ghee (மாட்டு நெய்)', category: 'ghee', variant: '¾ L', price: 675, image: GHEE_IMG, description: 'மாட்டு பாலில் இருந்து பாரம்பரிய முறையில் காய்ச்சிய மணமிக்க நெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  // Eruma Ghee
  { id: 'p15', name: 'Eruma Ghee (எருமை நெய்)', category: 'ghee', variant: '1 L', price: 1000, image: GHEE_IMG, description: 'எருமை பாலில் இருந்து பாரம்பரிய முறையில் காய்ச்சிய செழுமையான நெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  { id: 'p16', name: 'Eruma Ghee (எருமை நெய்)', category: 'ghee', variant: '½ L', price: 500, image: GHEE_IMG, description: 'எருமை பாலில் இருந்து பாரம்பரிய முறையில் காய்ச்சிய செழுமையான நெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
  { id: 'p17', name: 'Eruma Ghee (எருமை நெய்)', category: 'ghee', variant: '¾ L', price: 750, image: GHEE_IMG, description: 'எருமை பாலில் இருந்து பாரம்பரிய முறையில் காய்ச்சிய செழுமையான நெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
];

// ---------- REDUCERS ----------
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(item => item.id === action.payload.id);
      if (existing) {
        return state.map(item => item.id === action.payload.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...state, { ...action.payload, qty: 1 }];
    }
    case 'REMOVE':
      return state.filter(item => item.id !== action.payload);
    case 'UPDATE_QTY': {
      return state.map(item => item.id === action.payload.id ? { ...item, qty: Math.max(1, action.payload.qty) } : item);
    }
    case 'CLEAR':
      return [];
    default:
      return state;
  }
};

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
  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// ---------- PAGES ----------

// 1. HOME PAGE
const Home = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [submitState, setSubmitState] = useState({ loading: false, success: false, error: false });
  const [activeCard, setActiveCard] = useState(null);

  const handleLogoMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    if (x < width / 2) {
      setActiveCard('c1');
    } else {
      setActiveCard('c2');
    }
  };

  const handleLogoMouseLeave = () => {
    setActiveCard(null);
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert('பெயர் மற்றும் தொலைபேசி எண்ணை உள்ளிடவும்.');
      return;
    }
    setSubmitState({ loading: true, success: false, error: false });

    try {
      const dateStr = new Date().toLocaleDateString('ta-IN');
      const contactRef = ref(database, 'contact');
      await push(contactRef, {
        name: form.name,
        phone: form.phone,
        message: form.message,
        date: dateStr
      });

      setSubmitState({ loading: false, success: true, error: false });
      setForm({ name: '', phone: '', message: '' });
      setTimeout(() => {
        setSubmitState(prev => ({ ...prev, success: false }));
      }, 5000);
    } catch (err) {
      console.error('Contact submit error:', err);
      alert('தொடர்பு கொள்வதில் பிழை ஏற்பட்டது.');
      setSubmitState({ loading: false, success: false, error: true });
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="badge">
              <i className="fas fa-check-circle"></i> 100% தூய்மையான பால் & நெய்
            </span>
            <h1>வேளாண் <span className="highlight">பண்ணை</span></h1>
            <p className="hero-desc">
              Since 1977 - பாரம்பரியம் மாறா தரம். நேரடி பண்ணை பசுவின் பால் மற்றும் பாரம்பரிய முறையில் காய்ச்சிய மணமிக்க நெய். கொமரபாளையத்தில் பால் விநியோகம், தமிழகம் முழுவதும் கொரியர் வசதி.
            </p>
            <div className="hero-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => navigate('/products')} className="btn btn-primary">
                <i className="fas fa-shopping-basket"></i> ஆர்டர் செய்க
              </button>
              <a href="https://wa.me/message/4HI3RHBC6YMDB1" target="_blank" rel="noopener noreferrer" className="whatsapp-logo-btn btn-pulse" title="வாட்ஸ்அப் மூலம் ஆர்டர் செய்ய">
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <h3>1977</h3>
                <p>துவங்கிய ஆண்டு</p>
              </div>
              <div className="stat-item">
                <h3>100%</h3>
                <p>உத்தரவாத தரம்</p>
              </div>
              <div className="stat-item">
                <h3>1000+</h3>
                <p>வாடிக்கையாளர்கள்</p>
              </div>
            </div>
          </div>

          <div className="hero-image-container">
            <div className="hero-image-wrapper" onMouseMove={handleLogoMouseMove} onMouseLeave={handleLogoMouseLeave} style={{ cursor: 'pointer' }}>
              <img src={LOGO_URL} alt="Velaan Farm Logo" className="hero-logo-img" />
            </div>
            <div className={`floating-card c1 ${activeCard === 'c1' ? 'active' : ''}`}>
              <span className="card-icon">🥛</span>
              <div>
                <h4>பசுவின் பால்</h4>
                <p>தினமும் புதியது</p>
              </div>
            </div>
            <div className={`floating-card c2 ${activeCard === 'c2' ? 'active' : ''}`}>
              <span className="card-icon">🧈</span>
              <div>
                <h4>மணமணக்கும் நெய்</h4>
                <p>பாரம்பரிய முறை</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about" id="about">
        <div className="about-container">
          <div className="about-image">
            <div className="founder-card">
              <div className="founder-frame">
                <img src={FOUNDER_URL} alt="Founder Arumugam" className="founder-img" />
              </div>
              <div className="founder-info">
                <h4>ஆறுமுகம் பால்காரர்</h4>
                <p>நிறுவனர், Since 1977</p>
              </div>
            </div>
          </div>
          <div className="about-content">
            <span className="section-subtitle">எங்களைப் பற்றி</span>
            <h2>அன்பான வாடிக்கையாளர்களுக்கு வணக்கம்!</h2>
            <p className="about-text">
              1977 ஆம் ஆண்டு முதல் கொமரபாளையத்தில் தரமான பசுவின் பால் வழங்கி வரும் பாரம்பரியம் கொண்டது எங்கள் வேளாண் பண்ணை. பசுக்கள் இயற்கை முறையில் வளர்க்கப்பட்டு, தூய்மையான முறையில் பால் மற்றும் நெய் தயாரிக்கப்படுகிறது.
            </p>
            <p className="about-text">
              எங்கள் நோக்கம் மக்களுக்கு ஆரோக்கியமான மற்றும் இயற்கையான பால் பொருட்களை நேரடியாக வழங்குவதாகும்.
            </p>
            <div className="about-highlights">
              <div className="highlight-item">
                <i className="fas fa-check-circle"></i>
                <span>இயற்கை தீவனம் (புற்கள் மற்றும் பருத்தி கொட்டை)</span>
              </div>
              <div className="highlight-item">
                <i className="fas fa-check-circle"></i>
                <span>பாரம்பரிய மணமுள்ள மணல் நெய்</span>
              </div>
              <div className="highlight-item">
                <i className="fas fa-check-circle"></i>
                <span>வாராந்திர வெள்ளிக்கிழமை விநியோகம்</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="benefits-header">
          <span className="section-subtitle">சிறப்புகள்</span>
          <h2>ஏன் வேளாண் பண்ணை?</h2>
          <p>எங்களது தனித்துவமான தயாரிப்பு மற்றும் விநியோக முறைகள்</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="b-icon">
              <i className="fas fa-seedling"></i>
            </div>
            <h3>இயற்கை முறை</h3>
            <p>பசுக்கள் இயற்கை புற்கள் மற்றும் பருத்தி கொட்டைகளை தீவனமாக கொண்டு ஆரோக்கியமாக வளர்க்கப்படுகின்றன.</p>
          </div>
          <div className="benefit-card">
            <div className="b-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3>கலப்படம் இல்லை</h3>
            <p>தண்ணீர் அல்லது இதர வேதிப்பொருட்கள் எதுவும் கலக்கப்படாத தூய பால் மற்றும் நெய் தயாரிப்புகள்.</p>
          </div>
          <div className="benefit-card">
            <div className="b-icon">
              <i className="fas fa-wind"></i>
            </div>
            <h3>பாரம்பரிய மணம்</h3>
            <p>நாட்டு முறையில் வெண்ணெய் எடுத்து மெதுவாக உருக்கி காய்ச்சப்படும் பாரம்பரிய மணமிக்க நெய்.</p>
          </div>
          <div className="benefit-card">
            <div className="b-icon">
              <i className="fas fa-truck"></i>
            </div>
            <h3>முறையான விநியோகம்</h3>
            <p>கொமரபாளையத்தில் ஒவ்வொரு வாரமும் வெள்ளிக்கிழமை உங்கள் இல்லம் தேடி வரும் பால் விநியோகம்.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>சுவையான மற்றும் ஆரோக்கியமான நெய் வேண்டுமா?</h2>
          <p>இப்போதே ஆர்டர் செய்து உங்கள் இல்லத்திலேயே பெற்றுக்கொள்ளுங்கள். தமிழகம் முழுவதும் கொரியர் அனுப்பப்படும்.</p>
          <div className="cta-buttons" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <button onClick={() => navigate('/products')} className="btn btn-primary btn-pulse">
              <i className="fas fa-shopping-cart"></i> நெய் ஆர்டர் செய்ய
            </button>
            <a href="https://wa.me/message/4HI3RHBC6YMDB1" target="_blank" rel="noopener noreferrer" className="whatsapp-logo-btn" title="வாட்ஸ்அப்பில் கேட்க">
              <i className="fab fa-whatsapp"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact" id="contact">
        <div className="contact-container">
          <div className="contact-info-panel">
            <span className="section-subtitle">தொடர்புக்கு</span>
            <h2>எங்களை தொடர்பு கொள்ளவும்</h2>
            <p>உங்களுக்கு ஏதேனும் சந்தேகங்கள் அல்லது சிறப்பு தேவைகள் இருப்பின் எங்களை எப்போது வேண்டுமானாலும் தொடர்பு கொள்ளலாம்.</p>
            <div className="contact-details">
              <div className="contact-item">
                <div className="c-icon">
                  <i className="fas fa-phone"></i>
                </div>
                <div>
                  <h4>தொலைபேசி</h4>
                  <p><a href="tel:+917092782855">+91 70927 82855</a></p>
                </div>
              </div>
              <div className="contact-item">
                <div className="c-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div>
                  <h4>முகவரி</h4>
                  <p>5f11/1 manimegalai street, kumarapalayam, nammakal, Pincode - 638183</p>
                </div>
              </div>
            </div>
            <div className="social-links">
              <a href="https://wa.me/message/4HI3RHBC6YMDB1" target="_blank" rel="noopener noreferrer" className="social-icon wa">
                <i className="fab fa-whatsapp"></i>
              </a>
              <a href="https://www.instagram.com/velaan_farm_kpm?igsh=MTh0M3FjYTU5Mm42aQ==" target="_blank" rel="noopener noreferrer" className="social-icon ig">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>

          <div className="contact-form-panel">
            <h3>விசாரணை படிவம்</h3>
            <form onSubmit={handleContactSubmit}>
              <div className="form-group">
                <label>பெயர் (Name) *</label>
                <input type="text" name="name" value={form.name} onChange={handleInputChange} placeholder="உங்கள் பெயர்" required />
              </div>
              <div className="form-group">
                <label>தொலைபேசி எண் (Phone) *</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleInputChange} placeholder="உங்கள் எண்" required />
              </div>
              <div className="form-group">
                <label>செய்தி (Message)</label>
                <textarea name="message" value={form.message} onChange={handleInputChange} rows="4" placeholder="உங்கள் செய்தி அல்லது கேள்வி..."></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={submitState.loading}>
                {submitState.loading ? <i className="fas fa-spinner fa-spin"></i> : 'அனுப்புக (Send)'}
              </button>
              {submitState.success && (
                <div className="form-response success">
                  <i className="fas fa-check-circle"></i> உங்கள் விவரங்கள் வெற்றிகரமாக பெறப்பட்டது! விரைவில் தொடர்பு கொள்வோம்.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

// 2. ABOUT PAGE
const About = () => {
  return (
    <section style={{ paddingTop: '140px', minHeight: '80vh' }}>
      <div className="about-container" style={{ maxWidth: '1700px', margin: '0 auto', padding: '0 4%' }}>
        <div className="about-content" style={{ gridColumn: 'span 2' }}>
          <span className="section-subtitle" style={{ textAlign: 'center', display: 'block' }}>வேளாண் பண்ணை</span>
          <h2 style={{ textAlign: 'center', fontSize: '2.8rem', marginBottom: '30px' }}>நமது பாரம்பரிய கதை</h2>

          <div className="benefit-card" style={{ marginBottom: '40px', lineHeight: 1.8 }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
              <strong>வேளாண் பண்ணை</strong> 1977-ல் திரு. ஆறுமுகம் பால்காரர் அவர்களால் கொமரபாளையத்தில் ஒரு சிறு பால் பண்ணையாக துவங்கப்பட்டது. கடந்த 45 ஆண்டுகளுக்கும் மேலாக தரமான, இயற்கையான பசுவின் பாலை கொமரபாளைய மக்களுக்கு வழங்கி வருகிறோம்.
            </p>
            <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
              பசுக்கள் இயற்கை புற்கள், பருத்தி கொட்டை, தவிடு ஆகியவற்றை மட்டுமே தீவனமாக கொண்டு வளர்க்கப்படுகின்றன. எந்தவொரு செயற்கை ஊக்க மருந்துகளோ அல்லது வேதிப்பொருட்களோ பயன்படுத்தப்படுவதில்லை. இதனால் பால் மற்றும் நெய் முற்றிலும் இயற்கை தன்மையுடன் உள்ளது.
            </p>
            <p style={{ fontSize: '1.1rem' }}>
              தற்போது எங்களது வாடிக்கையாளர்களின் வேண்டுகோளுக்கு இணங்க, எங்களது தூய பசு நெய்யினை கொரியர் மூலம் தமிழகம் முழுவதும் விநியோகம் செய்கிறோம்.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginTop: '20px' }}>
            <div className="benefit-card" style={{ textAlign: 'center' }}>
              <div className="b-icon" style={{ margin: '0 auto 20px auto' }}>🥛</div>
              <h3>பசுவின் பால்</h3>
              <p>வாரந்தோறும் வெள்ளிக்கிழமை காலையில் கொமரபாளையத்தில் பிரத்யேகமாக விநியோகம் செய்யப்படுகிறது.</p>
            </div>
            <div className="benefit-card" style={{ textAlign: 'center' }}>
              <div className="b-icon" style={{ margin: '0 auto 20px auto' }}>🧈</div>
              <h3>தூய பசு நெய்</h3>
              <p>நாட்டு மாட்டு வெண்ணெயில் இருந்து பாரம்பரிய மணல் முறையில் வீட்டில் காய்ச்சப்படும் மணமிக்க நெய்.</p>
            </div>
            <div className="benefit-card" style={{ textAlign: 'center' }}>
              <div className="b-icon" style={{ margin: '0 auto 20px auto' }}>🌱</div>
              <h3>இயற்கை தீவனம்</h3>
              <p>ரசாயனம் இல்லாத தீவனம் மூலம் மாடுகள் பராமரிக்கப்பட்டு, ஆரோக்கியமான பால் பெறப்படுகிறது.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 3. PRODUCTS PAGE
const Products = () => {
  const { dispatch } = useContext(CartContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productsRef = ref(database, 'products');
    get(productsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setProductsList(list);
      } else {
        setProductsList(PRODUCTS);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching products:', err);
      setProductsList(PRODUCTS);
      setLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'all' || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, category, productsList]);

  return (
    <section style={{ paddingTop: '140px', minHeight: '85vh' }}>
      <div style={{ maxWidth: '1700px', margin: '0 auto', padding: '0 4%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
          <div>
            <span className="section-subtitle">தயாரிப்புகள்</span>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-dark)' }}>எங்கள் தயாரிப்புகள்</h2>
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="தேடுக (Search)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '12px 20px', borderRadius: '50px', border: '1px solid rgba(30, 94, 58, 0.2)', width: '220px', outline: 'none' }}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', background: '#eaf1eb', padding: '6px', borderRadius: '50px', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'அனைத்தும்', img: null },
                { key: 'milk', label: 'பால்', img: MILK_IMG },
                { key: 'curd', label: 'தயிர்', img: CURD_IMG },
                { key: 'paneer', label: 'பனீர்', img: PANEER_IMG },
                { key: 'butter', label: 'வெண்ணெய்', img: BUTTER_IMG },
                { key: 'ghee', label: 'நெய்', img: GHEE_IMG },
              ].map(({ key, label, img }) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.88rem',
                    border: 'none',
                    background: category === key ? 'var(--primary-color)' : 'transparent',
                    color: category === key ? 'white' : 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '50px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  {img && (
                    <img
                      src={img}
                      alt={label}
                      style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '4px', filter: category === key ? 'brightness(10)' : 'none' }}
                    />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>
              {loading ? 'ஏற்றப்படுகிறது (Loading)...' : 'தயாரிப்புகள் எதுவும் கிடைக்கவில்லை.'}
            </p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(p => (
              <div key={p.id} className="product-card">
                <div className="product-icon">
                  {p.image && (p.image.startsWith('/') || p.image.startsWith('http'))
                    ? <img src={p.image} alt={p.name} style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                    : <span>{p.image}</span>
                  }
                </div>
                <div>
                  <h3>{p.name}</h3>
                  <span style={{ fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: '700' }}>({p.variant})</span>
                </div>
                <p>{p.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <span className="product-price">₹{p.price}</span>
                  <button
                    onClick={() => {
                      dispatch({ type: 'ADD', payload: p });
                      alert(`✅ ${p.name} (${p.variant}) கூடையில் சேர்க்கப்பட்டது!`);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                  >
                    <i className="fas fa-cart-plus"></i> சேர்க்க
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// 4. CART PAGE
const CartPage = () => {
  const { state: cart, dispatch } = useContext(CartContext);
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Courier charges: Free if subtotal > 500 or if only milk is in the cart, otherwise 50
  const hasGhee = cart.some(item => item.category === 'ghee');
  const shipping = (subtotal === 0 || subtotal >= 500 || !hasGhee) ? 0 : 50;
  const total = subtotal + shipping;

  return (
    <section style={{ paddingTop: '140px', minHeight: '85vh' }}>
      <div style={{ maxWidth: '1700px', margin: '0 auto', padding: '0 4%' }}>
        <span className="section-subtitle">ஆர்டர் கூடை</span>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-dark)', marginBottom: '40px' }}>உங்கள் கூடை (Your Cart)</h2>

        {cart.length === 0 ? (
          <div className="benefit-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <span style={{ fontSize: '4rem' }}>🛒</span>
            <h3 style={{ margin: '20px 0 10px 0' }}>உங்கள் கூடை காலியாக உள்ளது.</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>நமது ஆரோக்கியமான தயாரிப்புகளை வாங்கி மகிழுங்கள்.</p>
            <button onClick={() => navigate('/products')} className="btn btn-primary">
              தயாரிப்புகளை பார்க்க
            </button>
          </div>
        ) : (
          <div className="cart-page-container">
            <div className="cart-list">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-details">
                    <span className="cart-item-icon">{item.image}</span>
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <p>{item.variant} · ₹{item.price}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                    <div className="cart-qty-control">
                      <button
                        onClick={() => dispatch({ type: 'UPDATE_QTY', payload: { id: item.id, qty: item.qty - 1 } })}
                        className="qty-btn"
                      >
                        -
                      </button>
                      <span style={{ fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                      <button
                        onClick={() => dispatch({ type: 'UPDATE_QTY', payload: { id: item.id, qty: item.qty + 1 } })}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>
                    <span className="cart-item-price">₹{item.price * item.qty}</span>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE', payload: item.id })}
                      className="remove-btn"
                      title="நீக்குக"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3 style={{ color: 'var(--primary-dark)', borderBottom: '1px solid rgba(30, 94, 58, 0.1)', paddingBottom: '10px' }}>தொகை விவரம் (Summary)</h3>
              <div className="summary-row">
                <span>பொருட்களின் தொகை (Subtotal)</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="summary-row">
                <span>கொரியர் கட்டணம் (Shipping)</span>
                <span>{shipping === 0 ? <strong style={{ color: 'var(--primary-light)' }}>இலவசம் (Free)</strong> : `₹${shipping}`}</span>
              </div>
              {hasGhee && subtotal < 500 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--accent-color)', marginTop: '-10px' }}>
                  * மேலும் ₹{500 - subtotal} மதிப்புள்ள பொருட்கள் வாங்கினால் இலவச கொரியர் வசதி!
                </p>
              )}
              <div className="summary-row total">
                <span>மொத்த தொகை (Total)</span>
                <span>₹{total}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => dispatch({ type: 'CLEAR' })} className="btn btn-secondary" style={{ padding: '12px 24px' }}>
                  கூடையை காலி செய்
                </button>
                <button onClick={() => navigate('/order')} className="btn btn-primary btn-pulse" style={{ padding: '14px 35px' }}>
                  விவரங்களை பூர்த்தி செய்ய →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// 5. ORDER / CHECKOUT PAGE
const Order = () => {
  const { state: cart, dispatch: cartDispatch } = useContext(CartContext);
  const { state: auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const hasGhee = cart.some(item => item.category === 'ghee');
  const shipping = (subtotal === 0 || subtotal >= 500 || !hasGhee) ? 0 : 50;
  const total = subtotal + shipping;

  const [form, setForm] = useState({
    name: auth.user ? auth.user.name : '',
    phone: '',
    email: auth.user ? auth.user.email : '',
    address: '',
    city: '',
    district: '',
    pincode: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/products');
    }
  }, [cart, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'பெயர் தேவை';
    if (!form.phone.trim() || !/^[0-9]{10}$/.test(form.phone.trim())) e.phone = 'சரியான 10-இலக்க எண் தேவை';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'சரியான மின்னஞ்சல் முகவரி தேவை';
    if (!form.address.trim()) e.address = 'முகவரி தேவை';
    if (!form.city.trim()) e.city = 'நகரம் தேவை';
    if (!form.district.trim()) e.district = 'மாவட்டம் தேவை';
    if (!form.pincode.trim() || !/^[0-9]{6}$/.test(form.pincode.trim())) {
      e.pincode = 'சரியான 6-இலக்க பின்கோடு தேவை';
    } else {
      // Milk is only deliverable to specific pincodes
      const MILK_PINCODES = ['638183', '638301'];
      const hasMilk = cart.some(item => item.category === 'milk');
      if (hasMilk && !MILK_PINCODES.includes(form.pincode.trim())) {
        e.pincode = 'உங்கள் பின்கோடுக்கு பால் விநியோகம் இல்லை. வேறு பொருட்களை தேர்வு செய்யவும்.';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const dateStr = new Date().toLocaleDateString('ta-IN');
    const orderData = {
      user_id: auth.user ? auth.user.id : 'guest',
      customer: form.name,
      phone: form.phone,
      email: form.email,
      address: `${form.address}, ${form.city}, ${form.district} - ${form.pincode}${form.notes ? ` (Notes: ${form.notes})` : ''}`,
      products: cart.map(item => `${item.name} (${item.variant}) x ${item.qty}`).join(', '),
      total: total,
      date: dateStr,
      timestamp: Date.now(),
      status: 'விநியோகத்தில் (Pending)'
    };

    try {
      const ordersRef = ref(database, 'orders');
      await push(ordersRef, orderData);

      // Clear cart and redirect
      cartDispatch({ type: 'CLEAR' });
      alert('✅ ஆர்டர் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது! எங்களது வாராந்திர விநியோகம் வெள்ளிக்கிழமை நடைபெறும். நன்றி!');
      navigate('/');
    } catch (err) {
      console.error('Submit order error:', err);
      alert('ஆர்டர் சமர்ப்பிப்பதில் பிழை ஏற்பட்டது.');
    }
  };

  return (
    <section style={{ paddingTop: '140px', minHeight: '85vh' }}>
      <div style={{ maxWidth: '1700px', margin: '0 auto', padding: '0 4%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>

          <div className="form-card" style={{ maxWidth: 'none', margin: 0 }}>
            <h3 className="form-title" style={{ textAlign: 'left' }}>விநியோக முகவரி (Delivery Address)</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label>பெயர் (Name) *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required />
                  {errors.name && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>கைபேசி எண் (Phone) *</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="10 இலக்க எண்" required />
                  {errors.phone && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{errors.phone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>மின்னஞ்சல் (Email) - விருப்பப்பட்டால்</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} />
                {errors.email && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>முகவரி (Address) *</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="கதவு எண், தெரு பெயர்" required />
                {errors.address && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{errors.address}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>நகரம் (City/Town) *</label>
                  <input type="text" name="city" value={form.city} onChange={handleChange} required />
                  {errors.city && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label>மாவட்டம் (District) *</label>
                  <input type="text" name="district" value={form.district} onChange={handleChange} required />
                  {errors.district && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{errors.district}</span>}
                </div>
                <div className="form-group">
                  <label>பின்கோடு (Pincode) *</label>
                  <input type="text" name="pincode" value={form.pincode} onChange={handleChange} maxLength="6" required />
                  {errors.pincode && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{errors.pincode}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>குறிப்புகள் (Delivery Notes)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" placeholder="ஏதேனும் கூடுதல் தகவல்கள்..."></textarea>
              </div>

              <button type="submit" className="btn btn-primary w-100" style={{ padding: '14px', marginTop: '10px' }}>
                ஆர்டரை உறுதி செய்க (Confirm Order) - ₹{total}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="benefit-card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--primary-dark)' }}>ஆர்டர் விவரங்கள் (Your Order)</h3>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem' }}>{item.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{item.variant} x {item.qty}</p>
                  </div>
                  <span style={{ fontWeight: '600' }}>₹{item.price * item.qty}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                <span style={{ fontSize: '0.95rem' }}>பொருட்கள் தொகை</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
                <span style={{ fontSize: '0.95rem' }}>விநியோக கட்டணம்</span>
                <span>{shipping === 0 ? 'இலவசம்' : `₹${shipping}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--primary-color)', paddingTop: '15px', fontWeight: '700', fontSize: '1.2rem', color: 'var(--primary-dark)' }}>
                <span>மொத்தம்</span>
                <span>₹{total}</span>
              </div>
            </div>

            <div className="benefit-card" style={{ backgroundColor: '#f1f8ee' }}>
              <h4 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}><i className="fas fa-truck"></i> வாராந்திர வெள்ளிக்கிழமை விநியோகம்</h4>
              <p style={{ fontSize: '0.9rem', color: '#2b5e2b', lineHeight: 1.5 }}>
                கொமரபாளையத்தில் பால் வெள்ளிக்கிழமை தோறும் நேரடியாக வழங்கப்படும். தூய நெய் ஆர்டர்கள் Courier மூலம் உடனடியாக அனுப்பப்படும்.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
// 6. MY ORDERS PAGE
const MyOrders = () => {
  const { state: auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [searched, setSearched] = useState(false);

  const STATUS_STEPS = [
    { key: 'pending', label: 'ஆர்டர் பெறப்பட்டது', icon: 'fa-check-circle' },
    { key: 'confirmed', label: 'உறுதிப்படுத்தப்பட்டது', icon: 'fa-thumbs-up' },
    { key: 'dispatch', label: 'அனுப்பப்பட்டது', icon: 'fa-shipping-fast' },
    { key: 'delivered', label: 'வழங்கப்பட்டது', icon: 'fa-home' },
  ];

  const getStepIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered') || s.includes('வழங்கப்பட்டது')) return 3;
    if (s.includes('dispatch') || s.includes('அனுப்பப்பட்டது')) return 2;
    if (s.includes('confirm') || s.includes('உறுதி')) return 1;
    return 0;
  };

  const fetchOrders = async (filterFn) => {
    setLoading(true);
    try {
      const snap = await get(child(ref(database), 'orders'));
      if (snap.exists()) {
        const all = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
        const filtered = all.filter(filterFn).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setOrders(filtered);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (auth.user) {
      fetchOrders(o => o.user_id === auth.user.id);
      setSearched(true);
    } else {
      setLoading(false);
    }
  }, [auth.user]);

  const handleGuestSearch = (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(phone.trim())) return;
    fetchOrders(o => o.phone === phone.trim());
    setSearched(true);
  };

  return (
    <section style={{ paddingTop: '140px', minHeight: '85vh', background: 'var(--bg-light)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 4%' }}>
        <span className="section-subtitle">கண்காணிப்பு</span>
        <h2 style={{ fontSize: '2.2rem', color: 'var(--primary-dark)', marginBottom: '8px' }}>என் ஆர்டர்கள்</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '36px' }}>உங்கள் ஆர்டரின் நிலையை இங்கே பார்க்கலாம்.</p>

        {/* Guest phone lookup */}
        {!auth.user && (
          <form onSubmit={handleGuestSearch} style={{ display: 'flex', gap: '12px', marginBottom: '36px', flexWrap: 'wrap' }}>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="உங்கள் கைபேசி எண் உள்ளிடவும்"
              maxLength="10"
              style={{ padding: '12px 20px', borderRadius: '50px', border: '1px solid rgba(30,94,58,0.25)', width: '260px', outline: 'none', fontSize: '1rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: '50px' }}>
              <i className="fas fa-search"></i> தேடு
            </button>
          </form>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
            <p style={{ marginTop: '16px', color: 'var(--text-light)' }}>ஏற்றப்படுகிறது...</p>
          </div>
        )}

        {!loading && searched && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <i className="fas fa-box-open" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p style={{ marginTop: '16px', color: 'var(--text-light)', fontSize: '1.1rem' }}>ஆர்டர்கள் எதுவும் இல்லை.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.map(order => {
            const step = getStepIndex(order.status);
            return (
              <div key={order.id} className="benefit-card" style={{ padding: '28px', borderRadius: '18px', boxShadow: '0 4px 24px rgba(30,94,58,0.08)', background: 'white' }}>
                {/* Order header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--primary-dark)', marginBottom: '4px' }}>
                      <i className="fas fa-receipt" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>
                      {order.customer} — {order.date}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-light)' }}>{order.products}</p>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary-dark)' }}>₹{order.total}</span>
                </div>

                {/* Status Timeline */}
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginTop: '10px' }}>
                  {STATUS_STEPS.map((s, i) => {
                    const done = i <= step;
                    const active = i === step;
                    return (
                      <React.Fragment key={s.key}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 'none' : 'none', zIndex: 1 }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: done ? 'var(--primary-color)' : '#e8ede9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: active ? '0 0 0 4px rgba(45,138,86,0.2)' : 'none',
                            transition: 'all 0.3s'
                          }}>
                            <i className={`fas ${s.icon}`} style={{ color: done ? 'white' : '#aaa', fontSize: '0.9rem' }}></i>
                          </div>
                          <span style={{ fontSize: '0.72rem', marginTop: '6px', color: done ? 'var(--primary-color)' : '#aaa', fontWeight: done ? '700' : '400', textAlign: 'center', maxWidth: '70px' }}>
                            {s.label}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div style={{ flex: 1, height: '3px', background: i < step ? 'var(--primary-color)' : '#e8ede9', margin: '0 4px', marginBottom: '22px', transition: 'background 0.3s' }}></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Address */}
                <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f7faf7', borderRadius: '10px', fontSize: '0.88rem', color: 'var(--text-light)' }}>
                  <i className="fas fa-map-marker-alt" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>
                  {order.address}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// 7. DELIVERY INFO PAGE
const DeliveryInfo = () => {
  return (
    <section style={{ paddingTop: '140px', minHeight: '80vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="benefit-card">
        <span className="section-subtitle">சேவை விவரங்கள்</span>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-dark)', marginBottom: '25px' }}>விநியோகத் தகவல் (Delivery Details)</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.7 }}>
          <div>
            <h4 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '8px' }}><i className="fas fa-city"></i> கொமரபாளையம் நகர பால் விநியோகம்</h4>
            <p>எங்களது பண்ணை பசுவின் பால் கொமரபாளையம் நகரில் வாரந்தோறும் வெள்ளிக்கிழமை காலை விநியோகம் செய்யப்படுகிறது. திங்கள் முதல் வியாழன் வரை பெறப்படும் ஆர்டர்கள் வெள்ளிக்கிழமை காலையில் உங்கள் இல்லம் தேடி வரும்.</p>
          </div>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px' }}>
            <h4 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '8px' }}><i className="fas fa-shipping-fast"></i> தமிழகம் தழுவிய நெய் விநியோகம்</h4>
            <p>தூய்மையான வீட்டு நெய் தயாரிப்புகள் Courier சேவை மூலம் தமிழ்நாடு முழுவதற்கும் அனுப்பி வைக்கப்படுகிறது. ஆர்டர் செய்த 2 முதல் 4 வேலை நாட்களில் உங்கள் இல்லத்திற்கு நெய் வந்தடையும்.</p>
          </div>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px' }}>
            <h4 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '8px' }}><i className="fas fa-truck-loading"></i> விநியோக கட்டணங்கள்</h4>
            <ul>
              <li>கொமரபாளையம் நகருக்குள் பால் விநியோகம் முற்றிலும் <strong>இலவசம்</strong>.</li>
              <li>நெய் ஆர்டர்களுக்கு ₹500 அல்லது அதற்கு மேல் வாங்கினால் கொரியர் விநியோகம் முற்றிலும் <strong>இலவசம்</strong>.</li>
              <li>₹500-க்கு குறைவான நெய் ஆர்டர்களுக்கு ₹50 கொரியர் கட்டணம் வசூலிக்கப்படும்.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

// 7. CONTACT PAGE
const Contact = () => {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [submitState, setSubmitState] = useState({ loading: false, success: false });

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert('பெயர் மற்றும் தொலைபேசி எண்ணை உள்ளிடவும்.');
      return;
    }
    setSubmitState({ loading: true, success: false });

    try {
      const dateStr = new Date().toLocaleDateString('ta-IN');
      const contactRef = ref(database, 'contact');
      await push(contactRef, {
        name: form.name,
        phone: form.phone,
        message: form.message,
        date: dateStr
      });

      setSubmitState({ loading: false, success: true });
      setForm({ name: '', phone: '', message: '' });
      setTimeout(() => setSubmitState({ loading: false, success: false }), 5000);
    } catch (err) {
      console.error('Contact submit error:', err);
      alert('தொடர்பு கொள்வதில் பிழை ஏற்பட்டது.');
      setSubmitState({ loading: false, success: false });
    }
  };

  return (
    <section style={{ paddingTop: '140px', minHeight: '85vh' }}>
      <div className="contact-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="contact-info-panel">
          <span className="section-subtitle">தொடர்புக்கு</span>
          <h2>எங்களை எப்படி தொடர்பு கொள்ளலாம்?</h2>
          <p>உங்களது ஆர்டர்கள் மற்றும் சந்தேகங்களுக்கு உடனுக்குடன் பதிலளிக்க நாங்கள் தயாராக உள்ளோம்.</p>

          <div className="contact-details">
            <div className="contact-item">
              <div className="c-icon"><i className="fas fa-phone"></i></div>
              <div>
                <h4>தொலைபேசி</h4>
                <p><a href="tel:+917092782855" style={{ color: 'inherit' }}>+91 70927 82855</a></p>
              </div>
            </div>
            <div className="contact-item">
              <div className="c-icon"><i className="fas fa-envelope"></i></div>
              <div>
                <h4>மின்னஞ்சல்</h4>
                <p>contact@velaanfarm.in</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="c-icon"><i className="fas fa-map-marker-alt"></i></div>
              <div>
                <h4>முகவரி</h4>
                <p>5f11/1 manimegalai street, kumarapalayam, nammakal, Pincode - 638183</p>
              </div>
            </div>
          </div>

          <div className="social-links">
            <a href="https://wa.me/message/4HI3RHBC6YMDB1" target="_blank" rel="noopener noreferrer" className="social-icon wa">
              <i className="fab fa-whatsapp"></i>
            </a>
            <a href="https://www.instagram.com/velaan_farm_kpm?igsh=MTh0M3FjYTU5Mm42aQ==" target="_blank" rel="noopener noreferrer" className="social-icon ig">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>

        <div className="contact-form-panel">
          <h3>விசாரணை படிவம்</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>உங்கள் பெயர் (Name) *</label>
              <input type="text" name="name" value={form.name} onChange={handleInputChange} placeholder="பெயர்" required />
            </div>
            <div className="form-group">
              <label>தொலைபேசி எண் (Phone) *</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleInputChange} placeholder="கைபேசி எண்" required />
            </div>
            <div className="form-group">
              <label>கேள்வி அல்லது கருத்து (Message)</label>
              <textarea name="message" value={form.message} onChange={handleInputChange} rows="4" placeholder="விவரங்கள்..."></textarea>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={submitState.loading}>
              {submitState.loading ? <i className="fas fa-spinner fa-spin"></i> : 'சமர்ப்பி (Submit)'}
            </button>
            {submitState.success && (
              <div className="form-response success">
                <i className="fas fa-check-circle"></i> உங்கள் விவரங்கள் அனுப்பப்பட்டது. மிக்க நன்றி!
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};


// 9. AUTHENTICATION (LOGIN / SIGNUP)
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
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        let foundUser = null;

        if (snapshot.exists()) {
          const usersObj = snapshot.val();
          for (let id in usersObj) {
            const u = usersObj[id];
            if (u.email === email && u.password === pass) {
              foundUser = { id, name: u.name, email: u.email, role: u.role || 'user' };
              break;
            }
          }
        }

        if (!foundUser) {
          alert('மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது! (Invalid email or password)');
          return;
        }

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
          dispatch({ type: 'LOGIN', payload: { user: foundUser, token: 'firebase-token' } });
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }, 5000);
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
        <h2 className="form-title">உள்நுழைக (Login)</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>மின்னஞ்சல் (Email)</label>
            <input type="email" placeholder="example@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>கடவுச்சொல் (Password)</label>
            <input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-100" style={{ padding: '12px', marginTop: '10px' }}>
            உள்நுழைக (Login)
          </button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          புதிய வாடிக்கையாளரா? <Link to="/signup" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>பதிவு செய்க (Sign up)</Link>
        </p>
      </div>
    </section>
  );
};

const Signup = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showSplash, setShowSplash] = useState(false);
  const [progress, setProgress] = useState(0);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (email && pass) {
      try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        let exists = false;

        if (snapshot.exists()) {
          const usersObj = snapshot.val();
          for (let id in usersObj) {
            if (usersObj[id].email === email) {
              exists = true;
              break;
            }
          }
        }

        if (exists) {
          alert('இந்த மின்னஞ்சலில் ஏற்கனவே கணக்கு உள்ளது!');
          return;
        }

        const newUserRef = await push(usersRef, {
          name: email.split('@')[0],
          email: email,
          password: pass,
          role: 'user'
        });

        const newUser = { id: newUserRef.key, name: email.split('@')[0], email, role: 'user' };

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
          dispatch({ type: 'LOGIN', payload: { user: newUser, token: 'firebase-token' } });
          navigate('/');
        }, 5000);
      } catch (err) {
        console.error('Signup error:', err);
        alert('கணக்கு உருவாக்குவதில் பிழை ஏற்பட்டது.');
      }
    } else {
      alert('விவரங்களை முழுமையாக உள்ளிடவும்.');
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
        <h2 className="form-title">பதிவு செய்க (Sign up)</h2>
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>மின்னஞ்சல் (Email)</label>
            <input type="email" placeholder="example@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>கடவுச்சொல் (Password)</label>
            <input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-100" style={{ padding: '12px', marginTop: '10px' }}>
            கணக்கை உருவாக்கு (Sign up)
          </button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          ஏற்கனவே கணக்கு உள்ளதா? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>உள்நுழைக (Login)</Link>
        </p>
      </div>
    </section>
  );
};


// ---------- MAIN APP COMPONENT ----------
const App = () => {
  const [cart, cartDispatch] = useReducer(cartReducer, [], (init) => {
    const stored = localStorage.getItem('velaan_cart');
    return stored ? JSON.parse(stored) : init;
  });

  const [auth, authDispatch] = useReducer(authReducer, initialAuth);
  const [menuActive, setMenuActive] = useState(false);

  // --- Entry Splash ---
  const [entrySplash, setEntrySplash] = useState(true);
  const [entryProgress, setEntryProgress] = useState(0);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    // Animate fill from 0 → 100 over ~2s (20% every 400ms)
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setEntryProgress(current);
      if (current >= 100) clearInterval(interval);
    }, 400);

    // Start fade-out at 2.2s, remove splash at 2.7s
    const fadeTimer = setTimeout(() => setSplashFading(true), 2200);
    const hideTimer = setTimeout(() => setEntrySplash(false), 2700);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('velaan_cart', JSON.stringify(cart));
  }, [cart]);

  const cartContextValue = useMemo(() => ({ state: cart, dispatch: cartDispatch }), [cart]);
  const authContextValue = useMemo(() => ({ state: auth, dispatch: authDispatch }), [auth]);

  const closeMenu = () => setMenuActive(false);

  return (
    <AuthContext.Provider value={authContextValue}>
      <CartContext.Provider value={cartContextValue}>
        <BrowserRouter>

          {/* ===== ENTRY SPLASH SCREEN ===== */}
          {entrySplash && (
            <div
              className="water-loader-container"
              style={{ opacity: splashFading ? 0 : 1, transition: 'opacity 0.5s ease' }}
            >
              <div className="water-logo-wrapper">
                <img src={LOGO_URL} alt="Velaan Farm Logo" className="water-logo-img" />
                <div className="water-fill" style={{ height: `${entryProgress}%` }}>
                  <img src={LOGO_URL} alt="Velaan Farm Logo" className="water-fill-logo-img" />
                </div>
              </div>
              <div className="water-loader-text" style={{ marginTop: '30px' }}>
                <h3>வேளாண் பண்ணை</h3>
                <p>தூய்மை • பாரம்பரியம் • நம்பகம்</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

            {/* Header/Navbar */}
            <nav className="navbar">
              <div className="nav-container">
                <Link to="/" onClick={closeMenu} className="nav-logo">
                  <img src={LOGO_URL} alt="Velaan Farm Logo" className="nav-logo-img" />
                  <span className="nav-brand-text">வேளாண் பண்ணை</span>
                </Link>

                <ul className={`nav-links ${menuActive ? 'active' : ''}`}>
                  <li><Link to="/" onClick={closeMenu}>முகப்பு (Home)</Link></li>
                  <li><Link to="/about" onClick={closeMenu}>பற்றி (About)</Link></li>
                  <li><Link to="/products" onClick={closeMenu}>தயாரிப்புகள் (Products)</Link></li>
                  <li><Link to="/delivery" onClick={closeMenu}>விநியோகம் (Delivery)</Link></li>
                  <li><Link to="/contact" onClick={closeMenu}>தொடர்புக்கு (Contact)</Link></li>
                  {auth.user && (
                    <li><Link to="/my-orders" onClick={closeMenu}>என் ஆர்டர்கள் (MyOrders)</Link></li>
                  )}


                  {cart.length > 0 && (
                    <li>
                      <Link to="/cart" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-shopping-cart"></i>
                        <span className="cart-badge">{cart.reduce((sum, i) => sum + i.qty, 0)}</span>
                      </Link>
                    </li>
                  )}

                  {auth.user ? (
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                        👤 {auth.user.name}
                      </span>
                      <button
                        onClick={() => { authDispatch({ type: 'LOGOUT' }); closeMenu(); }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Logout
                      </button>
                    </li>
                  ) : (
                    <li>
                      <Link to="/login" onClick={closeMenu} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.9rem', color: 'white' }}>
                        Login
                      </Link>
                    </li>
                  )}
                </ul>

                <a href="https://wa.me/message/4HI3RHBC6YMDB1" target="_blank" rel="noopener noreferrer" className="nav-cta-btn" title="வாட்ஸ்அப் மூலம் ஆர்டர் செய்ய">
                  <i className="fab fa-whatsapp"></i>
                </a>

                <div
                  className={`menu-toggle ${menuActive ? 'is-active' : ''}`}
                  id="mobile-menu"
                  onClick={() => setMenuActive(!menuActive)}
                >
                  <span className="bar"></span>
                  <span className="bar"></span>
                  <span className="bar"></span>
                </div>
              </div>
            </nav>

            {/* Routes Content */}
            <main style={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/products" element={<Products />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/order" element={<Protected><Order /></Protected>} />
                <Route path="/my-orders" element={<Protected><MyOrders /></Protected>} />
                <Route path="/delivery" element={<DeliveryInfo />} />
                <Route path="/contact" element={<Contact />} />

                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                {/* Fallback to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer */}
            <footer>
              <div className="footer-container">
                <div className="footer-brand">
                  <img src={LOGO_URL} alt="Velaan Farm Logo" className="footer-logo" />
                  <h3>வேளாண் பண்ணை</h3>
                  <p>100% தூய்மையான பண்ணை பசுவின் பால் மற்றும் நெய்</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '5px', opacity: 0.7 }}>5f11/1 manimegalai street, kumarapalayam, nammakal - 638183</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>தொலைபேசி: +91 70927 82855</p>
                </div>
                <div className="footer-copyright">
                  <p>© 2026 Orbis Freelancing. All Rights Reserved. Orbis Freelancing specializes in AI Development, Full-Stack Web Solutions, UI/UX Design, Automation, Branding, and Digital Growth Services. Crafted with cutting-edge technologies for exceptional user experiences across all platforms.</p>
                </div>
              </div>
            </footer>

          </div>
        </BrowserRouter>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
export { CartContext, AuthContext };
