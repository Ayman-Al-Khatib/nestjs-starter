import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface AppInfo {
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  status: 'ok';
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
}

interface AppMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
}

@Injectable()
export class AppService {
  private readonly metadata: AppMetadata = this.loadMetadata();

  getAppInfo(): AppInfo {
    return {
      name: this.metadata.name,
      displayName: this.toDisplayName(this.metadata.name),
      description: this.metadata.description,
      version: this.metadata.version,
      author: this.metadata.author,
      status: 'ok',
      environment: process.env.NODE_ENV ?? 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  getLandingPage(): string {
    const info = this.getAppInfo();
    const uptime = this.formatUptime(info.uptimeSeconds);

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${info.displayName}</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='42' fill='none' stroke='%239ece6a' stroke-width='6'/%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" />
  <style>
    *,*::before,*::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; }
    body {
      font-family: 'JetBrains Mono', ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      background: #0f1115;
      color: #e4e6eb;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      -webkit-font-smoothing: antialiased;
      font-size: 14px;
      line-height: 1.7;
    }
    .card {
      width: 100%;
      max-width: 380px;
    }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4ade80;
      margin-right: 8px;
      box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      50% { opacity: 0.5; }
    }
    .status {
      color: #6b7280;
      font-size: 13px;
      margin-bottom: 1.75rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 500;
      margin: 0 0 0.4rem;
      letter-spacing: -0.01em;
    }
    .desc {
      color: #9ca3af;
      margin: 0 0 2rem;
      font-size: 13px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-top: 1px solid #1f2128;
      font-size: 13px;
    }
    .row:last-of-type { border-bottom: 1px solid #1f2128; }
    .k { color: #6b7280; }
    .v { color: #e4e6eb; }
    a {
      display: inline-block;
      margin-top: 1.75rem;
      color: #9ece6a;
      text-decoration: none;
      font-size: 13px;
      border-bottom: 1px solid transparent;
      transition: border-color 0.15s ease;
    }
    a:hover { border-bottom-color: #9ece6a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="status"><span class="dot"></span>online</div>
    <h1>${info.displayName}</h1>
    <p class="desc">${info.description || 'API service'}</p>

    <div class="row"><span class="k">version</span><span class="v">${info.version}</span></div>
    <div class="row"><span class="k">environment</span><span class="v">${info.environment}</span></div>
    <div class="row"><span class="k">uptime</span><span class="v">${uptime}</span></div>

    <a href="/api/info">/api/info →</a>
  </div>
</body>
</html>`;
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  private loadMetadata(): AppMetadata {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
    );

    const author =
      typeof pkg.author === 'string'
        ? pkg.author
        : (pkg.author?.name ?? 'Unknown');

    return {
      name: pkg.name ?? 'app',
      description: pkg.description ?? '',
      version: pkg.version ?? '0.0.0',
      author,
    };
  }

  private toDisplayName(rawName: string): string {
    return rawName
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
