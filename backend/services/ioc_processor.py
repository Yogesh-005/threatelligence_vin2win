# backend/services/ioc_processor.py
import logging
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from crud import create_or_get_ioc, create_ioc_enrichment, link_article_ioc, update_ioc_enrichment
from schemas import IOCCreate, IOCEnrichmentCreate
from models import IOCType, IOCEnrichment

logger = logging.getLogger(__name__)

class ExtractedIOC(BaseModel):
    type: IOCType
    value: str
    description: Optional[str] = None

class IOCExtractor:
    """Extract IOCs using regex patterns"""
    
    def __init__(self):
        # Enhanced regex patterns for IOC extraction
        self.patterns = {
            IOCType.ip: [
                r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
                r'\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b'  # IPv6
            ],
            IOCType.domain: [
                r'\b[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}\b'
            ],
            IOCType.url: [
                r'https?://[^\s<>"{}|\\^`[\]]+',
                r'ftp://[^\s<>"{}|\\^`[\]]+'
            ],
            IOCType.hash: [
                r'\b[a-fA-F0-9]{32}\b',  # MD5
                r'\b[a-fA-F0-9]{40}\b',  # SHA1
                r'\b[a-fA-F0-9]{64}\b',  # SHA256
                r'\b[a-fA-F0-9]{128}\b'  # SHA512
            ]
        }
        
        # Compile patterns for performance
        self.compiled_patterns = {}
        for ioc_type, patterns in self.patterns.items():
            self.compiled_patterns[ioc_type] = [re.compile(pattern, re.IGNORECASE) for pattern in patterns]
    
    def extract_iocs_from_text(self, text: str) -> List[ExtractedIOC]:
        """Extract all IOCs from given text"""
        extracted_iocs = []
        
        for ioc_type, patterns in self.compiled_patterns.items():
            for pattern in patterns:
                matches = pattern.findall(text)
                for match in matches:
                    if self._is_valid_ioc(match, ioc_type):
                        extracted_iocs.append(ExtractedIOC(
                            type=ioc_type,
                            value=match.lower() if ioc_type in [IOCType.domain, IOCType.url] else match,
                            description=f"Extracted from text content"
                        ))
        
        # Remove duplicates
        seen = set()
        unique_iocs = []
        for ioc in extracted_iocs:
            key = (ioc.type, ioc.value)
            if key not in seen:
                seen.add(key)
                unique_iocs.append(ioc)
        
        return unique_iocs
    
    def _is_valid_ioc(self, value: str, ioc_type: IOCType) -> bool:
        """Validate extracted IOC"""
        if not value or len(value.strip()) == 0:
            return False
        
        # Filter out common false positives
        false_positives = {
            IOCType.ip: ['0.0.0.0', '127.0.0.1', '255.255.255.255', '192.168.', '10.0.', '172.16.'],
            IOCType.domain: ['example.com', 'example.org', 'localhost', 'test.com'],
            IOCType.url: ['http://example.com', 'https://example.com'],
            IOCType.hash: []
        }
        
        for fp in false_positives.get(ioc_type, []):
            if fp in value.lower():
                return False
        
        # Additional validation by type
        if ioc_type == IOCType.ip:
            return self._is_valid_ip(value)
        elif ioc_type == IOCType.domain:
            return self._is_valid_domain(value)
        elif ioc_type == IOCType.hash:
            return len(value) in [32, 40, 64, 128]
        
        return True
    
    def _is_valid_ip(self, ip: str) -> bool:
        """Validate IP address"""
        try:
            parts = ip.split('.')
            if len(parts) != 4:
                return False
            for part in parts:
                if not 0 <= int(part) <= 255:
                    return False
            return True
        except ValueError:
            return False
    
    def _is_valid_domain(self, domain: str) -> bool:
        """Validate domain name"""
        if len(domain) > 253:
            return False
        if domain.endswith('.'):
            domain = domain[:-1]
        allowed = re.compile(r'^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$')
        return all(allowed.match(label) for label in domain.split('.'))

class IOCEnricher:
    """Simple IOC enrichment with basic scoring"""
    
    def __init__(self):
        # Basic threat intelligence - in production, integrate with real APIs
        self.known_threats = {
            'malware_domains': ['malware.com', 'badsite.org'],
            'suspicious_ips': ['192.0.2.1', '198.51.100.1'],
            'phishing_urls': ['phishing-site.com']
        }
    
    def enrich_ioc(self, ioc: ExtractedIOC, source_confidence: float = 0.5) -> Dict[str, Any]:
        """Enrich IOC with threat intelligence"""
        base_score = self._calculate_base_score(ioc)
        risk_score = self._calculate_risk_score(base_score, source_confidence)
        
        enrichment_data = {
            'threat_types': self._get_threat_types(ioc),
            'reputation': self._get_reputation(ioc),
            'geolocation': self._get_geolocation(ioc) if ioc.type == IOCType.ip else None,
            'first_seen_wild': None,  # Would come from threat intel APIs
            'last_seen_wild': None
        }
        
        tags = self._generate_tags(ioc, enrichment_data)
        
        return {
            'base_score': base_score,
            'risk_score': risk_score,
            'source_confidence': source_confidence,
            'enrichment': enrichment_data,
            'tags': tags,
            'sightings': 1,
            'first_seen': datetime.now(),
            'last_seen': datetime.now()
        }
    
    def _calculate_base_score(self, ioc: ExtractedIOC) -> float:
        """Calculate base threat score"""
        base_scores = {
            IOCType.ip: 30.0,
            IOCType.domain: 25.0,
            IOCType.url: 40.0,
            IOCType.hash: 50.0
        }
        
        score = base_scores.get(ioc.type, 20.0)
        
        # Increase score for known threats
        if self._is_known_threat(ioc):
            score += 30.0
        
        return min(score, 100.0)
    
    def _calculate_risk_score(self, base_score: float, source_confidence: float) -> float:
        """Calculate final risk score"""
        return min(base_score * source_confidence, 100.0)
    
    def _is_known_threat(self, ioc: ExtractedIOC) -> bool:
        """Check if IOC is in known threat database"""
        value = ioc.value.lower()
        
        for threat_list in self.known_threats.values():
            if value in threat_list:
                return True
        
        return False
    
    def _get_threat_types(self, ioc: ExtractedIOC) -> List[str]:
        """Determine threat types"""
        threat_types = []
        value = ioc.value.lower()
        
        if value in self.known_threats['malware_domains']:
            threat_types.append('malware')
        if value in self.known_threats['suspicious_ips']:
            threat_types.append('suspicious')
        if value in self.known_threats['phishing_urls']:
            threat_types.append('phishing')
        
        return threat_types or ['unknown']
    
    def _get_reputation(self, ioc: ExtractedIOC) -> str:
        """Get reputation score"""
        if self._is_known_threat(ioc):
            return 'malicious'
        return 'unknown'
    
    def _get_geolocation(self, ioc: ExtractedIOC) -> Optional[Dict[str, str]]:
        """Get IP geolocation (mock implementation)"""
        if ioc.type == IOCType.ip:
            return {
                'country': 'Unknown',
                'city': 'Unknown',
                'asn': 'Unknown'
            }
        return None
    
    def _generate_tags(self, ioc: ExtractedIOC, enrichment: Dict[str, Any]) -> List[str]:
        """Generate tags for IOC"""
        tags = [ioc.type.value]
        
        if enrichment.get('threat_types'):
            tags.extend(enrichment['threat_types'])
        
        if enrichment.get('reputation') == 'malicious':
            tags.append('high-confidence')
        
        return list(set(tags))

class IOCProcessor:
    """Main IOC processing service"""
    
    def __init__(self, db: Session):
        self.db = db
        self.extractor = IOCExtractor()
        self.enricher = IOCEnricher()
    
    def process_article_iocs(self, article_id: int, article_content: str, feed_name: str) -> Dict[str, Any]:
        """Extract and enrich IOCs from article content"""
        try:
            # Extract IOCs
            extracted_iocs = self.extractor.extract_iocs_from_text(article_content)
            logger.info(f"Extracted {len(extracted_iocs)} IOCs from article {article_id}")
            
            processed_iocs = []
            
            for extracted_ioc in extracted_iocs:
                # Create or get existing IOC
                ioc_data = IOCCreate(
                    type=extracted_ioc.type,
                    value=extracted_ioc.value,
                    description=extracted_ioc.description,
                    source=feed_name
                )
                
                db_ioc = create_or_get_ioc(self.db, ioc_data)
                
                # Link IOC to article
                link_article_ioc(self.db, article_id, db_ioc.id)
                
                # Check if enrichment exists
                existing_enrichment = self.db.query(IOCEnrichment).filter(
                    IOCEnrichment.ioc_id == db_ioc.id
                ).first()
                
                if not existing_enrichment:
                    # Perform enrichment
                    enrichment_result = self.enricher.enrich_ioc(
                        extracted_ioc,
                        source_confidence=0.7  # Adjust based on feed reliability
                    )
                    
                    # Store enrichment
                    enrichment_data = IOCEnrichmentCreate(
                        ioc_id=db_ioc.id,
                        base_score=enrichment_result['base_score'],
                        risk_score=enrichment_result['risk_score'],
                        sightings=enrichment_result['sightings'],
                        first_seen=enrichment_result['first_seen'],
                        last_seen=enrichment_result['last_seen'],
                        source_confidence=enrichment_result['source_confidence'],
                        enrichment=enrichment_result['enrichment'],
                        tags=enrichment_result['tags']
                    )
                    
                    create_ioc_enrichment(self.db, enrichment_data)
                    risk_score = enrichment_result['risk_score']
                else:
                    # Update existing enrichment
                    update_ioc_enrichment(self.db, db_ioc.id, {
                        "sightings": existing_enrichment.sightings + 1,
                        "last_seen": datetime.now()
                    })
                    risk_score = existing_enrichment.risk_score
                
                processed_iocs.append({
                    "ioc_id": db_ioc.id,
                    "type": db_ioc.type.value,
                    "value": db_ioc.value,
                    "risk_score": risk_score
                })
            
            return {
                "success": True,
                "article_id": article_id,
                "processed_iocs": len(processed_iocs),
                "iocs": processed_iocs
            }
            
        except Exception as e:
            logger.error(f"Error processing IOCs for article {article_id}: {str(e)}")
            return {
                "success": False,
                "article_id": article_id,
                "error": str(e)
            }