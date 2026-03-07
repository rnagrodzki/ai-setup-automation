const fs = require('fs');
const path = require('path');

// Resolve paths relative to repo root (three levels up from tests/promptfoo/scripts/)
const REPO_ROOT = path.resolve(__dirname, '../../..');

module.exports = async function transformVars(vars) {
  const result = { ...vars };

  if (vars.skill_path) {
    const fullPath = path.join(REPO_ROOT, vars.skill_path);
    result.skill_content = fs.readFileSync(fullPath, 'utf8');
  }

  if (vars.reference_path) {
    const fullPath = path.join(REPO_ROOT, vars.reference_path);
    if (fs.existsSync(fullPath)) {
      result.reference_content = fs.readFileSync(fullPath, 'utf8');
    }
  }

  return result;
};
