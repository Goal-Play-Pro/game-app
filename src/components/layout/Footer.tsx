import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Twitter, 
  Instagram, 
  Users, 
  Github, 
  Mail, 
  ArrowRight,
  Heart,
  Trophy,
  Target,
  Zap
} from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    game: [
      { name: 'Play Now', href: '/game' },
      { name: 'Leaderboard', href: '/leaderboard' },
      { name: 'Videos', href: '/videos' },
      { name: 'About Goal Play', href: '/about' },
    ],
    marketplace: [
      { name: 'Shop', href: '/shop' },
      { name: 'My Inventory', href: '/inventory' },
      { name: 'Cajas Sorpresa', href: '/shop' },
      { name: 'Tokenomics', href: '/tokenomics' },
    ],
    community: [
      { name: 'Telegram', href: 'https://t.me/goalplay' },
      { name: 'Twitter (X)', href: 'https://twitter.com/goalplay' },
      { name: 'Instagram', href: 'https://instagram.com/goalplay' },
      { name: 'TikTok', href: 'https://tiktok.com/@goalplay' },
      { name: 'YouTubers', href: '/videos' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Roadmap', href: '/roadmap' },
      { name: 'Whitepaper', href: 'https://whitepaper.goalplay.pro/' },
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Users, href: '#', label: 'Discord' },
    { icon: Github, href: '#', label: 'Github' },
  ];

  const gameFeatures = [
    { icon: Target, title: 'Penalty Shootouts', description: 'Master the art of penalty kicks' },
    { icon: Trophy, title: 'Tournaments', description: 'Compete in global competitions' },
    { icon: Zap, title: 'NFT Players', description: 'Collect and upgrade unique players' },
  ];

  return (
    <footer className="relative mt-20 glass-dark border-t border-white/10">
      {/* Game Features Section */}
      <div className="container-responsive section-spacing">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-responsive-lg font-display font-bold gradient-text margin-responsive-b">
            Experience Football Gaming Like Never Before
          </h3>
          <p className="text-responsive-sm text-gray-400 margin-responsive-b max-w-responsive-md mx-auto">
            Join thousands of players in the ultimate football gaming experience with blockchain rewards and NFT collectibles.
          </p>
          
          <div className="grid-responsive-cards margin-responsive-b">
            {gameFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="game-card text-center padding-responsive"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto margin-responsive-b">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h4 className="text-responsive-base font-semibold text-white margin-responsive-b">{feature.title}</h4>
                <p className="text-responsive-xs text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Newsletter */}
          <div className="flex flex-col sm:flex-row max-w-responsive-sm mx-auto gap-responsive">
            <div className="flex-1">
              <input
                type="email"
                placeholder="Enter your email for updates"
                className="w-full input-field text-responsive-sm"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center justify-center space-x-2 touch-target"
            >
              <span className="text-responsive-sm">Subscribe</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Links Grid */}
        <div className="footer-responsive margin-responsive-b">
          <div>
            <h4 className="text-responsive-base font-semibold text-white margin-responsive-b">Game</h4>
            <ul className="space-responsive-y">
              {footerLinks.game.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-responsive-xs text-gray-400 hover:text-football-green transition-colors duration-200 touch-target block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-responsive-base font-semibold text-white margin-responsive-b">Marketplace</h4>
            <ul className="space-responsive-y">
              {footerLinks.marketplace.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-responsive-xs text-gray-400 hover:text-football-green transition-colors duration-200 touch-target block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-responsive-base font-semibold text-white margin-responsive-b">Community</h4>
            <ul className="space-responsive-y">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-responsive-xs text-gray-400 hover:text-football-green transition-colors duration-200 touch-target block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-responsive-base font-semibold text-white margin-responsive-b">Company</h4>
            <ul className="space-responsive-y">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-responsive-xs text-gray-400 hover:text-football-green transition-colors duration-200 touch-target block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex-responsive-center pt-6 sm:pt-8 border-t border-white/10 gap-4 sm:gap-0">
          {/* Logo and Copyright */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img
                src="https://photos.pinksale.finance/file/pinksale-logo-upload/1756173488726-1bb87d41d15fe27b500a4bfcde01bb0e.png"
                alt="Gol Play Logo"
                className="h-6 sm:h-8 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-football-green to-football-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">G</span>
              </div>
              <span className="font-display font-bold text-lg sm:text-xl gradient-text">
                Gol Play
              </span>
            </Link>
            <span className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              © 2024 Gol Play. All rights reserved.
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 sm:p-3 glass rounded-lg text-gray-400 hover:text-football-green transition-colors duration-200 touch-target"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Made with Love */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10"
        >
          <p className="text-gray-400 text-xs sm:text-sm flex items-center justify-center space-x-1 flex-wrap">
            <span>Made with</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Heart className="w-4 h-4 text-red-500 fill-current" />
            </motion.span>
            <span>for football gaming enthusiasts • API: game.goalplay.pro</span>
          </p>
        </motion.div>
      </div>

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-500 via-transparent to-transparent pointer-events-none" />
    </footer>
  );
};

export default Footer;