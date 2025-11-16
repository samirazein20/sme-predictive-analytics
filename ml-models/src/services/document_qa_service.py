"""
Document Q&A Service using RAG (Retrieval Augmented Generation)
Analyzes uploaded CSV data and answers user questions about it
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import json
import requests
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentQAService:
    """Service for answering questions about uploaded documents using AI"""

    def __init__(self):
        # Check if using Ollama Cloud
        self.use_cloud = os.getenv("OLLAMA_USE_CLOUD", "false").lower() == "true"
        
        if self.use_cloud:
            # Ollama Cloud configuration
            self.ollama_api_key = os.getenv("OLLAMA_API_KEY")
            self.model_name = os.getenv("OLLAMA_MODEL", "gpt-oss:20b-cloud")
            self.ollama_url = "https://ollama.com"
            logger.info(f"🌐 Using Ollama Cloud with model: {self.model_name}")
            
            if not self.ollama_api_key:
                logger.warning("⚠️  OLLAMA_API_KEY not set - Ollama Cloud will not work")
        else:
            # Local Ollama configuration
            self.ollama_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
            self.model_name = "llama3.1:8b"
            logger.info(f"🏠 Using Local Ollama at {self.ollama_url}")
        
        self.model_loaded = False
        self._preload_model()
    
    def _preload_model(self):
        """Preload the model to keep it in memory"""
        if self.use_cloud:
            # Cloud models are always ready - no preloading needed
            logger.info(f"✅ Ollama Cloud model {self.model_name} ready (no preload required)")
            self.model_loaded = True
            return
        
        # Local Ollama - preload model
        logger.info(f"Starting model preload for {self.model_name}...")
        try:
            # Send a simple request to load the model
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": "Hello",
                    "stream": False,
                    "options": {
                        "num_predict": 1  # Only generate 1 token to quickly load the model
                    }
                },
                timeout=120
            )
            self.model_loaded = True
            logger.info(f"✅ Successfully preloaded {self.model_name} model")
        except Exception as e:
            logger.warning(f"⚠️  Could not preload model: {str(e)}")
            self.model_loaded = False

    def analyze_document_context(self, csv_data: str, file_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the document and create a context summary for Q&A

        Args:
            csv_data: CSV content as string
            file_metadata: Metadata about the file (name, type, analysis results, etc.)

        Returns:
            Context dictionary with document summary and statistics
        """
        try:
            # Parse CSV data
            df = pd.read_csv(pd.io.common.StringIO(csv_data))

            # Generate comprehensive context
            context = {
                "file_name": file_metadata.get("file_name", "Unknown"),
                "row_count": len(df),
                "column_count": len(df.columns),
                "columns": df.columns.tolist(),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "numeric_columns": df.select_dtypes(include=[np.number]).columns.tolist(),
                "text_columns": df.select_dtypes(include=['object']).columns.tolist(),
                "sample_data": df.head(5).to_dict(orient='records'),
                "statistics": self._calculate_statistics(df),
                "summary": self._generate_summary(df, file_metadata)
            }

            return context

        except Exception as e:
            raise ValueError(f"Error analyzing document context: {str(e)}")

    def _calculate_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate comprehensive statistics for the dataframe"""
        stats = {}

        # Numeric columns statistics
        numeric_df = df.select_dtypes(include=[np.number])
        if not numeric_df.empty:
            stats["numeric"] = {
                col: {
                    "mean": float(numeric_df[col].mean()) if not pd.isna(numeric_df[col].mean()) else None,
                    "median": float(numeric_df[col].median()) if not pd.isna(numeric_df[col].median()) else None,
                    "std": float(numeric_df[col].std()) if not pd.isna(numeric_df[col].std()) else None,
                    "min": float(numeric_df[col].min()) if not pd.isna(numeric_df[col].min()) else None,
                    "max": float(numeric_df[col].max()) if not pd.isna(numeric_df[col].max()) else None,
                    "sum": float(numeric_df[col].sum()) if not pd.isna(numeric_df[col].sum()) else None
                }
                for col in numeric_df.columns
            }

        # Text columns statistics
        text_df = df.select_dtypes(include=['object'])
        if not text_df.empty:
            stats["text"] = {
                col: {
                    "unique_count": int(text_df[col].nunique()),
                    "most_common": text_df[col].value_counts().head(5).to_dict() if not text_df[col].empty else {}
                }
                for col in text_df.columns
            }

        # Missing values
        stats["missing_values"] = {
            col: int(df[col].isna().sum())
            for col in df.columns if df[col].isna().sum() > 0
        }

        return stats

    def _generate_summary(self, df: pd.DataFrame, file_metadata: Dict[str, Any]) -> str:
        """Generate a human-readable summary of the data"""
        summary_parts = []

        # Basic info
        summary_parts.append(f"This dataset contains {len(df)} rows and {len(df.columns)} columns.")

        # Column types
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        text_cols = df.select_dtypes(include=['object']).columns.tolist()

        if numeric_cols:
            summary_parts.append(f"Numeric columns: {', '.join(numeric_cols)}.")
        if text_cols:
            summary_parts.append(f"Text columns: {', '.join(text_cols)}.")

        # Analysis type from metadata
        analysis_type = file_metadata.get("analysis_type", "General")
        summary_parts.append(f"Analysis type detected: {analysis_type}.")

        return " ".join(summary_parts)

    def answer_question(
        self,
        question: str,
        document_context: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Answer a question about the document using AI reasoning

        Args:
            question: User's question
            document_context: Context about the document
            conversation_history: Previous messages in the conversation

        Returns:
            Answer dictionary with response and metadata
        """
        try:
            # Build prompt with document context
            prompt = self._build_prompt(question, document_context, conversation_history)

            # Call Ollama API
            response = self._call_ollama(prompt)

            # Extract relevant data points if mentioned
            referenced_data = self._extract_data_references(question, document_context)

            return {
                "answer": response,
                "referenced_data": referenced_data,
                "confidence": "high",  # Could be calculated based on response
                "suggestions": self._generate_follow_up_suggestions(question, document_context)
            }

        except Exception as e:
            return {
                "answer": f"I apologize, but I encountered an error while analyzing your question: {str(e)}",
                "referenced_data": {},
                "confidence": "low",
                "suggestions": []
            }

    def _build_prompt(
        self,
        question: str,
        context: Dict[str, Any],
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Build a comprehensive prompt for the AI model"""

        prompt_parts = [
            "You are a data analysis assistant helping a business owner understand their data.",
            "",
            "DOCUMENT INFORMATION:",
            f"- File: {context.get('file_name', 'Unknown')}",
            f"- Rows: {context.get('row_count', 0):,}",
            f"- Columns: {', '.join(context.get('columns', []))}",
            "",
            "DATA SUMMARY:",
            context.get('summary', 'No summary available'),
            "",
            "STATISTICS:"
        ]

        # Add numeric statistics
        if "statistics" in context and "numeric" in context["statistics"]:
            prompt_parts.append("\nNumeric Columns:")
            for col, stats in context["statistics"]["numeric"].items():
                prompt_parts.append(f"  {col}:")
                if stats.get("mean") is not None:
                    prompt_parts.append(f"    - Average: {stats['mean']:.2f}")
                if stats.get("min") is not None and stats.get("max") is not None:
                    prompt_parts.append(f"    - Range: {stats['min']:.2f} to {stats['max']:.2f}")

        # Add sample data
        if "sample_data" in context and context["sample_data"]:
            prompt_parts.append("\nSAMPLE DATA (first 3 rows):")
            for i, row in enumerate(context["sample_data"][:3], 1):
                prompt_parts.append(f"  Row {i}: {json.dumps(row, default=str)}")

        # Add conversation history if available
        if history:
            prompt_parts.append("\nPREVIOUS CONVERSATION:")
            for msg in history[-5:]:  # Last 5 messages for context
                sender = msg.get("sender_type", "USER")
                content = msg.get("content", "")
                prompt_parts.append(f"  {sender}: {content}")

        # Add the user's question
        prompt_parts.extend([
            "",
            "USER QUESTION:",
            question,
            "",
            "INSTRUCTIONS:",
            "- Provide a clear, concise answer based on the data provided",
            "- Use specific numbers and statistics when relevant",
            "- If you can't answer based on the available data, say so clearly",
            "- Suggest actionable insights when appropriate",
            "- Keep your response focused and business-oriented",
            "",
            "ANSWER:"
        ])

        return "\n".join(prompt_parts)

    def _call_ollama(self, prompt: str) -> str:
        """Call Ollama API for text generation (supports both cloud and local)"""
        try:
            if self.use_cloud:
                # Use Ollama Cloud API
                headers = {
                    "Authorization": f"Bearer {self.ollama_api_key}",
                    "Content-Type": "application/json"
                }
                
                response = requests.post(
                    f"{self.ollama_url}/api/generate",
                    headers=headers,
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_predict": 150
                        }
                    },
                    timeout=30  # Cloud is faster
                )
            else:
                # Use Local Ollama API
                response = requests.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_predict": 150
                        }
                    },
                    timeout=120  # Local needs more time
                )

            if response.status_code == 200:
                result = response.json()
                return result.get("response", "Unable to generate response")
            else:
                logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                return f"Error calling Ollama API: {response.status_code}"

        except requests.exceptions.ConnectionError:
            # Fallback response if Ollama is not available
            return self._generate_fallback_response(prompt)
        except Exception as e:
            logger.error(f"Error calling Ollama: {str(e)}")
            return f"Error: {str(e)}"

    def _generate_fallback_response(self, prompt: str) -> str:
        """Generate a basic response when Ollama is not available"""
        return ("I can help you analyze your data, but the AI reasoning service is currently unavailable. "
                "Please check the statistics and insights in the analysis results, or try again later.")

    def _extract_data_references(self, question: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract specific data points that might be relevant to the question"""
        references = {}

        # Check if question mentions specific columns
        question_lower = question.lower()
        for col in context.get("columns", []):
            if col.lower() in question_lower:
                references[col] = {
                    "type": context["dtypes"].get(col, "unknown"),
                    "stats": context.get("statistics", {}).get("numeric", {}).get(col, {})
                }

        return references

    def _generate_follow_up_suggestions(self, question: str, context: Dict[str, Any]) -> List[str]:
        """Generate suggested follow-up questions"""
        suggestions = []

        numeric_cols = context.get("numeric_columns", [])

        # Generic suggestions based on data type
        if numeric_cols:
            if len(numeric_cols) > 0:
                suggestions.append(f"What is the trend for {numeric_cols[0]}?")
            if len(numeric_cols) > 1:
                suggestions.append(f"How does {numeric_cols[0]} correlate with {numeric_cols[1]}?")
            suggestions.append("What are the outliers in this dataset?")

        suggestions.append("Can you summarize the key insights from this data?")

        return suggestions[:3]  # Return top 3 suggestions
