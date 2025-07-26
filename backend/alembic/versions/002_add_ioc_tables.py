# backend/alembic/versions/002_add_ioc_tables.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

# Define the ENUM once so it's reused consistently
ioc_type_enum = postgresql.ENUM('ip', 'domain', 'url', 'hash', name='ioctype')

def upgrade() -> None:
    # Create ENUM with checkfirst
    ioc_type_enum.create(op.get_bind(), checkfirst=True)

    # Create IOCs table
    op.create_table(
        'iocs',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('type', postgresql.ENUM(
            'ip', 'domain', 'url', 'hash',
            name='ioctype', create_type=False  # do not recreate
        ), nullable=False),
        sa.Column('value', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('type', 'value', name='uq_ioc_type_value')
    )
    op.create_index(op.f('ix_iocs_id'), 'iocs', ['id'], unique=False)
    op.create_index(op.f('ix_iocs_type'), 'iocs', ['type'], unique=False)
    op.create_index(op.f('ix_iocs_value'), 'iocs', ['value'], unique=False)

    # Create IOC enrichments table
    op.create_table(
        'ioc_enrichments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ioc_id', sa.Integer(), nullable=False),
        sa.Column('base_score', sa.Float(), nullable=True),
        sa.Column('risk_score', sa.Float(), nullable=True),
        sa.Column('sightings', sa.Integer(), nullable=True),
        sa.Column('first_seen', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True),
        sa.Column('source_confidence', sa.Float(), nullable=True),
        sa.Column('enrichment', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['ioc_id'], ['iocs.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_ioc_enrichments_id'), 'ioc_enrichments', ['id'], unique=False)
    op.create_index(op.f('ix_ioc_enrichments_ioc_id'), 'ioc_enrichments', ['ioc_id'], unique=False)
    op.create_index(op.f('ix_ioc_enrichments_risk_score'), 'ioc_enrichments', ['risk_score'], unique=False)

    # Create article-IOC relationship table
    op.create_table(
        'article_iocs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('article_id', sa.Integer(), nullable=False),
        sa.Column('ioc_id', sa.Integer(), nullable=False),
        sa.Column('discovered_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['article_id'], ['articles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ioc_id'], ['iocs.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('article_id', 'ioc_id', name='uq_article_ioc')
    )
    op.create_index(op.f('ix_article_iocs_article_id'), 'article_iocs', ['article_id'], unique=False)
    op.create_index(op.f('ix_article_iocs_ioc_id'), 'article_iocs', ['ioc_id'], unique=False)

    # Create threat summaries table
    op.create_table(
        'threat_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('article_id', sa.Integer(), nullable=False),
        sa.Column('mode', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('ioc_count', sa.Integer(), nullable=True),
        sa.Column('risk_level', sa.String(), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['article_id'], ['articles.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_threat_summaries_id'), 'threat_summaries', ['id'], unique=False)
    op.create_index(op.f('ix_threat_summaries_article_id'), 'threat_summaries', ['article_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_threat_summaries_article_id'), table_name='threat_summaries')
    op.drop_index(op.f('ix_threat_summaries_id'), table_name='threat_summaries')
    op.drop_table('threat_summaries')

    op.drop_index(op.f('ix_article_iocs_ioc_id'), table_name='article_iocs')
    op.drop_index(op.f('ix_article_iocs_article_id'), table_name='article_iocs')
    op.drop_table('article_iocs')

    op.drop_index(op.f('ix_ioc_enrichments_risk_score'), table_name='ioc_enrichments')
    op.drop_index(op.f('ix_ioc_enrichments_ioc_id'), table_name='ioc_enrichments')
    op.drop_index(op.f('ix_ioc_enrichments_id'), table_name='ioc_enrichments')
    op.drop_table('ioc_enrichments')

    op.drop_index(op.f('ix_iocs_value'), table_name='iocs')
    op.drop_index(op.f('ix_iocs_type'), table_name='iocs')
    op.drop_index(op.f('ix_iocs_id'), table_name='iocs')
    op.drop_table('iocs')

    # Drop ENUM
    ioc_type_enum.drop(op.get_bind(), checkfirst=True)
