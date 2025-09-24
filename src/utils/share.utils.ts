/**
 * Utilidades robustas para compartir contenido
 * Maneja Web Share API con fallbacks seguros
 */

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export interface ShareOptions {
  showNotification?: boolean;
  notificationDuration?: number;
  fallbackToPrompt?: boolean;
}

/**
 * Función principal para compartir contenido de forma robusta
 */
export const shareContent = async (
  shareData: ShareData, 
  options: ShareOptions = {}
): Promise<{ success: boolean; method: 'webshare' | 'clipboard' | 'prompt' | 'failed' }> => {
  const {
    showNotification = true,
    notificationDuration = 3000,
    fallbackToPrompt = true
  } = options;

  // Verificar si Web Share API está disponible y es seguro
  const canUseWebShare = (): boolean => {
    try {
      return (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        typeof navigator.share === 'function' &&
        navigator.canShare &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare(shareData) &&
        window.isSecureContext &&
        (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
      );
    } catch (error) {
      console.log('Web Share API verification failed:', error);
      return false;
    }
  };

  // Intentar Web Share API primero
  if (canUseWebShare()) {
    try {
      await navigator.share(shareData);
      console.log('✅ Content shared successfully via Web Share API');
      return { success: true, method: 'webshare' };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('📝 User cancelled share dialog');
        return { success: false, method: 'webshare' };
      } else {
        console.log('❌ Web Share failed, trying clipboard fallback:', error);
        // Continuar con fallback
      }
    }
  }

  // Fallback 1: Clipboard API
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareData.url);
      console.log('📋 Content copied to clipboard successfully');
      
      if (showNotification) {
        showCopyNotification('✅ Link copied to clipboard!', notificationDuration);
      }
      
      return { success: true, method: 'clipboard' };
    }
  } catch (error) {
    console.log('❌ Clipboard API failed:', error);
  }

  // Fallback 2: Legacy execCommand (para navegadores antiguos)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = shareData.url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      console.log('📋 Content copied via execCommand');
      
      if (showNotification) {
        showCopyNotification('✅ Link copied to clipboard!', notificationDuration);
      }
      
      return { success: true, method: 'clipboard' };
    }
  } catch (error) {
    console.log('❌ execCommand failed:', error);
  }

  // Fallback 3: Prompt (último recurso)
  if (fallbackToPrompt) {
    try {
      const userCopied = prompt(
        `Copy this link:\n\n${shareData.title}\n${shareData.text}`, 
        shareData.url
      );
      
      if (userCopied !== null) {
        console.log('📝 User prompted to copy link');
        return { success: true, method: 'prompt' };
      }
    } catch (error) {
      console.log('❌ Prompt failed:', error);
    }
  }

  console.log('❌ All share methods failed');
  return { success: false, method: 'failed' };
};

/**
 * Mostrar notificación visual de copia exitosa
 */
export const showCopyNotification = (message: string, duration: number = 3000): void => {
  try {
    // Remover notificación existente si existe
    const existingNotification = document.getElementById('copy-notification');
    if (existingNotification) {
      document.body.removeChild(existingNotification);
    }

    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.id = 'copy-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: rgba(0, 184, 148, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: slideInRight 0.3s ease-out;
    `;

    // Añadir animación CSS
    if (!document.getElementById('copy-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'copy-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remover después del tiempo especificado
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, duration);
  } catch (error) {
    console.log('❌ Failed to show notification:', error);
  }
};

/**
 * Verificar si el dispositivo soporta Web Share API
 */
export const isWebShareSupported = (): boolean => {
  try {
    return (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      typeof navigator.share === 'function' &&
      navigator.canShare &&
      typeof navigator.canShare === 'function' &&
      window.isSecureContext
    );
  } catch (error) {
    return false;
  }
};

/**
 * Verificar si el Clipboard API está disponible
 */
export const isClipboardSupported = (): boolean => {
  try {
    return (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      navigator.clipboard.writeText &&
      typeof navigator.clipboard.writeText === 'function'
    );
  } catch (error) {
    return false;
  }
};

/**
 * Obtener información sobre las capacidades de compartir del dispositivo
 */
export const getShareCapabilities = () => {
  return {
    webShare: isWebShareSupported(),
    clipboard: isClipboardSupported(),
    execCommand: typeof document !== 'undefined' && document.execCommand,
    isSecureContext: typeof window !== 'undefined' && window.isSecureContext,
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown'
  };
};