import FirecrawlApp from '@mendable/firecrawl-js';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class FirecrawlService {
  private firecrawl: FirecrawlApp;

  constructor() {
    this.firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });
  }

  async scrapeMarkdown(url: string) {
    const response = await this.firecrawl.scrapeUrl(url, {
      formats: ['markdown'],
    });
    if (!response.success) {
      throw new InternalServerErrorException(
        response.error || 'Failed to scrape website',
      );
    }
    return response.markdown;
  }

  /**
   * Scans a website to retrieve its sitemap/available pages
   * @param url Base URL of the website to scan
   * @returns Array of page URLs found on the website
   */
  async scanWebsite(url: string): Promise<{ url: string; title: string }[]> {
    try {
      // Extract links from the website using the existing scrapeUrl method
      const response = await this.firecrawl.scrapeUrl(url, {
        formats: ['links'],
      });
      
      if (!response.success) {
        throw new InternalServerErrorException(
          response.error || 'Failed to scan website links',
        );
      }
      
      // Filter for internal links only (same domain)
      const baseUrl = new URL(url).origin;
      const internalLinks = (response.links || [])
        .filter(link => link.startsWith(baseUrl) || link.startsWith('/'))
        .map(link => {
          // Convert relative links to absolute
          const fullUrl = link.startsWith('/') ? `${baseUrl}${link}` : link;
          // Use the last part of the path as a simple title
          const pathParts = new URL(fullUrl).pathname.split('/').filter(Boolean);
          const title = pathParts.length > 0 
            ? pathParts[pathParts.length - 1].replace(/-/g, ' ').replace(/\.(html|php|aspx)$/, '')
            : 'Home Page';
          
          return {
            url: fullUrl,
            title: title.charAt(0).toUpperCase() + title.slice(1),
          };
        });
      
      // Remove duplicates
      const uniqueLinks = Array.from(
        new Map(internalLinks.map(link => [link.url, link])).values()
      );
      
      return uniqueLinks;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to scan website sitemap',
      );
    }
  }

  /**
   * Crawls multiple pages from a website and combines their content
   * @param urls Array of URLs to crawl
   * @returns Combined markdown content from all crawled pages
   */
  async crawlMultiplePages(urls: string[]): Promise<string> {
    try {
      let combinedMarkdown = '';
      
      for (const url of urls) {
        const pageMarkdown = await this.scrapeMarkdown(url);
        combinedMarkdown += `\n\n## Page: ${url}\n\n${pageMarkdown}`;
      }
      
      return combinedMarkdown.trim();
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to crawl multiple pages',
      );
    }
  }
}
