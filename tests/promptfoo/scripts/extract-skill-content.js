const fs = require('fs');
const os = require('os');
const path = require('path');

// Resolve paths relative to repo root (three levels up from tests/promptfoo/scripts/)
const REPO_ROOT = path.resolve(__dirname, '../../..');

module.exports = async function transformVars(vars) {
  const result = { ...vars };

  if (vars.skill_path) {
    const fullPath = path.join(REPO_ROOT, vars.skill_path);
    try {
      result.skill_content = fs.readFileSync(fullPath, 'utf8');
    } catch (err) {
      throw new Error(`extract-skill-content: cannot read skill_path "${fullPath}": ${err.message}`);
    }
  }

  if (vars.reference_path) {
    const fullPath = path.join(REPO_ROOT, vars.reference_path);
    if (fs.existsSync(fullPath)) {
      result.reference_content = fs.readFileSync(fullPath, 'utf8');
    }
  }

  // project_root with "file://fixtures-fs/" prefix points to a real directory fixture.
  // Copy it to a temp dir so scripts can write files without dirtying the source fixture.
  if (vars.project_root && vars.project_root.startsWith('file://fixtures-fs/')) {
    const relativePath = vars.project_root.replace('file://fixtures-fs/', 'tests/fixtures/');
    const sourceDir = path.join(REPO_ROOT, relativePath);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptfoo-fixture-'));
    fs.cpSync(sourceDir, tmpDir, { recursive: true });
    result.project_root = tmpDir;
  }

  return result;
};
