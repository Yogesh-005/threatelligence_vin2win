import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articlesAPI, formatIOCType, getRiskColor, getRiskLevel, getTimeAgo } from '../api/client';
import { Container, Card, Button, LoadingSpinner, ErrorMessage } from '../styles/themes';

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});
  const [activeMode, setActiveMode] = useState('soc');

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const [articleResponse, summariesResponse] = await Promise.all([
        articlesAPI.getArticle(id),
        articlesAPI.getArticleSummaries(id).catch(() => ({ data: [] }))
      ]);
      
      setArticle(articleResponse.data);
      
      // Organize existing summaries by mode
      const existingSummaries = {};
      summariesResponse.data.forEach(summary => {
        existingSummaries[summary.mode] = summary;
      });
      setSummaries(existingSummaries);
      
      setError(null);
    } catch (error) {
      setError('Failed to load article');
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (mode) => {
    setSummaryLoading(prev => ({ ...prev, [mode]: true }));
    
    try {
      const response = await articlesAPI.summarizeArticle(id, mode);
      setSummaries(prev => ({
        ...prev,
        [mode]: response.data
      }));
    } catch (error) {
      console.error(`Error generating ${mode} summary:`, error);
      setSummaries(prev => ({
        ...prev,
        [mode]: { error: 'Failed to generate summary' }
      }));
    } finally {
      setSummaryLoading(prev => ({ ...prev, [mode]: false }));
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingSpinner />
        </div>
      </Container>
    );
  }

  if (error || !article) {
    return (
      <Container>
        <ErrorMessage>{error || 'Article not found'}</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Card style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#e0e0e0', marginBottom: '15px', fontSize: '24px', lineHeight: '1.3' }}>
          {article.title}
        </h1>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', fontSize: '14px', color: '#a0a0a0' }}>
          <span style={{ backgroundColor: '#333333', padding: '4px 8px', borderRadius: '4px', color: '#e0e0e0' }}>
            {article.feed_name}
          </span>
          <span>{getTimeAgo(article.created_at)}</span>
          <span>{article.published}</span>
        </div>

        <div style={{ marginBottom: '30px', lineHeight: '1.6', color: '#c0c0c0' }}>
          {article.summary}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            <Button>View Original Article</Button>
          </a>
          {article.iocs && article.iocs.length > 0 && (
            <Link to={`/iocs?article=${article.id}`}>
              <Button variant="secondary">
                View IOCs ({article.iocs.length})
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* IOCs Section */}
      {article.iocs && article.iocs.length > 0 && (
        <Card style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#e0e0e0', marginBottom: '20px' }}>
            Indicators of Compromise ({article.iocs.length})
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {article.iocs.slice(0, 10).map(ioc => (
              <div key={ioc.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px',
                backgroundColor: '#1a1a1a',
                borderRadius: '6px',
                border: '1px solid #333333'
              }}>
                <div>
                  <span style={{ 
                    backgroundColor: '#333333', 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    marginRight: '10px'
                  }}>
                    {formatIOCType(ioc.type)}
                  </span>
                  <code style={{ color: '#e0e0e0' }}>{ioc.value}</code>
                </div>
                {ioc.enrichments?.[0]?.risk_score && (
                  <span style={{
                    backgroundColor: getRiskColor(ioc.enrichments[0].risk_score),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {Math.round(ioc.enrichments[0].risk_score)}
                  </span>
                )}
              </div>
            ))}
            {article.iocs.length > 10 && (
              <div style={{ textAlign: 'center', padding: '10px', color: '#a0a0a0' }}>
                ... and {article.iocs.length - 10} more IOCs
              </div>
            )}
          </div>
        </Card>
      )}

      {/* AI Summary Section */}
      <Card>
        <h3 style={{ color: '#e0e0e0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🤖 AI Threat Analysis
        </h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {['soc', 'researcher', 'executive'].map(mode => (
            <Button
              key={mode}
              onClick={() => {
                setActiveMode(mode);
                if (!summaries[mode]) {
                  generateSummary(mode);
                }
              }}
              style={{
                backgroundColor: activeMode === mode ? '#555555' : '#333333',
                borderColor: activeMode === mode ? '#777777' : '#555555'
              }}
              disabled={summaryLoading[mode]}
            >
              {summaryLoading[mode] ? <LoadingSpinner /> : mode.toUpperCase()}
            </Button>
          ))}
        </div>

        {summaries[activeMode] ? (
          summaries[activeMode].error ? (
            <ErrorMessage>{summaries[activeMode].error}</ErrorMessage>
          ) : (
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '6px',
              padding: '20px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              color: '#e0e0e0'
            }}>
              {summaries[activeMode].summary || summaries[activeMode].content}
            </div>
          )
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#a0a0a0',
            fontStyle: 'italic',
            border: '1px dashed #333333',
            borderRadius: '6px'
          }}>
            Click a mode above to generate AI threat analysis
          </div>
        )}
      </Card>
    </Container>
  );
};

export default ArticleDetail;