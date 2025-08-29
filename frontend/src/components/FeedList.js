import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { feedsAPI } from '../api/client';
import { Container, Card, Button, Input, LoadingSpinner, ErrorMessage } from '../styles/themes';

const FeedGrid = styled.div`
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
`;

const FeedCard = styled(Card)`
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

const FeedInfo = styled.div`
  flex: 1;
`;

const FeedName = styled.h3`
  color: #e0e0e0;
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
`;

const FeedUrl = styled.p`
  color: #a0a0a0;
  font-size: 14px;
  word-break: break-all;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const FeedMeta = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 8px;
  font-size: 12px;
  color: #666666;
`;

const StatusBadge = styled.span`
  background-color: ${props => props.status === 'active' ? '#28a745' : '#dc3545'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const AddFeedForm = styled.form`
  background-color: #1a1a1a;
  padding: 25px;
  border-radius: 8px;
  border: 1px solid #333333;
  margin-bottom: 30px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 15px;
  align-items: end;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
`;

const PageTitle = styled.h2`
  color: #e0e0e0;
  margin-bottom: 30px;
  font-size: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const RefreshButton = styled(Button)`
  background-color: #007bff;
  
  &:hover {
    background-color: #0056b3;
  }
`;

function FeedList() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadFeeds();
    loadStats();
  }, []);

  const loadFeeds = async () => {
    setLoading(true);
    try {
      const response = await feedsAPI.getFeeds();
      setFeeds(response.data);
      setError(null);
    } catch (error) {
      setError('Failed to load feeds');
      console.error('Error loading feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats for now - you can implement actual API call
      setStats({
        total_feeds: feeds.length,
        active_feeds: feeds.filter(f => f.status === 'active').length,
        total_articles: 0,
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading feed stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return;

    setSubmitting(true);
    try {
      const response = await feedsAPI.addFeed(formData);
      setFeeds(prev => [...prev, response.data]);
      setFormData({ name: '', url: '' });
      setError(null);
      
      // Show success message
      alert('Feed added successfully!');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to add feed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (feedId) => {
    if (!window.confirm('Are you sure you want to remove this feed?')) return;

    try {
      await feedsAPI.removeFeed(feedId);
      setFeeds(prev => prev.filter(feed => feed.id !== feedId));
      setError(null);
    } catch (error) {
      setError('Failed to remove feed');
    }
  };

  const handleRefresh = async (feedId = null) => {
    setRefreshing(true);
    try {
      // Backend supports refreshing all feeds via /feeds/refresh
      // If a specific feed is requested, fall back to refreshing all for now
      await feedsAPI.refreshFeeds();
      alert(feedId ? 'Refresh triggered (all feeds)' : 'All feeds refreshed successfully!');
      await loadFeeds();
    } catch (error) {
      setError('Failed to refresh feeds');
    } finally {
      setRefreshing(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Container>
      <PageTitle>
        📡 RSS Feeds Management
      </PageTitle>

      {/* Statistics */}
      {feeds.length > 0 && (
        <StatsContainer>
          <StatCard>
            <StatValue>{feeds.length}</StatValue>
            <StatLabel>Total Feeds</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{feeds.filter(f => f.status === 'active').length}</StatValue>
            <StatLabel>Active Feeds</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{feeds.filter(f => f.last_fetched).length}</StatValue>
            <StatLabel>Recently Updated</StatLabel>
          </StatCard>
        </StatsContainer>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Global Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <RefreshButton 
          onClick={() => handleRefresh()} 
          disabled={refreshing || feeds.length === 0}
        >
          {refreshing ? <LoadingSpinner /> : '🔄 Refresh All Feeds'}
        </RefreshButton>
      </div>

      {/* Add Feed Form */}
      <AddFeedForm onSubmit={handleSubmit}>
        <h3 style={{ color: '#e0e0e0', marginBottom: '20px', fontSize: '18px' }}>
          Add New RSS Feed
        </h3>
        <FormRow>
          <FormGroup>
            <Label htmlFor="name">Feed Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. CISA Cybersecurity Advisories"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="url">RSS Feed URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com/rss.xml"
              value={formData.url}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          <Button type="submit" disabled={submitting}>
            {submitting ? <LoadingSpinner /> : 'Add Feed'}
          </Button>
        </FormRow>
      </AddFeedForm>

      {/* Feed List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingSpinner />
        </div>
      ) : (
        <FeedGrid>
          {feeds.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <h3 style={{ color: '#e0e0e0', marginBottom: '10px' }}>No RSS Feeds Found</h3>
                <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>
                  Add your first RSS feed above to start collecting threat intelligence articles.
                </p>
                <p style={{ color: '#666666', fontSize: '14px' }}>
                  💡 Try adding feeds from CISA, MITRE, or other cybersecurity organizations
                </p>
              </div>
            </Card>
          ) : (
            feeds.map((feed) => (
              <FeedCard key={feed.id}>
                <FeedInfo>
                  <FeedName>{feed.name}</FeedName>
                  <FeedUrl>{feed.url}</FeedUrl>
                  <FeedMeta>
                    <StatusBadge status={feed.status || 'active'}>
                      {feed.status || 'Active'}
                    </StatusBadge>
                    {feed.last_fetched && (
                      <span>Last updated: {new Date(feed.last_fetched).toLocaleString()}</span>
                    )}
                    {feed.article_count && (
                      <span>Articles: {feed.article_count}</span>
                    )}
                  </FeedMeta>
                </FeedInfo>
                
                <ActionButtons>
                  <Button
                    onClick={() => handleRefresh(feed.id)}
                    disabled={refreshing}
                    style={{ marginRight: '10px' }}
                  >
                    {refreshing ? <LoadingSpinner /> : 'Refresh'}
                  </Button>
                  <Button 
                    variant="danger"
                    onClick={() => handleRemove(feed.id)}
                  >
                    Remove
                  </Button>
                </ActionButtons>
              </FeedCard>
            ))
          )}
        </FeedGrid>
      )}

      {/* Help Section */}
      <Card style={{ marginTop: '30px', backgroundColor: '#1a1a1f', border: '1px solid #2a2a3a' }}>
        <h3 style={{ color: '#e0e0e0', marginBottom: '15px', fontSize: '16px' }}>
          📚 Popular Cybersecurity RSS Feeds
        </h3>
        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
          <div style={{ color: '#a0a0a0' }}>
            • <strong>CISA:</strong> https://www.cisa.gov/cybersecurity-advisories/all.xml
          </div>
          <div style={{ color: '#a0a0a0' }}>
            • <strong>KrebsOnSecurity:</strong> https://krebsonsecurity.com/feed/
          </div>
          <div style={{ color: '#a0a0a0' }}>
            • <strong>Threatpost:</strong> https://threatpost.com/feed/
          </div>
          <div style={{ color: '#a0a0a0' }}>
            • <strong>MITRE ATT&CK:</strong> https://attack.mitre.org/resources/updates/updates.xml
          </div>
        </div>
      </Card>
    </Container>
  );
}

export default FeedList;