import os
import sys
import logging
import json
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.services.ai_matching import generate_embedding

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting embedding generation for projects...")
    
    db: Session = SessionLocal()
    try:
        # Use a raw query to bypass Enum mapping issues with legacy data
        query = text("""
            SELECT id, title, summary, problem, value_proposition, technical_outputs 
            FROM projects 
            WHERE embedding IS NULL
        """)
        
        projects = db.execute(query).fetchall()
        total_projects = len(projects)
        
        logger.info(f"Found {total_projects} projects without embeddings.")
        
        if total_projects == 0:
            logger.info("No projects need updating. Exiting.")
            return

        success_count = 0
        error_count = 0
        
        for i, row in enumerate(projects, 1):
            try:
                # Reconstruct the project text manually
                parts = []
                if row.title: parts.append(row.title)
                if row.summary: parts.append(row.summary)
                if row.problem: parts.append(row.problem)
                if row.value_proposition: parts.append(row.value_proposition)
                if row.technical_outputs: parts.append(row.technical_outputs)
                
                text_content = " ".join(parts)
                
                if text_content.strip():
                    embedding = generate_embedding(text_content)
                    
                    # Update back to the database
                    update_query = text("UPDATE projects SET embedding = :embedding WHERE id = :id")
                    db.execute(update_query, {"embedding": json.dumps(embedding), "id": row.id})
                    
                success_count += 1
                
                # Commit every 50 to avoid big transactions
                if i % 50 == 0:
                    db.commit()
                    logger.info(f"Processed {i}/{total_projects} projects...")
                    
            except Exception as e:
                logger.error(f"Error generating embedding for project ID {row.id}: {e}")
                error_count += 1
                db.rollback()

        # Final commit
        db.commit()
        
        logger.info(f"Embedding generation complete.")
        logger.info(f"Successfully processed: {success_count}")
        logger.info(f"Errors: {error_count}")

    finally:
        db.close()

if __name__ == "__main__":
    main()
