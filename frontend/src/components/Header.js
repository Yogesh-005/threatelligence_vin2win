import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Container } from '../styles/themes';

const HeaderContainer = styled.header`
  background-color: #161b22;
  border-bottom: 1px solid #30363d;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Nav = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #e0e0e0;
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 0;
`;

const NavLink = styled(Link)`
  background: none;
  border: none;
  color: ${props => props.$active ? '#e0e0e0' : '#8b949e'};
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 0 4px;
  position: relative;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: #e0e0e0;
    background-color: #21262d;
    text-decoration: none;
  }

  ${props => props.$active && `
    background-color: #21262d;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -17px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background-color: #f093fb;
      border-radius: 1px;
    }
  `}
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8b949e;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #28a745;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

function Header() {
  const location = useLocation();
  const [systemStatus, setSystemStatus] = React.useState('online');

  const navigation = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/articles', label: 'Articles', icon: '📰' },
    { path: '/iocs', label: 'IOCs', icon: '🔍' },
    { path: '/feeds', label: 'Feeds', icon: '📡' },
  ];

  const isActive = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/dashboard')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <HeaderContainer>
      <Nav>
        <Logo>
          <LogoIcon>🛡️</LogoIcon>
          Threatelligence
        </Logo>
        
        <NavLinks>
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              $active={isActive(item.path)}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </NavLinks>

        <StatusIndicator>
          <StatusDot />
          System {systemStatus}
        </StatusIndicator>
      </Nav>
    </HeaderContainer>
  );
}

export default Header;