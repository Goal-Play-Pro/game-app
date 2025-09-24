import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Share2, ExternalLink, QrCode } from 'lucide-react';
import { shareContent, showCopyNotification } from '../../utils/share.utils';

interface ReferralLinkProps {
  referralLink: string;
  referralCode: string;
  className?: string;
}

const ReferralLink = ({ referralLink, referralCode, className = '' }: ReferralLinkProps) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const copyLink = async () => {
    // Usar utilidad robusta de copia
    const result = await shareContent({
      title: 'Join Gol Play with my referral link!',
      text: 'Start playing football games and earning rewards! 🚀⚽💰',
      url: referralLink
    }, {
      showNotification: false, // Manejamos la notificación manualmente
      fallbackToPrompt: false
    });

    if (result.success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      if (result.method === 'clipboard') {
        showCopyNotification('✅ Referral link copied to clipboard!');
      }
    } else {
      console.error('Failed to copy referral link');
      // Mostrar error visual
      showCopyNotification('❌ Failed to copy link', 2000);
    }
  };

  const shareLink = async () => {
    // Usar utilidad robusta de compartir
    const result = await shareContent({
      title: 'Join Gol Play with my referral link!',
      text: 'Start playing football games and earning rewards with blockchain technology! 🚀⚽💰',
      url: referralLink
    }, {
      showNotification: true,
      fallbackToPrompt: false
    });

    if (result.success) {
      console.log(`✅ Referral link shared via ${result.method}`);
    } else {
      console.log('❌ Failed to share referral link, trying copy fallback');
      copyLink();
    }
  };

  const openQRGenerator = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}`;
    window.open(qrUrl, '_blank');
  };

  return (
    <div className={`glass-dark rounded-xl p-6 ${className}`}>
      <h4 className="text-lg font-semibold text-white mb-4">Share Your Referral Link</h4>
      
      {/* Referral Code Display */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Your Referral Code</div>
        <div className="flex items-center space-x-3">
          <div className="flex-1 glass rounded-lg p-3">
            <div className="text-white font-mono text-xl text-center">
              {referralCode}
            </div>
          </div>
        </div>
      </div>

      {/* Full Link Display */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2">Full Referral Link</div>
        <div className="flex items-center space-x-2">
          <div className="flex-1 glass rounded-lg p-3">
            <div className="text-white font-mono text-sm break-all">
              {referralLink}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={copyLink}
          className={`btn-secondary flex items-center justify-center space-x-2 ${
            copySuccess ? 'bg-green-500/20 text-green-400' : ''
          }`}
        >
          <Copy className="w-4 h-4" />
          <span className="text-sm">{copySuccess ? 'Copied!' : 'Copy'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={shareLink}
          className="btn-secondary flex items-center justify-center space-x-2"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openQRGenerator}
          className="btn-secondary flex items-center justify-center space-x-2"
        >
          <QrCode className="w-4 h-4" />
          <span className="text-sm">QR Code</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🚀 Join me on Gol Play - The ultimate football gaming platform with blockchain rewards! ⚽💰`)}&url=${encodeURIComponent(referralLink)}`, '_blank')}
          className="btn-secondary flex items-center justify-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm">Tweet</span>
        </motion.button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 glass rounded-lg">
        <h5 className="text-sm font-semibold text-football-green mb-2">
          💡 How to maximize your earnings:
        </h5>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Share on social media (Twitter, Instagram, TikTok)</li>
          <li>• Send to friends who love football gaming</li>
          <li>• Post in gaming and crypto communities</li>
          <li>• Create content about Gol Play with your link</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferralLink;