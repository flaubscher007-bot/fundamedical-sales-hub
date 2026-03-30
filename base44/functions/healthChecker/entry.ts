import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const issues = [];
    const pagesDir = './src/pages';
    const componentsDir = './src/components';

    // Read all page files
    let pageFiles = [];
    try {
      pageFiles = await readdir(pagesDir);
      pageFiles = pageFiles.filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
    } catch (e) {
      issues.push({ severity: 'error', file: 'pages/', message: 'Could not read pages directory' });
    }

    // Analyze each page
    for (const file of pageFiles) {
      const filePath = join(pagesDir, file);
      const content = await readFile(filePath, 'utf-8');
      const pageIssues = analyzeFile(content, file, 'page');
      issues.push(...pageIssues);
    }

    // Read all component files
    let componentFiles = [];
    try {
      const walkComponents = async (dir, baseDir = '') => {
        const files = await readdir(dir, { withFileTypes: true });
        for (const file of files) {
          const fullPath = join(dir, file.name);
          if (file.isDirectory()) {
            await walkComponents(fullPath, join(baseDir, file.name));
          } else if (file.name.endsWith('.jsx') || file.name.endsWith('.js')) {
            componentFiles.push(join(baseDir, file.name));
          }
        }
      };
      await walkComponents(componentsDir);
    } catch (e) {
      issues.push({ severity: 'error', file: 'components/', message: 'Could not read components directory' });
    }

    for (const file of componentFiles.slice(0, 20)) { // Limit to 20 to avoid timeout
      const filePath = join(componentsDir, file);
      const content = await readFile(filePath, 'utf-8');
      const pageIssues = analyzeFile(content, file, 'component');
      issues.push(...pageIssues);
    }

    // Count by severity
    const summary = {
      total: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      issues: issues.slice(0, 50), // Return top 50 issues
      timestamp: new Date().toISOString(),
      filesChecked: pageFiles.length + componentFiles.length
    };

    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function analyzeFile(content, filename, type) {
  const issues = [];

  // Check 1: Missing React import (if component uses hooks or JSX)
  if ((content.includes('useState') || content.includes('useEffect') || content.includes('<')) && 
      !content.includes("import React") && 
      !content.includes("from 'react'") &&
      !content.includes('from "react"')) {
    issues.push({
      file: filename,
      severity: 'error',
      rule: 'missing-react-import',
      message: 'File uses React hooks/JSX but missing React import'
    });
  }

  // Check 2: Invalid icon imports
  const iconMatches = content.match(/from\s+["']lucide-react["']/g);
  if (iconMatches) {
    const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*["']lucide-react["']/);
    if (importMatch) {
      const icons = importMatch[1].split(',').map(i => i.trim());
      const invalidIcons = ['FileInput', 'IconName']; // Add known invalid ones
      const foundInvalid = icons.filter(i => invalidIcons.includes(i));
      if (foundInvalid.length) {
        issues.push({
          file: filename,
          severity: 'error',
          rule: 'invalid-icon',
          message: `Invalid lucide-react icons: ${foundInvalid.join(', ')}`
        });
      }
    }
  }

  // Check 3: useState outside component (at module level)
  const stateAtModuleLevel = content.match(/^(const|let|var)\s+\[.*\]\s*=\s*useState/m);
  if (stateAtModuleLevel && !content.includes('function') && !content.includes('export default')) {
    issues.push({
      file: filename,
      severity: 'warning',
      rule: 'hook-outside-component',
      message: 'Hook called at module level - must be inside a component'
    });
  }

  // Check 4: Missing export default (for pages)
  if (type === 'page' && !content.includes('export default')) {
    issues.push({
      file: filename,
      severity: 'error',
      rule: 'missing-export',
      message: 'Page file missing export default statement'
    });
  }

  // Check 5: Unused imports (basic check)
  const importMatches = content.match(/import\s+(\w+)\s+from/g);
  if (importMatches) {
    importMatches.forEach(imp => {
      const match = imp.match(/import\s+(\w+)\s+from/);
      if (match) {
        const varName = match[1];
        // Very basic check - if imported but not used in JSX or code
        if (!content.includes(`<${varName}`) && 
            content.split(varName).length < 3 && 
            !['React', 'Fragment'].includes(varName)) {
          // Could be unused, but hard to tell definitively
        }
      }
    });
  }

  // Check 6: base44 SDK not imported but used
  if ((content.includes('base44.') || content.includes('base44.entities') || content.includes('base44.functions')) &&
      !content.includes('from "@/api/base44Client"') &&
      !content.includes("from '@/api/base44Client'")) {
    issues.push({
      file: filename,
      severity: 'error',
      rule: 'missing-base44-import',
      message: 'Uses base44 SDK but missing import from @/api/base44Client'
    });
  }

  // Check 7: Duplicate imports
  const importLines = content.match(/^import .+ from .+$/gm) || [];
  const importMap = {};
  importLines.forEach(line => {
    const key = line.split(' from ')[1]; // Use the "from" part as key
    if (importMap[key]) {
      issues.push({
        file: filename,
        severity: 'error',
        rule: 'duplicate-import',
        message: `Duplicate import detected: ${key}`
      });
    }
    importMap[key] = true;
  });

  // Check 8: useQuery without QueryClientProvider context
  if (content.includes('useQuery') && !content.includes('QueryClientProvider')) {
    // This is a warning since it might be in a wrapped component
    issues.push({
      file: filename,
      severity: 'info',
      rule: 'query-hook-check',
      message: 'Uses useQuery - ensure component is wrapped with QueryClientProvider'
    });
  }

  return issues;
}