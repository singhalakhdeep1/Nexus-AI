'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Sparkles, Copy, Check, RefreshCw, Download } from 'lucide-react';

interface ContentGenerationProps {
  onGenerate?: (prompt: string, type: string) => Promise<string>;
}

export default function ContentGeneration({ onGenerate }: ContentGenerationProps) {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('blog');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const contentTypes = [
    { id: 'blog', label: 'Blog Post' },
    { id: 'email', label: 'Email' },
    { id: 'social', label: 'Social Media' },
    { id: 'product', label: 'Product Description' },
    { id: 'summary', label: 'Summary' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    
    try {
      const content = onGenerate 
        ? await onGenerate(prompt, contentType)
        : await mockContentGeneration(prompt, contentType);
      
      setGeneratedContent(content);
    } catch (error) {
      console.error('Content generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mockContentGeneration = async (input: string, type: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const templates = {
      blog: `# ${input}\n\nIntroduction: This is a comprehensive guide about ${input}.\n\n## Key Points\n\n1. First important aspect of ${input}\n2. Second crucial element\n3. Third consideration\n\n## Conclusion\n\nIn summary, ${input} is an important topic that deserves attention.`,
      
      email: `Subject: Regarding ${input}\n\nDear [Name],\n\nI hope this email finds you well. I wanted to reach out regarding ${input}.\n\n[Main content about ${input}]\n\nPlease let me know if you have any questions.\n\nBest regards,\n[Your Name]`,
      
      social: `🚀 Exciting news about ${input}!\n\nWe're thrilled to share some updates on ${input}. Here's what you need to know:\n\n✨ [Key point 1]\n✨ [Key point 2]\n✨ [Key point 3]\n\n#${input.replace(/\s+/g, '')} #Innovation #Update`,
      
      product: `Introducing ${input}\n\nExperience the power of ${input} with our latest innovation.\n\n**Features:**\n- Premium quality\n- Easy to use\n- Affordable pricing\n\n**Benefits:**\n- Saves time\n- Increases productivity\n- Enhances workflow\n\nOrder now and transform your experience!`,
      
      summary: `Summary: ${input}\n\nThis document provides a comprehensive overview of ${input}. The key takeaways include:\n\n• Main point 1 about ${input}\n• Main point 2\n• Main point 3\n\nOverall, ${input} represents an important development in this field.`
    };
    
    return templates[type as keyof typeof templates] || templates.blog;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contentType}-content.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border rounded-lg bg-background p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold">AI Content Generation</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">Content Type</label>
          <div className="flex flex-wrap gap-2">
            {contentTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setContentType(type.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  contentType === type.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-accent'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what content you want to generate..."
            className="w-full px-4 py-3 border rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content
            </>
          )}
        </Button>
      </div>

      {generatedContent && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Generated Content</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
