const { execFile } = require('child_process');

class ClaudeCliProvider {
  id() {
    return 'claude-cli';
  }

  async callApi(prompt) {
    return new Promise((resolve) => {
      const proc = execFile('claude', ['-p', '--output-format', 'text'], {
        timeout: 120_000,
        maxBuffer: 1024 * 1024,
      }, (error, stdout, stderr) => {
        if (error) {
          return resolve({ error: error.message, output: stderr });
        }
        resolve({ output: stdout });
      });
      proc.stdin.write(prompt);
      proc.stdin.end();
    });
  }
}

module.exports = ClaudeCliProvider;
