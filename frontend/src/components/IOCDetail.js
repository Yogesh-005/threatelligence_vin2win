// frontend/src/components/IOCDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { iocAPI, articlesAPI, formatIOCType, getRiskColor, getRiskLevel, getTimeAgo, copyToClipboard } from '../api/client';
import { Container, Card, Button, LoadingSpinner, ErrorMessage } from '../styles/themes';

const BackButton = styled(Button)`
  margin-bottom: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const IOCHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  gap: 20px;
`;

const IOCInfo = styled.div`
  flex: 1;
`;

const IOCType = styled.span`
  background-color: #333333;
  color: #e0e0e0;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 15px;
  display: inline-block;
`;

const IOCValue = styled.h1`
  color: #e0e0e0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 24px;
  font-weight: 500;
  margin: 0 0 15px 0;
  word-break: break-all;
  line-height: 1.3;
`;

const IOCMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 14px;
  color: #a0a0a0;
`;

const RiskSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
`;

const RiskBadge = styled.div`
  background-color: ${props => getRiskColor(props.score)};
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  min-width: 120px;
`;

const RiskScore = styled.div`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 5px;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const CopyButton = styled(Button)`
  background-color: #444444;
  
  &:hover {
    background-color: #555555;
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DetailCard = styled(Card)`
  padding: 25px;
`;

const DetailTitle = styled.h3`
  color: #e0e0e0;
  margin-bottom: 20px;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #333333;

  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  color: #a0a0a0;
  font-size: 14px;
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 400;
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const Tag = styled.span`
  background-color: #333333;
  color: #e0e0e0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const EnrichmentData = styled.pre`
  background-color: #1a1a1a;
  color: #c0c0c0;
  padding: 15px;
  border-radius: 6px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
`;

const ArticlesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ArticleItem = styled(Card)`
  padding: 20px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #555555;
    background-color: #222222;
  }
`;

const ArticleTitle = styled.h4`
  color: #e0e0e0;
  margin: 0 0 10px 0;
  font-size: 16px;
  line-height: 1.4;
`;

const ArticleInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #a0a0a0;
`;

const NoData = styled.div`
  text-align: center;
  padding: 40px;
  color: #a0a0a0;
  font-style: italic;
`;

function IOCDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ioc, setIOC] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);

  useEffect(() => {
    loadIOCDetails();
  }, [id]);

  const loadIOCDetails = async () => {
    setLoading(true);
    try {
      const [iocResponse, articlesResponse] = await Promise.all([
        iocAPI.getIOCDetails(id),
        articlesAPI.getArticles(0, 100) // Get more articles to filter
      ]);

      setIOC(iocResponse.data);
      
      // Filter articles that contain this IOC
      const relatedArticles = articlesResponse.data.filter(article =>
        article.iocs && article.iocs.some(articleIOC => articleIOC.id === parseInt(id))
      );
      
      setArticles(relatedArticles);
      setError(null);
    } catch (error) {
      setError('Failed to load IOC details');
      console.error('Error loading IOC details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyIOC = async () => {
    if (!ioc) return;
    
    const success = await copyToClipboard(ioc.value);
    setCopyStatus(success ? 'copied' : 'failed');
    
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleBack = () => {
    navigate('/iocs');
  };

  if (loading) {
    return (
      <Container>
        <BackButton onClick={handleBack}>← Back to IOCs</BackButton>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingSpinner />
        </div>
      </Container>
    );
  }

  if (error || !ioc) {
    return (
      <Container>
        <BackButton onClick={handleBack}>← Back to IOCs</BackButton>
        <ErrorMessage>{error || 'IOC not found'}</ErrorMessage>
      </Container>
    );
  }

  const enrichment = ioc.enrichments?.[0];
  const riskScore = enrichment?.risk_score || 0;

  return (
    <Container>
      <BackButton onClick={handleBack}>← Back to IOCs</BackButton>
      
      <Card style={{ marginBottom: '30px' }}>
        <IOCHeader>
          <IOCInfo>
            <IOCType>{formatIOCType(ioc.type)}</IOCType>
            <IOCValue>{ioc.value}</IOCValue>
            <IOCMeta>
              <span>First seen: {getTimeAgo(ioc.created_at)}</span>
              {ioc.source && <span>• Source: {ioc.source}</span>}
              {enrichment?.sightings && <span>• Sightings: {enrichment.sightings}</span>}
              {enrichment?.last_seen && <span>• Last seen: {getTimeAgo(enrichment.last_seen)}</span>}
            </IOCMeta>
          </IOCInfo>

          <RiskSection>
            <RiskBadge score={riskScore}>
              <RiskScore>{Math.round(riskScore)}</RiskScore>
              {getRiskLevel(riskScore)} Risk
            </RiskBadge>
            
            <ActionsContainer>
              <CopyButton onClick={handleCopyIOC}>
                {copyStatus === 'copied' ? '✓ Copied' : 
                 copyStatus === 'failed' ? '✗ Failed' : 'Copy IOC'}
              </CopyButton>
              <Button onClick={() => window.open(`https://www.virustotal.com/gui/search/${encodeURIComponent(ioc.value)}`, '_blank')}>
                Search VirusTotal
              </Button>
            </ActionsContainer>
          </RiskSection>
        </IOCHeader>
      </Card>

      <DetailsGrid>
        {/* Enrichment Details */}
        <DetailCard>
          <DetailTitle>🔍 Threat Intelligence</DetailTitle>
          
          {enrichment ? (
            <>
              <DetailRow>
                <DetailLabel>Base Score</DetailLabel>
                <DetailValue>{enrichment.base_score?.toFixed(1) || 'N/A'}</DetailValue>
              </DetailRow>
              
              <DetailRow>
                <DetailLabel>Risk Score</DetailLabel>
                <DetailValue>{riskScore.toFixed(1)}</DetailValue>
              </DetailRow>
              
              <DetailRow>
                <DetailLabel>Source Confidence</DetailLabel>
                <DetailValue>{enrichment.source_confidence?.toFixed(2) || 'N/A'}</DetailValue>
              </DetailRow>
              
              <DetailRow>
                <DetailLabel>Sightings</DetailLabel>
                <DetailValue>{enrichment.sightings || 0}</DetailValue>
              </DetailRow>

              {enrichment.tags && enrichment.tags.length > 0 && (
                <DetailRow>
                  <DetailLabel>Tags</DetailLabel>
                  <div>
                    <TagsList>
                      {enrichment.tags.map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </TagsList>
                  </div>
                </DetailRow>
              )}
            </>
          ) : (
            <NoData>No enrichment data available</NoData>
          )}
        </DetailCard>

        {/* Technical Details */}
        <DetailCard>
          <DetailTitle>⚙️ Technical Details</DetailTitle>
          
          <DetailRow>
            <DetailLabel>IOC Type</DetailLabel>
            <DetailValue>{formatIOCType(ioc.type)}</DetailValue>
          </DetailRow>
          
          <DetailRow>
            <DetailLabel>Value Length</DetailLabel>
            <DetailValue>{ioc.value.length} characters</DetailValue>
          </DetailRow>
          
          <DetailRow>
            <DetailLabel>Created</DetailLabel>
            <DetailValue>{new Date(ioc.created_at).toLocaleString()}</DetailValue>
          </DetailRow>
          
          {ioc.updated_at && (
            <DetailRow>
              <DetailLabel>Updated</DetailLabel>
              <DetailValue>{new Date(ioc.updated_at).toLocaleString()}</DetailValue>
            </DetailRow>
          )}

          {ioc.description && (
            <DetailRow>
              <DetailLabel>Description</DetailLabel>
              <DetailValue style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                {ioc.description}
              </DetailValue>
            </DetailRow>
          )}
        </DetailCard>
      </DetailsGrid>

      {/* Raw Enrichment Data */}
      {enrichment?.enrichment && (
        <DetailCard style={{ marginBottom: '30px' }}>
          <DetailTitle>📊 Raw Enrichment Data</DetailTitle>
          <EnrichmentData>
            {JSON.stringify(enrichment.enrichment, null, 2)}
          </EnrichmentData>
        </DetailCard>
      )}

      {/* Related Articles */}
      <DetailCard>
        <DetailTitle>📰 Related Articles ({articles.length})</DetailTitle>
        
        {articles.length === 0 ? (
          <NoData>No articles found containing this IOC</NoData>
        ) : (
          <ArticlesList>
            {articles.map(article => (
              <ArticleItem key={article.id}>
                <Link to={`/articles/${article.id}`} style={{ textDecoration: 'none' }}>
                  <ArticleTitle>{article.title}</ArticleTitle>
                  <ArticleInfo>
                    <span>{article.feed_name}</span>
                    <span>{getTimeAgo(article.created_at)}</span>
                  </ArticleInfo>
                </Link>
              </ArticleItem>
            ))}
          </ArticlesList>
        )}
      </DetailCard>
    </Container>
  );
}

export default IOCDetail;