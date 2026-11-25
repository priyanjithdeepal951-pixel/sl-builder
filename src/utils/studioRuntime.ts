import React from 'react';
import { BlockLogicConfig } from '../types/builder';

export interface StudioConsoleEntry {
  id: string;
  time: string;
  level: 'log' | 'success' | 'warn' | 'error';
  message: string;
}

export interface FormSubmissionSnapshot {
  timestamp: string;
  message: string;
  fields: Array<{ label: string; value: string }>;
}

export interface StudioRuntimeState {
  variables: Record<string, string | number | boolean>;
  lists: Record<string, string[]>;
  objects: Record<string, Record<string, unknown>>;
  dbCollections: Record<string, Array<{ id: string; data: Record<string, unknown>; createdAt: string }>>;
  authUser: { email: string; uid: string } | null;
  openModals: Record<string, boolean>;
  hiddenBlocks: Record<string, boolean>;
  disabledBlocks: Record<string, boolean>;
  extraClasses: Record<string, string[]>;
  styleOverrides: Record<string, React.CSSProperties>;
  textOverrides: Record<string, string>;
  consoleLogs: StudioConsoleEntry[];
  lastSubmission?: FormSubmissionSnapshot | null;
}

export const INITIAL_RUNTIME_STATE: StudioRuntimeState = {
  variables: {
    score: 0,
    isLoggedIn: false,
    userName: 'Creator',
  },
  lists: {
    tasks: ['Design Layout', 'Wire Logic', 'Export App'],
  },
  objects: {
    profile: { name: 'BlockCraft Studio', plan: 'Pro', active: true },
  },
  dbCollections: {
    users: [
      {
        id: 'usr_demo_1',
        data: { name: 'Kasun Perera', role: 'Lead Architect' },
        createdAt: '2026-11-20',
      },
    ],
  },
  authUser: null,
  openModals: {},
  hiddenBlocks: {},
  disabledBlocks: {},
  extraClasses: {},
  styleOverrides: {},
  textOverrides: {},
  consoleLogs: [],
  lastSubmission: null,
};

export function resolveOperandValue(
  raw: string | undefined,
  variables: Record<string, string | number | boolean>,
  formInputs: Record<string, string>,
  blocks?: Array<{ id: string; type: string; name: string; subtitle?: string; counterValue?: number }>
): string {
  const token = (raw ?? '').trim();
  if (!token) return '';
  if (Object.prototype.hasOwnProperty.call(variables, token)) {
    return String(variables[token]);
  }
  if (Object.prototype.hasOwnProperty.call(formInputs, token)) {
    return String(formInputs[token]);
  }
  if (blocks && blocks.length > 0) {
    const lower = token.toLowerCase();
    if (lower === 'counter' || lower === 'clicks') {
      const counterBlk = blocks.find((b) => b.type === 'logic-counter');
      if (counterBlk) return String(counterBlk.counterValue ?? 0);
    }
    const matchedInput = blocks.find(
      (b) =>
        (b.type.startsWith('ui-input') ||
          b.type === 'ui-textarea' ||
          b.type === 'ui-select' ||
          b.type === 'ui-checkbox') &&
        (b.name.toLowerCase() === lower || (b.subtitle || '').toLowerCase() === lower)
    );
    if (matchedInput && Object.prototype.hasOwnProperty.call(formInputs, matchedInput.id)) {
      return String(formInputs[matchedInput.id]);
    }
  }
  return token;
}

function comparePair(
  leftRaw: string,
  op: BlockLogicConfig['operator'],
  rightRaw: string
): boolean {
  const lNum = Number(leftRaw);
  const rNum = Number(rightRaw);
  const bothNumeric =
    leftRaw.trim() !== '' &&
    rightRaw.trim() !== '' &&
    !Number.isNaN(lNum) &&
    !Number.isNaN(rNum);

  switch (op) {
    case '!=':
      return bothNumeric ? lNum !== rNum : leftRaw !== rightRaw;
    case '>':
      return bothNumeric ? lNum > rNum : leftRaw > rightRaw;
    case '<':
      return bothNumeric ? lNum < rNum : leftRaw < rightRaw;
    case '>=':
      return bothNumeric ? lNum >= rNum : leftRaw >= rightRaw;
    case '<=':
      return bothNumeric ? lNum <= rNum : leftRaw <= rightRaw;
    case 'contains':
      return leftRaw.toLowerCase().includes(rightRaw.toLowerCase());
    case '==':
    default:
      return bothNumeric ? lNum === rNum : leftRaw === rightRaw;
  }
}

export function evaluateLogicCondition(
  cfg: BlockLogicConfig | undefined,
  variables: Record<string, string | number | boolean>,
  formInputs: Record<string, string>,
  blocks?: Array<{ id: string; type: string; name: string; subtitle?: string; counterValue?: number }>
): boolean {
  const left = resolveOperandValue(cfg?.leftOperand || 'score', variables, formInputs, blocks);
  const right = resolveOperandValue(cfg?.rightOperand || '10', variables, formInputs, blocks);
  const firstResult = comparePair(left, cfg?.operator || '>=', right);

  const combinator = cfg?.combinator || 'NONE';
  if (combinator === 'NOT') {
    return !firstResult;
  }
  if (combinator === 'AND' || combinator === 'OR') {
    const left2 = resolveOperandValue(cfg?.secondLeft || 'isLoggedIn', variables, formInputs, blocks);
    const right2 = resolveOperandValue(cfg?.secondRight || 'true', variables, formInputs, blocks);
    const secondResult = comparePair(left2, cfg?.secondOp || '==', right2);
    return combinator === 'AND' ? firstResult && secondResult : firstResult || secondResult;
  }

  return firstResult;
}

export function evaluateMathTextOperation(
  cfg: BlockLogicConfig | undefined,
  variables: Record<string, string | number | boolean>
): string {
  const op = cfg?.mathTextOp || 'random';
  const rawA = resolveOperandValue(cfg?.argA ?? '1', variables, {});
  const rawB = resolveOperandValue(cfg?.argB ?? '100', variables, {});
  const numA = Number(rawA) || 0;
  const numB = Number(rawB) || 0;

  switch (op) {
    case 'add':
      return String(numA + numB);
    case 'sub':
      return String(numA - numB);
    case 'mul':
      return String(numA * numB);
    case 'div':
      return numB === 0 ? 'Infinity' : String(Number((numA / numB).toFixed(4)));
    case 'round':
      return String(Math.round(numA));
    case 'random': {
      const min = Math.ceil(Math.min(numA, numB));
      const max = Math.floor(Math.max(numA, numB));
      return String(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    case 'join':
      return `${rawA}${rawB ? ` ${rawB}` : ''}`;
    case 'length':
      return String(rawA.length);
    case 'contains':
      return String(rawA.toLowerCase().includes(rawB.toLowerCase()));
    case 'upper':
      return rawA.toUpperCase();
    case 'lower':
      return rawA.toLowerCase();
    case 'format-date': {
      const now = new Date();
      return now.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
    default:
      return rawA;
  }
}

export function validateInputValue(
  value: string,
  rule: BlockLogicConfig['validationRule'] = 'not-empty'
): { valid: boolean; reason: string } {
  const trimmed = value.trim();
  if (rule === 'email') {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    return { valid: ok, reason: ok ? 'Valid email address' : 'Please enter a valid email address' };
  }
  if (rule === 'min-length') {
    const ok = trimmed.length >= 6;
    return { valid: ok, reason: ok ? 'Minimum length met (6+ chars)' : 'Must be at least 6 characters' };
  }
  const ok = trimmed.length > 0;
  return { valid: ok, reason: ok ? 'Field is valid' : 'This field cannot be empty' };
}

export function parseOptionsList(
  rawContent?: string,
  explicit?: string[],
  fallback?: string[]
): string[] {
  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit;
  }
  const parsed = (rawContent || '')
    .split(/[,|·]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parsed.length > 0) {
    return parsed;
  }
  return fallback || [];
}
