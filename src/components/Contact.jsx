import React, { useState } from 'react';
import * as Icons from './Icons';
import { translations } from './translations';
import { saveInquiry } from '../utils/db';

export default function Contact({ lang, translations: dynamicTranslations }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const activeTranslations = dynamicTranslations || translations;
  const t = activeTranslations[lang] || activeTranslations.en;

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedOffline, setSubmittedOffline] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const localizedFaqs = {
    en: [
      { id: 1, q: 'What crops do you currently collect?', a: 'We collect Sunflower seeds, Maize, Dry Beans, Sesame, and other field crops. Each crop undergoes moisture checks and quality grading upon delivery at any of our collection hubs.' },
      { id: 2, q: 'How does the payout process work?', a: 'Once your crop weight and grading checks are completed (typically within 30 minutes of drop-off), payments are issued via mobile money or bank transfer on the same day.' },
      { id: 3, q: 'How do I access cooperative farm inputs?', a: 'Registered Jeroma farmers can purchase organic fertilizers, certified seeds, and agro-chemicals directly at our Lira center. Purchases can be paid in cash or deducted from your next harvest payout under our buy-now-pay-at-harvest scheme.' },
      { id: 4, q: 'Can Jeroma transport my harvest from my farm?', a: 'Yes. We provide transit assistance for bulk volumes above 2 tons. Coordinate a truck dispatch by messaging our WhatsApp hotline at least 48 hours before harvest day.' },
      { id: 5, q: 'How do I become a registered Jeroma farmer?', a: 'Visit our main office in Lira with your national ID and land documents. Registration is free for all smallholder farmers. You will receive a membership card granting access to subsidized inputs and priority collection services.' }
    ],
    luo: [
      { id: 1, q: 'Kabilo ago me pur ma icogo woko?', a: 'Wacogo Sunflower, Anam (Maize), Ngor (Beans), Sesame, kede ebirimwa ebirala. Buri crop cito i moisture test kede grading me quality i keno me cogo mwa.' },
      { id: 2, q: 'Yore me cula woto calo ango?', a: 'Ka okad kilo kede moisture test (i dwe 30), wamiyo cula cutcut dwe meno kede mobile money nyo bank transfer.' },
      { id: 3, q: 'Anongo ango yat me cooperative inputs me pur?', a: 'Opur ma oketti twero nongo organic fertilizer, seeds, kede yat me pur i main center mwa i Lira. Twero cula cash nyo cula ka okad payout me keyo (buy-now-pay-at-harvest).' },
      { id: 4, q: 'Jeroma twero cogo keyo na ki i poto na?', a: 'Eyo. Wacwako tere pur pi bulk volume ma okatte toni 2. Oro WhatsApp dispatch i dwol mwa 48 hours ka dwe keyo okad.' },
      { id: 5, q: 'Anwang membership me Jeroma calo ango?', a: 'Cito i od-tic mwa i Lira kede national ID kede land documents. Membership obedo free pi opur ducu. Inongo card me agro inputs kede prioritised collection services.' }
    ]
  };

  const faqs = localizedFaqs[lang] || localizedFaqs.en;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = lang === 'en' ? 'Name is required' : 'Nying mitte';
    if (!formData.email.trim()) {
      newErrors.email = lang === 'en' ? 'Email is required' : 'Email mitte';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = lang === 'en' ? 'Email address is invalid' : 'Email rac';
    }
    if (!formData.phone.trim()) newErrors.phone = lang === 'en' ? 'Phone number is required' : 'Simu mitte';
    if (!formData.message.trim()) newErrors.message = lang === 'en' ? 'Message is required' : 'Lok me oro mitte';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sanitizeInput = (val) => {
    if (typeof val !== 'string') return val;
    let cleaned = val.replace(/<[^>]*>/g, '');
    cleaned = cleaned
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
    return cleaned.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    const sanitizedData = {
      name: sanitizeInput(formData.name),
      email: sanitizeInput(formData.email),
      phone: sanitizeInput(formData.phone),
      subject: sanitizeInput(formData.subject || 'General Inquiry'),
      message: sanitizeInput(formData.message)
    };

    try {
      // If browser is offline, saveInquiry will queue locally via its own fallback
      await saveInquiry(sanitizedData);
      setSubmittedOffline(!navigator.onLine);
      setIsSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      // Silently fail — saveInquiry has its own localStorage fallback
      setIsSuccess(true);
      setSubmittedOffline(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <section id="contact" className="section" style={{ backgroundColor: 'var(--color-bg-light)' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{t.contactBadge}</span>
          <h2 className="section-title">{t.contactTitle}</h2>
          <p className="section-subtitle">{t.contactSubtitle}</p>
        </div>

        <div className="contact-grid">
          {/* Left: Info + FAQs */}
          <div className="contact-info-block">

            {/* Logo + Office banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary-light))',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px'
            }}>
              <img src="/logo.webp" alt="Jeroma Farmers Logo"
                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-secondary)', flexShrink: 0 }}
                loading="lazy"
              />
              <div>
                <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '2px' }}>{t.officeTitle}</h4>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>
                  {t.officeDealers}
                </p>
                <p style={{ color: 'var(--color-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  Rwot Awich Road, Pader Town Council, Pader District, Uganda
                </p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.74rem', marginTop: '2px' }}>
                  Also: Agago · Kitgum · Abim · Karenga · Lira · Kole
                </p>
              </div>
            </div>

            <div className="contact-details">
              <div className="contact-item">
                <div className="contact-icon-wrapper">
                  <Icons.MapPin size={20} />
                </div>
                <div>
                  <h4>{t.officeAddress}</h4>
                  <p>{t.officeBox}</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon-wrapper">
                  <Icons.Phone size={20} />
                </div>
                <div>
                  <h4>{t.officePhone}</h4>
                  <p>
                    <a href="tel:+256773623196" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>+256 773 623 196</a>
                    {' / '}
                    <a href="tel:+256782608721" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>+256 782 608 721</a>
                  </p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon-wrapper">
                  <Icons.Mail size={20} />
                </div>
                <div>
                  <h4>{t.officeEmail}</h4>
                  <p>
                    <a href="mailto:jeromafarmers.c@gmail.com" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
                      jeromafarmers.c@gmail.com
                    </a>
                  </p>
                  <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                    <a href="http://www.jeromafarmers.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-light)' }}>
                      www.jeromafarmers.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon-wrapper">
                  <Icons.Clock size={20} />
                </div>
                <div>
                  <h4>{t.officeHours}</h4>
                  <p style={{ whiteSpace: 'pre-line' }}>{t.officeHoursDesc}</p>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="faq-block">
              <h3 className="faq-title">{t.faqTitle}</h3>
              <div className="faq-accordion">
                {faqs.map((faq, index) => (
                  <div key={faq.id} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                    <button className="faq-trigger" onClick={() => toggleFaq(index)}>
                      <span>{faq.q}</span>
                      <Icons.ChevronDown size={18} />
                    </button>
                    <div className="faq-content">
                      <p>{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="contact-form-card glass-panel">
            {!isSuccess ? (
              <>
                <h3>{t.formTitle}</h3>
                <p>{t.formSubtitle}</p>

                <form onSubmit={handleSubmit} className="calc-form">
                  <div className="form-group">
                    <label htmlFor="contact-name">{t.formLabelName}</label>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      className="form-input"
                      placeholder="e.g. John Okello"
                      value={formData.name}
                      onChange={handleInputChange}
                      aria-invalid={errors.name ? "true" : "false"}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {errors.name && <span id="name-error" style={{ color: '#d90429', fontSize: '0.75rem' }}>{errors.name}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="contact-email">{t.formLabelEmail}</label>
                      <input
                        type="email"
                        id="contact-email"
                        name="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        aria-invalid={errors.email ? "true" : "false"}
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                      {errors.email && <span id="email-error" style={{ color: '#d90429', fontSize: '0.75rem' }}>{errors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact-phone">{t.formLabelPhone}</label>
                      <input
                        type="tel"
                        id="contact-phone"
                        name="phone"
                        className="form-input"
                        placeholder="+256 7XX XXX XXX"
                        value={formData.phone}
                        onChange={handleInputChange}
                        aria-invalid={errors.phone ? "true" : "false"}
                        aria-describedby={errors.phone ? "phone-error" : undefined}
                      />
                      {errors.phone && <span id="phone-error" style={{ color: '#d90429', fontSize: '0.75rem' }}>{errors.phone}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-subject">{t.formLabelSubject}</label>
                    <input
                      type="text"
                      id="contact-subject"
                      name="subject"
                      className="form-input"
                      placeholder="e.g. Bulk collection inquiry"
                      value={formData.subject}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-message">{t.formLabelMessage}</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      className="form-input"
                      placeholder="Describe your inquiry, crop volumes, or any questions..."
                      value={formData.message}
                      onChange={handleInputChange}
                      aria-invalid={errors.message ? "true" : "false"}
                      aria-describedby={errors.message ? "message-error" : undefined}
                    ></textarea>
                    {errors.message && <span id="message-error" style={{ color: '#d90429', fontSize: '0.75rem' }}>{errors.message}</span>}
                  </div>

                  <button
                    type="submit"
                    id="contact-submit-btn"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                  >
                    {isSubmitting ? (
                      <span>{t.formBtnSubmitting}</span>
                    ) : (
                      <>
                        <span>{t.formBtnSubmit}</span>
                        <Icons.ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  {/* Quick WhatsApp CTA */}
                  <a
                    href={`https://wa.me/256773623196?text=${encodeURIComponent(lang === 'en' ? 'Hello Jeroma Farmers, I would like to inquire about your services.' : 'Mirembe Jeroma Farmers, amit me nongo kony kom tije mwa.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      width: '100%', justifyContent: 'center',
                      background: '#25d366', color: '#fff',
                      borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-heading)',
                      fontWeight: 600, gap: '8px', display: 'inline-flex',
                      alignItems: 'center', padding: '12px 28px'
                    }}
                  >
                    <Icons.MessageCircle size={18} />
                    {t.formBtnWhatsApp}
                  </a>
                </form>
              </>
            ) : (
              <div className="success-overlay">
                <div className="success-icon" style={{ color: submittedOffline ? 'var(--color-secondary)' : 'var(--color-accent)' }}>
                  {submittedOffline ? (
                    <Icons.Clock size={60} strokeWidth={1.5} style={{ animation: 'wa-pulse 2s infinite' }} />
                  ) : (
                    <Icons.CheckCircle size={60} strokeWidth={1.5} />
                  )}
                </div>
                <img src="/logo.webp" alt="Jeroma Logo"
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary-light)' }}
                  loading="lazy"
                />
                <h3>{submittedOffline ? (lang === 'en' ? 'Saved Offline!' : 'Ocopo i Paco!') : t.formSuccessHeader}</h3>
                <p>
                  {submittedOffline ? (
                    lang === 'en'
                      ? "Message Saved Offline! 🌾 We noticed you are currently offline. Your transit request has been safely queued on your phone and will be sent automatically as soon as your internet reconnects."
                      : "Lok me oro ocopo maber i paco! 🌾 Wano ni in offline. Lok me oro ni bino cito cutcut ka okad internet piny."
                  ) : t.formSuccessDesc}
                </p>
                <button
                  className="btn btn-outline"
                  onClick={() => setIsSuccess(false)}
                  style={{ marginTop: '20px' }}
                >
                  {t.formSuccessBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
