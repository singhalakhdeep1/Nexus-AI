'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Sparkles, TrendingUp, Star, Filter } from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  score: number;
  category: string;
  reason: string;
}

interface RecommendationEngineProps {
  onGetRecommendations?: (userId: string, context: string) => Promise<Recommendation[]>;
}

export default function RecommendationEngine({ onGetRecommendations }: RecommendationEngineProps) {
  const [context, setContext] = useState('');
  const [category, setCategory] = useState('all');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['all', 'content', 'products', 'users', 'projects'];

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    
    try {
      const results = onGetRecommendations 
        ? await onGetRecommendations('user-123', context)
        : await mockRecommendations(context, category);
      
      setRecommendations(results);
    } catch (error) {
      console.error('Recommendation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mockRecommendations = async (ctx: string, cat: string): Promise<Recommendation[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        id: '1',
        title: 'Advanced React Patterns',
        description: 'Learn advanced React patterns for better performance',
        score: 0.95,
        category: 'content',
        reason: 'Based on your recent activity in React projects'
      },
      {
        id: '2',
        title: 'TypeScript Best Practices',
        description: 'Master TypeScript with industry best practices',
        score: 0.88,
        category: 'content',
        reason: 'You viewed TypeScript content recently'
      },
      {
        id: '3',
        title: 'Next.js 15 Features',
        description: 'Explore the latest features in Next.js 15',
        score: 0.82,
        category: 'content',
        reason: 'Popular among developers with similar interests'
      },
      {
        id: '4',
        title: 'UI Component Library',
        description: 'Build reusable UI components with modern tools',
        score: 0.79,
        category: 'projects',
        reason: 'Matches your project preferences'
      },
      {
        id: '5',
        title: 'Performance Optimization',
        description: 'Optimize your applications for better performance',
        score: 0.75,
        category: 'content',
        reason: 'Trending topic in your field'
      }
    ];
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-500';
    if (score >= 0.7) return 'text-blue-500';
    return 'text-yellow-500';
  };

  const filteredRecommendations = category === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.category === category);

  return (
    <div className="border rounded-lg bg-background p-4 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold">AI Recommendation Engine</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">Context</label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-accent'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGetRecommendations}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Get Recommendations
            </>
          )}
        </Button>
      </div>

      {filteredRecommendations.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {filteredRecommendations.length} Recommendations
            </p>
            <Filter className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            {filteredRecommendations.map(rec => (
              <div
                key={rec.id}
                className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rec.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className={`text-sm font-medium ${getScoreColor(rec.score)}`}>
                      {(rec.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                    {rec.category}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {rec.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
