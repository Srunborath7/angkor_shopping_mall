import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Send,
  Clock,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useStoreSettings } from "../hooks/useStoreSettings";
import { useTranslation } from "../context/LanguageContext";
import "./Footer.css";

function Footer() {
  const navigate = useNavigate();
  const store = useStoreSettings();
  const { language } = useTranslation();
  const isKhmer = language === "km";

  const telegramHandle = (store.supportTelegram || "@AngkorMallSupport").replace("@", "");
  const telegramLink = store.telegramUrl || `https://t.me/${telegramHandle}`;
  const cleanPhone = (store.storePhone || "+855 23 888 999").replace(/\s+/g, "");

  return (
    <footer className="official-store-footer">
      {/* Top Value Proposition Bar */}
      <div className="footer-perks-bar">
        <div className="footer-perks-container">
          <div className="footer-perk-item">
            <div className="perk-icon-circle green">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5>{isKhmer ? "ទំនិញសុទ្ធ ១០០%" : "100% Genuine Products"}</h5>
              <p>{isKhmer ? "ធានាគុណភាពផ្លូវការ" : "Official brand warranties"}</p>
            </div>
          </div>

          <div className="footer-perk-item">
            <div className="perk-icon-circle blue">
              <CreditCard size={20} />
            </div>
            <div>
              <h5>{isKhmer ? "ទូទាត់រហ័សទាន់ចិត្ត" : "Instant KHQR Payment"}</h5>
              <p>{isKhmer ? "ABA, Bakong, Wing & COD" : "ABA, Bakong, Wing & COD"}</p>
            </div>
          </div>

          <div className="footer-perk-item">
            <div className="perk-icon-circle orange">
              <Clock size={20} />
            </div>
            <div>
              <h5>{isKhmer ? "ដឹកជញ្ជូនរហ័ស ២៤ ម៉ោង" : "Fast 24H Delivery"}</h5>
              <p>{isKhmer ? "ភ្នំពេញ និងគ្រប់ខេត្តក្រុង" : "Phnom Penh & All Provinces"}</p>
            </div>
          </div>

          <div className="footer-perk-item">
            <div className="perk-icon-circle purple">
              <Send size={20} />
            </div>
            <div>
              <h5>{isKhmer ? "ជំនួយការផ្ទាល់ ២៤/៧" : "24/7 Live Support"}</h5>
              <p>{isKhmer ? "តាមរយៈ Telegram & Hotline" : "Via Telegram & Hotline"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content Grid */}
      <div className="footer-main-container">
        <div className="footer-content-grid">
          {/* Column 1: Store Branding & Mission */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header">
              <div className="brand-logo-gem">🏛️</div>
              <div>
                <h3 className="brand-title">{store.storeName}</h3>
                <span className="brand-badge-official">Official Mall</span>
              </div>
            </div>
            <p className="brand-tagline">{store.storeTagline}</p>

            {/* Official Operating Hours */}
            <div className="operating-hours-box">
              <Clock size={16} className="hours-icon" />
              <div>
                <span className="hours-label">{isKhmer ? "ម៉ោងបម្រើការងារផ្លូវការ" : "Operating Hours"}</span>
                <span className="hours-val">{store.operatingHours || "Mon - Sun: 8:00 AM - 10:00 PM"}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Official Contact & Headquarters Info */}
          <div className="footer-col contact-col">
            <h4 className="footer-heading">{isKhmer ? "ព័ត៌មានទំនាក់ទំនងផ្លូវការ" : "Official Company Info"}</h4>
            <ul className="footer-contact-list">
              <li>
                <MapPin size={18} className="contact-icon" />
                <div>
                  <strong>{isKhmer ? "ទីស្នាក់ការកណ្តាល" : "Headquarters Address"}:</strong>
                  <p>{store.storeAddress}</p>
                </div>
              </li>

              <li>
                <Phone size={18} className="contact-icon" />
                <div>
                  <strong>{isKhmer ? "ទូរស័ព្ទ Hotline" : "Phone Hotline"}:</strong>
                  <a href={`tel:${cleanPhone}`} className="contact-link">
                    {store.storePhone}
                  </a>
                </div>
              </li>

              <li>
                <Mail size={18} className="contact-icon" />
                <div>
                  <strong>{isKhmer ? "អ៊ីមែលផ្លូវការ" : "Official Support Email"}:</strong>
                  <a href={`mailto:${store.storeEmail}`} className="contact-link">
                    {store.storeEmail}
                  </a>
                </div>
              </li>

              <li>
                <Send size={18} className="contact-icon" />
                <div>
                  <strong>{isKhmer ? "ឆានែល Telegram" : "Official Telegram"}:</strong>
                  <a
                    href={telegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-link telegram-pill"
                  >
                    {store.supportTelegram} <ExternalLink size={12} />
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="footer-col links-col">
            <h4 className="footer-heading">{isKhmer ? "តំណភ្ជាប់រហ័ស" : "Quick Navigation"}</h4>
            <ul className="footer-nav-list">
              <li onClick={() => navigate("/")}>
                <ChevronRight size={14} /> {isKhmer ? "ទំព័រដើម (Home)" : "Home"}
              </li>
              <li onClick={() => navigate("/shop")}>
                <ChevronRight size={14} /> {isKhmer ? "កាតាឡុកទំនិញ (Shop Catalog)" : "Shop Catalog"}
              </li>
              <li onClick={() => navigate("/flash-sale")}>
                <ChevronRight size={14} /> {isKhmer ? "ប្រូម៉ូសិន Flash Sale" : "Flash Sale Promotions"}
              </li>
              <li onClick={() => navigate("/recommendations")}>
                <ChevronRight size={14} /> {isKhmer ? "ទំនិញពេញនិយម" : "AI Top Picks"}
              </li>
              <li onClick={() => navigate("/orders")}>
                <ChevronRight size={14} /> {isKhmer ? "តាមដានការបញ្ជាទិញ" : "Track My Orders"}
              </li>
            </ul>
          </div>

          {/* Column 4: Payment Methods & Security */}
          <div className="footer-col payments-col">
            <h4 className="footer-heading">{isKhmer ? "វិធីសាស្ត្រទូទាត់ប្រាក់" : "Accepted Payment Methods"}</h4>
            <p className="payments-subtext">
              {isKhmer
                ? "ទូទាត់ប្រាក់ប្រកបដោយសុវត្ថិភាពខ្ពស់តាមរយៈធនាគារក្នុងស្រុក និងអន្តរជាតិ"
                : "Secure, instant checkout with Cambodian national banks and global cards"}
            </p>

            <div className="payment-badges-grid">
              {store.abaEnabled && (
                <div className="pay-chip aba">
                  <span className="pay-chip-brand">ABA'</span>
                  <span className="pay-chip-type">PayWay & KHQR</span>
                </div>
              )}
              {store.bakongEnabled && (
                <div className="pay-chip bakong">
                  <span className="pay-chip-brand">BAKONG</span>
                  <span className="pay-chip-type">NBC KHQR</span>
                </div>
              )}
              {store.wingEnabled && (
                <div className="pay-chip wing">
                  <span className="pay-chip-brand">WING</span>
                  <span className="pay-chip-type">Bank Pay</span>
                </div>
              )}
              {store.codEnabled && (
                <div className="pay-chip cod">
                  <span className="pay-chip-brand">COD</span>
                  <span className="pay-chip-type">Cash on Delivery</span>
                </div>
              )}
            </div>

            <div className="exchange-rate-pill">
              <span>{isKhmer ? "អត្រាប្តូរប្រាក់ផ្លូវការ៖" : "Official Exchange Rate:"}</span>
              <strong>1 USD = {store.khrRate || 4100} KHR</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Legal Strip */}
      <div className="footer-bottom-strip">
        <div className="footer-bottom-inner">
          <p className="copyright-text">
            © {new Date().getFullYear()} <strong>{store.storeName}</strong>. {isKhmer ? "រក្សាសិទ្ធិគ្រប់យ៉ាង។" : "All rights reserved."}
          </p>
          <div className="legal-badges">
            <span className="vat-badge">VAT ID: K008-992817281</span>
            <span className="secure-badge">🔒 256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
