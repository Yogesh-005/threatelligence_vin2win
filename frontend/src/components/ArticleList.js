import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { articlesAPI, formatIOCType, getRiskColor, getRiskLevel, getTimeAgo } from '../api/client';
import { Container, Card, Button, LoadingSpinner, ErrorMessage } from '../styles/themes';

const ArticlesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
`;

const ArticleCard = styled(Card)`
  padding: 25px;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    border-color: #555555;
    background-color: #222222;
    transform: translateY(-2px);
  }
`;

const ArticleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 15px;
`;

const ArticleInfo = styled.div`
  flex: 1;
`;

const ArticleTitle = styled.h3`
  color: #e0e0e0;
  margin: 0 0 10px 0;
  font-size: 18px;
  line-height: 1.4;
  
  a {
    color: inherit;
    text-decoration: none;
    
    &:hover {
      color: #ffffff;
    }
  }
`;

const ArticleMeta = styled.div`
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #a0a0a0;
  margin-bottom: 15px;
`;

const FeedBadge = styled.span`
  background-color: #333333;
  color: #e0e0e0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
`;

const ArticleSummary = styled.p`
  color: #c0c0c0;
  margin: 0 0 20px 0;
  line-height: 1.5;
  font-size: 14px;
`;

const IOCSection = styled.div`
  margin-bottom: 20px;
`;

const IOCList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const IOCBadge = styled.span`
  background-color: ${props => getRiskColor(props.risk || 0)};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const SummarySection = styled.div`
  border-top: 1px solid #333333;
  padding-top: 20px;
  margin-top: 20px;
`;

const SummaryModes = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const ModeButton = styled(Button)`
  padding: 6px 12px;
  font-size: 12px;
  background-color: ${props => props.active ? '#555555' : '#333333'};
  border-color: ${props => props.active ? '#777777' : '#555555'};
  
  &:disabled {
    opacity: 0.6;
  }
`;

const SummaryContent = styled.div`
  background-color: #1a1a1a;
  border: 1px solid #333333;
  border-radius: 6px;
  padding: 15px;
  margin-top: 10px;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.5;
  color: #e0e0e0;
  max-height: 300px;
  overflow-y: auto;
`;

const SummaryMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #a0a0a0;
  margin-top: 10px;
`;

const RiskIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: ${props => getRiskColor(props.score || 0)};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
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

const PageTitle = styled.h2`
  color: #e0e0e0;
  margin-bottom: 30px;
  font-size: 28px;
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1a1a1a;
  padding: 15px 20px;
  border-radius: 8px;
  border: 1px solid #333333;
  margin-bottom: 30px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #e0e0e0;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #a0a0a0;
  text-transform: uppercase;
`;

function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [summaries, setSummaries] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});
  const [activeModes, setActiveModes] = useState({});
  const [stats, setStats] = useState(null);

  const ITEMS_PER_PAGE = 20;
  const summaryModes = [
    { key: 'soc', label: 'SOC', description: 'Security Operations Center view' },
    { key: 'researcher', label: 'Research', description: 'Technical research analysis' },
    { key: 'executive', label: 'Executive', description: 'High-level business impact' }
  ];

  useEffect(() => {
    loadArticles();
    loadStats();
  }, [currentPage]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const response = await articlesAPI.getArticles(
        currentPage * ITEMS_PER_PAGE,
        ITEMS_PER_PAGE
      );
      setArticles(response.data);
      setError(null);
    } catch (error) {
      setError('Failed to load articles');
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [countResponse, recentResponse] = await Promise.all([
        articlesAPI.getArticleCount(),
        articlesAPI.getRecentArticles(24)
      ]);
      
      setStats({
        total: countResponse.data.count,
        recent24h: recentResponse.data.count
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const generateSummary = async (articleId, mode) => {
    const key = `${articleId}-${mode}`;
    setSummaryLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const response = await articlesAPI.summarizeArticle(articleId, mode);
      setSummaries(prev => ({
        ...prev,
        [key]: response.data
      }));
      setActiveModes(prev => ({
        ...prev,
        [articleId]: mode
      }));
    } catch (error) {
      console.error(`Error generating ${mode} summary:`, error);
      setSummaries(prev => ({
        ...prev,
        [key]: { error: 'Failed to generate summary' }
      }));
    } finally {
      setSummaryLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getHighestRiskScore = (iocs) => {
    if (!iocs || iocs.length === 0) return 0;
    return Math.max(...iocs.map(ioc => 
      ioc.enrichments?.[0]?.risk_score || 0
    ));
  };

  const countIOCsByType = (iocs) => {
    const counts = {};
    iocs?.forEach(ioc => {
      counts[ioc.type] = (counts[ioc.type] || 0) + 1;
    });
    return counts;
  };

  if (loading && !articles.length) {
    return (
      <Container>
        <PageTitle>Security Articles</PageTitle>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingSpinner />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <PageTitle>Security Articles</PageTitle>

      {/* Statistics */}
      {stats && (
        <StatsBar>
          <StatItem>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Total Articles</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.recent24h}</StatValue>
            <StatLabel>Last 24 Hours</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{articles.length}</StatValue>
            <StatLabel>Current Page</StatLabel>
          </StatItem>
        </StatsBar>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Articles List */}
      <ArticlesList>
        {articles.map((article) => {
          const highestRisk = getHighestRiskScore(article.iocs);
          const iocCounts = countIOCsByType(article.iocs);
          const activeMode = activeModes[article.id] || 'soc';
          const summaryKey = `${article.id}-${activeMode}`;
          const currentSummary = summaries[summaryKey];

          return (
            <ArticleCard key={article.id}>
              <ArticleHeader>
                <ArticleInfo>
                  <ArticleTitle>
                    <Link to={`/articles/${article.id}`}>
                      {article.title}
                    </Link>
                  </ArticleTitle>
                  
                  <ArticleMeta>
                    <FeedBadge>{article.feed_name}</FeedBadge>
                    <span>{getTimeAgo(article.created_at)}</span>
                    {article.iocs?.length > 0 && (
                      <>
                        <span>• {article.iocs.length} IOC{article.iocs.length !== 1 ? 's' : ''}</span>
                        {highestRisk > 0 && (
                          <RiskIndicator score={highestRisk}>
                            • {getRiskLevel(highestRisk)} Risk
                          </RiskIndicator>
                        )}
                      </>
                    )}
                  </ArticleMeta>
                </ArticleInfo>

                <ActionButtons>
                  <Link to={`/articles/${article.id}`}>
                    <Button>View Full Article</Button>
                  </Link>
                </ActionButtons>
              </ArticleHeader>

              <ArticleSummary>
                {article.summary.length > 300 
                  ? `${article.summary.substring(0, 300)}...` 
                  : article.summary}
              </ArticleSummary>

              {/* IOCs Section */}
              {article.iocs && article.iocs.length > 0 && (
                <IOCSection>
                  <h4 style={{ color: '#e0e0e0', margin: '0 0 10px 0', fontSize: '16px' }}>
                    Indicators of Compromise:
                  </h4>
                  <IOCList>
                    {Object.entries(iocCounts).map(([type, count]) => (
                      <IOCBadge key={type} risk={highestRisk}>
                        {count} {formatIOCType(type)}{count !== 1 ? 's' : ''}
                      </IOCBadge>
                    ))}
                  </IOCList>
                </IOCSection>
              )}

              {/* AI Summary Section */}
              <SummarySection>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ color: '#e0e0e0', margin: 0, fontSize: '16px' }}>
                    🤖 AI Threat Analysis:
                  </h4>
                  <SummaryModes>
                    {summaryModes.map(mode => (
                      <ModeButton
                        key={mode.key}
                        active={activeMode === mode.key}
                        disabled={summaryLoading[`${article.id}-${mode.key}`]}
                        onClick={() => generateSummary(article.id, mode.key)}
                        title={mode.description}
                      >
                        {summaryLoading[`${article.id}-${mode.key}`] ? (
                          <LoadingSpinner />
                        ) : (
                          mode.label
                        )}
                      </ModeButton>
                    ))}
                  </SummaryModes>
                </div>

                {currentSummary ? (
                  <>
                    {currentSummary.error ? (
                      <ErrorMessage>{currentSummary.error}</ErrorMessage>
                    ) : (
                      <>
                        <SummaryContent>
                          {currentSummary.summary}
                        </SummaryContent>
                        <SummaryMeta>
                          <span>
                            Generated: {getTimeAgo(currentSummary.generated_at)} • 
                            Mode: {activeMode.toUpperCase()} • 
                            IOCs: {currentSummary.ioc_count}
                          </span>
                          {currentSummary.risk_level && (
                            <RiskIndicator score={highestRisk}>
                              Risk Level: {currentSummary.risk_level.toUpperCase()}
                            </RiskIndicator>
                          )}
                        </SummaryMeta>
                      </>
                    )}
                  </>
                ) : (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#a0a0a0',
                    fontStyle: 'italic',
                    border: '1px dashed #333333',
                    borderRadius: '6px'
                  }}>
                    Click a mode above to generate AI threat analysis
                  </div>
                )}
              </SummarySection>
            </ArticleCard>
          );
        })}
      </ArticlesList>

      {/* Pagination */}
      {articles.length > 0 && (
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
            disabled={articles.length < ITEMS_PER_PAGE}
          >
            Next
          </PageButton>
        </Pagination>
      )}

      {articles.length === 0 && !loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0a0' }}>
            No articles found. Try refreshing the RSS feeds.
          </div>
        </Card>
      )}
    </Container>
  );
}

export default ArticleList;