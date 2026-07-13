'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Smile, Meh, Frown, TrendingUp, BarChart3 } from 'lucide-react';

interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
  };
  keywords: string[];
}

interface SentimentAnalysisProps {
  onAnalyze?: (text: string) => Promise<SentimentResult>;
}

export default function SentimentAnalysis({ onAnalyze }: SentimentAnalysisProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    
    try {
      const analysis = onAnalyze 
        ? await onAnalyze(text)
        : await mockSentimentAnalysis(text);
      
      setResult(analysis);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const mockSentimentAnalysis = async (input: string): Promise<SentimentResult> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const positiveWords = ['great', 'awesome', 'love', 'excellent', 'happy', 'good'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'sad', 'poor'];
    
    const lowerInput = input.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerInput.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerInput.includes(word)).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    if (negativeCount > positiveCount) sentiment = 'negative';
    
    return {
      sentiment,
      confidence: Math.random() * 0.3 + 0.7,
      emotions: {
        joy: Math.random() * 100,
        anger: Math.random() * 100,
        fear: Math.random() * 100,
        sadness: Math.random() * 100,
        surprise: Math.random() * 100
      },
      keywords: input.split(' ').filter(word => word.length > 4).slice(0, 5)
    };
  };

  const getSentimentIcon = () => {
    switch (result?.sentiment) {
      case 'positive':
        return <Smile className="w-8 h-8 text-green-500" />;
      case 'negative':
        return <Frown className="w-8 h-8 text-red-500" />;
      default:
        return <Meh className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getSentimentColor = () => {
    switch (result?.sentiment) {
      case 'positive':
        return 'bg-green-500';
      case 'negative':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="border rounded-lg bg-background p-4 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        <h3 className="font-semibold">Sentiment Analysis</h3>
      </div>

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to analyze sentiment..."
          className="w-full px-4 py-3 border rounded-lg resize-none h-32 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button onClick={handleAnalyze} disabled={isAnalyzing || !text.trim()} className="w-full">
          {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
        </Button>
      </div>

      {result && (
        <div className="space-y-4 pt-4 border-t">
          {/* Overall Sentiment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getSentimentIcon()}
              <div>
                <p className="font-medium capitalize">{result.sentiment}</p>
                <p className="text-sm text-muted-foreground">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getSentimentColor()}`}
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Emotions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4" />
              <p className="text-sm font-medium">Emotion Breakdown</p>
            </div>
            <div className="space-y-2">
              {Object.entries(result.emotions).map(([emotion, value]) => (
                <div key={emotion} className="flex items-center gap-2">
                  <span className="w-20 text-sm capitalize">{emotion}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {value.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <p className="text-sm font-medium mb-2">Key Keywords</p>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-muted rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
