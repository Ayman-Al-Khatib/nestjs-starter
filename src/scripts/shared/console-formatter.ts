import { stripAnsi } from './ansi';

export const ANSI_COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
} as const;

export const BOX_CHARS = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
  middleLeft: '╠',
  middleRight: '╣',
} as const;

export type StatusType = 'success' | 'warning' | 'error';

const STATUS_ICONS: Record<StatusType, string> = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

const STATUS_COLORS: Record<StatusType, string> = {
  success: ANSI_COLORS.green,
  warning: ANSI_COLORS.yellow,
  error: ANSI_COLORS.red,
};

const MIN_BOX_WIDTH = 50;
const BOX_PADDING = 4;
const DEFAULT_PROGRESS_WIDTH = 20;

export class ConsoleFormatter {
  static createBox(title: string, content: string[]): string {
    const strippedTitle = stripAnsi(title);
    const strippedContent = content.map(stripAnsi);

    const width =
      Math.max(strippedTitle.length, ...strippedContent.map((line) => line.length), MIN_BOX_WIDTH) +
      BOX_PADDING;

    const top = BOX_CHARS.topLeft + BOX_CHARS.horizontal.repeat(width - 2);
    const titleLine =
      `${BOX_CHARS.vertical} ${title}` + ' '.repeat(width - 2 - strippedTitle.length - 1);
    const separator = BOX_CHARS.middleLeft + BOX_CHARS.horizontal.repeat(width - 2);
    const contentLines = content.map((line, idx) => {
      const len = strippedContent[idx].length;
      return `${BOX_CHARS.vertical} ${line}` + ' '.repeat(width - 2 - len - 1);
    });
    const bottom = BOX_CHARS.bottomLeft + BOX_CHARS.horizontal.repeat(width - 2);

    return [top, titleLine, separator, ...contentLines, bottom].join('\n');
  }

  static createProgressBar(percentage: number, width = DEFAULT_PROGRESS_WIDTH): string {
    const clamped = Math.min(100, Math.max(0, percentage));
    const filled = Math.round((clamped / 100) * width);
    const empty = width - filled;
    const color =
      clamped >= 90 ? ANSI_COLORS.green : clamped >= 70 ? ANSI_COLORS.yellow : ANSI_COLORS.red;

    return `${color}[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${clamped.toFixed(1)}%${ANSI_COLORS.reset}`;
  }

  static formatStatus(type: StatusType, message: string): string {
    return `${STATUS_ICONS[type]} ${STATUS_COLORS[type]}${message}${ANSI_COLORS.reset}`;
  }
}
