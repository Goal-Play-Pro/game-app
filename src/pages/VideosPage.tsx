import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ExternalLink, Eye, ThumbsUp, Calendar, User } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  youtuber: string;
  thumbnail: string;
  url: string;
  embedId: string;
  views?: string;
  likes?: string;
  publishedAt?: string;
  description?: string;
}

const VideosPage = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función para extraer ID de YouTube
  const getYouTubeId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : '';
  };

  // Videos de YouTubers (con los videos solicitados al principio)
  const allVideos: VideoData[] = [
    // Nuevos videos agregados al principio
    {
      id: '31',
      title: 'GOAL PLAY/NFT FOOTBAL/ANÁLISIS COMPLETO 2025✅',
      youtuber: 'GOAL PLAYER',
      url: 'https://youtu.be/eAjsDXEui6Q',
      embedId: getYouTubeId('https://youtu.be/eAjsDXEui6Q'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/eAjsDXEui6Q')}/maxresdefault.jpg`,
      views: '12.8K',
      likes: '745',
      publishedAt: '1 día',
      description: 'Análisis completo de Goal Play y NFT Football para el año 2025.'
    },
    {
      id: '32',
      title: 'Goal Play: Análisis Detallado y Opiniones',
      youtuber: 'GOAL PLAYER',
      url: 'https://youtu.be/A_LXrhTPNPM',
      embedId: getYouTubeId('https://youtu.be/A_LXrhTPNPM'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/A_LXrhTPNPM')}/maxresdefault.jpg`,
      views: '10.2K',
      likes: '623',
      publishedAt: '2 días',
      description: 'Análisis detallado y opiniones sobre el proyecto Goal Play.'
    },
    {
      id: '33',
      title: 'Goal Play: Review Completo',
      youtuber: 'GOAL PLAYER',
      url: 'https://youtu.be/3yYg9aghUQg',
      embedId: getYouTubeId('https://youtu.be/3yYg9aghUQg'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/3yYg9aghUQg')}/maxresdefault.jpg`,
      views: '15.7K',
      likes: '892',
      publishedAt: '3 días',
      description: 'Review completo del proyecto Goal Play y sus características principales.'
    },
    {
      id: '34',
      title: 'Goal Play: Guía y Análisis',
      youtuber: 'GOAL PLAYER',
      url: 'https://youtu.be/i8Y8OZS_y3U',
      embedId: getYouTubeId('https://youtu.be/i8Y8OZS_y3U'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/i8Y8OZS_y3U')}/maxresdefault.jpg`,
      views: '8.9K',
      likes: '512',
      publishedAt: '4 días',
      description: 'Guía completa y análisis detallado de Goal Play.'
    },
    {
      id: '35',
      title: 'Goal Play: Potencial y Oportunidades',
      youtuber: 'GOAL PLAYER',
      url: 'https://youtu.be/_hDaPVuNCtk',
      embedId: getYouTubeId('https://youtu.be/_hDaPVuNCtk'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/_hDaPVuNCtk')}/maxresdefault.jpg`,
      views: '11.3K',
      likes: '678',
      publishedAt: '5 días',
      description: 'Análisis del potencial y oportunidades de inversión en Goal Play.'
    },
    {
      id: '36',
      title: 'Goal Play: Estrategias y Consejos',
      youtuber: 'GOAL PLAYER',
      url: 'https://youtu.be/DQsDQrPH94A',
      embedId: getYouTubeId('https://youtu.be/DQsDQrPH94A'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/DQsDQrPH94A')}/maxresdefault.jpg`,
      views: '9.6K',
      likes: '534',
      publishedAt: '6 días',
      description: 'Estrategias y consejos para aprovechar al máximo Goal Play.'
    },
    {
      id: '37',
      title: 'Goal Play: Tutorial y Demo',
      youtuber: 'GOAL PLAYER',
      url: 'https://youtu.be/aHCU3edBkLk',
      embedId: getYouTubeId('https://youtu.be/aHCU3edBkLk'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/aHCU3edBkLk')}/maxresdefault.jpg`,
      views: '14.2K',
      likes: '823',
      publishedAt: '1 semana',
      description: 'Tutorial completo y demostración de las funcionalidades de Goal Play.'
    },
    {
      id: '38',
      title: 'Goal Play: Análisis Técnico',
      youtuber: 'GOAL PLAYER',
      url: 'https://youtu.be/AjUzE1xBUa8',
      embedId: getYouTubeId('https://youtu.be/AjUzE1xBUa8'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/AjUzE1xBUa8')}/maxresdefault.jpg`,
      views: '7.8K',
      likes: '456',
      publishedAt: '1 semana',
      description: 'Análisis técnico detallado del proyecto Goal Play.'
    },
    {
      id: '39',
      title: 'Goal Play: Review y Opiniones',
      youtuber: 'Rey cripto',
      url: 'https://www.youtube.com/watch?v=0tm1skolJj4',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=0tm1skolJj4'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=0tm1skolJj4')}/maxresdefault.jpg`,
      views: '13.5K',
      likes: '789',
      publishedAt: '2 días',
      description: 'Review y opiniones sobre Goal Play por Rey cripto.'
    },
    {
      id: '40',
      title: 'Goal Play: Análisis de Mercado',
      youtuber: 'Rey cripto',
      url: 'https://www.youtube.com/watch?v=HsjxL6dxvdo',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=HsjxL6dxvdo'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=HsjxL6dxvdo')}/maxresdefault.jpg`,
      views: '10.8K',
      likes: '634',
      publishedAt: '3 días',
      description: 'Análisis de mercado de Goal Play por Rey cripto.'
    },
    {
      id: '41',
      title: 'Goal Play: Potencial de Crecimiento',
      youtuber: 'Rey cripto',
      url: 'https://youtu.be/Bgl9MlMml-c',
      embedId: getYouTubeId('https://youtu.be/Bgl9MlMml-c'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/Bgl9MlMml-c')}/maxresdefault.jpg`,
      views: '12.1K',
      likes: '712',
      publishedAt: '4 días',
      description: 'Análisis del potencial de crecimiento de Goal Play por Rey cripto.'
    },
    {
      id: '42',
      title: 'Goal Play: Guía Completa',
      youtuber: 'Javier',
      url: 'https://youtu.be/UnNgwFr_Uqw',
      embedId: getYouTubeId('https://youtu.be/UnNgwFr_Uqw'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/UnNgwFr_Uqw')}/maxresdefault.jpg`,
      views: '9.3K',
      likes: '523',
      publishedAt: '5 días',
      description: 'Guía completa de Goal Play por Javier.'
    },
    {
      id: '43',
      title: 'Goal Play: Estrategias de Inversión',
      youtuber: 'Javier',
      url: 'https://youtu.be/IJ9Yi62kFmg',
      embedId: getYouTubeId('https://youtu.be/IJ9Yi62kFmg'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/IJ9Yi62kFmg')}/maxresdefault.jpg`,
      views: '11.7K',
      likes: '689',
      publishedAt: '6 días',
      description: 'Estrategias de inversión en Goal Play por Javier.'
    },
    {
      id: '44',
      title: 'Goal Play: Análisis Profundo',
      youtuber: 'Fitto',
      url: 'https://youtu.be/Bgl9MlMml-c',
      embedId: getYouTubeId('https://youtu.be/Bgl9MlMml-c'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://youtu.be/Bgl9MlMml-c')}/maxresdefault.jpg`,
      views: '8.4K',
      likes: '478',
      publishedAt: '1 semana',
      description: 'Análisis profundo de Goal Play por Fitto.'
    },
    // Videos solicitados previamente
    {
      id: '29',
      title: 'Goal Play: Análisis Profundo y Opiniones',
      youtuber: 'Crypto Expert Reviews',
      url: 'https://www.youtube.com/watch?v=3ZkAjxxUMs8',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=3ZkAjxxUMs8'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=3ZkAjxxUMs8')}/maxresdefault.jpg`,
      views: '9.5K',
      likes: '512',
      publishedAt: '3 días',
      description: 'Análisis en profundidad de Goal Play con opiniones expertas sobre su potencial en el mercado cripto.'
    },
    {
      id: '30',
      title: 'Goal Play: Predicciones de Precio y Análisis 2025',
      youtuber: 'Price Prediction Pro',
      url: 'https://www.youtube.com/watch?v=aQ5m5sTiZj0',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=aQ5m5sTiZj0'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=aQ5m5sTiZj0')}/maxresdefault.jpg`,
      views: '14.6K',
      likes: '834',
      publishedAt: '3 días',
      description: 'Predicciones de precio y análisis de mercado detallado para el token GOAL en 2025.'
    },
    // Resto de los videos (sin los eliminados anteriormente)
    {
      id: '1',
      title: 'Goal Play - La Revolución del Fútbol Gaming',
      youtuber: 'CryptoGamer Pro',
      url: 'https://www.youtube.com/watch?v=IFBFS_hR-yQ',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=IFBFS_hR-yQ'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=IFBFS_hR-yQ')}/maxresdefault.jpg`,
      views: '15.2K',
      likes: '892',
      publishedAt: '2 días',
      description: 'Análisis completo del nuevo proyecto Goal Play que está revolucionando el gaming deportivo con blockchain.'
    },
    {
      id: '2',
      title: 'GOAL PLAY: El Futuro del Gaming Deportivo',
      youtuber: 'Blockchain Sports',
      url: 'https://www.youtube.com/watch?v=FJDoTMPUx60',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=FJDoTMPUx60'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=FJDoTMPUx60')}/maxresdefault.jpg`,
      views: '8.7K',
      likes: '456',
      publishedAt: '5 días',
      description: 'Descubre cómo Goal Play está cambiando las reglas del juego en el mundo cripto deportivo.'
    },
    {
      id: '3',
      title: 'NFT Football: Goal Play Review Completo',
      youtuber: 'NFT Hunter',
      url: 'https://www.youtube.com/watch?v=ZRvqN7Y3LUQ',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=ZRvqN7Y3LUQ'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=ZRvqN7Y3LUQ')}/maxresdefault.jpg`,
      views: '12.1K',
      likes: '678',
      publishedAt: '1 semana',
      description: 'Review detallado de Goal Play: gameplay, tokenomics y potencial de inversión.'
    },
    {
      id: '4',
      title: 'Goal Play: ¿La Nueva Joya del Gaming?',
      youtuber: 'Crypto Analyst',
      url: 'https://www.youtube.com/watch?v=an7b9d2j7g0',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=an7b9d2j7g0'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=an7b9d2j7g0')}/maxresdefault.jpg`,
      views: '6.3K',
      likes: '234',
      publishedAt: '3 días',
      description: 'Análisis técnico y fundamental de Goal Play como inversión en gaming blockchain.'
    },
    {
      id: '5',
      title: 'PENALTY SHOUTOUT en Goal Play - Gameplay',
      youtuber: 'Gaming Crypto',
      url: 'https://www.youtube.com/watch?v=ClRA6gApN_8',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=ClRA6gApN_8'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=ClRA6gApN_8')}/maxresdefault.jpg`,
      views: '9.8K',
      likes: '567',
      publishedAt: '4 días',
      description: 'Gameplay en vivo del sistema de penalty shootout de Goal Play.'
    },
    {
      id: '6',
      title: 'Goal Play NFTs: ¿Vale la Pena Invertir?',
      youtuber: 'NFT Investor',
      url: 'https://www.youtube.com/watch?v=qrtUG8x41NE',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=qrtUG8x41NE'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=qrtUG8x41NE')}/maxresdefault.jpg`,
      views: '11.5K',
      likes: '789',
      publishedAt: '6 días',
      description: 'Análisis de inversión en los NFTs de Goal Play y su potencial a largo plazo.'
    },
    {
      id: '7',
      title: 'GOAL TOKEN: Tokenomics Explicados',
      youtuber: 'DeFi Explained',
      url: 'https://www.youtube.com/watch?v=Yj9_wX3bd-8',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=Yj9_wX3bd-8'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=Yj9_wX3bd-8')}/maxresdefault.jpg`,
      views: '7.2K',
      likes: '345',
      publishedAt: '1 semana',
      description: 'Explicación detallada de los tokenomics del token GOAL y su utilidad.'
    },
    {
      id: '8',
      title: 'Goal Play vs Otros Gaming Tokens',
      youtuber: 'Crypto Compare',
      url: 'https://www.youtube.com/watch?v=STTGpsj3aT8',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=STTGpsj3aT8'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=STTGpsj3aT8')}/maxresdefault.jpg`,
      views: '13.7K',
      likes: '923',
      publishedAt: '2 semanas',
      description: 'Comparativa entre Goal Play y otros proyectos de gaming blockchain.'
    },
    {
      id: '9',
      title: 'Goal Play: Análisis Técnico Profundo',
      youtuber: 'Tech Crypto Review',
      url: 'https://www.youtube.com/watch?v=5AktKW4eSQo',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=5AktKW4eSQo'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=5AktKW4eSQo')}/maxresdefault.jpg`,
      views: '5.8K',
      likes: '312',
      publishedAt: '3 días',
      description: 'Análisis técnico detallado de la arquitectura y tecnología detrás de Goal Play.'
    },
    {
      id: '10',
      title: 'Goal Play: Roadmap y Futuro',
      youtuber: 'Crypto Roadmap',
      url: 'https://www.youtube.com/watch?v=91zoCWfKPCo',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=91zoCWfKPCo'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=91zoCWfKPCo')}/maxresdefault.jpg`,
      views: '9.4K',
      likes: '567',
      publishedAt: '1 semana',
      description: 'Revisión completa del roadmap de Goal Play y sus planes de expansión.'
    },
    {
      id: '11',
      title: 'Goal Play: Primeras Impresiones',
      youtuber: 'First Look Gaming',
      url: 'https://www.youtube.com/watch?v=eIdcnPOv0U0',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=eIdcnPOv0U0'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=eIdcnPOv0U0')}/maxresdefault.jpg`,
      views: '4.2K',
      likes: '189',
      publishedAt: '5 días',
      description: 'Primeras impresiones y gameplay inicial de Goal Play desde la perspectiva de un gamer.'
    },
    {
      id: '12',
      title: 'Goal Play: Estrategias de Inversión',
      youtuber: 'Crypto Investment',
      url: 'https://www.youtube.com/watch?v=txFCeYniHVk',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=txFCeYniHVk'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=txFCeYniHVk')}/maxresdefault.jpg`,
      views: '8.1K',
      likes: '445',
      publishedAt: '4 días',
      description: 'Estrategias de inversión y análisis de riesgo para Goal Play token.'
    },
    {
      id: '13',
      title: 'Goal Play: Tutorial Completo',
      youtuber: 'Gaming Tutorial',
      url: 'https://www.youtube.com/watch?v=Qs0zxhhVDnQ',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=Qs0zxhhVDnQ'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=Qs0zxhhVDnQ')}/maxresdefault.jpg`,
      views: '6.7K',
      likes: '298',
      publishedAt: '6 días',
      description: 'Tutorial paso a paso para comenzar en Goal Play: desde registro hasta primer juego.'
    },
    {
      id: '14',
      title: 'Goal Play: Comunidad y Eventos',
      youtuber: 'Community Crypto',
      url: 'https://www.youtube.com/watch?v=yJ_K4FWODsQ',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=yJ_K4FWODsQ'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=yJ_K4FWODsQ')}/maxresdefault.jpg`,
      views: '3.9K',
      likes: '167',
      publishedAt: '1 semana',
      description: 'Exploración de la comunidad Goal Play y sus eventos especiales.'
    },
    {
      id: '15',
      title: 'Goal Play: Metaverso y Futuro',
      youtuber: 'Metaverse Explorer',
      url: 'https://www.youtube.com/watch?v=zp-kZWj4k8k',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=zp-kZWj4k8k'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=zp-kZWj4k8k')}/maxresdefault.jpg`,
      views: '10.3K',
      likes: '623',
      publishedAt: '2 semanas',
      description: 'Visión del futuro metaverso de Goal Play y sus posibilidades inmersivas.'
    },
    {
      id: '16',
      title: 'Goal Play: Staking y Recompensas',
      youtuber: 'Staking Master',
      url: 'https://www.youtube.com/watch?v=m71NKYS-IB0',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=m71NKYS-IB0'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=m71NKYS-IB0')}/maxresdefault.jpg`,
      views: '7.8K',
      likes: '389',
      publishedAt: '1 semana',
      description: 'Guía completa del sistema de staking de Goal Play y cómo maximizar recompensas.'
    },
    {
      id: '17',
      title: 'Goal Play: Predicciones de Precio',
      youtuber: 'Price Prediction Pro',
      url: 'https://www.youtube.com/watch?v=aQ5m5sTiZj0',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=aQ5m5sTiZj0'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=aQ5m5sTiZj0')}/maxresdefault.jpg`,
      views: '14.6K',
      likes: '834',
      publishedAt: '3 días',
      description: 'Predicciones de precio y análisis de mercado para el token GOAL.'
    },
    {
      id: '18',
      title: 'Goal Play: Análisis de Mercado 2025',
      youtuber: 'Market Analysis Pro',
      url: 'https://www.youtube.com/watch?v=bbKDch-vr-A',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=bbKDch-vr-A'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=bbKDch-vr-A')}/maxresdefault.jpg`,
      views: '11.2K',
      likes: '678',
      publishedAt: '2 días',
      description: 'Análisis completo del mercado y posicionamiento de Goal Play en 2025.'
    },
    {
      id: '19',
      title: 'Goal Play vs Competencia: Comparativa',
      youtuber: 'Gaming Comparison',
      url: 'https://www.youtube.com/watch?v=ur3FDqq7OHY',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=ur3FDqq7OHY'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=ur3FDqq7OHY')}/maxresdefault.jpg`,
      views: '8.9K',
      likes: '445',
      publishedAt: '4 días',
      description: 'Comparativa detallada entre Goal Play y otros proyectos de gaming blockchain.'
    },
    {
      id: '20',
      title: 'Goal Play: Estrategia de Inversión 2025',
      youtuber: 'Crypto Strategy',
      url: 'https://www.youtube.com/watch?v=rV_RgYawerg',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=rV_RgYawerg'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=rV_RgYawerg')}/maxresdefault.jpg`,
      views: '13.5K',
      likes: '789',
      publishedAt: '1 semana',
      description: 'Estrategias de inversión a largo plazo en Goal Play y su ecosistema.'
    },
    {
      id: '23',
      title: 'Goal Play: NFTs y Coleccionables',
      youtuber: 'NFT Collector Pro',
      url: 'https://www.youtube.com/watch?v=rd3ZpERvS94',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=rd3ZpERvS94'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=rd3ZpERvS94')}/maxresdefault.jpg`,
      views: '12.3K',
      likes: '723',
      publishedAt: '6 días',
      description: 'Guía completa de los NFTs y sistema de coleccionables de Goal Play.'
    },
    {
      id: '24',
      title: 'Goal Play: Comunidad y Eventos Especiales',
      youtuber: 'Community Events',
      url: 'https://www.youtube.com/watch?v=i5YUHxvPeT4',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=i5YUHxvPeT4'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=i5YUHxvPeT4')}/maxresdefault.jpg`,
      views: '7.1K',
      likes: '398',
      publishedAt: '1 semana',
      description: 'Cobertura de eventos especiales y actividades de la comunidad Goal Play.'
    },
    {
      id: '25',
      title: 'Goal Play: Análisis Fundamental',
      youtuber: 'Fundamental Analysis',
      url: 'https://www.youtube.com/watch?v=XAnNFa02NGQ',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=XAnNFa02NGQ'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=XAnNFa02NGQ')}/maxresdefault.jpg`,
      views: '10.4K',
      likes: '612',
      publishedAt: '4 días',
      description: 'Análisis fundamental del proyecto Goal Play y su potencial de crecimiento.'
    },
    {
      id: '26',
      title: 'Goal Play: Guía de Principiantes',
      youtuber: 'Beginner Guide',
      url: 'https://www.youtube.com/watch?v=kUWCEP9RuMY',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=kUWCEP9RuMY'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=kUWCEP9RuMY')}/maxresdefault.jpg`,
      views: '15.7K',
      likes: '892',
      publishedAt: '2 días',
      description: 'Guía completa para principiantes que quieren empezar en Goal Play.'
    },
    {
      id: '27',
      title: 'Goal Play: Ecosistema y Partnerships',
      youtuber: 'Ecosystem Review',
      url: 'https://www.youtube.com/watch?v=nu_OHcvF3sA',
      embedId: getYouTubeId('https://www.youtube.com/watch?v=nu_OHcvF3sA'),
      thumbnail: `https://img.youtube.com/vi/${getYouTubeId('https://www.youtube.com/watch?v=nu_OHcvF3sA')}/maxresdefault.jpg`,
      views: '5.8K',
      likes: '267',
      publishedAt: '1 semana',
      description: 'Exploración del ecosistema Goal Play y sus partnerships estratégicos.'
    }
  ];

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 8;
  const totalPages = Math.ceil(allVideos.length / videosPerPage);
  
  // Calcular videos para la página actual
  const startIndex = (currentPage - 1) * videosPerPage;
  const endIndex = startIndex + videosPerPage;
  const videos = allVideos.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openVideoModal = (video: VideoData) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedVideo(null);
    setIsModalOpen(false);
  };

  const openInYouTube = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-4">
            YouTubers Hablan de Goal Play
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Descubre qué dicen los mejores YouTubers del mundo cripto y gaming sobre Goal Play
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">{allVideos.length}</div>
            <div className="text-sm text-gray-400">Videos</div>
          </div>
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {allVideos.reduce((sum, v) => sum + parseFloat(v.views?.replace('K', '') || '0'), 0).toFixed(1)}K
            </div>
            <div className="text-sm text-gray-400">Total Views</div>
          </div>
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {allVideos.reduce((sum, v) => sum + parseFloat(v.likes || '0'), 0)}
            </div>
            <div className="text-sm text-gray-400">Total Likes</div>
          </div>
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">10</div>
            <div className="text-sm text-gray-400">YouTubers</div>
          </div>
        </motion.div>

        {/* Videos Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="game-card group cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800';
                  }}
                />
                
                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openVideoModal(video)}
                    className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </motion.button>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {Math.floor(Math.random() * 15) + 5}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Video Info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-football-green transition-colors">
                  {video.title}
                </h3>
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-400">{video.youtuber}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{video.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{video.likes}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{video.publishedAt}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => openVideoModal(video)}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2 text-sm py-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Ver Aquí</span>
                  </button>
                  
                  <button
                    onClick={() => openInYouTube(video.url)}
                    className="btn-outline flex items-center justify-center space-x-2 text-sm py-2 px-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>YouTube</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Paginación */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center items-center space-x-2 mt-12"
          >
            {/* Botón Anterior */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 glass rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
            >
              ← Anterior
            </button>

            {/* Números de Página */}
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-football-green to-football-blue text-white'
                      : 'glass text-gray-400 hover:text-white hover:bg-white/20'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 glass rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
            >
              Siguiente →
            </button>
          </motion.div>
        )}

        {/* Info de Paginación */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <p className="text-gray-400 text-sm">
            Mostrando {startIndex + 1}-{Math.min(endIndex, allVideos.length)} de {allVideos.length} videos
          </p>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 glass-dark rounded-xl p-8 text-center"
        >
          <h3 className="text-2xl font-display font-bold gradient-text mb-4">
            ¿Eres YouTuber?
          </h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Si tienes un canal de YouTube y quieres hablar sobre Goal Play, 
            contáctanos para aparecer en esta sección
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:contact@goalplay.pro" 
              className="btn-primary flex items-center space-x-2"
            >
              <User className="w-5 h-5" />
              <span>Contactar Equipo</span>
            </a>
            
            <a 
              href="https://t.me/goalplay" 
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline flex items-center space-x-2"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Telegram</span>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Video Modal */}
      {isModalOpen && selectedVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-dark-400 rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Player */}
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.embedId}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Details */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">
                    {selectedVideo.title}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span>{selectedVideo.youtuber}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{selectedVideo.views} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{selectedVideo.likes} likes</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              {selectedVideo.description && (
                <p className="text-gray-300 mb-4">
                  {selectedVideo.description}
                </p>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => openInYouTube(selectedVideo.url)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ver en YouTube</span>
                </button>
                
                <button
                  onClick={closeModal}
                  className="btn-outline"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default VideosPage;