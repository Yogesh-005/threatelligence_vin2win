# backend/services/ai_summarizer.py
import logging
import hashlib
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import requests
import os

logger = logging.getLogger(__name__)

class SummaryCache:
    """Simple in-memory cache for summaries"""
    
    def __init__(self, ttl_hours: int = 24):
        self.cache = {}
        self.ttl_hours = ttl_hours
    
    def _generate_key(self, content: str, mode: str) -> str:
        """Generate cache key from content and mode"""
        content_hash = hashlib.md5(content.encode()).hexdigest()
        return f"{mode}:{content_hash}"
    
    def get(self, content: str, mode: str) -> Optional[str]:
        """Get cached summary if available and not expired"""
        key = self._generate_key(content, mode)
        
        if key in self.cache:
            summary, timestamp = self.cache[key]
            if datetime.now() - timestamp < timedelta(hours=self.ttl_hours):
                logger.info(f"Cache hit for summary key: {key[:20]}...")
                return summary
            else:
                # Remove expired entry
                del self.cache[key]
        
        return None
    
    def set(self, content: str, mode: str, summary: str):
        """Cache summary"""
        key = self._generate_key(content, mode)
        self.cache[key] = (summary, datetime.now())
        logger.info(f"Cached summary for key: {key[:20]}...")
    
    def clear_expired(self):
        """Clear expired cache entries"""
        now = datetime.now()
        expired_keys = []
        
        for key, (_, timestamp) in self.cache.items():
            if now - timestamp >= timedelta(hours=self.ttl_hours):
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.cache[key]
        
        if expired_keys:
            logger.info(f"Cleared {len(expired_keys)} expired cache entries")

class ThreatSummarizer:
    """AI-powered threat intelligence summarizer"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.cache = SummaryCache()
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        
        # Role-specific prompts
        self.prompts = {
            "soc": """
You are a SOC analyst reviewing threat intelligence. Analyze the following security content and provide a concise summary focusing on:

1. **Immediate Threats**: What requires immediate attention?
2. **IOC Analysis**: Key indicators and their significance
3. **Recommended Actions**: Specific steps for SOC team
4. **Risk Assessment**: Threat level and potential impact

Keep it actionable and technical. Focus on what a SOC analyst needs to know right now.

Content to analyze:
{content}

IOCs found: {ioc_list}

Provide a clear, structured summary for SOC operations.
            """,
            
            "researcher": """
You are a security researcher analyzing threat intelligence. Provide a detailed technical analysis focusing on:

1. **Technical Details**: TTPs, attack vectors, and methodologies
2. **Attribution**: Potential threat actor patterns
3. **IOC Context**: Technical significance of each indicator
4. **Research Insights**: Connections to known campaigns or families
5. **Further Research**: Areas requiring deeper investigation

Be thorough and technical. This is for security researchers who need comprehensive analysis.

Content to analyze:
{content}

IOCs found: {ioc_list}

Provide a detailed research-oriented analysis.
            """,
            
            "executive": """
You are briefing executives on cybersecurity threats. Provide a high-level summary focusing on:

1. **Business Impact**: How this affects the organization
2. **Risk Level**: Clear assessment of threat severity
3. **Strategic Implications**: Long-term security considerations
4. **Resource Requirements**: What investment/actions are needed
5. **Timeline**: Urgency and expected duration of threat

Use business language, avoid technical jargon. Focus on decision-making information.

Content to analyze:
{content}

Number of security indicators found: {ioc_count}

Provide an executive-level threat briefing.
            """
        }
    
    def summarize(self, content: str, mode: str = "soc", iocs: list = None) -> str:
        """Generate AI summary based on mode"""
        if not self.api_key:
            logger.warning("No OpenRouter API key configured, returning basic summary")
            return self._generate_basic_summary(content, mode, iocs or [])
        
        # Check cache first
        cache_key_content = f"{content}:{len(iocs or [])}"
        cached = self.cache.get(cache_key_content, mode)
        if cached:
            return cached
        
        try:
            summary = self._generate_ai_summary(content, mode, iocs or [])
            self.cache.set(cache_key_content, mode, summary)
            return summary
        except Exception as e:
            logger.error(f"AI summarization failed: {str(e)}")
            return self._generate_basic_summary(content, mode, iocs or [])
    
    def _generate_ai_summary(self, content: str, mode: str, iocs: list) -> str:
        """Generate summary using OpenRouter API"""
        if mode not in self.prompts:
            raise ValueError(f"Invalid mode: {mode}")
        
        # Prepare IOC information
        ioc_list = "\n".join([f"- {ioc.get('type', 'unknown')}: {ioc.get('value', 'N/A')}" for ioc in iocs]) if iocs else "None detected"
        ioc_count = len(iocs)
        
        # Format prompt
        prompt = self.prompts[mode].format(
            content=content[:2000],  # Limit content length
            ioc_list=ioc_list,
            ioc_count=ioc_count
        )
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.3
        }
        
        response = requests.post(self.base_url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"].strip()
        else:
            raise Exception("No response from AI service")
    
    def _generate_basic_summary(self, content: str, mode: str, iocs: list) -> str:
        """Generate basic summary when AI is unavailable"""
        ioc_count = len(iocs)
        high_risk_iocs = sum(1 for ioc in iocs if ioc.get('risk_score', 0) > 50)
        
        summaries = {
            "soc": f"""
**SOC Alert Summary**

Content analyzed from security feed with {ioc_count} indicators of compromise detected.

**Key Findings:**
- {high_risk_iocs} high-risk IOCs requiring immediate attention
- {ioc_count - high_risk_iocs} medium/low-risk indicators for monitoring

**Recommended Actions:**
- Review and validate high-risk IOCs immediately
- Add indicators to threat hunting queries
- Monitor for related activity in network logs

**Risk Level:** {"HIGH" if high_risk_iocs > 0 else "MEDIUM" if ioc_count > 0 else "LOW"}
            """,
            
            "researcher": f"""
**Technical Analysis Summary**

Security intelligence analysis completed on provided content.

**IOC Breakdown:**
- Total indicators: {ioc_count}
- High-risk indicators: {high_risk_iocs}
- Indicator types: {', '.join(set(ioc.get('type', 'unknown') for ioc in iocs)) if iocs else 'None'}

**Research Notes:**
- Content requires further analysis with threat intelligence platforms
- Cross-reference indicators with known campaign data
- Monitor for additional related indicators

**Next Steps:**
- Deep dive analysis recommended for high-risk IOCs
- Correlation with historical attack data needed
            """,
            
            "executive": f"""
**Executive Threat Brief**

**Situation:** Security monitoring detected {ioc_count} potential threat indicators.

**Business Impact:** 
- {"IMMEDIATE ATTENTION REQUIRED" if high_risk_iocs > 0 else "Routine monitoring sufficient"}
- {"Potential active threat detected" if high_risk_iocs > 0 else "No immediate business disruption expected"}

**Resource Requirements:**
- SOC team review: {"Urgent" if high_risk_iocs > 0 else "Standard"}
- Additional investigation: {"Recommended" if ioc_count > 5 else "Optional"}

**Timeline:** {"Immediate response required" if high_risk_iocs > 0 else "Monitor over next 24-48 hours"}
            """
        }
        
        return summaries.get(mode, summaries["soc"])
    
    def determine_risk_level(self, iocs: list) -> str:
        """Determine overall risk level from IOCs"""
        if not iocs:
            return "low"
        
        max_risk = max(ioc.get('risk_score', 0) for ioc in iocs)
        
        if max_risk >= 75:
            return "critical"
        elif max_risk >= 50:
            return "high"
        elif max_risk >= 25:
            return "medium"
        else:
            return "low"