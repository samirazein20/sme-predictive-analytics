/**
 * Utility module for generating plain language explanations of ML analysis results
 * Converts technical data and metrics into user-friendly, business-focused explanations
 */

export interface TrendExplanation {
  technical: string;
  plain: string;
  insight: string;
}

export interface PredictionExplanation {
  technical: string;
  plain: string;
  businessImpact: string;
}

export interface InsightExplanation {
  technical: string;
  plain: string;
  actionable: string;
}

/**
 * Generate plain language explanation for a trend
 */
export function explainTrend(
  columnName: string,
  trend: { direction: string; change_percent: number; volatility: number }
): TrendExplanation {
  const { direction, change_percent, volatility } = trend;
  
  // Format column name for readability
  const readableColumn = formatColumnName(columnName);
  
  // Technical description
  const technical = `${readableColumn}: ${direction} by ${Math.abs(change_percent).toFixed(1)}% (volatility: ${volatility.toFixed(1)}%)`;
  
  // Plain language description
  let plain = `Your ${readableColumn.toLowerCase()} `;
  
  if (Math.abs(change_percent) < 2) {
    plain += 'has remained relatively stable';
  } else if (change_percent > 0) {
    if (change_percent > 20) {
      plain += `has grown significantly by ${change_percent.toFixed(1)}%`;
    } else if (change_percent > 10) {
      plain += `has grown moderately by ${change_percent.toFixed(1)}%`;
    } else {
      plain += `has increased slightly by ${change_percent.toFixed(1)}%`;
    }
  } else {
    const absChange = Math.abs(change_percent);
    if (absChange > 20) {
      plain += `has declined significantly by ${absChange.toFixed(1)}%`;
    } else if (absChange > 10) {
      plain += `has declined moderately by ${absChange.toFixed(1)}%`;
    } else {
      plain += `has decreased slightly by ${absChange.toFixed(1)}%`;
    }
  }
  
  // Add volatility context
  if (volatility > 30) {
    plain += ', with high fluctuations';
  } else if (volatility > 15) {
    plain += ', with some fluctuations';
  } else {
    plain += ', with consistent behavior';
  }
  
  plain += '.';
  
  // Business insight
  let insight = '';
  if (volatility > 30) {
    insight = '⚠️ High volatility suggests unpredictable patterns. Consider investigating underlying causes.';
  } else if (Math.abs(change_percent) > 15) {
    if (change_percent > 0) {
      insight = '✅ Strong positive trend. This indicates good performance worth maintaining.';
    } else {
      insight = '⚠️ Notable decline detected. Review factors that may be contributing to this downturn.';
    }
  } else if (Math.abs(change_percent) < 2 && volatility < 10) {
    insight = '📊 Stable metrics indicate predictable business conditions.';
  }
  
  return { technical, plain, insight };
}

/**
 * Generate plain language explanation for predictions
 */
export function explainPredictions(
  predictions: number[],
  columnName?: string
): PredictionExplanation {
  if (predictions.length === 0) {
    return {
      technical: 'No predictions available',
      plain: 'Not enough data to generate predictions.',
      businessImpact: ''
    };
  }
  
  const avgValue = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const firstValue = predictions[0];
  const lastValue = predictions[predictions.length - 1];
  const totalChange = lastValue - firstValue;
  const percentChange = (totalChange / firstValue) * 100;
  
  // Calculate volatility in predictions
  const stdDev = Math.sqrt(
    predictions.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / predictions.length
  );
  const volatility = (stdDev / avgValue) * 100;
  
  // Technical description
  const technical = `Forecast: ${predictions.length} periods, Range: ${Math.min(...predictions).toFixed(2)} - ${Math.max(...predictions).toFixed(2)}, Avg: ${avgValue.toFixed(2)}`;
  
  // Plain language description
  let plain = `Over the next ${predictions.length} time periods, `;
  const metric = columnName ? formatColumnName(columnName).toLowerCase() : 'values';
  
  if (Math.abs(percentChange) < 5) {
    plain += `${metric} are expected to remain relatively stable around ${avgValue.toFixed(0)}`;
  } else if (percentChange > 0) {
    plain += `${metric} are projected to grow from ${firstValue.toFixed(0)} to ${lastValue.toFixed(0)} (${percentChange.toFixed(1)}% increase)`;
  } else {
    plain += `${metric} are projected to decline from ${firstValue.toFixed(0)} to ${lastValue.toFixed(0)} (${Math.abs(percentChange).toFixed(1)}% decrease)`;
  }
  
  // Add trend pattern
  const isIncreasing = predictions.slice(1).every((val, i) => val >= predictions[i]);
  const isDecreasing = predictions.slice(1).every((val, i) => val <= predictions[i]);
  
  if (isIncreasing) {
    plain += ' with consistent upward momentum';
  } else if (isDecreasing) {
    plain += ' with consistent downward movement';
  } else if (volatility > 20) {
    plain += ' with significant fluctuations';
  } else {
    plain += ' with some variation';
  }
  
  plain += '.';
  
  // Business impact
  let businessImpact = '';
  if (percentChange > 10) {
    businessImpact = '📈 Growth Opportunity: This positive trend suggests favorable conditions. Consider increasing investment or capacity to capitalize on this momentum.';
  } else if (percentChange < -10) {
    businessImpact = '📉 Attention Required: The declining trend indicates potential challenges ahead. Review strategies to mitigate this downturn or adapt to changing conditions.';
  } else if (volatility > 20) {
    businessImpact = '⚡ High Uncertainty: Significant variability in the forecast suggests unpredictable conditions. Plan for multiple scenarios and maintain flexibility.';
  } else {
    businessImpact = '📊 Steady State: Stable projections indicate predictable conditions. This is a good time to focus on optimization and efficiency improvements.';
  }
  
  return { technical, plain, businessImpact };
}

/**
 * Generate plain language explanation for ML insights
 */
export function explainInsight(
  insight: { type: string; title: string; message: string; score: number; category: string }
): InsightExplanation {
  const { type, message, score } = insight;
  
  // Technical description (existing message)
  const technical = message;
  
  // Plain language explanation based on insight type
  let plain = '';
  let actionable = '';
  
  switch (type) {
    case 'data_quality':
      if (score > 0.9) {
        plain = 'Your data is excellent quality with very few missing values. This gives us high confidence in the analysis.';
        actionable = '✅ Maintain your current data collection processes.';
      } else if (score > 0.7) {
        plain = 'Your data has good quality overall, though some information is missing. The analysis is still reliable.';
        actionable = '💡 Consider reviewing data entry processes to capture more complete information.';
      } else {
        plain = 'Your data has some quality concerns with missing information. This may affect the accuracy of predictions.';
        actionable = '⚠️ Prioritize improving data collection to get more accurate insights.';
      }
      break;
      
    case 'correlation':
      if (score > 0.7) {
        plain = 'We found a strong connection between some of your metrics. When one changes, the other tends to change in a predictable way.';
        actionable = '🔗 Use these relationships to forecast one metric based on another, or identify leading indicators.';
      } else if (score > 0.4) {
        plain = 'There\'s a moderate relationship between some of your data points. They influence each other to some degree.';
        actionable = '📊 Monitor these related metrics together to spot patterns early.';
      } else {
        plain = 'Your metrics show weak connections, suggesting they operate independently.';
        actionable = '📌 Track these metrics separately as they don\'t significantly influence each other.';
      }
      break;
      
    case 'anomaly':
      const outlierPercentage = (1 - score) * 10;
      if (outlierPercentage > 5) {
        plain = `We detected some unusual values in your data (${outlierPercentage.toFixed(1)}% outliers). These could be errors, special events, or important exceptions.`;
        actionable = '🔍 Review these unusual values to determine if they\'re errors that need correction or genuine exceptional cases that need attention.';
      } else {
        plain = 'Your data shows normal patterns with very few outliers. This suggests consistent operations.';
        actionable = '✅ Continue monitoring for any emerging anomalies.';
      }
      break;
      
    case 'business':
      plain = message; // Business insights are already user-friendly
      if (message.toLowerCase().includes('revenue')) {
        actionable = '💰 Track this metric closely as it directly impacts business performance.';
      } else {
        actionable = '📈 Use this insight to inform strategic decisions.';
      }
      break;
      
    default:
      plain = message;
      actionable = score > 0.7 ? '✅ This is a positive indicator for your business.' : '💡 Consider investigating this further.';
  }
  
  return { technical, plain, actionable };
}

/**
 * Generate overall analysis summary in plain language
 */
export function generateOverallSummary(
  analysisResults: {
    trends: Record<string, any>;
    predictions: number[];
    insights: Array<{ type: string; title: string; message: string; score: number; category: string }>;
    summary_stats: Record<string, any>;
  }
): string {
  const parts: string[] = [];
  
  // Count different types of signals
  const trendCount = Object.keys(analysisResults.trends).length;
  const positiveInsights = analysisResults.insights.filter(i => i.score > 0.7).length;
  const concernInsights = analysisResults.insights.filter(i => i.score < 0.5).length;
  
  // Opening
  parts.push('📊 **Analysis Summary**\n');
  
  // Data overview
  const dataQualityInsight = analysisResults.insights.find(i => i.type === 'data_quality');
  if (dataQualityInsight) {
    if (dataQualityInsight.score > 0.9) {
      parts.push('Your data is comprehensive and reliable, providing a solid foundation for analysis.');
    } else if (dataQualityInsight.score > 0.7) {
      parts.push('Your data is in good shape with minor gaps that don\'t significantly impact the analysis.');
    } else {
      parts.push('Your data has some quality issues that may affect accuracy. Consider improving data collection.');
    }
  }
  
  // Trends summary
  if (trendCount > 0) {
    const trends = Object.entries(analysisResults.trends);
    const increasingTrends = trends.filter(([_, t]: [string, any]) => t.direction === 'increasing').length;
    const decreasingTrends = trends.filter(([_, t]: [string, any]) => t.direction === 'decreasing').length;
    
    if (increasingTrends > decreasingTrends) {
      parts.push(`\n📈 **Positive Momentum**: Most of your key metrics (${increasingTrends} out of ${trendCount}) are showing growth, which is a good sign for business health.`);
    } else if (decreasingTrends > increasingTrends) {
      parts.push(`\n📉 **Attention Needed**: Several metrics (${decreasingTrends} out of ${trendCount}) are declining. This warrants investigation and possible intervention.`);
    } else {
      parts.push(`\n📊 **Mixed Signals**: Your metrics show a balanced mix of increases and decreases, suggesting a transitional period.`);
    }
  }
  
  // Predictions summary
  if (analysisResults.predictions.length > 0) {
    const predictionExplanation = explainPredictions(analysisResults.predictions);
    parts.push(`\n🔮 **Forecast**: ${predictionExplanation.plain}`);
  }
  
  // Key insights summary
  if (positiveInsights > 0) {
    parts.push(`\n✅ **Strengths**: We identified ${positiveInsights} positive indicators in your data.`);
  }
  if (concernInsights > 0) {
    parts.push(`\n⚠️ **Areas for Improvement**: ${concernInsights} areas need attention to optimize performance.`);
  }
  
  // Closing recommendation
  parts.push('\n\n💡 **Next Steps**: Review the detailed insights below and focus on the areas marked for attention. The predictions can help you plan for the upcoming period.');
  
  return parts.join(' ');
}

/**
 * Helper function to format column names for readability
 */
function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a summary statistic with plain language context
 */
export function explainSummaryStats(
  columnName: string,
  stats: {
    count: number;
    mean: number;
    std: number;
    min: number;
    '25%': number;
    '50%': number;
    '75%': number;
    max: number;
  }
): string {
  const readableColumn = formatColumnName(columnName);
  const cv = (stats.std / stats.mean) * 100; // Coefficient of variation
  
  let explanation = `**${readableColumn}**: `;
  
  // Describe the typical value
  explanation += `Typically around ${stats['50%'].toFixed(0)}`;
  
  // Describe the spread
  if (cv > 50) {
    explanation += `, but varies widely from ${stats.min.toFixed(0)} to ${stats.max.toFixed(0)}. `;
    explanation += 'This high variation suggests diverse scenarios or changing conditions.';
  } else if (cv > 25) {
    explanation += `, with moderate variation (range: ${stats.min.toFixed(0)} to ${stats.max.toFixed(0)}). `;
    explanation += 'Some fluctuation is normal for this metric.';
  } else {
    explanation += `, with consistent values (range: ${stats.min.toFixed(0)} to ${stats.max.toFixed(0)}). `;
    explanation += 'This stability indicates predictable patterns.';
  }
  
  return explanation;
}
