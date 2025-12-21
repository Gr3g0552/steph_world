import React from 'react';
import { motion } from 'framer-motion';
import './Footer.css';

const Footer = () => {
  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="footer-content">
        <div className="footer-section">
          <h3>Me contacter</h3>
          <a href="mailto:gregory.monsoro@gmail.com" className="footer-link">
            gregory.monsoro@gmail.com
          </a>
        </div>
        <div className="footer-section">
          <h3>LinkedIn</h3>
          <a
            href="https://pf.linkedin.com/in/gregory-monsoro-0759881a5?trk=people-guest_people_search-card"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Gregory Monsoro
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 Steph World. Tous droits réservés.</p>
      </div>
    </motion.footer>
  );
};

export default Footer;

