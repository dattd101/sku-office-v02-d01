import {readFileSync, readdirSync} from 'node:fs';
import {dirname, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const normalize = value => value.replaceAll('\\', '/');

export function checkSource(file, source) {
  const errors = [];
  const feature = file.match(/^features\/([^/]+)\//)?.[1];
  const shared = file.startsWith('shared/');
  const checkImport = specifier => {
    if (!specifier.startsWith('@/') && !specifier.startsWith('.')) return;
    const target = normalize(relative(root, specifier.startsWith('@/')
      ? resolve(root, specifier.slice(2)) : resolve(root, dirname(file), specifier)));
    if (shared && !target.startsWith('shared/')) {
      errors.push(`${file}: shared must not depend on ${specifier}`);
    }
    if (feature && !target.startsWith(`features/${feature}/`) && !target.startsWith('shared/')) {
      errors.push(`${file}: feature must not depend on ${specifier}`);
    }
  };
  if (/\.(ts|tsx)$/.test(file)) {
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const visit = node => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
        checkImport(node.moduleSpecifier.text);
      }
      if (ts.isCallExpression(node) &&
          (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(ast) === 'require')) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) checkImport(argument.text);
        else if (shared || feature) errors.push(`${file}: module imports must use literal paths`);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  if (file.endsWith('.css')) {
    for (const match of source.matchAll(/@import\s+['"]([^'"]+)['"]/g)) checkImport(match[1]);
  }
  if (file.startsWith('src-tauri/src/shared/') && /crate::(?:features|workspace)\b/.test(source)) {
    errors.push(`${file}: Rust shared must not depend on features or workspace`);
  }
  if (file.startsWith('src-tauri/src/features/') &&
      /crate::(?:features|workspace)\b|super::super::(?:word|excel|powerpoint)\b/.test(source)) {
    errors.push(`${file}: Rust features must use their own modules and shared utilities`);
  }
  return errors;
}

function files(directory) {
  return readdirSync(resolve(root, directory), {withFileTypes: true}).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? files(file) : [file];
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sources = ['app', 'features', 'shared', 'workspace', 'src-tauri/src']
    .flatMap(files).filter(file => /\.(ts|tsx|css|rs)$/.test(file));
  const errors = sources.flatMap(file => checkSource(file, readFileSync(resolve(root, file), 'utf8')));
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Module boundaries passed (${sources.length} source files).`);
  }
}
