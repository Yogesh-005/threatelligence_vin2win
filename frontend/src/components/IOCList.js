import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { iocAPI, formatIOCType, getRiskColor, getRiskLevel, getTimeAgo, copyToClipboard } from '../api/client';
import { Container, Card, Button, Input, LoadingSpinner, ErrorMessage } from '../styles/themes';

const FiltersContainer = styled.div`
  background-color: #1a1a1a;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #333333;
  margin-bottom: 30px;
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 15px;
  align-items: end;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FilterLabel = styled.label`
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
`;

const Select = styled.select`
  background-color: #2a2a2a;
  color: #e0e0e0;
  border: 1px solid #444444;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #666666;
  }

  option {
    background-color: #2a2a2a;
    color: #e0e0e0;
  }
`;

const IOCGrid = styled.div`
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
`;

const IOCCard = styled(Card)`
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

const IOCInfo = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 20px;
  align-items: center;
`;

const IOCType = styled.span`
  background-color: #333333;
  color: #e0e0e0;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const IOCValue = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const IOCValueText = styled.span`
  color: #e0e0e0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  word-break: break-all;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #ffffff;
  }
`;

const IOCMetadata = styled.div`
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #a0a0a0;
`;

const RiskBadge = styled.span`
  background-color: ${props => getRiskColor(props.score)};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
`;

const ArticleCount = styled.span`
  background-color: #444444;
  color: #e0e0e0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const CopyButton = styled(Button)`
  padding: 8px 12px;
  font-size: 12px;
  background-color: #444444;

  &:hover {
    background-color: #555555;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
`;

const PageButton = styled(Button)`
  padding: 8px 16px;
  font-size: 14px;
  
  &:disabled {
    background-color: #2a2a2a;
    color: #666666;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: #a0a0a0;
  font-size: 14px;
  margin: 0 15px;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled(Card)`
  text-align: center;
  padding: 20px;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #a0a0a0;
`;

const PageTitle = styled.h2`
  color: #e0e0e0;
  margin-bottom: 30px;
  font-size: 28px;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 40px;
  color: #a0a0a0;
  font-size: 16px;
`;

function IOCList() {
  const [iocs, setIOCs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState({
    ioc_type: '',
    min_risk_score: ''
  });
  const [copyStatus, setCopyStatus] = useState({});

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadIOCs();
    loadStats();
  }, [currentPage, filters]);

  const loadIOCs = async () => {
    setLoading(true);
    try {
      const params = {
        skip: currentPage * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await iocAPI.getIOCs(params);
      setIOCs(response.data);
      setError(null);
    } catch (error) {
      setError('Failed to load IOCs');
      console.error('Error loading IOCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await iocAPI.getIOCStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading IOC stats:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(0); // Reset to first page when filters change
  };

  const handleCopyIOC = async (iocValue, iocId) => {
    const success = await copyToClipboard(iocValue);
    setCopyStatus(prev => ({
      ...prev,
      [iocId]: success ? 'copied' : 'failed'
    }));

    // Clear status after 2 seconds
    setTimeout(() => {
      setCopyStatus(prev => ({
        ...prev,
        [iocId]: null
      }));
    }, 2000);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      ioc_type: '',
      min_risk_score: ''
    });
    setCurrentPage(0);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Container>
      <PageTitle>Indicators of Compromise (IOCs)</PageTitle>

      {/* Statistics */}
      {stats && (
        <StatsContainer>
          <StatCard>
            <StatValue>{stats.total_count}</StatValue>
            <StatLabel>Total IOCs</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.recent_count}</StatValue>
            <StatLabel>Recent (24h)</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.by_risk_level.high + stats.by_risk_level.critical}</StatValue>
            <StatLabel>High Risk</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.by_type.ip || 0}</StatValue>
            <StatLabel>IP Addresses</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.by_type.domain || 0}</StatValue>
            <StatLabel>Domains</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.by_type.hash || 0}</StatValue>
            <StatLabel>File Hashes</StatLabel>
          </StatCard>
        </StatsContainer>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Filters */}
      <FiltersContainer>
        <FilterRow>
          <FilterGroup>
            <FilterLabel htmlFor="ioc_type">IOC Type</FilterLabel>
            <Select
              id="ioc_type"
              value={filters.ioc_type}
              onChange={(e) => handleFilterChange('ioc_type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="ip">IP Address</option>
              <option value="domain">Domain</option>
              <option value="url">URL</option>
              <option value="hash">File Hash</option>
            </Select>
          </FilterGroup>
          
          <FilterGroup>
            <FilterLabel htmlFor="min_risk_score">Minimum Risk Score</FilterLabel>
            <Input
              id="min_risk_score"
              type="number"
              min="0"
              max="100"
              placeholder="0-100"
              value={filters.min_risk_score}
              onChange={(e) => handleFilterChange('min_risk_score', e.target.value)}
            />
          </FilterGroup>
          
          <FilterGroup>
            <FilterLabel>&nbsp;</FilterLabel>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={loadIOCs} disabled={loading}>
                {loading ? <LoadingSpinner /> : 'Apply Filters'}
              </Button>
              {hasActiveFilters && (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </FilterGroup>
        </FilterRow>
      </FiltersContainer>

      {/* IOC List */}
      {loading && !iocs.length ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <IOCGrid>
            {iocs.length === 0 ? (
              <NoResults>
                {hasActiveFilters ? 'No IOCs match your filters.' : 'No IOCs found.'}
              </NoResults>
            ) : (
              iocs.map((ioc) => (
                <IOCCard key={ioc.id}>
                  <IOCInfo>
                    <IOCType>{formatIOCType(ioc.type)}</IOCType>
                    
                    <IOCValue>
                      <IOCValueText 
                        onClick={() => handleCopyIOC(ioc.value, ioc.id)}
                        title="Click to copy"
                      >
                        {ioc.value}
                      </IOCValueText>
                      <IOCMetadata>
                        <span>First seen: {getTimeAgo(ioc.created_at)}</span>
                        {ioc.source && <span>• Source: {ioc.source}</span>}
                        {ioc.enrichments?.[0]?.sightings && (
                          <span>• Sightings: {ioc.enrichments[0].sightings}</span>
                        )}
                      </IOCMetadata>
                    </IOCValue>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {ioc.enrichments?.[0]?.risk_score !== undefined && (
                        <RiskBadge style={{ marginRight: '10px' }} score={ioc.enrichments[0].risk_score}>
                          {getRiskLevel(ioc.enrichments[0].risk_score)} 
                          ({Math.round(ioc.enrichments[0].risk_score)})
                        </RiskBadge>
                      )}

                      {ioc.articles?.length > 0 && (
                        <ArticleCount>
                          {ioc.articles.length} article{ioc.articles.length !== 1 ? 's' : ''}
                        </ArticleCount>
                      )}
                    </div>
                  </IOCInfo>

                  <ActionButtons>
                    <CopyButton
                      onClick={() => handleCopyIOC(ioc.value, ioc.id)}
                      title="Copy IOC value"
                    >
                      {copyStatus[ioc.id] === 'copied' ? '✓ Copied' : 
                       copyStatus[ioc.id] === 'failed' ? '✗ Failed' : 'Copy'}
                    </CopyButton>
                    
                    <Link to={`/iocs/${ioc.id}`}>
                      <Button>Details</Button>
                    </Link>
                  </ActionButtons>
                </IOCCard>
              ))
            )}
          </IOCGrid>

          {/* Pagination */}
          {iocs.length > 0 && (
            <Pagination>
              <PageButton
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                Previous
              </PageButton>
              
              <PageInfo>
                Page {currentPage + 1}
              </PageInfo>
              
              <PageButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={iocs.length < ITEMS_PER_PAGE}
              >
                Next
              </PageButton>
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
}

export default IOCList;