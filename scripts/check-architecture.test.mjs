import assert from 'node:assert/strict';
import {test} from 'node:test';
import {checkSource} from './check-architecture.mjs';

test('shared rejects feature and workspace imports, including re-exports', () => {
  assert.equal(checkSource('shared/document/types.ts', `export type {Sheet} from '@/features/excel/types';`).length, 1);
  assert.equal(checkSource('shared/editor/types.ts', `import '@/workspace/editor/office';`).length, 1);
});

test('features reject sibling imports through aliases, relative paths and dynamic imports', () => {
  for (const source of [
    `import '@/features/powerpoint/actions';`,
    `export * from '../powerpoint/actions';`,
    `const module = import('../powerpoint/actions');`,
    `const module = require('@/workspace/document/create');`,
  ]) assert.equal(checkSource('features/excel/editor.tsx', source).length, 1);
});

test('features can use their own code and shared contracts; workspace can compose features', () => {
  assert.deepEqual(checkSource('features/excel/editor.tsx', `import './actions'; import type {OfficeDocument} from '@/shared/document/types';`), []);
  assert.deepEqual(checkSource('workspace/editor/office.tsx', `import '@/features/excel/editor';`), []);
});

test('CSS respects shared and feature boundaries', () => {
  assert.equal(checkSource('shared/styles/globals.css', `@import '../../features/word/styles.css';`).length, 1);
  assert.deepEqual(checkSource('app/globals.css', `@import '../features/word/styles.css';`), []);
});

test('Rust shared stays independent and features cannot import sibling modules', () => {
  assert.equal(checkSource('src-tauri/src/shared/document.rs', 'use crate::features::{word, excel};').length, 1);
  assert.equal(checkSource('src-tauri/src/features/word/adapter.rs', 'use super::super::excel::model::Workbook;').length, 1);
  assert.deepEqual(checkSource('src-tauri/src/features/word/adapter.rs', 'use crate::shared::document::OfficeDocument;'), []);
});
