// frontend/src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { dashboardAPI, iocAPI, articlesAPI, getRiskColor, getRiskLevel, getTimeAgo, formatIOCType } from '../api/client';
import { Container, Card, Button, LoadingSpinner, ErrorMessage } from '../styles/themes';

const DashboardGrid = styled.div`
  display: grid;
  gap: 30px;
  margin-bottom: 30px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled(Card)`
  text-align: center;
  padding: 25px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color || '#333333'};
  }
`;

const StatValue = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: #e0e0e0;
  margin-bottom: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #a0a0a0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatChange = styled.div`
  font-size: 12px;
  color: ${props => props.positive ? '#28a745' : '#dc3545'};
  margin-top: 5px;
  font-weight: 500;
`;

const SectionTitle = styled.h3`
  color: #e0e0e0;
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #333333;
  }
`;

const ThreatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ThreatItem = styled(Card)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #555555;
    background-color: #222222;
  }
`;

const ThreatInfo = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 120px 1fr auto auto;
  gap: 20px;
  align-items: center;
`;

const ThreatType = styled.span`
  background-color: #333333;
  color: #e0e0e0;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const ThreatValue = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ThreatValueText = styled.span`
  color: #e0e0e0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  word-break: break-all;
`;

const ThreatMeta = styled.div`
  font-size: 12px;
  color: #a0a0a0;
  display: flex;
  gap: 10px;
`;

const RiskBadge = styled.span`
  background-color: ${props => getRiskColor(props.score)};
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
`;

const ActionCard = styled(Card)`
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &:hover {
    border-color: #555555;
    background-color: #222222;
    transform: translateY(-2px);
  }
`;

const ActionIcon = styled.div`
  font-size: 32px;
  margin-bottom: 10px;
  color: #666666;
`;

const ActionTitle = styled.h4`
  color: #e0e0e0;
  margin-bottom: 5px;
  font-size: 16px;
`;

const ActionDescription = styled.p`
  color: #a0a0a0;
  font-size: 14px;
  margin: 0;
`;

const TimeSelector = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: flex-end;
`;

const TimeButton = styled(Button)`
  padding: 8px 16px;
  font-size: 14px;
  background-color: ${props => props.active ? '#555555' : '#333333'};
  border-color: ${props => props.active ? '#777777' : '#555555'};
`;

const RefreshIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #a0a0a0;
  font-size: 14px;
  margin-bottom: 20px;
`;

const PageTitle = styled.h2`
  color: #e0e0e0;
  margin-bottom: 30px;
  font-size: 28px;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.status === 'healthy' ? '#28a745' : '#dc3545'};
  animation: ${props => props.status === 'healthy' ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState({ stats: true, threats: true, overview: true });
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(24);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState('unknown');
  const [lastDataFetch, setLastDataFetch] = useState({ stats: null, threats: null, overview: null });

  const timeRanges = [
    { label: '1h', value: 1 },
    { label: '6h', value: 6 },
    { label: '24h', value: 24 },
    { label: '7d', value: 168 }
  ];

  useEffect(() => {
    loadDashboardData();
    checkSystemHealth();
    
    // Auto-refresh every 15 minutes (reduced from 5 minutes)
    const interval = setInterval(() => {
      loadDashboardData();
      checkSystemHealth();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    const now = Date.now();
    const cacheTimeout = 2 * 60 * 1000; // 2 minutes cache

    // Load stats with caching
    if (!lastDataFetch.stats || (now - lastDataFetch.stats) > cacheTimeout) {
      setLoading(prev => ({ ...prev, stats: true }));
      try {
        const response = await dashboardAPI.getStats();
        setStats(response.data);
        setLastDataFetch(prev => ({ ...prev, stats: now }));
      } catch (error) {
        console.error('Stats loading error:', error);
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    }

    // Load threats with caching
    if (!lastDataFetch.threats || (now - lastDataFetch.threats) > cacheTimeout) {
      setLoading(prev => ({ ...prev, threats: true }));
      try {
        const response = await dashboardAPI.getRecentThreats(10, 25);
        setThreats(response.data.threats);
        setLastDataFetch(prev => ({ ...prev, threats: now }));
      } catch (error) {
        console.error('Threats loading error:', error);
      } finally {
        setLoading(prev => ({ ...prev, threats: false }));
      }
    }

    // Load overview (always refresh when time range changes)
    setLoading(prev => ({ ...prev, overview: true }));
    try {
      const response = await dashboardAPI.getThreatOverview(selectedTimeRange);
      setOverview(response.data);
      setLastDataFetch(prev => ({ ...prev, overview: now }));
    } catch (error) {
      console.error('Overview loading error:', error);
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }

    setLastRefresh(new Date());
    setError(null);
  };

  const checkSystemHealth = async () => {
    try {
      const response = await dashboardAPI.getHealth ? dashboardAPI.getHealth() : { data: { status: 'unknown' } };
      setSystemStatus(response.data.status);
    } catch (error) {
      setSystemStatus('unhealthy');
      console.error('Health check failed:', error);
    }
  };

  const handleRefresh = () => {
    // Clear cache and reload all data
    setLastDataFetch({ stats: null, threats: null, overview: null });
    loadDashboardData();
    checkSystemHealth();
  };

  const quickActions = [
    {
      icon: '🔄',
      title: 'Refresh Feeds',
      description: 'Manually trigger RSS feed refresh',
      action: () => window.location.href = '/feeds'
    },
    {
      icon: '🔍',
      title: 'View All IOCs',
      description: 'Browse all indicators of compromise',
      action: () => window.location.href = '/iocs'
    },
    {
      icon: '📊',
      title: 'High Risk IOCs',
      description: 'View high-risk threats',
      action: () => window.location.href = '/iocs?min_risk_score=50'
    },
    {
      icon: '📰',
      title: 'Recent Articles',
      description: 'View latest security articles',
      action: () => window.location.href = '/articles'
    }
  ];

  const isLoading = loading.stats && loading.threats && loading.overview && !stats;
  if (isLoading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingSpinner />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <PageTitle>
        Threat Intelligence Dashboard
        <StatusIndicator status={systemStatus} title={`System Status: ${systemStatus}`} />
      </PageTitle>

      <RefreshIndicator>
        <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
        <Button onClick={handleRefresh} disabled={loading.stats || loading.threats || loading.overview} style={{ padding: '4px 8px', fontSize: '12px' }}>
          {loading.stats || loading.threats || loading.overview ? <LoadingSpinner /> : 'Refresh'}
        </Button>
      </RefreshIndicator>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Quick Actions */}
      <SectionTitle>Quick Actions</SectionTitle>
      <QuickActions>
        {quickActions.map((action, index) => (
          <ActionCard key={index} onClick={action.action}>
            <ActionIcon>{action.icon}</ActionIcon>
            <ActionTitle>{action.title}</ActionTitle>
            <ActionDescription>{action.description}</ActionDescription>
          </ActionCard>
        ))}
      </QuickActions>

      {/* Overview Statistics */}
      {(stats || loading.stats) && (
        <>
          <SectionTitle>System Overview</SectionTitle>
          <StatsGrid>
            <StatCard color="#007bff">
              <StatValue>{loading.stats ? <LoadingSpinner /> : stats?.total_articles || 0}</StatValue>
              <StatLabel>Total Articles</StatLabel>
            </StatCard>
            
            <StatCard color="#28a745">
              <StatValue>{loading.stats ? <LoadingSpinner /> : stats?.total_iocs || 0}</StatValue>
              <StatLabel>Total IOCs</StatLabel>
            </StatCard>
            
            <StatCard color="#dc3545">
              <StatValue>{loading.stats ? <LoadingSpinner /> : stats?.high_risk_iocs || 0}</StatValue>
              <StatLabel>High Risk IOCs</StatLabel>
            </StatCard>
            
            <StatCard color="#ffc107">
              <StatValue>{loading.stats ? <LoadingSpinner /> : stats?.recent_articles || 0}</StatValue>
              <StatLabel>Recent Articles (24h)</StatLabel>
            </StatCard>
          </StatsGrid>
        </>
      )}

      {/* Time Range Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <SectionTitle style={{ marginBottom: 0 }}>Threat Overview</SectionTitle>
        <TimeSelector>
          {timeRanges.map(range => (
            <TimeButton
              key={range.value}
              active={selectedTimeRange === range.value}
              onClick={() => setSelectedTimeRange(range.value)}
            >
              {range.label}
            </TimeButton>
          ))}
        </TimeSelector>
      </div>

      {/* Threat Overview */}
      {(overview || loading.overview) && (
        <StatsGrid>
          <StatCard color="#17a2b8">
            <StatValue>{loading.overview ? <LoadingSpinner /> : overview?.articles_with_iocs || 0}</StatValue>
            <StatLabel>Articles with IOCs</StatLabel>
            <StatChange positive={overview?.articles_with_iocs > 0}>
              {overview?.threat_detection_rate?.toFixed(1) || 0}% detection rate
            </StatChange>
          </StatCard>
          
          <StatCard color="#fd7e14">
            <StatValue>{loading.overview ? <LoadingSpinner /> : overview?.total_iocs || 0}</StatValue>
            <StatLabel>IOCs Found</StatLabel>
            <StatChange positive={overview?.total_iocs > overview?.high_risk_iocs}>
              {overview?.high_risk_iocs || 0} high risk
            </StatChange>
          </StatCard>
        </StatsGrid>
      )}

      {/* Recent High-Risk Threats */}
      <SectionTitle>Recent High-Risk Threats</SectionTitle>
      {loading.threats ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <LoadingSpinner />
          </div>
        </Card>
      ) : threats.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0a0' }}>
            No high-risk threats detected recently.
          </div>
        </Card>
      ) : (
        <ThreatList>
          {threats.map((threat, index) => (
            <ThreatItem key={`${threat.ioc_id}-${index}`}>
              <ThreatInfo>
                <ThreatType>{formatIOCType(threat.type)}</ThreatType>
                
                <ThreatValue>
                  <ThreatValueText>{threat.value}</ThreatValueText>
                  <ThreatMeta>
                    <span>First seen: {getTimeAgo(threat.first_seen)}</span>
                    <span>• {threat.articles_count} article{threat.articles_count !== 1 ? 's' : ''}</span>
                    {threat.tags && threat.tags.length > 0 && (
                      <span>• Tags: {threat.tags.slice(0, 2).join(', ')}</span>
                    )}
                  </ThreatMeta>
                </ThreatValue>

                <RiskBadge score={threat.risk_score}>
                  {getRiskLevel(threat.risk_score)} ({Math.round(threat.risk_score)})
                </RiskBadge>

                <Link to={`/iocs/${threat.ioc_id}`}>
                  <Button style={{ padding: '8px 16px', fontSize: '14px' }}>
                    View Details
                  </Button>
                </Link>
              </ThreatInfo>
            </ThreatItem>
          ))}
        </ThreatList>
      )}

      {/* IOC Type Distribution */}
      {(stats?.ioc_types || loading.stats) && (
        <>
          <SectionTitle>IOC Distribution</SectionTitle>
          <StatsGrid>
            {loading.stats ? (
              <StatCard color="#6f42c1">
                <StatValue><LoadingSpinner /></StatValue>
                <StatLabel>Loading...</StatLabel>
              </StatCard>
            ) : (
              Object.entries(stats?.ioc_types || {}).map(([type, count]) => (
                <StatCard key={type} color="#6f42c1">
                  <StatValue>{count}</StatValue>
                  <StatLabel>{formatIOCType(type)}</StatLabel>
                </StatCard>
              ))
            )}
          </StatsGrid>
        </>
      )}

      {/* Risk Level Distribution */}
      {(stats?.risk_distribution || loading.stats) && (
        <>
          <SectionTitle>Risk Level Distribution</SectionTitle>
          <StatsGrid>
            <StatCard color="#28a745">
              <StatValue>{loading.stats ? <LoadingSpinner /> : stats?.risk_distribution?.low || 0}</StatValue>
              <StatLabel>Low Risk</StatLabel>
            </StatCard>
            
            <StatCard color="#ffc107">
              <StatValue>{loading.stats ? <LoadingSpinner /> : stats?.risk_distribution?.medium || 0}</StatValue>
              <StatLabel>Medium Risk</StatLabel>
            </StatCard>
            
            <StatCard color="#fd7e14">
              <StatValue>{loading.stats ? <LoadingSpinner /> : stats?.risk_distribution?.high || 0}</StatValue>
              <StatLabel>High Risk</StatLabel>
            </StatCard>
            
            <StatCard color="#dc3545">
              <StatValue>{loading.stats ? <LoadingSpinner /> : stats?.risk_distribution?.critical || 0}</StatValue>
              <StatLabel>Critical Risk</StatLabel>
            </StatCard>
          </StatsGrid>
        </>
      )}
    </Container>
  );
}

export default Dashboard;