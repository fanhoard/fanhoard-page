import fs from 'fs';
import path from 'path';
import {
  MasterIndexSchema,
  SymbolGroupIndexSchema,
  SymbolCategoryFileSchema,
  ButtonConfigSchema,
  StageConfigSchema,
  VersionConfigSchema,
  ReleaseManifestSchema
} from '../src/schemas/data';

const ROOT = path.resolve(__dirname, '..');

let totalFiles = 0;
let passedFiles = 0;
let failedFiles = 0;

function validateFile(relativePath: string, schema: any) {
  totalFiles++;
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ [MISSING] File not found: ${relativePath}`);
    failedFiles++;
    return;
  }

  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const json = JSON.parse(raw);
    const result = schema.safeParse(json);

    if (result.success) {
      passedFiles++;
      console.log(`  [OK] ${relativePath}`);
    } else {
      failedFiles++;
      console.error(`❌ [SCHEMA ERROR] ${relativePath}:`);
      console.error(JSON.stringify(result.error.format(), null, 2));
    }
  } catch (err: any) {
    failedFiles++;
    console.error(`❌ [PARSE ERROR] ${relativePath}: ${err.message}`);
  }
}

console.log('🔍 Starting FanHoard Static Data Schema Validation...\n');

// 1. Master Index
console.log('--- Master Symbol Index ---');
validateFile('assets/db/con-data/index.json', MasterIndexSchema);

// 2. Group Indexes
console.log('\n--- Group Indexes ---');
const groupIndexes = ['cards.json', 'emoji.json', 'fancy.json', 'symbol.json'];
for (const file of groupIndexes) {
  validateFile(`assets/db/con-data/${file}`, SymbolGroupIndexSchema);
}

// 3. Category Data Files
console.log('\n--- Category Data Files ---');
const conDataDir = path.join(ROOT, 'assets/db/con-data');
const subdirs = ['cards', 'emoji', 'fancy', 'symbol'];

for (const subdir of subdirs) {
  const dirPath = path.join(conDataDir, subdir);
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      validateFile(`assets/db/con-data/${subdir}/${f}`, SymbolCategoryFileSchema);
    }
  }
}

// 4. Application Configs
console.log('\n--- Application Configs ---');
validateFile('assets/json/buttons.json', ButtonConfigSchema);
validateFile('assets/json/current-stage.json', StageConfigSchema);
validateFile('assets/json/version.json', VersionConfigSchema);

// 5. Release Manifests
console.log('\n--- Release Manifests ---');
validateFile('assets/md/en/releases/index.json', ReleaseManifestSchema);
validateFile('assets/md/th/releases/index.json', ReleaseManifestSchema);

console.log('\n========================================');
console.log(`Validation Summary: ${passedFiles}/${totalFiles} passed (${failedFiles} errors)`);
console.log('========================================\n');

if (failedFiles > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
