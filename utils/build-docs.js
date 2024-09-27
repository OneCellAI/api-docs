const fs = require('fs');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const path = require('path');

// Function to read and parse the redocly.yaml file
function getApiAliases(filePath) {
  try {
    // Load the YAML file
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents);

    // Get the API aliases (keys under the 'apis' section)
    return Object.keys(data.apis);
  } catch (e) {
    console.error('Error reading or parsing the file:', e);
    process.exit(1);  // Exit with error code if parsing fails
  }
}

// Function to build docs for each API alias using @redocly/cli
function buildDocsForApis(apiAliases, outputDir) {
  apiAliases.forEach((alias) => {
    const aliasOutputDir = path.join(outputDir, alias);
    const docsOutputPath = path.join(aliasOutputDir, 'index.html');
    const specOutputPath = path.join(aliasOutputDir, 'openapi.yml');

    try {
      console.log(`Building docs for: ${alias}...`);

      // Ensure the directory for the alias exists
      fs.mkdirSync(aliasOutputDir, { recursive: true });

      // Run the Redocly CLI to build the docs without the --alias flag
      execSync(`npx @redocly/cli build-docs --output ${docsOutputPath} ${alias}`, {
        stdio: 'inherit', // Inherit stdout/stderr from the process to show the output in real-time
      });

      // Run the Redocly CLI to build the docs without the --alias flag
      execSync(`npx @redocly/cli bundle --output ${specOutputPath} ${alias}`, {
        stdio: 'inherit', // Inherit stdout/stderr from the process to show the output in real-time
      });

      console.log(`Docs built for ${alias} and saved to ${docsOutputPath}`);
    } catch (error) {
      console.error(`Error building docs for ${alias}:`, error.message);
      process.exit(1);  // Exit with error code if the build process fails
    }
  });
}

// Function to generate index.html with links to each API's docs
function generateIndexHtml(apiAliases, outputDir) {
  const indexFilePath = path.join(outputDir, 'index.html');
  let htmlContent = '<!DOCTYPE html><html><head><title>API Docs</title></head><body>';
  htmlContent += '<h1>OneCell API Documentation</h1><ul>';

  apiAliases.forEach((alias) => {
    const apiLink = `<li><a href="./${alias}/index.html">${alias}</a> (<a href="./${alias}/openapi.yml">openapi.yml</a>)</li>`;
    htmlContent += apiLink;
  });

  htmlContent += '</ul></body></html>';

  try {
    fs.writeFileSync(indexFilePath, htmlContent, 'utf8');
    console.log(`Index file created at ${indexFilePath}`);
  } catch (error) {
    console.error('Error writing index.html:', error.message);
    process.exit(1);  // Exit with error code if writing index.html fails
  }
}

// Main script execution
const redoclyYamlPath = './redocly.yaml';
const outputDir = './public';

// Step 1: Get the API aliases from redocly.yaml
const apiAliases = getApiAliases(redoclyYamlPath);

// Step 2: Build the docs for each API alias
buildDocsForApis(apiAliases, outputDir);

// Step 3: Generate the index.html file with links to each API doc
generateIndexHtml(apiAliases, outputDir);
