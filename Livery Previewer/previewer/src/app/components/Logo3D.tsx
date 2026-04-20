import { useState } from 'react'

const LOGO_3D_STYLES = `
  .logo-3d-container {
    perspective: 1000px;
    transform-style: preserve-3d;
  }

  .logo-3d {
    position: relative;
    transform-style: preserve-3d;
    animation: logo3dRotate 8s linear infinite;
  }

  .logo-3d-text {
    font-family: 'Inter', sans-serif;
    font-weight: 900;
    font-size: 3rem;
    color: #c4ff0d;
    text-transform: lowercase;
    letter-spacing: -0.02em;
    position: relative;
    transform-style: preserve-3d;
    text-shadow: 
      0 0 20px rgba(196, 255, 13, 0.5),
      0 0 40px rgba(196, 255, 13, 0.3),
      0 0 60px rgba(196, 255, 13, 0.1);
    animation: logo3dFloat 3s ease-in-out infinite;
  }

  .logo-3d-subtitle {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: #71717a;
    text-transform: lowercase;
    letter-spacing: 0.1em;
    margin-top: 8px;
    opacity: 0.8;
  }

  .logo-3d-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120%;
    height: 120%;
    background: radial-gradient(circle, rgba(196, 255, 13, 0.1) 0%, transparent 70%);
    filter: blur(20px);
    animation: logo3dGlow 4s ease-in-out infinite;
    pointer-events: none;
  }

  .logo-3d-particles {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: 2px;
    height: 2px;
    background: #c4ff0d;
    border-radius: 50%;
    opacity: 0.6;
    animation: particleFloat 6s linear infinite;
  }

  @keyframes logo3dRotate {
    0% { transform: rotateY(0deg) rotateX(0deg); }
    25% { transform: rotateY(90deg) rotateX(5deg); }
    50% { transform: rotateY(180deg) rotateX(0deg); }
    75% { transform: rotateY(270deg) rotateX(-5deg); }
    100% { transform: rotateY(360deg) rotateX(0deg); }
  }

  @keyframes logo3dFloat {
    0%, 100% { transform: translateY(0px) translateZ(0px); }
    50% { transform: translateY(-10px) translateZ(20px); }
  }

  @keyframes logo3dGlow {
    0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.2); }
  }

  @keyframes particleFloat {
    0% {
      transform: translateY(0px) translateX(0px);
      opacity: 0;
    }
    10% {
      opacity: 0.6;
    }
    90% {
      opacity: 0.6;
    }
    100% {
      transform: translateY(-100px) translateX(50px);
      opacity: 0;
    }
  }

  .logo-3d-container:hover .logo-3d-text {
    color: #88ff00;
    text-shadow: 
      0 0 30px rgba(136, 255, 0, 0.8),
      0 0 60px rgba(136, 255, 0, 0.4),
      0 0 90px rgba(136, 255, 0, 0.2);
  }

  @media (max-width: 768px) {
    .logo-3d-text {
      font-size: 2rem;
    }
    .logo-3d-subtitle {
      font-size: 0.8rem;
    }
    
    /* Disable 3D rotation on mobile for better performance */
    .logo-3d {
      animation: none !important;
    }
    
    /* Simplified mobile animation */
    .logo-3d-text {
      animation: logo3dFloat 3s ease-in-out infinite !important;
    }
  }
`;

function Particle({ delay }: { delay: number }) {
  const style = {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${delay}s`,
  };

  return <div className="particle" style={style} />;
}

export default function Logo3D({ size = 200, className = "", style = {}, onClick }: { size?: number, className?: string, style?: React.CSSProperties, onClick?: () => void }) {
  const [stylesLoaded, setStylesLoaded] = useState(false);

  // Load styles once
  if (!stylesLoaded && typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = LOGO_3D_STYLES;
    styleElement.id = 'logo-3d-styles';
    document.head.appendChild(styleElement);
    setStylesLoaded(true);
  }

  return (
    <div className={`logo-3d-container ${className}`} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', ...style }} onClick={onClick}>
      {/* Glow effect */}
      <div className="logo-3d-glow" />
      
      {/* Particles */}
      <div className="logo-3d-particles">
        {[...Array(20)].map((_, i) => (
          <Particle key={i} delay={Math.random() * 6} />
        ))}
      </div>
      
      {/* 3D Logo */}
      <div className="logo-3d">
        <div style={{ textAlign: 'center' }}>
          <div className="logo-3d-text">itzz</div>
          <div className="logo-3d-subtitle">industries</div>
        </div>
      </div>
    </div>
  );
}
